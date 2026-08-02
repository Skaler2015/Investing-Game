import type { AchievementDef, AchievementContext, AchievementTier } from '../types';
import { formatCurrency } from '../utils/format';

const TIER_REWARD: Record<AchievementTier, { coins: number; xp: number }> = {
  Bronze: { coins: 60, xp: 40 },
  Silver: { coins: 140, xp: 90 },
  Gold: { coins: 320, xp: 200 },
  Diamond: { coins: 750, xp: 450 },
  Legendary: { coins: 1600, xp: 950 },
};

interface Milestone {
  threshold: number;
  tier: AchievementTier;
}

/** Build a family of tiered milestone achievements sharing a check metric. */
function family(
  idBase: string,
  icon: string,
  milestones: Milestone[],
  title: (t: number) => string,
  desc: (t: number) => string,
  metric: (c: AchievementContext) => number
): AchievementDef[] {
  return milestones.map((m) => ({
    id: `${idBase}-${m.threshold}`,
    title: title(m.threshold),
    description: desc(m.threshold),
    icon,
    tier: m.tier,
    rewardCoins: TIER_REWARD[m.tier].coins,
    rewardXp: TIER_REWARD[m.tier].xp,
    check: (c) => metric(c) >= m.threshold,
  }));
}

const B: AchievementTier = 'Bronze';
const S: AchievementTier = 'Silver';
const G: AchievementTier = 'Gold';
const D: AchievementTier = 'Diamond';
const L: AchievementTier = 'Legendary';

export const ACHIEVEMENTS: AchievementDef[] = [
  // Specials
  {
    id: 'ach-first-investment', title: 'First Investment',
    description: 'Make your very first trade.', icon: 'Sparkles', tier: B,
    rewardCoins: 60, rewardXp: 40, check: (c) => c.totalTrades >= 1,
  },
  {
    id: 'ach-emergency-fund', title: 'Safety Net',
    description: 'Keep 6 months of expenses in savings.', icon: 'PiggyBank', tier: G,
    rewardCoins: 320, rewardXp: 200,
    check: (c) => c.monthlyExpenses > 0 && c.savings >= c.monthlyExpenses * 6,
  },
  {
    id: 'ach-tycoon', title: 'Empire Builder',
    description: 'Own a business and a property at the same time.', icon: 'Crown', tier: D,
    rewardCoins: 750, rewardXp: 450,
    check: (c) => c.businessesOwned >= 1 && c.propertiesOwned >= 1,
  },

  // Net worth
  ...family(
    'ach-nw', 'Crown',
    [
      { threshold: 100000, tier: B }, { threshold: 500000, tier: B },
      { threshold: 1000000, tier: S }, { threshold: 5000000, tier: S },
      { threshold: 10000000, tier: G }, { threshold: 50000000, tier: G },
      { threshold: 100000000, tier: D }, { threshold: 500000000, tier: D },
      { threshold: 1000000000, tier: L },
    ],
    (t) => `Net Worth ${formatCurrency(t)}`,
    (t) => `Grow your total net worth to ${formatCurrency(t)}.`,
    (c) => c.netWorth
  ),

  // Realised profit
  ...family(
    'ach-profit', 'TrendingUp',
    [
      { threshold: 10000, tier: B }, { threshold: 100000, tier: S },
      { threshold: 500000, tier: S }, { threshold: 2500000, tier: G },
      { threshold: 10000000, tier: D }, { threshold: 50000000, tier: L },
    ],
    (t) => `Profit ${formatCurrency(t)}`,
    (t) => `Bank ${formatCurrency(t)} in total realised profit.`,
    (c) => c.realizedPnl
  ),

  // Total trades
  ...family(
    'ach-trades', 'Activity',
    [
      { threshold: 10, tier: B }, { threshold: 50, tier: S }, { threshold: 100, tier: S },
      { threshold: 500, tier: G }, { threshold: 1000, tier: D }, { threshold: 5000, tier: L },
    ],
    (t) => `${t} Trades`,
    (t) => `Complete ${t} trades in total.`,
    (c) => c.totalTrades
  ),

  // Profitable trades
  ...family(
    'ach-wins', 'Trophy',
    [{ threshold: 1, tier: B }, { threshold: 25, tier: S }, { threshold: 100, tier: G }, { threshold: 500, tier: D }],
    (t) => `${t} Winning Trades`,
    (t) => `Close ${t} trades at a profit.`,
    (c) => c.profitableTrades
  ),

  // Businesses
  ...family(
    'ach-biz', 'Store',
    [{ threshold: 1, tier: S }, { threshold: 3, tier: G }, { threshold: 6, tier: D }, { threshold: 12, tier: L }],
    (t) => (t === 1 ? 'First Business' : `${t} Businesses`),
    (t) => `Own ${t} business${t > 1 ? 'es' : ''} at once.`,
    (c) => c.businessesOwned
  ),

  // Properties
  ...family(
    'ach-prop', 'Home',
    [{ threshold: 1, tier: S }, { threshold: 3, tier: G }, { threshold: 6, tier: D }, { threshold: 10, tier: L }],
    (t) => (t === 1 ? 'First Property' : `${t} Properties`),
    (t) => `Own ${t} propert${t > 1 ? 'ies' : 'y'}.`,
    (c) => c.propertiesOwned
  ),

  // SIPs
  ...family(
    'ach-sip', 'PiggyBank',
    [{ threshold: 1, tier: B }, { threshold: 3, tier: S }, { threshold: 5, tier: G }],
    (t) => (t === 1 ? 'SIP Started' : `${t} SIPs`),
    (t) => `Run ${t} systematic investment plan${t > 1 ? 's' : ''}.`,
    (c) => c.sipCount
  ),

  // Diversification
  ...family(
    'ach-div', 'LayoutGrid',
    [{ threshold: 3, tier: B }, { threshold: 6, tier: S }, { threshold: 10, tier: G }],
    (t) => `Diversified ×${t}`,
    (t) => `Hold ${t} different asset classes at once.`,
    (c) => c.distinctClassesHeld
  ),

  // Savings
  ...family(
    'ach-save', 'PiggyBank',
    [{ threshold: 100000, tier: S }, { threshold: 1000000, tier: G }],
    (t) => `Saver ${formatCurrency(t)}`,
    (t) => `Hold ${formatCurrency(t)} in your savings account.`,
    (c) => c.savings
  ),
];

export const TIER_COLOR: Record<AchievementTier, string> = {
  Bronze: '#b45309',
  Silver: '#94a3b8',
  Gold: '#f59e0b',
  Diamond: '#22d3ee',
  Legendary: '#a855f7',
};
