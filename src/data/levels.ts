import type { LevelDef } from '../types';

/**
 * Progression ladder. xpRequired is the cumulative XP needed to *reach* the
 * level. Titles map onto the design's example tiers.
 */
export const LEVELS: LevelDef[] = [
  { level: 1, title: 'Beginner Investor', xpRequired: 0 },
  { level: 2, title: 'Beginner Investor', xpRequired: 100 },
  { level: 3, title: 'Novice Trader', xpRequired: 260 },
  { level: 4, title: 'Novice Trader', xpRequired: 480 },
  { level: 5, title: 'Smart Investor', xpRequired: 780 },
  { level: 6, title: 'Smart Investor', xpRequired: 1180 },
  { level: 7, title: 'Savvy Trader', xpRequired: 1700 },
  { level: 8, title: 'Market Expert', xpRequired: 2360 },
  { level: 9, title: 'Market Expert', xpRequired: 3200 },
  { level: 10, title: 'Investment Master', xpRequired: 4260 },
  { level: 11, title: 'Investment Master', xpRequired: 5600 },
  { level: 12, title: 'Wealth Wizard', xpRequired: 7300 },
  { level: 13, title: 'Tycoon', xpRequired: 9500 },
  { level: 14, title: 'Billionaire', xpRequired: 12500 },
  { level: 15, title: 'Billionaire', xpRequired: 16500 },
];

export interface LevelState {
  level: number;
  title: string;
  currentLevelXp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progress: number; // 0..1
  isMax: boolean;
}

/** Resolve raw XP into a rich level state for the UI. */
export function resolveLevel(xp: number): LevelState {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xpRequired) idx = i;
  }
  const current = LEVELS[idx];
  const next = LEVELS[idx + 1];
  if (!next) {
    return {
      level: current.level,
      title: current.title,
      currentLevelXp: current.xpRequired,
      xpIntoLevel: xp - current.xpRequired,
      xpForNextLevel: 0,
      progress: 1,
      isMax: true,
    };
  }
  const span = next.xpRequired - current.xpRequired;
  const into = xp - current.xpRequired;
  return {
    level: current.level,
    title: current.title,
    currentLevelXp: current.xpRequired,
    xpIntoLevel: into,
    xpForNextLevel: span,
    progress: Math.max(0, Math.min(1, into / span)),
    isMax: false,
  };
}
