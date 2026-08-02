# 📈 Invest Master

**Invest Master** is a modern, mobile-first **investment simulation game**. Start
with ₹1,00,000 in virtual cash, build a diversified portfolio across stocks,
crypto, gold, real estate, fixed deposits and startups, and grow your net worth
by riding a live, event-driven market.

> ⚠️ **Simulation only.** This is an educational game. All money, prices and
> assets are **virtual**. No real money and no real-world trading is involved.

---

## ✨ Features

| Area | What's included |
| --- | --- |
| **Dashboard** | Net worth, cash, portfolio value, daily P&L, level & XP, global rank, live news ticker, daily reward |
| **Market** | 6 asset classes (Stocks, Crypto, Gold, Real Estate, Fixed Deposit, Startups) with live prices, risk levels, mini charts & class filters |
| **Trading** | Buy/sell with a quantity stepper, max-buy / sell-all shortcuts, live cost preview and validation |
| **Market engine** | Prices update every few seconds via geometric Brownian motion, biased by random news events (booms, crashes, inflation, policy changes…) |
| **Portfolio** | Holdings with live P&L, allocation donut chart, and full trade history |
| **Missions** | Rotating daily missions with coin / XP / badge rewards |
| **Rewards** | Daily login streak rewards + weekly challenges + auto-granted achievement rewards |
| **Achievements** | Milestone unlocks (First Investment, First ₹1 Lakh Profit, ₹10M Portfolio, 100 Trades…) |
| **Levels** | XP-based progression: Beginner → Smart Investor → Market Expert → Investment Master → Billionaire |
| **Leaderboard** | Global / Friends / Weekly rankings with a podium and your live rank |
| **Economy** | Passive income from dividends, interest and rent on eligible assets |
| **UI/UX** | Dark & light mode, modern cards, interactive SVG charts, smooth Framer Motion animations, responsive mobile-first layout |

---

## 🏗️ Tech Stack & Architecture

- **React 18 + TypeScript** — typed, component-driven UI
- **Vite** — fast dev server and optimized production builds
- **Zustand** — lightweight, scalable global state
- **Framer Motion** — smooth animations and transitions
- **lucide-react** — clean, consistent iconography
- **Custom SVG charts** — sparklines, price chart and donut (no heavy chart deps)
- **PWA (vite-plugin-pwa + Workbox)** — installable, offline-capable, runs
  fullscreen as a standalone mobile app

```
src/
├─ types/         Domain models (Asset, Holding, Trade, Player, …)
├─ data/          Game content: assets, events, missions, achievements, levels, weekly, leaderboard
├─ engine/        Pure simulation logic: market price engine + economy/portfolio math
├─ services/      Swappable abstractions: storage (persistence) & auth
├─ store/         Zustand game store + balance constants + selectors
├─ hooks/         useMarketTick (drives the live market)
├─ components/    Reusable UI (ui/) , layout (layout/) and game widgets (game/)
├─ screens/       Dashboard, Market, Portfolio, Quests, Leaderboard, Profile
└─ utils/         Formatting & id helpers
```

### Designed for future expansion

The codebase is intentionally modular so new features slot in cleanly:

- **Cloud database** — persistence goes through a `StorageAdapter` interface
  (`src/services/storage.ts`). The default `LocalStorageAdapter` keeps the game
  fully playable offline; swap in a Supabase/Firebase/custom-API adapter without
  touching game logic.
- **Secure authentication** — auth goes through an `AuthProvider` interface
  (`src/services/auth.ts`). The default guest provider models the shape a real
  identity provider (Firebase Auth, Auth0, JWT backend…) would expose.
- **New content** — assets, market events, missions, achievements, levels and
  weekly challenges are all data-driven; add entries to the `data/` files.
- **Planned** — Multiplayer, AI Investment Advisor, Business Management, Loan
  System, Property Management, Seasonal Events, Clubs & Tournaments.

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start the dev server (http://localhost:5173)
npm run dev

# Type-check + production build
npm run build

# Preview the production build
npm run preview

# Lint
npm run lint
```

Open the app on a phone-sized viewport (or your browser's device toolbar) for
the intended mobile experience. Progress auto-saves to your device.

---

## 📱 Install as a mobile app (PWA)

Invest Master is a **Progressive Web App**, so it installs to your phone's home
screen and runs fullscreen like a native app — no app store required. It also
works offline thanks to a service worker that caches the app shell.

> The service worker only activates on a production build served over HTTPS (or
> `localhost`). Use `npm run build && npm run preview`, or deploy the `dist/`
> folder to any static host (Netlify, Vercel, GitHub Pages, …).
>
> 🚀 **Auto-deploy to Hostinger:** pushing to `main` builds and publishes the
> site to your subdomain automatically — see **[DEPLOY.md](DEPLOY.md)** for the
> one-time setup.

**Android / Chrome:** open the site → tap the in-app **Install** banner, or use
the browser menu → **Install app / Add to Home screen**.

**iPhone / iPad (Safari):** tap the **Share** button → **Add to Home Screen**.

Once installed, launch it from the home-screen icon for a fullscreen, standalone
experience with its own splash and app icon.

---

## 🎮 How to Play

1. **Invest** — open the Market, tap an asset, and buy with your starting cash.
2. **Watch the market** — prices move every few seconds; news events swing them.
3. **Take profits** — sell when you're up to realise gains and bank XP.
4. **Complete quests** — finish daily missions and weekly challenges for rewards.
5. **Level up & climb** — earn XP, unlock achievements, and rise up the leaderboard.

Happy (virtual) investing! 🚀
