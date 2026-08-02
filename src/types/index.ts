/**
 * Core domain types for Invest Master.
 *
 * This is a simulation-only educational game. All currency values are in
 * virtual Indian Rupees (₹). No real money is ever involved.
 */

export type AssetClass =
  | 'stock'
  | 'crypto'
  | 'gold'
  | 'realestate'
  | 'fd'
  | 'startup';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Very High';

/** A single point in an asset's price history. */
export interface PricePoint {
  /** Simulation tick index at which the price was recorded. */
  t: number;
  price: number;
}

/**
 * A tradable asset. Static metadata plus the live, mutable market fields
 * (price / history) that the market engine updates every tick.
 */
export interface Asset {
  id: string;
  name: string;
  symbol: string;
  assetClass: AssetClass;
  risk: RiskLevel;
  /** Base annualised drift used by the market engine (e.g. 0.10 = 10%). */
  drift: number;
  /** Per-tick volatility. Higher = larger swings. */
  volatility: number;
  /** Passive yield paid on holdings per in-game day (e.g. FD interest, rent). */
  dividendYield: number;
  price: number;
  /** Rolling price history, most recent last. */
  history: PricePoint[];
  /** Minimum quantity that can be traded (e.g. fractional crypto vs whole FD). */
  minQty: number;
  description: string;
}

/** A player's position in a single asset. */
export interface Holding {
  assetId: string;
  quantity: number;
  /** Weighted-average purchase price, used to compute realised/unrealised P&L. */
  avgCost: number;
}

export type TradeSide = 'buy' | 'sell';

export interface Trade {
  id: string;
  assetId: string;
  assetName: string;
  side: TradeSide;
  quantity: number;
  price: number;
  total: number;
  /** Realised profit/loss on a sell (0 for buys). */
  realizedPnl: number;
  timestamp: number;
}

/** A market news event that shifts prices for a window of ticks. */
export interface MarketEvent {
  id: string;
  headline: string;
  /** Sentiment from -1 (crash) to +1 (boom). */
  sentiment: number;
  /** Which asset classes are affected. Empty = whole market. */
  affects: AssetClass[];
  /** Multiplier applied to affected assets' drift while active. */
  driftImpact: number;
  /** How many ticks the event stays active. */
  duration: number;
  timestamp: number;
}

export type MissionType =
  | 'buy_count'
  | 'sell_count'
  | 'trade_count'
  | 'profit_amount'
  | 'invest_class'
  | 'net_worth';

export interface MissionDef {
  id: string;
  title: string;
  description: string;
  type: MissionType;
  target: number;
  /** For invest_class missions: which class must be invested in. */
  assetClass?: AssetClass;
  rewardCoins: number;
  rewardXp: number;
  rewardBadge?: string;
}

export interface MissionProgress {
  defId: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  rewardCoins: number;
  rewardXp: number;
  /** Evaluated against game state to decide if unlocked. */
  check: (ctx: AchievementContext) => boolean;
}

export interface AchievementContext {
  netWorth: number;
  totalTrades: number;
  profitableTrades: number;
  realizedPnl: number;
  distinctClassesHeld: number;
  hasAnyHolding: boolean;
}

export interface LevelDef {
  level: number;
  title: string;
  /** Cumulative XP required to reach this level. */
  xpRequired: number;
}

export interface Player {
  id: string;
  name: string;
  avatarSeed: string;
  cash: number;
  coins: number;
  xp: number;
  /** Total realised P&L over the account lifetime. */
  realizedPnl: number;
  createdAt: number;
  lastLoginDay: string;
  /** Consecutive daily-login streak. */
  loginStreak: number;
  unlockedAchievements: string[];
  earnedBadges: string[];
  /** Selected career id (drives monthly salary/expenses). Null until chosen. */
  careerId: string | null;
}

/** A career the player works while investing — the tycoon cash-flow engine. */
export interface Career {
  id: string;
  title: string;
  icon: string;
  /** Virtual ₹ paid into cash each in-game month. */
  salary: number;
  /** Virtual ₹ of living costs deducted each in-game month. */
  expenses: number;
  description: string;
  /** Reserved for future promotion / job-loss systems. */
  volatility: number;
}

/** A single credit/debit in the monthly cash-flow ledger. */
export interface LedgerEntry {
  id: string;
  month: number;
  label: string;
  amount: number;
  kind: 'salary' | 'expense' | 'passive' | 'event';
  timestamp: number;
}

/** A net-worth sample taken at each month boundary (growth chart). */
export interface NetWorthPoint {
  month: number;
  value: number;
}

export type LoanType = 'personal' | 'gold' | 'home';

/** A locked fixed deposit earning simple interest until maturity. */
export interface FixedDeposit {
  id: string;
  principal: number;
  /** Annual interest rate (e.g. 0.07 = 7%). */
  rate: number;
  termMonths: number;
  startMonth: number;
  maturityMonth: number;
}

/** An amortising loan repaid via a fixed monthly EMI. */
export interface Loan {
  id: string;
  type: LoanType;
  /** Original borrowed amount. */
  principal: number;
  /** Outstanding balance. */
  balance: number;
  /** Annual interest rate. */
  rate: number;
  emi: number;
  termMonths: number;
  remainingMonths: number;
  startMonth: number;
  missedPayments: number;
}

/** The player's banking position. */
export interface BankState {
  savings: number;
  deposits: FixedDeposit[];
  loans: Loan[];
  /** 300–900 creditworthiness score. */
  creditScore: number;
}

/** Static definition of a buyable business type. */
export interface BusinessDef {
  id: string;
  name: string;
  icon: string;
  sector: string;
  /** Purchase cost at level 1. */
  cost: number;
  /** Base monthly revenue at level 1. */
  baseRevenue: number;
  /** Base monthly operating cost at level 1. */
  operatingCost: number;
  maxLevel: number;
  description: string;
}

/** An owned business instance. */
export interface Business {
  id: string;
  defId: string;
  level: number;
  /** Marketing boosts revenue for an extra running cost. */
  marketing: boolean;
  purchasedMonth: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  netWorth: number;
  weeklyGain: number;
  isPlayer: boolean;
  isFriend: boolean;
}

export type ThemeMode = 'dark' | 'light';

export type ScreenId =
  | 'dashboard'
  | 'market'
  | 'portfolio'
  | 'missions'
  | 'rewards'
  | 'leaderboard'
  | 'profile'
  | 'bank'
  | 'business';

/** Ephemeral toast/notification surfaced to the player. */
export interface Toast {
  id: string;
  title: string;
  message?: string;
  kind: 'info' | 'success' | 'reward' | 'event' | 'warning';
}
