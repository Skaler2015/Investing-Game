<?php
/** Current owner announcement (public). -> { announcement: {id,title,body}|null }. */
require __DIR__ . '/_db.php';
migrate();
$raw = settingGet('announcement');
$ann = $raw ? json_decode($raw, true) : null;
ok(['announcement' => is_array($ann) ? $ann : null]);
