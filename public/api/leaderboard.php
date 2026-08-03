<?php
/**
 * Global leaderboard.
 *
 * POST (authed):  body { netWorth, weekGain?, name? }
 *   Publishes the caller's current net worth, then returns the live board.
 * GET:            returns the live board without publishing.
 *
 * Response: { ok, top: [{id,name,netWorth,weekGain}], rank, total, updatedAt }
 *   `rank` is the caller's 1-based position (0 if not on the board).
 */
require __DIR__ . '/_db.php';
migrate();

$pdo = db();
$rank = 0;
$myNet = null;

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
  $u = requireUser();
  $in = body();
  $net = (int)round((float)($in['netWorth'] ?? 0));
  $week = (float)($in['weekGain'] ?? 0);
  // Clamp the weekly-gain % to a sane range to resist tampering.
  if ($week > 100000) $week = 100000;
  if ($week < -100) $week = -100;
  $name = trim((string)($in['name'] ?? $u['name']));
  if ($name === '') $name = $u['name'];
  if (mb_strlen($name) > 120) $name = mb_substr($name, 0, 120);

  $stmt = $pdo->prepare(
    'INSERT INTO leaderboard (user_id, name, net_worth, week_gain, updated_at)
       VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name), net_worth = VALUES(net_worth),
       week_gain = VALUES(week_gain), updated_at = VALUES(updated_at)'
  );
  $stmt->execute([$u['id'], $name, $net, $week, time()]);
  $myNet = $net;

  // Caller's rank = how many players sit strictly above them, +1.
  $r = $pdo->prepare('SELECT COUNT(*) AS c FROM leaderboard WHERE net_worth > ?');
  $r->execute([$net]);
  $rank = (int)$r->fetch()['c'] + 1;
}

$rows = $pdo->query(
  'SELECT user_id, name, net_worth, week_gain
     FROM leaderboard ORDER BY net_worth DESC LIMIT 100'
)->fetchAll();

$top = array_map(function ($row) {
  return [
    'id'       => $row['user_id'],
    'name'     => $row['name'],
    'netWorth' => (int)$row['net_worth'],
    'weekGain' => (float)$row['week_gain'],
  ];
}, $rows);

$total = (int)$pdo->query('SELECT COUNT(*) AS c FROM leaderboard')->fetch()['c'];

ok(['top' => $top, 'rank' => $rank, 'total' => $total, 'you' => $myNet]);
