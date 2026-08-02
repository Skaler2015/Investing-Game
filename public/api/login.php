<?php
/** Sign in. Body: { email, password } -> { token, user } */
require __DIR__ . '/_db.php';
migrate();

$in    = body();
$email = strtolower(trim((string)($in['email'] ?? '')));
$pass  = (string)($in['password'] ?? '');

if ($email === '' || $pass === '') fail('Email and password are required.');

$stmt = db()->prepare('SELECT id, email, name, pass_hash FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$row = $stmt->fetch();

if (!$row || !password_verify($pass, $row['pass_hash'])) {
  fail('Incorrect email or password.', 401);
}

$token = issueToken($row['id']);
ok(['token' => $token, 'user' => ['id' => $row['id'], 'email' => $row['email'], 'name' => $row['name']]]);
