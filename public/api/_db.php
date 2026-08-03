<?php
/**
 * Shared bootstrap for every API endpoint:
 *  - CORS + JSON headers
 *  - PDO connection (reads _config.php, which is NOT in the repo)
 *  - schema migration (CREATE TABLE IF NOT EXISTS)
 *  - tiny helpers: json in/out, token auth, id generation
 *
 * Every endpoint file does:  require __DIR__ . '/_db.php';
 */

declare(strict_types=1);

// ---- headers ---------------------------------------------------------------
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-Token');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

// Pre-flight: answer and stop.
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
  http_response_code(204);
  exit;
}

// ---- responses -------------------------------------------------------------
function ok(array $data = []): void {
  echo json_encode(array_merge(['ok' => true], $data));
  exit;
}

function fail(string $error, int $code = 400): void {
  http_response_code($code);
  echo json_encode(['ok' => false, 'error' => $error]);
  exit;
}

/** Decode the JSON request body into an associative array. */
function body(): array {
  $raw = file_get_contents('php://input');
  if ($raw === false || $raw === '') return [];
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

/** The bearer-style token sent by the client in the X-Token header. */
function requestToken(): string {
  $t = $_SERVER['HTTP_X_TOKEN'] ?? '';
  return is_string($t) ? trim($t) : '';
}

/** Random URL-safe id / token. */
function randId(int $bytes = 24): string {
  return rtrim(strtr(base64_encode(random_bytes($bytes)), '+/', '-_'), '=');
}

// ---- database --------------------------------------------------------------
function db(): PDO {
  static $pdo = null;
  if ($pdo instanceof PDO) return $pdo;

  $cfgFile = __DIR__ . '/_config.php';
  if (!is_file($cfgFile)) {
    fail('server not configured (missing _config.php)', 500);
  }
  $cfg = require $cfgFile;

  $dsn = sprintf(
    'mysql:host=%s;dbname=%s;charset=utf8mb4',
    $cfg['host'] ?? 'localhost',
    $cfg['db'] ?? ''
  );
  try {
    $pdo = new PDO($dsn, $cfg['user'] ?? '', $cfg['pass'] ?? '', [
      PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
  } catch (Throwable $e) {
    fail('database connection failed', 500);
  }
  return $pdo;
}

/** Create tables on first run. Cheap enough to call on every request. */
function migrate(): void {
  $pdo = db();
  $pdo->exec(
    'CREATE TABLE IF NOT EXISTS users (
       id         VARCHAR(48)  NOT NULL PRIMARY KEY,
       email      VARCHAR(190) NOT NULL UNIQUE,
       name       VARCHAR(120) NOT NULL DEFAULT "",
       pass_hash  VARCHAR(255) NOT NULL,
       created_at INT          NOT NULL DEFAULT 0
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
  );
  $pdo->exec(
    'CREATE TABLE IF NOT EXISTS tokens (
       token      VARCHAR(64) NOT NULL PRIMARY KEY,
       user_id    VARCHAR(48) NOT NULL,
       created_at INT         NOT NULL DEFAULT 0,
       INDEX (user_id)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
  );
  $pdo->exec(
    'CREATE TABLE IF NOT EXISTS saves (
       user_id    VARCHAR(48) NOT NULL PRIMARY KEY,
       snapshot   LONGTEXT    NOT NULL,
       updated_at INT         NOT NULL DEFAULT 0
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
  );
  $pdo->exec(
    'CREATE TABLE IF NOT EXISTS leaderboard (
       user_id    VARCHAR(48)  NOT NULL PRIMARY KEY,
       name       VARCHAR(120) NOT NULL DEFAULT "",
       net_worth  BIGINT       NOT NULL DEFAULT 0,
       week_gain  DOUBLE       NOT NULL DEFAULT 0,
       updated_at INT          NOT NULL DEFAULT 0,
       INDEX (net_worth)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
  );
}

/** Resolve the current user from the X-Token header, or null. */
function currentUser(): ?array {
  $token = requestToken();
  if ($token === '') return null;
  $stmt = db()->prepare(
    'SELECT u.id, u.email, u.name
       FROM tokens t JOIN users u ON u.id = t.user_id
      WHERE t.token = ? LIMIT 1'
  );
  $stmt->execute([$token]);
  $row = $stmt->fetch();
  return $row ?: null;
}

/** Require auth or 401. */
function requireUser(): array {
  $u = currentUser();
  if (!$u) fail('unauthorized', 401);
  return $u;
}

/** Issue a fresh token for a user id. */
function issueToken(string $userId): string {
  $token = randId(32);
  $stmt = db()->prepare('INSERT INTO tokens (token, user_id, created_at) VALUES (?, ?, ?)');
  $stmt->execute([$token, $userId, time()]);
  return $token;
}
