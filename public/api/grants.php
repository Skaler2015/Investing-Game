<?php
/**
 * Claim admin gifts (coins / XP) for the signed-in player.
 *
 * Fetch-and-consume: returns any unclaimed grants and marks them claimed in the
 * same request, so the client applies them exactly once.
 *
 * Header: X-Token.  ->  { grants: [{coins,xp,reason}] }
 */
require __DIR__ . '/_db.php';
migrate();
$u = requireUser();
$pdo = db();

$stmt = $pdo->prepare('SELECT id, coins, xp, reason FROM grants WHERE user_id = ? AND claimed_at IS NULL');
$stmt->execute([$u['id']]);
$rows = $stmt->fetchAll();

if ($rows) {
  $ids = array_column($rows, 'id');
  $ph = implode(',', array_fill(0, count($ids), '?'));
  $upd = $pdo->prepare("UPDATE grants SET claimed_at = ? WHERE id IN ($ph)");
  $upd->execute(array_merge([time()], $ids));
}

$grants = array_map(function ($r) {
  return ['coins' => (int) $r['coins'], 'xp' => (int) $r['xp'], 'reason' => $r['reason']];
}, $rows);

ok(['grants' => $grants]);
