<?php
/** Create an account. Body: { email, password, name? } -> { token, user } */
require __DIR__ . '/_db.php';
migrate();

$in    = body();
$email = strtolower(trim((string)($in['email'] ?? '')));
$pass  = (string)($in['password'] ?? '');
$name  = trim((string)($in['name'] ?? ''));

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Please enter a valid email.');
if (strlen($pass) < 6) fail('Password must be at least 6 characters.');

$pdo = db();

// Already registered?
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
if ($stmt->fetch()) fail('An account with this email already exists.', 409);

$id   = randId(18);
$hash = password_hash($pass, PASSWORD_DEFAULT);
if ($name === '') $name = explode('@', $email)[0];

$stmt = $pdo->prepare(
  'INSERT INTO users (id, email, name, pass_hash, created_at) VALUES (?, ?, ?, ?, ?)'
);
$stmt->execute([$id, $email, $name, $hash, time()]);

$token = issueToken($id);
ok(['token' => $token, 'user' => ['id' => $id, 'email' => $email, 'name' => $name]]);
