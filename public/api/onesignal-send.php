<?php
header('Content-Type: application/json; charset=utf-8');

$appId = 'f5e99edf-0039-4e79-890f-d34d6753db0d';

// Key lives OUTSIDE the web root, one folder above the site root:
//   <parent of DOCUMENT_ROOT>/onesignal-key.txt   (file contains only the key)
// So deploying/overwriting dist/ never touches it, and nobody can download it.
$keyFile = dirname($_SERVER['DOCUMENT_ROOT']) . '/onesignal-key.txt';
$key = is_readable($keyFile) ? trim(file_get_contents($keyFile)) : '';

if ($key === '') {
  http_response_code(500);
  echo json_encode([
    'ok' => false,
    'error' => 'OneSignal key file missing or empty: ' . $keyFile,
  ]);
  exit;
}

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