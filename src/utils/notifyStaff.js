import { ref, push, set } from 'firebase/database';
import { database } from '../firebase';

// Dev (vite) -> Node plugin route. Production (LiteSpeed/shared hosting) -> PHP file.
const PUSH_URL = import.meta.env.DEV
  ? '/api/onesignal/send'
  : '/api/onesignal-send.php';

export function getStaffPlayerId(staff) {
  if (!staff) return '';
  const candidates = [
    staff.oneSignalId, // Flutter app (PushService) saves the subscription id here
    staff.oneSignalPlayerId,
    staff.onesignalPlayerId,
    staff.playerId,
    staff.subscriptionId,
  ];
  const id = candidates.find((v) => typeof v === 'string' && v.trim().length > 8);
  return id ? id.trim() : '';
}

function buildAddressLine(addressItem) {
  const landmark = addressItem.landmark ? `${addressItem.landmark}, ` : '';
  return `${addressItem.addressLine}, ${landmark}${addressItem.city}, ${addressItem.state} - ${addressItem.pincode}`;
}

async function sendDevicePush(payload) {
  const res = await fetch(PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(
      `Push API HTTP ${res.status}: JSON nahi mila (route/hosting check kar)`
    );
  }

  if (!res.ok || !json.ok) {
    throw new Error(json.error || 'OneSignal send failed');
  }
  return json;
}

export async function notifyStaffOnAssignment({ staff, addressItem, assignedAt }) {
  const address = buildAddressLine(addressItem);
  const title = 'New Verification Assigned';
  const body = `Case #${addressItem.caseId} — ${addressItem.applicantName} at ${addressItem.city}`;
  const message = `New Verification Assigned: Case #${addressItem.caseId} (${addressItem.applicantName}) at ${addressItem.city}.`;

  // 1. In-app notification (Firebase RTDB)
  const notifRef = push(ref(database, `staff_notifications/${staff.uid}`));
  await set(notifRef, {
    id: notifRef.key,
    caseId: addressItem.caseId,
    addressId: addressItem.id || null,
    applicantName: addressItem.applicantName,
    phone: addressItem.phone,
    address,
    clientName: addressItem.clientName,
    verificationType: addressItem.verificationType,
    priority: addressItem.priority,
    timestamp: assignedAt,
    read: false,
    type: 'address_assigned',
    message,
  });

  // 2. Device push (OneSignal)
  const payload = {
    uid: staff.uid,
    playerId: getStaffPlayerId(staff),
    title,
    body,
    data: {
      type: 'address_assigned',
      caseId: String(addressItem.caseId || ''),
      addressId: String(addressItem.id || ''),
      notificationId: String(notifRef.key || ''),
    },
  };

  try {
    const json = await sendDevicePush(payload);
    if (json.recipients === 0) {
      return { deviceSent: false, reason: 'no_subscribed_device' };
    }
    return { deviceSent: true };
  } catch (err) {
    const reason = err.message || 'OneSignal send failed';
    try {
      const failRef = push(ref(database, 'onesignal_queue'));
      await set(failRef, {
        uid: staff.uid,
        title,
        body,
        data: payload.data,
        createdAt: assignedAt,
        status: 'failed',
        error: reason,
      });
    } catch (logErr) {
      console.error('Failed to log push failure', logErr);
    }
    return { deviceSent: false, reason };
  }
}