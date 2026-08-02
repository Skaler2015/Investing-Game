/**
 * Occasional monthly life events that nudge the player's cash — the seed of a
 * full life-simulation layer. Amounts are multipliers of monthly salary so
 * they scale with the player's career. Expandable: marriage, children,
 * medical, travel, insurance payouts, etc.
 */
export interface LifeEventTemplate {
  id: string;
  label: string;
  kind: 'bonus' | 'expense';
  /** Fraction of monthly salary (e.g. 0.5 = half a month's pay). */
  salaryFraction: number;
}

export const LIFE_EVENTS: LifeEventTemplate[] = [
  { id: 'bonus', label: '🎉 Performance bonus', kind: 'bonus', salaryFraction: 0.6 },
  { id: 'gift', label: '🎁 Festival gift money', kind: 'bonus', salaryFraction: 0.25 },
  { id: 'freelance', label: '💼 Side-gig payout', kind: 'bonus', salaryFraction: 0.4 },
  { id: 'medical', label: '🏥 Medical expense', kind: 'expense', salaryFraction: 0.5 },
  { id: 'repair', label: '🔧 Home/vehicle repair', kind: 'expense', salaryFraction: 0.3 },
  { id: 'travel', label: '✈️ Family trip', kind: 'expense', salaryFraction: 0.35 },
  { id: 'gadget', label: '📱 New gadget', kind: 'expense', salaryFraction: 0.2 },
];

/** Roughly 22% of months trigger a life event. Returns null otherwise. */
export function maybeLifeEvent(): LifeEventTemplate | null {
  if (Math.random() > 0.22) return null;
  return LIFE_EVENTS[Math.floor(Math.random() * LIFE_EVENTS.length)];
}
