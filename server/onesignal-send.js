import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const CONFIG_PATH = resolve(process.cwd(), 'server/onesignal.json');
const KEY_PATH = resolve(process.cwd(), 'server/onesignal-key.txt');

export function loadConfig() {
  const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  const appId = (config.appId || '').trim();
  let restApiKey = (config.restApiKey || process.env.ONESIGNAL_REST_API_KEY || '').trim();
  if (!restApiKey && existsSync(KEY_PATH)) {
    restApiKey = readFileSync(KEY_PATH, 'utf8').trim();
  }
  if (!appId) throw new Error('Missing OneSignal App ID');
  if (!restApiKey) {
    throw new Error('Missing OneSignal REST API Key. Put it in server/onesignal.json as restApiKey');
  }
  return { appId, restApiKey };
}

export async function sendOneSignalNotification({ uid, playerId, title, body, data }) {
  const { appId, restApiKey } = loadConfig();
  const payload = {
    app_id: appId,
    target_channel: 'push',
    headings: { en: title || 'UNICAN' },
    contents: { en: body || '' },
    data: data || {},
    priority: 10,
    android_visibility: 1,
  };

  if (playerId) {
    payload.include_subscription_ids = [playerId];
  } else if (uid) {
    payload.include_aliases = { external_id: [String(uid)] };
  } else {
    throw new Error('Missing staff uid for OneSignal external_id');
  }

  const res = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Key ${restApiKey}`,
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    const err = Array.isArray(json.errors) ? json.errors.join(', ') : json.errors || json.message;
    throw new Error(err || 'OneSignal send failed');
  }
  return { id: json.id || '', recipients: json.recipients || 0 };
}

export async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

export async function handleOneSignalRequest(req, res) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const payload = await readJsonBody(req);
    const result = await sendOneSignalNotification(payload);
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, ...result }));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: err.message || 'OneSignal send failed' }));
  }
}
