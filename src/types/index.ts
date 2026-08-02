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
  | 'startup'
  | 'etf'
  | 'mutualfund'
  | 'bond'
  | 'reit';

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

  // Optional fundamentals (shown on the asset detail sheet).
  sector?: string;
  /** Market capitalisation in ₹. */
  marketCap?: number;
  /** Price-to-earnings ratio. */
  pe?: number;
  /** Earnings per share. */
  eps?: number;
  ceo?: string;
  /** Annual dividend yield for display (e.g. 0.012 = 1.2%). */
  divYieldAnnual?: number;
  /** Fund expense ratio (e.g. 0.005 = 0.5%). */
  expenseRatio?: number;
  /** Trailing 1-year return for funds/ETFs. */
  return1y?: number;
}

/** A recurring monthly investment (Systematic Investment Plan). */
export interface SIP {
  id: string;
  assetId: string;
  amount: number;
  createdMonth: number;
}

/**
 * A resting order that fills automatically when the market crosses its price.
 *  - kind 'limit' (buy):  fills when price falls to/below `price`
 *  - kind 'stop'  (sell): fills when price falls to/below `price` (stop-loss)
 *  - kind 'take'  (sell): fills when price rises to/above `price` (take-profit)
 */
export type OrderKind = 'limit' | 'stop' | 'take';

export interface PendingOrder {
  id: string;
  assetId: string;
  side: 'buy' | 'sell';
  kind: OrderKind;
  price: number;
  quantity: number;
  createdAt: number;
}

/** A one-shot price alert that notifies when the market crosses `price`. */
export interface PriceAlert {
  id: string;
  assetId: string;
  price: number;
  dir: 'above' | 'below';
  createdAt: number;
}

export type EconomyPhase = 'boom' | 'expansion' | 'slowdown' | 'recession' | 'recovery';

/** The macro backdrop that biases the whole market. */
export interface EconomyState {
  phase: EconomyPhase;
  monthsInPhase: number;
  /** Annual inflation %. */
  inflation: number;
  /** Annual GDP growth %. */
  gdp: number;
  /** Central-bank interest rate %. */
  interestRate: number;
}

export type NewsCategory = 'economic' | 'business' | 'political' | 'crypto' | 'company';

/** A headline in the rolling news feed. */
export interface NewsItem {
  id: string;
  headline: string;
  category: NewsCategory;
  sentiment: number;
  month: number;
  timestamp: number;
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

export type AchievementTier = 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | 'Legendary';

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: AchievementTier;
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
  businessesOwned: number;
  propertiesOwned: number;
  sipCount: number;
  savings: number;
  totalLoanBalance: number;
  monthlyExpenses: number;
}

/** A short interactive lesson with a single reward-bearing quiz question. */
export interface Lesson {
  id: string;
  title: string;
  icon: string;
  summary: string;
  /** Teaching content, one paragraph per entry. */
  body: string[];
  question: string;
  options: string[];
  answer: number;
  rewardCoins: number;
  rewardXp: number;
}

/** A single AI-advisor recommendation. */
export interface Advice {
  id: string;
  severity: 'good' | 'info' | 'warn';
  title: string;
  detail: string;
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

export type PropertyType = 'residential' | 'commercial' | 'industrial' | 'agricultural';

/** Static definition of a buyable property. */
export interface PropertyDef {
  id: string;
  name: string;
  icon: string;
  type: PropertyType;
  price: number;
  /** Monthly rent collected. */
  monthlyRent: number;
  /** Monthly upkeep cost. */
  maintenance: number;
  /** Annual property-tax rate on current value. */
  taxRate: number;
  /** Annual appreciation rate. */
  appreciation: number;
  description: string;
}

/** An owned property instance (value appreciates each month). */
export interface Property {
  id: string;
  defId: string;
  purchaseMonth: number;
  purchasePrice: number;
  /** Current appraised value (grows with appreciation). */
  currentValue: number;
  /** Whether the property is rented out. */
  rented: boolean;
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
  | 'business'
  | 'realestate'
  | 'news'
  | 'advisor'
  | 'learn'
  | 'settings';

/** Ephemeral toast/notification surfaced to the player. */
export interface Toast {
  id: string;
  title: string;
  message?: string;
  kind: 'info' | 'success' | 'reward' | 'event' | 'warning';
}
