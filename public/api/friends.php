<?php
/**
 * Friends. Each player has a short shareable friend code; friendships are
 * mutual and stored once in canonical (a<b) order.
 *
 * POST (authed): body { action: 'list' | 'add' | 'remove', code?, friendId? }
 * Response: { ok, code, friends: [{id,name,netWorth,weekGain}], message? }
 */
require __DIR__ . '/_db.php';
migrate();

$u = requireUser();
$pdo = db();

/** Get the caller's friend code, generating a unique one on first use. */
function friendCode(PDO $pdo, string $userId): string {
  $sel = $pdo->prepare('SELECT code FROM friend_codes WHERE user_id = ? LIMIT 1');
  $sel->execute([$userId]);
  $row = $sel->fetch();
  if ($row) return $row['code'];

  $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous 0/O/1/I
  for ($attempt = 0; $attempt < 12; $attempt++) {
    $code = '';
    for ($i = 0; $i < 6; $i++) $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    try {
      $ins = $pdo->prepare('INSERT INTO friend_codes (user_id, code) VALUES (?, ?)');
      $ins->execute([$userId, $code]);
      return $code;
    } catch (Throwable $e) {
      // Unique collision — try another code.
    }
  }
  fail('could not allocate a friend code', 500);
}

/** Return the caller's friends as leaderboard-style rows, richest first. */
function friendRows(PDO $pdo, string $userId): array {
  $stmt = $pdo->prepare(
    'SELECT u.id AS id, u.name AS name,
            COALESCE(l.net_worth, 0) AS net_worth,
            COALESCE(l.week_gain, 0) AS week_gain
       FROM friends f
       JOIN users u ON u.id = CASE WHEN f.a = ? THEN f.b ELSE f.a END
       LEFT JOIN leaderboard l ON l.user_id = u.id
      WHERE f.a = ? OR f.b = ?
      ORDER BY net_worth DESC
      LIMIT 200'
  );
  $stmt->execute([$userId, $userId, $userId]);
  return array_map(function ($r) {
    return [
      'id'       => $r['id'],
      'name'     => $r['name'],
      'netWorth' => (int) $r['net_worth'],
      'weekGain' => (float) $r['week_gain'],
    ];
  }, $stmt->fetchAll());
}

$code = friendCode($pdo, $u['id']);
$in = body();
$action = (string) ($in['action'] ?? 'list');
$message = null;

if ($action === 'add') {
  $target = strtoupper(trim((string) ($in['code'] ?? '')));
  if ($target === '') fail('Enter a friend code.');
  if ($target === $code) fail("That's your own code.");
  $sel = $pdo->prepare('SELECT user_id FROM friend_codes WHERE code = ? LIMIT 1');
  $sel->execute([$target]);
  $row = $sel->fetch();
  if (!$row) fail('No player found with that code.', 404);
  $fid = $row['user_id'];
  // Canonical order so the pair is stored once.
  $a = min($u['id'], $fid);
  $b = max($u['id'], $fid);
  $ins = $pdo->prepare('INSERT IGNORE INTO friends (a, b, created_at) VALUES (?, ?, ?)');
  $ins->execute([$a, $b, time()]);
  $message = 'Friend added';
} elseif ($action === 'remove') {
  $fid = (string) ($in['friendId'] ?? '');
  if ($fid !== '') {
    $a = min($u['id'], $fid);
    $b = max($u['id'], $fid);
    $del = $pdo->prepare('DELETE FROM friends WHERE a = ? AND b = ?');
    $del->execute([$a, $b]);
    $message = 'Friend removed';
  }
}

ok(['code' => $code, 'friends' => friendRows($pdo, $u['id']), 'message' => $message]);
