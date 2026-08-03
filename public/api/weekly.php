<?php
/**
 * Weekly League — a fresh competition every ISO week, ranked by net-worth
 * growth (%) since each player's first check-in that week.
 *
 * POST (authed): body { netWorth, name? }
 *   Records the caller's net worth for the current week (capturing a baseline
 *   on their first check-in), then returns this week's standings.
 *
 * Response: { ok, week, endsIn, top:[{id,name,netWorth,weekGain}], rank, total }
 *   `endsIn` = seconds until the week resets (next Monday 00:00 server time).
 */
require __DIR__ . '/_db.php';
migrate();

$pdo = db();
$week = date('oW'); // ISO year + week, e.g. 202631
$rank = 0;

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
  $u = requireUser();
  $in = body();
  $net = (int) round((float) ($in['netWorth'] ?? 0));
  $name = trim((string) ($in['name'] ?? $u['name']));
  if ($name === '') $name = $u['name'];
  if (mb_strlen($name) > 120) $name = mb_substr($name, 0, 120);

  // Baseline: the net worth at the player's first check-in this week.
  $sel = $pdo->prepare('SELECT start_net FROM weekly_league WHERE week = ? AND user_id = ? LIMIT 1');
  $sel->execute([$week, $u['id']]);
  $row = $sel->fetch();
  $start = $row ? (int) $row['start_net'] : $net;
  if ($start <= 0) $start = $net > 0 ? $net : 1;

  $gain = $start > 0 ? (($net - $start) / $start) * 100 : 0;
  if ($gain > 100000) $gain = 100000;
  if ($gain < -100) $gain = -100;

  if ($row) {
    $up = $pdo->prepare(
      'UPDATE weekly_league SET name = ?, net_worth = ?, gain = ?, updated_at = ?
        WHERE week = ? AND user_id = ?'
    );
    $up->execute([$name, $net, $gain, time(), $week, $u['id']]);
  } else {
    $ins = $pdo->prepare(
      'INSERT INTO weekly_league (week, user_id, name, start_net, net_worth, gain, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $ins->execute([$week, $u['id'], $name, $start, $net, $gain, time()]);
  }

  $r = $pdo->prepare('SELECT COUNT(*) AS c FROM weekly_league WHERE week = ? AND gain > ?');
  $r->execute([$week, $gain]);
  $rank = (int) $r->fetch()['c'] + 1;
}

$stmt = $pdo->prepare(
  'SELECT user_id, name, net_worth, gain
     FROM weekly_league WHERE week = ? ORDER BY gain DESC LIMIT 100'
);
$stmt->execute([$week]);
$top = array_map(function ($row) {
  return [
    'id'       => $row['user_id'],
    'name'     => $row['name'],
    'netWorth' => (int) $row['net_worth'],
    'weekGain' => (float) $row['gain'],
  ];
}, $stmt->fetchAll());

$totalStmt = $pdo->prepare('SELECT COUNT(*) AS c FROM weekly_league WHERE week = ?');
$totalStmt->execute([$week]);
$total = (int) $totalStmt->fetch()['c'];

$endsIn = max(0, strtotime('next monday') - time());

ok(['week' => $week, 'endsIn' => $endsIn, 'top' => $top, 'rank' => $rank, 'total' => $total]);
