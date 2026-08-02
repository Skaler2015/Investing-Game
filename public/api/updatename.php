<?php
/** Rename the signed-in user. Body: { name }. Header: X-Token. */
require __DIR__ . '/_db.php';
migrate();
$u = requireUser();

$name = trim((string)(body()['name'] ?? ''));
if ($name === '') fail('Name cannot be empty.');
if (mb_strlen($name) > 120) $name = mb_substr($name, 0, 120);

$stmt = db()->prepare('UPDATE users SET name = ? WHERE id = ?');
$stmt->execute([$name, $u['id']]);

ok(['user' => ['id' => $u['id'], 'email' => $u['email'], 'name' => $name]]);
