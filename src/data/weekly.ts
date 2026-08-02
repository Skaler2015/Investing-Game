export interface WeeklyChallengeDef {
  id: string;
  title: string;
  description: string;
  metric: 'trades' | 'profit';
  target: number;
  rewardCoins: number;
  rewardXp: number;
}

/** Weekly challenges reset every ISO-ish week (see weekKey in utils). */
export const WEEKLY_CHALLENGES: WeeklyChallengeDef[] = [
  {
    id: 'w-trades-15',
    title: 'Trade Marathon',
    description: 'Complete 15 trades this week.',
    metric: 'trades',
    target: 15,
    rewardCoins: 400,
    rewardXp: 250,
  },
  {
    id: 'w-profit-50k',
    title: 'Big Earner',
    description: 'Bank ₹50,000 in realised profit this week.',
    metric: 'profit',
    target: 50000,
    rewardCoins: 600,
    rewardXp: 350,
  },
  {
    id: 'w-trades-40',
    title: 'Market Machine',
    description: 'Complete 40 trades this week.',
    metric: 'trades',
    target: 40,
    rewardCoins: 900,
    rewardXp: 500,
  },
];
