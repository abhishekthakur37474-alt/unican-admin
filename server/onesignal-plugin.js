import { handleOneSignalRequest } from './onesignal-send.js';

function attach(middlewares) {
  middlewares.use(async (req, res, next) => {
    if (req.method !== 'POST' || req.url !== '/api/onesignal/send') {
      next();
      return;
    }
    await handleOneSignalRequest(req, res);
  });
}

export function onesignalPlugin() {
  return {
    name: 'unican-onesignal',
    configureServer(server) {
      attach(server.middlewares);
    },
    configurePreviewServer(server) {
      attach(server.middlewares);
    },
  };
}
