<?php
/** Invalidate the current token. Header: X-Token. Always succeeds. */
require __DIR__ . '/_db.php';
migrate();
$token = requestToken();
if ($token !== '') {
  $stmt = db()->prepare('DELETE FROM tokens WHERE token = ?');
  $stmt->execute([$token]);
}
ok();
