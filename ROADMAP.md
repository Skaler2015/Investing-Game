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
  - _Cloud cross-device accounts remain the one item needing an external
    backend (Supabase/Firebase keys) — the AuthProvider/StorageAdapter
    abstractions are ready for it whenever you want to wire it up._

All eight phases shipped. Future ideas: cloud sync, multiplayer, spin-wheel &
clubs/tournaments, and a real remote-config admin panel — each slots onto the
existing data-driven, service-abstracted architecture.
