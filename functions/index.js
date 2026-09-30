const { onValueCreated } = require('firebase-functions/v2/database');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

exports.sendQueuedFcm = onValueCreated(
  {
    ref: '/fcm_queue/{pushId}',
    instance: 'unican-33d3b-default-rtdb',
    region: 'asia-southeast1',
  },
  async (event) => {
    const payload = event.data.val();
    const pushId = event.params.pushId;

    if (!payload || payload.status !== 'pending' || !payload.token) {
      logger.warn('Skipping FCM queue item', { pushId, status: payload && payload.status });
      return;
    }

    const db = admin.database();
    const itemRef = db.ref(`fcm_queue/${pushId}`);

    try {
      const data = {};
      const rawData = payload.data || {};
      Object.keys(rawData).forEach((key) => {
        data[key] = String(rawData[key] == null ? '' : rawData[key]);
      });

      await admin.messaging().send({
        token: payload.token,
        notification: {
          title: payload.title || 'UNICAN',
          body: payload.body || '',
        },
        data,
        android: {
          priority: 'high',
          notification: {
            channelId: 'unican_assignments',
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
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
      });

      await itemRef.update({
        status: 'sent',
        sentAt: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('FCM send failed', { pushId, message: err.message });
      await itemRef.update({
        status: 'failed',
        error: err.message,
        failedAt: new Date().toISOString(),
      });
    }
  }
);
