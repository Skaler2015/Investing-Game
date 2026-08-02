<?php
/** Persist the game snapshot for the signed-in user. Body: { snapshot }. */
require __DIR__ . '/_db.php';
migrate();
$u = requireUser();

$in = body();
if (!array_key_exists('snapshot', $in)) fail('Missing snapshot.');

$json = json_encode($in['snapshot']);
if ($json === false) fail('Snapshot is not serializable.');

// MySQL LONGTEXT holds up to 4GB; guard against anything absurd anyway.
if (strlen($json) > 4000000) fail('Snapshot too large.', 413);

$stmt = db()->prepare(
  'INSERT INTO saves (user_id, snapshot, updated_at) VALUES (?, ?, ?)
   ON DUPLICATE KEY UPDATE snapshot = VALUES(snapshot), updated_at = VALUES(updated_at)'
);
$stmt->execute([$u['id'], $json, time()]);

ok(['savedAt' => time()]);
