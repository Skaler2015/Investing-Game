/**
 * Daily scratch-card prizes — a second free daily reward alongside the spin
 * wheel. Weighted so small wins are common. Virtual coins/XP only.
 */
export interface ScratchPrize {
  id: string;
  label: string;
  coins: number;
  xp: number;
  weight: number;
}

export const SCRATCH_PRIZES: ScratchPrize[] = [
  { id: 's30',  label: '30 coins',  coins: 30,  xp: 5,  weight: 30 },
  { id: 's80',  label: '80 coins',  coins: 80,  xp: 10, weight: 24 },
  { id: 'sx40', label: '40 XP',     coins: 0,   xp: 40, weight: 18 },
  { id: 's200', label: '200 coins', coins: 200, xp: 15, weight: 14 },
  { id: 's400', label: '400 coins', coins: 400, xp: 25, weight: 9 },
  { id: 'sbig', label: '750 coins', coins: 750, xp: 50, weight: 5 },
];

export function pickScratchPrize(): { prize: ScratchPrize; index: number } {
  const total = SCRATCH_PRIZES.reduce((sum, p) => sum + p.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < SCRATCH_PRIZES.length; i++) {
    r -= SCRATCH_PRIZES[i].weight;
    if (r <= 0) return { prize: SCRATCH_PRIZES[i], index: i };
  }
  return { prize: SCRATCH_PRIZES[0], index: 0 };
}
