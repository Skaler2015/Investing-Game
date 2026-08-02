<?php
/** Fetch the saved snapshot for the signed-in user. -> { snapshot|null, updatedAt }. */
require __DIR__ . '/_db.php';
migrate();
$u = requireUser();

$stmt = db()->prepare('SELECT snapshot, updated_at FROM saves WHERE user_id = ? LIMIT 1');
$stmt->execute([$u['id']]);
$row = $stmt->fetch();

if (!$row) ok(['snapshot' => null, 'updatedAt' => 0]);

$snapshot = json_decode($row['snapshot'], true);
ok(['snapshot' => $snapshot, 'updatedAt' => (int)$row['updated_at']]);
