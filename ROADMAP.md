# 🗺️ Invest Master — Tycoon Roadmap

Turning the trading sim into a full **Investment Tycoon + Life Sim + Financial
Education** game, built **incrementally** so nothing breaks along the way. Each
phase ships live on its own.

## Architecture principles
- **Data-driven**: game content lives in `src/data/*` (assets, careers, events,
  missions…). Adding content = adding data, not rewriting logic.
- **Pure engines**: `src/engine/*` holds side-effect-free simulation (market,
  economy, insights). Easy to test and reuse.
- **One store**: `src/store/gameStore.ts` owns state + persistence, with a
  monthly cash-flow "heartbeat" every new system plugs into.
- **Swappable services**: `AuthProvider` / `StorageAdapter` interfaces let a
  cloud backend drop in later without touching gameplay.
- **Per-account saves**, migration-safe (`migrateSnapshot`) so updates never
  wipe existing players.

## Phases

- [x] **Phase 0 — Core game**: live market, 6 asset classes, trading,
      portfolio, missions, achievements, levels, leaderboard, PWA, deploy.
- [x] **Phase 1 — Trader → Tycoon foundation**
  - Career system (11 careers with salary/expenses)
  - Monthly cash-flow engine (salary + passive income − living costs + life
    events) with a net-worth growth history
  - Premium dashboard cards: monthly income, passive income, net/month,
    lifetime return, net-worth growth chart, Market Sentiment / Economic
    Condition / Portfolio Risk gauges
- [x] **Phase 2 — Banking & debt**
  - Savings account with monthly interest; Fixed Deposits (tenures/rates,
    maturity payouts)
  - Loans (personal / gold / home) with amortising EMIs auto-collected each
    month, early repayment, eligibility by salary + credit score
  - Credit score (CIBIL) that rises on on-time EMIs and falls on missed ones
  - Dedicated Bank screen + dashboard quick-access; net worth now counts
    savings + deposits − loan balances
- [x] **Phase 3 — Businesses**
  - 12 buyable businesses (café → shopping mall) with monthly profit that
    scales with the economy and feeds the monthly ledger
  - Level upgrades, marketing boost (+revenue for a cost), and selling
  - Business value counts toward net worth; dedicated Businesses screen +
    dashboard quick-access
- [x] **Phase 4 — Real estate**
  - 8 properties (studio → mall unit) across residential/commercial/
    industrial/agricultural
  - Monthly net rent (rent − maintenance − property tax) on the ledger, plus
    value appreciation nudged by the economy
  - Rent/vacant toggle, sell at current value; property value counts toward
    net worth; dedicated screen + dashboard quick-access
- [x] **Phase 5 — Deeper markets**
  - New asset classes: Mutual Funds, ETFs, Bonds, REITs (10 new instruments)
    trading through the existing market/portfolio engine
  - SIP (systematic investment plan): set a monthly amount on any asset and it
    auto-invests each month; managed from the asset sheet & Portfolio
  - Richer asset detail: sector, market cap, P/E, EPS, CEO, dividend yield,
    52-week range, fund expense ratio & 1Y return
  - Candlestick chart (line/candle toggle) derived from tick history
- [x] **Phase 6 — Global economy & news engine**
  - Macro economy that cycles through Boom → Expansion → Slowdown →
    Recession → Recovery, evolving inflation / GDP / interest-rate numbers
  - The active phase biases market-wide drift and volatility every tick
  - Rolling, categorised news feed (economy / business / company / policy /
    crypto) with a dedicated News & Economy screen; dashboard Economy card +
    tappable news ticker
- [x] **Phase 7 — Progression, tax, advice & education**
  - Tiered achievements (Bronze → Silver → Gold → Diamond → Legendary),
    generated across milestone families with tier-scaled rewards
  - Tax system: progressive income-tax slabs deducted monthly + short-term
    capital-gains tax on profitable sells, with a Tax summary on the profile
  - AI Financial Advisor: a rules engine that inspects the whole portfolio and
    returns prioritised guidance (emergency fund, diversification, risk, debt,
    idle cash, SIP…), surfaced on the dashboard and a dedicated screen
  - Learn & Earn: bite-sized financial-literacy lessons with reward-bearing
    quizzes
- [x] **Phase 8 — Polish: sound, seasons, exports, settings**
  - Web-Audio sound effects (buy / sell / reward / achievement) with a toggle
  - Calendar-driven seasonal events (Independence Month, Diwali, New Year…)
    that boost daily rewards, with a dashboard banner
  - Exportable financial statement (printable HTML → Save-as-PDF)
  - Settings screen (sound, theme, export, reset, simulation notice)
- [x] **Phase 9 — Cloud accounts & central saves (PHP + MySQL)**
  - A small PHP API (`public/api/*.php`) backed by the owner's Hostinger MySQL
    database stores every account and every player's full game snapshot
    server-side, so progress is central and works across devices.
  - Email/password signup + login with hashed passwords (`password_hash`),
    token auth via an `X-Token` header, and prepared statements throughout.
  - The client (`services/backend.ts`) probes `/api/health.php` on boot and
    picks **server** mode when the DB is reachable, else falls back to the
    existing **local** on-device storage — the game always works. Server saves
    are debounced; a local cache mirrors them for offline use.
  - One-time server setup is in `SETUP-BACKEND.md` (copy `_config.php`, set the
    DB password).

- [x] **Phase 10 — Market Pro & engagement**
  - Market screen: live **search** (name/symbol), **sort** (top gainers/losers,
    price, name) and a **Watchlist** (⭐) filter; star any asset from its sheet.
  - **Buy by ₹ amount** (not just quantity) with an all-cash shortcut.
  - **Price alerts** (notify when a price crosses a target, with optional OS
    notifications) and **auto orders** — limit-buy, stop-loss and take-profit
    that fill automatically on each tick.
  - Chart **time-range** tabs (1D / 1W / 1M / All) on line & candle views.
  - **Daily Spin** wheel (one weighted free spin a day) on the Rewards tab.
  - **Net-worth goal** tracker on the dashboard with live progress.
  - All new state lives in the snapshot (migration-safe) so it syncs to the
    cloud database automatically.

- [x] **Phase 11 — Wealth & life expansion**
  - **Insurance** (health / life) in the Bank: a monthly premium that absorbs
    part of negative life events, woven into the monthly cash-flow engine.
  - **Portfolio Analytics** tab: cost basis, current value, realised vs
    unrealised P&L, overall return, and best / weakest performer.
  - **Financial Health** score (0–100) on the dashboard from emergency fund,
    diversification, debt, cover and SIPs, with the next best step.
  - **Daily Scratch Card** (a second free daily reward beside the spin) and
    **streak milestone** bonuses at 7 / 30 / 100 days.
  - **Glossary** of financial terms in Learn & Earn; **life-goal presets**
    (car / house / trip / ₹1 Cr) on the goal card.
  - All new state is snapshot-persisted and migration-safe, syncing to the
    cloud database automatically.

All eleven phases shipped. Future ideas: real cross-player leaderboards,
friends, clubs/tournaments, and a richer remote-config admin panel — each
slots onto the existing data-driven, service-abstracted architecture.
