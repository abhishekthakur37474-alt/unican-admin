<?php
header('Content-Type: application/json; charset=utf-8');

$appId = 'f5e99edf-0039-4e79-890f-d34d6753db0d';
$key   = 'os_v2_app_6xuz5xyahfhhtcip2ngwou63buyllqivfegee7vitp453qtqgm4klg4ndbagmnvqo5bzsxsj4poqv6yl7y7nsrqakcejw6g6wvl47xq'; // purani mat daal, wo leak ho chuki

$in = json_decode(file_get_contents('php://input'), true) ?: [];
$payload = [
  'app_id' => $appId,
  'target_channel' => 'push',
  'headings' => ['en' => $in['title'] ?? 'UNICAN'],
  'contents' => ['en' => $in['body'] ?? ''],
  'data' => (object)($in['data'] ?? []),
  'priority' => 10,
];

if (!empty($in['playerId'])) {
  $payload['include_subscription_ids'] = [$in['playerId']];
} elseif (!empty($in['uid'])) {
  $payload['include_aliases'] = ['external_id' => [(string)$in['uid']]];
} else {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Missing staff uid']);
  exit;
}

$ch = curl_init('https://api.onesignal.com/notifications');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    'Content-Type: application/json; charset=utf-8',
    'Authorization: Key ' . $key,
  ],
  CURLOPT_POSTFIELDS => json_encode($payload),
]);
$res  = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$json = json_decode($res, true) ?: [];

if ($code >= 300 || !empty($json['errors'])) {
  http_response_code(500);
  $err = isset($json['errors'])
    ? json_encode($json['errors'], JSON_UNESCAPED_UNICODE)
    : ($res ?: 'OneSignal send failed');
  echo json_encode(['ok' => false, 'error' => $err]);
  exit;
}
$id = $json['id'] ?? '';
$recipients = $id !== '' ? ($json['recipients'] ?? 1) : 0;

echo json_encode(['ok' => true, 'id' => $id, 'recipients' => $recipients]);