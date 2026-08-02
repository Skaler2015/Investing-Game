/** Tunable game-balance constants, centralised for easy tweaking. */

/** Starting virtual cash for a brand-new player (₹1,00,000). */
export const STARTING_CASH = 100000;

/** Milliseconds between market ticks. */
export const TICK_INTERVAL_MS = 2500;

/** XP granted per completed trade. */
export const XP_PER_TRADE = 12;

/** Max trades retained in history. */
export const TRADE_HISTORY_LIMIT = 120;

/** Base daily-login reward (coins), scaled by streak. */
export const DAILY_REWARD_BASE_COINS = 100;
export const DAILY_REWARD_BASE_XP = 30;
/** Streak day at which the reward multiplier caps. */
export const DAILY_REWARD_STREAK_CAP = 7;

export const STORAGE_SNAPSHOT_KEY = 'snapshot-v1';
