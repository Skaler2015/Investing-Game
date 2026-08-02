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
- [ ] **Phase 5 — Deeper markets**: mutual funds/SIP, ETFs, bonds, REITs,
      richer stock detail (PE/EPS/dividends), candlestick charts.
- [ ] **Phase 6 — Global economy & news engine**: inflation, rates, GDP,
      recessions/booms and a generated news feed driving prices.
- [ ] **Phase 7 — Progression at scale**: 500+ missions, tiered achievements
      (Bronze→Legendary), tax system, AI advisor, education/tutorial mode.
- [ ] **Phase 8 — Live & social**: cloud accounts (Firebase/Supabase), real
      leaderboards, seasons/events, spin-wheel & daily systems, sound, PDF
      exports, admin/remote-config.

Progress is tracked here; each shipped phase updates this file.
