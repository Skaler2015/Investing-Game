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
  | 'profile';

/** Ephemeral toast/notification surfaced to the player. */
export interface Toast {
  id: string;
  title: string;
  message?: string;
  kind: 'info' | 'success' | 'reward' | 'event' | 'warning';
}
