# 🚀 Auto-deploy to Hostinger (GitHub → live subdomain)

Every time you push to the **`main`** branch, GitHub Actions builds the game and
uploads it to your Hostinger subdomain over FTP. Change code → push → the site
updates automatically. Users on the installed PWA get the update on their next
open (the service worker auto-updates).

The workflow lives in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

---

## One-time setup (~10 minutes)

### 1. Create the subdomain in Hostinger
In **hPanel → Domains → Subdomains**, create your subdomain (e.g.
`invest.playb.in`). Note the **document root** folder it creates — it's usually
something like:

```
/domains/invest.playb.in/public_html/
```

or, on some plans:

```
/public_html/invest/
```

### 2. Get your FTP details
In **hPanel → Files → FTP Accounts**, find (or create) an FTP account. You'll
get:

- **FTP host / server** — e.g. `82.180.xxx.xxx` or `ftp.playb.in`
- **FTP username** — e.g. `u123456789.invest`
- **FTP password** — the one you set

### 3. Add the secrets & variable to GitHub
In your repo: **Settings → Secrets and variables → Actions**.

**Secrets** tab → *New repository secret* (add all three):

| Name | Value |
| --- | --- |
| `FTP_SERVER` | your FTP host (e.g. `82.180.164.152`) |
| `FTP_USERNAME` | your FTP username (e.g. `u246829578.playb.in`) |
| `FTP_PASSWORD` | your FTP password (set/reset it in hPanel → FTP Accounts) |

**Variables** tab → *New repository variable*:

| Name | Value |
| --- | --- |
| `FTP_TARGET_DIR` | the subdomain document root, home-relative, **with a trailing slash**, e.g. `/domains/playb.in/public_html/Invest/` |

> The FTP account lands in your account home (`/home/uXXXXXXXX/`), so the
> target path is written **relative to that home** — start it at `/domains/…`,
> not at `/home/…`. If files don't show up, log in once with FileZilla to see
> the exact path.

> 🔒 Secrets are encrypted and never shown in logs. The variable is just a path,
> so it's safe as a plain variable.

### 4. Get the code onto `main`
The workflow deploys from `main`. Merge this branch into `main` (open a Pull
Request and merge it, or merge locally). After that first merge, the Action runs
automatically and your site goes live.

---

## Day-to-day

```bash
# make your changes, then:
git add -A
git commit -m "Update something"
git push        # to main
```

Watch progress in the repo's **Actions** tab. When the run is green, refresh
`https://invest.playb.in` — your change is live. 🎉

You can also trigger a deploy by hand: **Actions → Deploy to Hostinger → Run
workflow**.

---

## Notes & troubleshooting

- **FTP vs FTPS:** the workflow uses plain `ftp` on port 21, because Hostinger's
  FTPS certificate is issued for a hostname and fails when you connect via the
  IP. If you have a matching FTP hostname and want encryption, switch
  `protocol: ftp` to `protocol: ftps` in `deploy.yml`.
- **Wrong folder?** If files land in the wrong place, fix `FTP_TARGET_DIR`. Test
  your FTP login first with FileZilla to confirm the exact path.
- **Old files piling up:** deploys add/replace files but don't delete old ones.
  Hashed asset names make this harmless. To mirror exactly instead, uncomment
  `dangerous-clean-slate: true` in `deploy.yml` — but only if `FTP_TARGET_DIR`
  points **only** at this app's folder.
- **HTTPS:** enable the free SSL certificate for the subdomain in
  **hPanel → Security → SSL**. HTTPS is required for the PWA/service worker to
  work and for "Install app" to appear.
- **Caching:** `public/.htaccess` makes `index.html`, `sw.js` and the manifest
  always revalidate, so updates are picked up immediately while hashed JS/CSS is
  cached for a year.

---

### Alternative: Hostinger's built-in Git deploy
Hostinger also has **hPanel → Advanced → GIT**, but it only *pulls your repo
files* — it does **not** run `npm run build`. Since this is a Vite app that must
be built, the GitHub Actions method above is the right choice.
