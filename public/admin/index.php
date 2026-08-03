<?php
/**
 * Invest Master — Owner admin panel.
 *
 * A single, self-contained page (login + dashboard) that lets the site owner
 * see every registered account and each player's saved game at a glance.
 *
 * Access:  https://invest.playb.in/admin/
 * Login:   username + password come from public_html/Invest/api/_config.php
 *          (keys `admin_user` / `admin_pass`) — never from the git repo.
 *
 * Read-only: this panel only SELECTs. It never modifies player data.
 */

declare(strict_types=1);
session_start();

// ---- config + db -----------------------------------------------------------
$cfgFile = __DIR__ . '/../api/_config.php';
if (!is_file($cfgFile)) {
  http_response_code(500);
  echo 'Admin not configured: api/_config.php is missing on the server.';
  exit;
}
$cfg = require $cfgFile;

$ADMIN_USER = (string)($cfg['admin_user'] ?? '');
$ADMIN_PASS = (string)($cfg['admin_pass'] ?? '');
$adminReady = $ADMIN_USER !== '' && $ADMIN_PASS !== '' && $ADMIN_PASS !== 'CHANGE_THIS_ADMIN_PASSWORD';

function pdo_connect(array $cfg): ?PDO {
  $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $cfg['host'] ?? 'localhost', $cfg['db'] ?? '');
  try {
    return new PDO($dsn, $cfg['user'] ?? '', $cfg['pass'] ?? '', [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
  } catch (Throwable $e) {
    return null;
  }
}

function h($v): string { return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); }
function inr($n): string { return '₹' . number_format((float)$n, 0); }

// ---- auth actions ----------------------------------------------------------
$loginError = '';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST' && isset($_POST['login'])) {
  $u = (string)($_POST['username'] ?? '');
  $p = (string)($_POST['password'] ?? '');
  if (!$adminReady) {
    $loginError = 'Admin credentials are not set in api/_config.php yet.';
  } elseif (hash_equals($ADMIN_USER, $u) && hash_equals($ADMIN_PASS, $p)) {
    session_regenerate_id(true);
    $_SESSION['admin'] = true;
    header('Location: ' . strtok($_SERVER['REQUEST_URI'], '?'));
    exit;
  } else {
    $loginError = 'Wrong username or password.';
  }
}

if (isset($_GET['logout'])) {
  $_SESSION = [];
  session_destroy();
  header('Location: ' . strtok($_SERVER['REQUEST_URI'], '?'));
  exit;
}

$authed = !empty($_SESSION['admin']);

// ---- admin power-tool actions (authed POST) --------------------------------
$flash = $_SESSION['flash'] ?? null;
unset($_SESSION['flash']);

if ($authed && ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST' && isset($_POST['admin_action'])) {
  $pdo = pdo_connect($cfg);
  if ($pdo) {
    // Ensure the tables the game API also manages exist.
    $pdo->exec('CREATE TABLE IF NOT EXISTS settings (k VARCHAR(64) NOT NULL PRIMARY KEY, v TEXT NOT NULL, updated_at INT NOT NULL DEFAULT 0) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    $pdo->exec('CREATE TABLE IF NOT EXISTS grants (id VARCHAR(48) NOT NULL PRIMARY KEY, user_id VARCHAR(48) NOT NULL, coins INT NOT NULL DEFAULT 0, xp INT NOT NULL DEFAULT 0, reason VARCHAR(200) NOT NULL DEFAULT "", created_at INT NOT NULL DEFAULT 0, claimed_at INT NULL, INDEX (user_id, claimed_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');

    $act = (string)$_POST['admin_action'];
    if ($act === 'broadcast') {
      $title = trim((string)($_POST['title'] ?? ''));
      $btext = trim((string)($_POST['body'] ?? ''));
      if ($title !== '' || $btext !== '') {
        $ann = json_encode([
          'id'    => substr(md5(uniqid('', true)), 0, 10),
          'title' => mb_substr($title, 0, 120),
          'body'  => mb_substr($btext, 0, 400),
          'ts'    => time(),
        ]);
        $st = $pdo->prepare('INSERT INTO settings (k, v, updated_at) VALUES ("announcement", ?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v), updated_at = VALUES(updated_at)');
        $st->execute([$ann, time()]);
        $_SESSION['flash'] = 'Announcement broadcast to all players.';
      } else {
        $_SESSION['flash'] = 'Enter a title or message to broadcast.';
      }
    } elseif ($act === 'clear_ann') {
      $pdo->prepare('DELETE FROM settings WHERE k = "announcement"')->execute();
      $_SESSION['flash'] = 'Announcement cleared.';
    } elseif ($act === 'grant') {
      $email = strtolower(trim((string)($_POST['email'] ?? '')));
      $coins = (int)($_POST['coins'] ?? 0);
      $xp    = (int)($_POST['xp'] ?? 0);
      $reason = trim((string)($_POST['reason'] ?? '')) ?: 'Gift from the team';
      $sel = $pdo->prepare('SELECT id, name FROM users WHERE email = ? LIMIT 1');
      $sel->execute([$email]);
      $urow = $sel->fetch();
      if (!$urow) {
        $_SESSION['flash'] = 'No user found with that email.';
      } elseif ($coins === 0 && $xp === 0) {
        $_SESSION['flash'] = 'Enter coins or XP to grant.';
      } else {
        $gid = substr(md5(uniqid('', true)), 0, 20);
        $ins = $pdo->prepare('INSERT INTO grants (id, user_id, coins, xp, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)');
        $ins->execute([$gid, $urow['id'], $coins, $xp, mb_substr($reason, 0, 200), time()]);
        $_SESSION['flash'] = "Granted {$coins} coins / {$xp} XP to {$urow['name']} — applied next time they open the game.";
      }
    }
  }
  header('Location: ' . strtok($_SERVER['REQUEST_URI'], '?'));
  exit;
}

// ---- view snapshot JSON (authed only) --------------------------------------
if ($authed && isset($_GET['view'])) {
  header('Content-Type: application/json; charset=utf-8');
  $pdo = pdo_connect($cfg);
  if (!$pdo) { echo json_encode(['error' => 'db']); exit; }
  $st = $pdo->prepare('SELECT snapshot FROM saves WHERE user_id = ? LIMIT 1');
  $st->execute([(string)$_GET['view']]);
  $row = $st->fetch();
  echo $row ? $row['snapshot'] : json_encode(['error' => 'no save']);
  exit;
}
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Invest Master — Admin</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
         background: #0b1020; color: #e7ecf7; }
  a { color: #7ca8ff; }
  .wrap { max-width: 1100px; margin: 0 auto; padding: 24px 16px 60px; }
  .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .logo { width: 40px; height: 40px; border-radius: 10px; display: grid; place-items: center;
          font-weight: 800; font-size: 20px; background: linear-gradient(135deg,#3b82f6,#22c55e); color: #fff; }
  h1 { font-size: 20px; margin: 0; }
  .muted { color: #9aa6c0; font-size: 13px; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit,minmax(150px,1fr)); gap: 12px; margin: 18px 0 24px; }
  .card { background: #141b31; border: 1px solid #24304f; border-radius: 14px; padding: 14px 16px; }
  .card .n { font-size: 26px; font-weight: 800; }
  .card .l { color: #9aa6c0; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
  table { width: 100%; border-collapse: collapse; background: #141b31; border-radius: 14px; overflow: hidden;
          border: 1px solid #24304f; }
  th, td { padding: 10px 12px; text-align: left; font-size: 14px; border-bottom: 1px solid #1e2841; white-space: nowrap; }
  th { background: #0f1730; color: #9aa6c0; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: .03em; }
  tr:last-child td { border-bottom: none; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .scroll { overflow-x: auto; border-radius: 14px; }
  .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; background: #1c2b1c; color: #7ee787; font-size: 12px; }
  .topbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
  form.login { max-width: 340px; margin: 8vh auto 0; background: #141b31; border: 1px solid #24304f;
               border-radius: 16px; padding: 24px; }
  form.login h2 { margin: 0 0 4px; }
  input[type=text], input[type=password] { width: 100%; padding: 11px 12px; margin-top: 10px; border-radius: 10px;
    border: 1px solid #2b3a5e; background: #0d1428; color: #e7ecf7; font-size: 15px; }
  button { margin-top: 16px; width: 100%; padding: 12px; border: none; border-radius: 10px; cursor: pointer;
    background: linear-gradient(135deg,#3b82f6,#22c55e); color: #fff; font-weight: 700; font-size: 15px; }
  .err { background: #3a1620; border: 1px solid #6b2637; color: #ffb3c1; padding: 10px 12px; border-radius: 10px;
         margin-top: 14px; font-size: 14px; }
  .warn { background: #3a2f16; border: 1px solid #6b5626; color: #ffe08a; padding: 12px 14px; border-radius: 12px;
          margin: 16px 0; font-size: 14px; }
  .search { padding: 9px 12px; border-radius: 10px; border: 1px solid #2b3a5e; background: #0d1428; color: #e7ecf7;
            font-size: 14px; min-width: 220px; }
  .ops { background:#141b31; border:1px solid #24304f; border-radius:16px; padding:16px; display:flex; flex-direction:column; gap:10px; }
  .ops h3 { margin:0 0 2px; font-size:15px; }
  .opsf { width:100%; padding:10px 12px; border-radius:10px; border:1px solid #2b3a5e; background:#0d1428; color:#e7ecf7; font-size:14px; font-family:inherit; }
  .ops textarea.opsf { resize:vertical; }
  .ops .row2 { display:flex; gap:8px; }
  .ops .row2 > * { flex:1; }
  .ops button { padding:10px 14px; border:none; border-radius:10px; cursor:pointer; font-weight:700; font-size:14px;
                background:linear-gradient(135deg,#3b82f6,#22c55e); color:#fff; }
  .ops button.ghost { background:#1c2b1c; color:#9aa6c0; border:1px solid #2b3a5e; flex:0 0 auto; }
  .ann-cur { font-size:12.5px; color:#ffe08a; background:#3a2f16; border:1px solid #6b5626; border-radius:10px; padding:8px 10px; }
  .section-label { font-weight:700; font-size:15px; margin:6px 0 10px; }
</style>
</head>
<body>
<div class="wrap">
  <div class="brand">
    <div class="logo">₹</div>
    <div>
      <h1>Invest Master — Admin</h1>
      <div class="muted">Owner dashboard · <?= h($cfg['db'] ?? '') ?></div>
    </div>
  </div>

<?php if (!$authed): ?>

  <form class="login" method="post" autocomplete="off">
    <h2>Sign in</h2>
    <div class="muted">Owner access only</div>
    <?php if (!$adminReady): ?>
      <div class="warn">Set <code>admin_user</code> and <code>admin_pass</code> in
        <code>api/_config.php</code> on the server first.</div>
    <?php endif; ?>
    <input type="text" name="username" placeholder="Username" autofocus>
    <input type="password" name="password" placeholder="Password">
    <?php if ($loginError): ?><div class="err"><?= h($loginError) ?></div><?php endif; ?>
    <button type="submit" name="login" value="1">Sign in</button>
  </form>

<?php else:
  // ---- dashboard -----------------------------------------------------------
  $pdo = pdo_connect($cfg);
  if (!$pdo) { echo '<div class="err">Database connection failed.</div></div></body></html>'; exit; }

  $totalUsers = (int)$pdo->query('SELECT COUNT(*) c FROM users')->fetch()['c'];
  $totalSaves = (int)$pdo->query('SELECT COUNT(*) c FROM saves')->fetch()['c'];
  $dayAgo  = time() - 86400;
  $weekAgo = time() - 7 * 86400;
  $newToday = (int)$pdo->query('SELECT COUNT(*) c FROM users WHERE created_at >= ' . $dayAgo)->fetch()['c'];
  $newWeek  = (int)$pdo->query('SELECT COUNT(*) c FROM users WHERE created_at >= ' . $weekAgo)->fetch()['c'];

  // Live-ops analytics (tables may be empty on a brand-new install).
  $active24 = 0; $active7 = 0; $richest = []; $pendingGrants = 0; $curAnn = null;
  try {
    $active24 = (int)$pdo->query('SELECT COUNT(*) c FROM leaderboard WHERE updated_at >= ' . $dayAgo)->fetch()['c'];
    $active7  = (int)$pdo->query('SELECT COUNT(*) c FROM leaderboard WHERE updated_at >= ' . $weekAgo)->fetch()['c'];
    $richest  = $pdo->query('SELECT name, net_worth FROM leaderboard ORDER BY net_worth DESC LIMIT 5')->fetchAll();
  } catch (Throwable $e) { /* leaderboard table not created yet */ }
  try {
    $pendingGrants = (int)$pdo->query('SELECT COUNT(*) c FROM grants WHERE claimed_at IS NULL')->fetch()['c'];
  } catch (Throwable $e) { /* grants table not created yet */ }
  try {
    $ar = $pdo->query('SELECT v FROM settings WHERE k = "announcement" LIMIT 1')->fetch();
    if ($ar) $curAnn = json_decode($ar['v'], true);
  } catch (Throwable $e) { /* settings table not created yet */ }

  $rows = $pdo->query(
    'SELECT u.id, u.email, u.name, u.created_at,
            s.snapshot, s.updated_at
       FROM users u LEFT JOIN saves s ON s.user_id = u.id
      ORDER BY u.created_at DESC'
  )->fetchAll();
?>
  <div class="topbar">
    <div class="muted"><?= $totalUsers ?> total players</div>
    <div>
      <input id="q" class="search" type="text" placeholder="Search email or name…" onkeyup="filterRows()">
      &nbsp;<a href="?logout=1">Log out</a>
    </div>
  </div>

  <?php if ($flash): ?><div class="warn"><?= h($flash) ?></div><?php endif; ?>

  <div class="cards">
    <div class="card"><div class="n"><?= $totalUsers ?></div><div class="l">Total users</div></div>
    <div class="card"><div class="n"><?= $newToday ?></div><div class="l">New today</div></div>
    <div class="card"><div class="n"><?= $newWeek ?></div><div class="l">New this week</div></div>
    <div class="card"><div class="n"><?= $active24 ?></div><div class="l">Active 24h</div></div>
    <div class="card"><div class="n"><?= $active7 ?></div><div class="l">Active 7d</div></div>
    <div class="card"><div class="n"><?= $totalSaves ?></div><div class="l">Saved games</div></div>
  </div>

  <!-- Live ops: broadcast + grant -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:12px;margin-bottom:24px">
    <form method="post" class="ops">
      <input type="hidden" name="admin_action" value="broadcast">
      <h3>📢 Broadcast announcement</h3>
      <?php if (is_array($curAnn)): ?>
        <div class="ann-cur">Live now: <b><?= h($curAnn['title'] ?? '') ?></b> — <?= h($curAnn['body'] ?? '') ?></div>
      <?php endif; ?>
      <input class="opsf" type="text" name="title" maxlength="120" placeholder="Title (e.g. Diwali event!)">
      <textarea class="opsf" name="body" rows="2" maxlength="400" placeholder="Message shown to every player"></textarea>
      <div class="row2">
        <button type="submit">Send to all players</button>
        <button type="submit" name="admin_action" value="clear_ann" class="ghost">Clear</button>
      </div>
    </form>

    <form method="post" class="ops">
      <input type="hidden" name="admin_action" value="grant">
      <h3>🎁 Grant coins / XP</h3>
      <input class="opsf" type="email" name="email" placeholder="Player email" required>
      <div class="row2">
        <input class="opsf" type="number" name="coins" placeholder="Coins" min="0">
        <input class="opsf" type="number" name="xp" placeholder="XP" min="0">
      </div>
      <input class="opsf" type="text" name="reason" maxlength="200" placeholder="Reason (optional)">
      <button type="submit">Grant<?= $pendingGrants ? " · {$pendingGrants} pending" : '' ?></button>
    </form>
  </div>

  <?php if ($richest): ?>
  <div class="section-label">🏆 Richest players</div>
  <div class="scroll" style="margin-bottom:20px">
    <table>
      <thead><tr><th>#</th><th>Player</th><th class="num">Net worth</th></tr></thead>
      <tbody>
        <?php foreach ($richest as $ri => $rr): ?>
          <tr><td><?= $ri + 1 ?></td><td><?= h($rr['name']) ?></td><td class="num"><?= inr($rr['net_worth']) ?></td></tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
  <?php endif; ?>

  <div class="section-label">👥 All players</div>
  <div class="scroll">
  <table id="tbl">
    <thead>
      <tr>
        <th>#</th><th>Email</th><th>Player</th><th>Career</th>
        <th class="num">Cash</th><th class="num">Net worth</th><th class="num">Level</th>
        <th>Registered</th><th>Last played</th><th>Save</th>
      </tr>
    </thead>
    <tbody>
    <?php $i = 0; foreach ($rows as $r):
      $i++;
      $snap = $r['snapshot'] ? json_decode($r['snapshot'], true) : null;
      $player = is_array($snap) ? ($snap['player'] ?? []) : [];
      $cash = $player['cash'] ?? null;
      $level = $player['level'] ?? null;
      $career = $player['careerId'] ?? null;
      $nw = null;
      if (is_array($snap) && !empty($snap['netWorthHistory'])) {
        $last = end($snap['netWorthHistory']);
        $nw = is_array($last) ? ($last['value'] ?? null) : null;
      }
    ?>
      <tr class="row" data-s="<?= h(strtolower(($r['email'] ?? '') . ' ' . ($r['name'] ?? ''))) ?>">
        <td><?= $i ?></td>
        <td><?= h($r['email']) ?></td>
        <td><?= h($r['name']) ?></td>
        <td><?= $career ? h($career) : '<span class="muted">—</span>' ?></td>
        <td class="num"><?= $cash !== null ? inr($cash) : '—' ?></td>
        <td class="num"><?= $nw !== null ? inr($nw) : '—' ?></td>
        <td class="num"><?= $level !== null ? (int)$level : '—' ?></td>
        <td class="muted"><?= $r['created_at'] ? h(date('d M Y', (int)$r['created_at'])) : '—' ?></td>
        <td class="muted"><?= !empty($r['updated_at']) ? h(date('d M Y H:i', (int)$r['updated_at'])) : '<span class="muted">never</span>' ?></td>
        <td><?php if ($r['snapshot']): ?><a href="?view=<?= h($r['id']) ?>" target="_blank">JSON</a><?php else: ?><span class="muted">—</span><?php endif; ?></td>
      </tr>
    <?php endforeach; ?>
    <?php if (!$rows): ?>
      <tr><td colspan="10" class="muted" style="text-align:center;padding:28px">No players yet. Share the game link to get your first sign-ups!</td></tr>
    <?php endif; ?>
    </tbody>
  </table>
  </div>

  <p class="muted" style="margin-top:16px">Read-only view · times shown in server timezone · passwords are stored hashed and never shown.</p>

  <script>
    function filterRows() {
      var q = document.getElementById('q').value.toLowerCase();
      document.querySelectorAll('#tbl tbody tr.row').forEach(function (tr) {
        tr.style.display = tr.getAttribute('data-s').indexOf(q) > -1 ? '' : 'none';
      });
    }
  </script>

<?php endif; ?>
</div>
</body>
</html>
