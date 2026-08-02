<?php
/** Liveness + config probe. The client hits this to decide server vs local mode. */
require __DIR__ . '/_db.php';
try {
  migrate();
  ok(['service' => 'invest-master', 'db' => true]);
} catch (Throwable $e) {
  fail('database unavailable', 500);
}
