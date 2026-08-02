import type { MissionDef } from '../types';

/**
 * Pool of daily missions. A deterministic daily subset is selected in the
 * store so every player gets the same rotation on a given day, but it still
 * changes day to day.
 */
export const MISSION_POOL: MissionDef[] = [
  {
    id: 'm-buy-3-stocks',
    title: 'Stock Shopper',
    description: 'Buy 3 stocks today.',
    type: 'buy_count',
    target: 3,
    rewardCoins: 100,
    rewardXp: 60,
  },
  {
    id: 'm-earn-10k',
    title: 'Profit Hunter',
    description: 'Earn ₹10,000 in realised profit.',
    type: 'profit_amount',
    target: 10000,
    rewardCoins: 200,
    rewardXp: 120,
    rewardBadge: 'Profit Hunter',
  },
  {
    id: 'm-invest-gold',
    title: 'Golden Touch',
    description: 'Invest in Gold.',
    type: 'invest_class',
    target: 1,
    assetClass: 'gold',
    rewardCoins: 80,
    rewardXp: 50,
  },
  {
    id: 'm-5-trades',
    title: 'Busy Bee',
    description: 'Complete 5 trades.',
    type: 'trade_count',
    target: 5,
    rewardCoins: 120,
    rewardXp: 70,
  },
  {
    id: 'm-invest-crypto',
    title: 'Crypto Curious',
    description: 'Invest in Cryptocurrency.',
    type: 'invest_class',
    target: 1,
    assetClass: 'crypto',
    rewardCoins: 90,
    rewardXp: 55,
  },
  {
    id: 'm-invest-startup',
    title: 'Angel Investor',
    description: 'Invest in a Startup.',
    type: 'invest_class',
    target: 1,
    assetClass: 'startup',
    rewardCoins: 110,
    rewardXp: 65,
  },
  {
    id: 'm-sell-2',
    title: 'Take Profits',
    description: 'Sell an asset 2 times.',
    type: 'sell_count',
    target: 2,
    rewardCoins: 90,
    rewardXp: 55,
  },
  {
    id: 'm-networth-grow',
    title: 'Wealth Builder',
    description: 'Reach ₹1,10,000 net worth.',
    type: 'net_worth',
    target: 110000,
    rewardCoins: 150,
    rewardXp: 90,
    rewardBadge: 'Wealth Builder',
  },
];

/** Deterministically pick `count` missions for a given day string (YYYY-MM-DD). */
export function selectDailyMissions(dayKey: string, count = 4): MissionDef[] {
  // Simple deterministic hash of the day string → rotating offset.
  let hash = 0;
  for (let i = 0; i < dayKey.length; i++) {
    hash = (hash * 31 + dayKey.charCodeAt(i)) % 100000;
  }
  const pool = [...MISSION_POOL];
  const picked: MissionDef[] = [];
  let cursor = hash % pool.length;
  for (let i = 0; i < Math.min(count, pool.length); i++) {
    picked.push(pool[cursor]);
    cursor = (cursor + 3) % pool.length;
    // Avoid duplicates from the +3 step landing on an already-picked index.
    while (picked.includes(pool[cursor])) {
      cursor = (cursor + 1) % pool.length;
    }
  }
  return picked;
}
