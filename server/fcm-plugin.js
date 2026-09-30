import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SA_PATH = resolve(process.cwd(), 'server/service-account.json');
const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

let cachedSa = null;
let cachedAccess = { token: '', exp: 0 };

function loadServiceAccount() {
  if (cachedSa) return cachedSa;
  cachedSa = JSON.parse(readFileSync(SA_PATH, 'utf8'));
  if (cachedSa.type !== 'service_account' || !cachedSa.private_key || !cachedSa.client_email) {
    throw new Error('Invalid Firebase service account file');
  }
  return cachedSa;
}

function b64url(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function createSignedJwt(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(
    JSON.stringify({
      iss: sa.client_email,
      sub: sa.client_email,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
      scope: FCM_SCOPE,
    })
  );
  const unsigned = `${header}.${payload}`;
  const sign = createSign('RSA-SHA256');
  sign.update(unsigned);
  sign.end();
  const signature = b64url(sign.sign(sa.private_key));
  return `${unsigned}.${signature}`;
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccess.token && cachedAccess.exp - 60 > now) {
    return cachedAccess.token;
  }

  const sa = loadServiceAccount();
  const jwt = createSignedJwt(sa);
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwt,
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const json = await res.json();
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || json.error || 'Failed to get Google access token');
  }

  cachedAccess = {
    token: json.access_token,
    exp: now + (Number(json.expires_in) || 3600),
  };
  return cachedAccess.token;
}

function stringifyData(data) {
  const out = {};
  if (!data || typeof data !== 'object') return out;
  for (const [key, value] of Object.entries(data)) {
    out[key] = value == null ? '' : String(value);
  }
  return out;
}

export async function sendFcmMessage({ token, title, body, data }) {
  if (!token || typeof token !== 'string') {
    throw new Error('Missing FCM device token');
  }

  const sa = loadServiceAccount();
  const accessToken = await getAccessToken();
  const message = {
    message: {
      token,
      notification: {
        title: title || 'UNICAN',
        body: body || '',
      },
      data: stringifyData(data),
      android: {
        priority: 'HIGH',
        notification: {
          channel_id: 'unican_assignments',
          sound: 'default',
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    },
  };

  const url = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
  const json = await res.json();
  if (!res.ok) {
    const err = json.error || {};
    throw new Error(err.message || 'FCM send failed');
  }
  return { name: json.name || '' };
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

export function fcmPlugin() {
  return {
    name: 'unican-fcm',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'POST' || req.url !== '/api/fcm/send') {
          next();
          return;
        }

        res.setHeader('Content-Type', 'application/json');
        try {
          const payload = await readJsonBody(req);
          const result = await sendFcmMessage(payload);
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, name: result.name }));
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ ok: false, error: err.message || 'FCM send failed' }));
        }
      });
    },
  };
}
