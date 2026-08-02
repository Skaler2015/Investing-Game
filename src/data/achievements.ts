import type { AchievementDef } from '../types';

/**
 * Achievement catalogue. Each `check` is a pure predicate over an
 * AchievementContext snapshot, evaluated after every trade / tick.
 */
export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'ach-first-investment',
    title: 'First Investment',
    description: 'Make your very first trade.',
    icon: 'Sparkles',
    rewardCoins: 50,
    rewardXp: 40,
    check: (c) => c.totalTrades >= 1,
  },
  {
    id: 'ach-diversified',
    title: 'Diversified',
    description: 'Hold at least 3 different asset classes at once.',
    icon: 'LayoutGrid',
    rewardCoins: 120,
    rewardXp: 80,
    check: (c) => c.distinctClassesHeld >= 3,
  },
  {
    id: 'ach-first-lakh',
    title: 'First ₹1 Lakh Profit',
    description: 'Earn ₹1,00,000 in total realised profit.',
    icon: 'TrendingUp',
    rewardCoins: 300,
    rewardXp: 200,
    check: (c) => c.realizedPnl >= 100000,
  },
  {
    id: 'ach-networth-1m',
    title: 'Millionaire',
    description: 'Reach a net worth of ₹10,00,000.',
    icon: 'Crown',
    rewardCoins: 250,
    rewardXp: 180,
    check: (c) => c.netWorth >= 1000000,
  },
  {
    id: 'ach-networth-10m',
    title: 'Portfolio Worth ₹10 Million',
    description: 'Reach a net worth of ₹1,00,00,000.',
    icon: 'Gem',
    rewardCoins: 800,
    rewardXp: 500,
    check: (c) => c.netWorth >= 10000000,
  },
  {
    id: 'ach-100-trades',
    title: '100 Successful Trades',
    description: 'Close 100 profitable trades.',
    icon: 'Trophy',
    rewardCoins: 1000,
    rewardXp: 600,
    check: (c) => c.profitableTrades >= 100,
  },
  {
    id: 'ach-active-trader',
    title: 'Active Trader',
    description: 'Complete 25 trades in total.',
    icon: 'Activity',
    rewardCoins: 150,
    rewardXp: 120,
    check: (c) => c.totalTrades >= 25,
  },
];
