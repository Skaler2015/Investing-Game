/**
 * Calendar-driven seasonal events. When one is active the UI shows a festive
 * banner and daily-login rewards are boosted. Ranges are inclusive; the one
 * range that wraps the year end (New Year) is handled in `activeSeason`.
 */
export interface Season {
  id: string;
  name: string;
  emoji: string;
  color: string;
  /** Multiplier applied to daily-login rewards while active. */
  dailyMultiplier: number;
  message: string;
  start: { m: number; d: number };
  end: { m: number; d: number };
}

export const SEASONS: Season[] = [
  {
    id: 'republic', name: 'Republic Day', emoji: '🇮🇳', color: '#22c55e',
    dailyMultiplier: 2, message: 'Republic Day — double daily rewards!',
    start: { m: 1, d: 24 }, end: { m: 1, d: 27 },
  },
  {
    id: 'budget', name: 'Budget Season', emoji: '📊', color: '#6366f1',
    dailyMultiplier: 1.5, message: 'Budget Season — markets are watching. +50% daily rewards.',
    start: { m: 2, d: 1 }, end: { m: 2, d: 10 },
  },
  {
    id: 'summer', name: 'Summer Rally', emoji: '☀️', color: '#f59e0b',
    dailyMultiplier: 1.5, message: 'Summer Rally — soak up +50% daily rewards.',
    start: { m: 5, d: 1 }, end: { m: 5, d: 31 },
  },
  {
    id: 'independence', name: 'Independence Month', emoji: '🇮🇳', color: '#f59e0b',
    dailyMultiplier: 1.5, message: 'Independence Month — celebrate freedom with +50% daily rewards!',
    start: { m: 8, d: 1 }, end: { m: 8, d: 31 },
  },
  {
    id: 'diwali', name: 'Diwali Dhamaka', emoji: '🪔', color: '#f59e0b',
    dailyMultiplier: 2, message: 'Diwali Dhamaka — double daily rewards and prosperity!',
    start: { m: 10, d: 20 }, end: { m: 11, d: 5 },
  },
  {
    id: 'christmas', name: 'Festive Season', emoji: '🎄', color: '#22c55e',
    dailyMultiplier: 2, message: 'Festive Season — double daily rewards!',
    start: { m: 12, d: 20 }, end: { m: 12, d: 26 },
  },
  {
    id: 'newyear', name: 'New Year Bonanza', emoji: '🎆', color: '#a855f7',
    dailyMultiplier: 2, message: 'New Year Bonanza — start rich with double daily rewards!',
    start: { m: 12, d: 28 }, end: { m: 1, d: 5 },
  },
];

function inRange(m: number, d: number, s: Season): boolean {
  const cur = m * 100 + d;
  const start = s.start.m * 100 + s.start.d;
  const end = s.end.m * 100 + s.end.d;
  if (start <= end) return cur >= start && cur <= end;
  // Wraps the year (e.g. Dec → Jan).
  return cur >= start || cur <= end;
}

export function activeSeason(date: Date = new Date()): Season | null {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return SEASONS.find((s) => inRange(m, d, s)) ?? null;
}
