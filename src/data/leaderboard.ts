import type { LeaderboardEntry } from '../types';

/**
 * Simulated rival investors for the leaderboard. Net-worth figures here are
 * baselines; the store nudges them slightly over time so rankings feel alive.
 * `isFriend` marks a subset shown on the "Friends" tab.
 */
export interface RivalSeed {
  id: string;
  name: string;
  netWorth: number;
  weeklyGain: number;
  isFriend: boolean;
}

export const RIVAL_SEEDS: RivalSeed[] = [
  { id: 'r1', name: 'WolfOfDalalSt', netWorth: 8420000, weeklyGain: 12.4, isFriend: false },
  { id: 'r2', name: 'CryptoQueen', netWorth: 6210000, weeklyGain: 24.1, isFriend: true },
  { id: 'r3', name: 'SteadyEddie', netWorth: 3980000, weeklyGain: 4.2, isFriend: true },
  { id: 'r4', name: 'GoldBugGita', netWorth: 2750000, weeklyGain: 6.8, isFriend: false },
  { id: 'r5', name: 'StartupSam', netWorth: 2210000, weeklyGain: -8.3, isFriend: true },
  { id: 'r6', name: 'DividendDiva', netWorth: 1840000, weeklyGain: 3.1, isFriend: false },
  { id: 'r7', name: 'RookieRahul', netWorth: 640000, weeklyGain: 15.7, isFriend: true },
  { id: 'r8', name: 'ValueVikram', netWorth: 1520000, weeklyGain: 5.5, isFriend: false },
  { id: 'r9', name: 'MomentumMaya', netWorth: 990000, weeklyGain: 18.2, isFriend: false },
  { id: 'r10', name: 'HodlHarish', netWorth: 430000, weeklyGain: -3.4, isFriend: true },
];

export function buildRivalEntries(): LeaderboardEntry[] {
  return RIVAL_SEEDS.map((r) => ({
    id: r.id,
    name: r.name,
    netWorth: r.netWorth,
    weeklyGain: r.weeklyGain,
    isPlayer: false,
    isFriend: r.isFriend,
  }));
}
