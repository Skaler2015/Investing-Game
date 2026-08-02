<?php
/**
 * Database configuration TEMPLATE.
 *
 * SETUP (one time, on the server — NOT committed to git):
 *   1. In Hostinger File Manager, open this folder:  public_html/Invest/api/
 *   2. Copy this file and rename the copy to  _config.php
 *   3. Edit _config.php and fill in your real MySQL password below.
 *
 * The deploy never overwrites _config.php (it's not in the repo), so your
 * credentials stay safe on the server.
 */
return [
  'host' => 'localhost',            // Hostinger MySQL host (usually localhost)
  'db'   => 'u246829578_Invest',    // your database name
  'user' => 'u246829578_Invest',    // your database user
  'pass' => 'YOUR_DB_PASSWORD_HERE', // <-- set this to your MySQL password

  // ── Admin panel login (for /admin) ──────────────────────────────────────
  // These protect the owner dashboard at  https://invest.playb.in/admin/
  // Change them to anything you like; they live only here on the server.
  'admin_user' => 'admin',
  'admin_pass' => 'CHANGE_THIS_ADMIN_PASSWORD',
];
