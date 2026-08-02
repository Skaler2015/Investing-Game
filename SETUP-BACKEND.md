# 🗄️ Backend setup (one time) — save every user in your MySQL database

Your game now has a small PHP + MySQL backend so that **signup details and every
player's progress save on the server** (in your Hostinger database
`u246829578_Invest`) instead of only on the phone/browser. This means data is
central — you own it — and it works across devices.

You only have to do this **once**. After that, every deploy just updates the code
and your database keeps all its data.

---

## Step 1 — Put your database password on the server

The code intentionally does **not** contain your database password (so it never
leaks into GitHub). You add it once, directly on Hostinger:

1. Open **Hostinger → File Manager**.
2. Go to the folder:  `public_html/Invest/api/`
3. You'll see a file called **`_config.sample.php`**.
   - **Right-click → Copy**, then rename the copy to **`_config.php`**
     (exact name, with the leading underscore).
4. **Edit `_config.php`** and set your real MySQL password:

   ```php
   return [
     'host' => 'localhost',
     'db'   => 'u246829578_Invest',
     'user' => 'u246829578_Invest',   // your MySQL username (often same as db)
     'pass' => 'YOUR_REAL_PASSWORD',  // <-- paste your MySQL password here
   ];
   ```

   > If you don't remember the password, in Hostinger go to
   > **Databases → Management**, and for `u246829578_Invest` you can **change the
   > password** — then paste that same password here.

5. **Save** the file.

That's it — the tables (`users`, `tokens`, `saves`) are created automatically the
first time the API is called. You don't need to run any SQL.

---

## Step 2 — Check it's working

Open this URL in your browser:

```
https://invest.playb.in/api/health.php
```

- ✅ You should see:  `{"ok":true,"service":"invest-master","db":true}`
  → The backend is live and connected to MySQL. Signups now save to your DB.
- ❌ If you see `{"ok":false,...}` → the password in `_config.php` is wrong, or
  the DB user isn't attached to the database. Fix the password and reload.
- ❌ If you see the game/HTML instead of JSON → the `api` folder didn't upload;
  re-run the deploy (push any change, or run the GitHub Action manually).

---

## Step 3 — (Recommended) turn on HTTPS/SSL

In **Hostinger → SSL**, make sure SSL is active for `invest.playb.in` and
"Force HTTPS" is on. Passwords should always travel over HTTPS.

---

## How it behaves

- When the server + database are reachable, the game runs in **server mode**:
  new signups, logins, and all progress save into `u246829578_Invest`.
- If the server is ever unreachable, the game automatically falls back to saving
  **on the device** so nobody is ever blocked — it re-syncs to the server the
  next time it can.

## Where your users' data lives

In phpMyAdmin (Hostinger → Databases → phpMyAdmin) open `u246829578_Invest`:

- **`users`** — one row per account (id, email, name, hashed password, created).
- **`saves`** — one row per user with their full game snapshot (JSON) and the
  last-updated time.
- **`tokens`** — active login sessions.

Passwords are stored **hashed** (never in plain text), which is the correct,
secure way to keep them.
