/**
 * Daily spin-wheel prizes. One free spin per calendar day. Weighted so small
 * rewards are common and the jackpot is rare — all virtual, just for fun.
 */
export interface SpinPrize {
  id: string;
  label: string;
  coins: number;
  xp: number;
  /** Relative weight for the random draw (higher = more common). */
  weight: number;
  color: string;
}

export const SPIN_PRIZES: SpinPrize[] = [
  { id: 'c50',   label: '50 coins',   coins: 50,   xp: 0,  weight: 26, color: '#5b93ff' },
  { id: 'c100',  label: '100 coins',  coins: 100,  xp: 10, weight: 22, color: '#22c55e' },
  { id: 'xp25',  label: '25 XP',      coins: 0,    xp: 25, weight: 18, color: '#a855f7' },
  { id: 'c250',  label: '250 coins',  coins: 250,  xp: 20, weight: 14, color: '#f5b301' },
  { id: 'c500',  label: '500 coins',  coins: 500,  xp: 30, weight: 9,  color: '#ff8c42' },
  { id: 'xp100', label: '100 XP',     coins: 0,    xp: 100, weight: 7, color: '#ec4899' },
  { id: 'jack',  label: '1000 coins', coins: 1000, xp: 60, weight: 4,  color: '#ffd60a' },
];

/** Weighted random prize. Returns both the prize and its wheel index. */
export function pickSpinPrize(): { prize: SpinPrize; index: number } {
  const total = SPIN_PRIZES.reduce((sum, p) => sum + p.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < SPIN_PRIZES.length; i++) {
    r -= SPIN_PRIZES[i].weight;
    if (r <= 0) return { prize: SPIN_PRIZES[i], index: i };
  }
  return { prize: SPIN_PRIZES[0], index: 0 };
}
