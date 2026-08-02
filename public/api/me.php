<?php
/** Who am I? Header: X-Token -> { user } (or 401). */
require __DIR__ . '/_db.php';
migrate();
$u = requireUser();
ok(['user' => ['id' => $u['id'], 'email' => $u['email'], 'name' => $u['name']]]);
