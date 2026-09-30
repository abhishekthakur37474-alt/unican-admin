import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { handleOneSignalRequest } from './onesignal-send.js';

const DIST = resolve(process.cwd(), 'dist');
const PORT = Number(process.env.PORT) || 4173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
};

function sendFile(res, filePath) {
  const ext = extname(filePath).toLowerCase();
  res.statusCode = 200;
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  res.end(readFileSync(filePath));
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'POST' && url.pathname === '/api/onesignal/send') {
    await handleOneSignalRequest(req, res);
    return;
  }

  const requested = decodeURIComponent(url.pathname);
  const safePath = join(DIST, requested === '/' ? 'index.html' : requested);
  const isInsideDist = safePath.startsWith(DIST);

  if (isInsideDist && existsSync(safePath) && statSync(safePath).isFile()) {
    sendFile(res, safePath);
    return;
  }

  const indexPath = join(DIST, 'index.html');
  if (existsSync(indexPath)) {
    sendFile(res, indexPath);
    return;
  }

  res.statusCode = 404;
  res.end('Build missing. Run npm run build first.');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`UNICAN admin live on http://0.0.0.0:${PORT}`);
});
