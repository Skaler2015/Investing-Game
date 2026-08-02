/**
 * Insurance plans. Pay a small monthly premium; when a negative life event
 * strikes (medical bill, income shock), the plan absorbs part of the loss.
 * All virtual — a gentle lesson in why cover matters.
 */
export interface InsurancePlan {
  id: 'health' | 'life';
  name: string;
  premium: number;   // ₹ per in-game month
  coverage: number;  // fraction of a negative life event it absorbs (0–1)
  description: string;
}

export const INSURANCE_PLANS: InsurancePlan[] = [
  {
    id: 'health',
    name: 'Health Insurance',
    premium: 800,
    coverage: 0.6,
    description: 'Absorbs 60% of unexpected expense-type life events.',
  },
  {
    id: 'life',
    name: 'Life & Income Cover',
    premium: 1200,
    coverage: 0.8,
    description: 'Absorbs 80% of income-shock expense events.',
  },
];

export function getInsurancePlan(id: string): InsurancePlan | undefined {
  return INSURANCE_PLANS.find((p) => p.id === id);
}

/** Highest coverage among the player's active plans (0 if none). */
export function bestCoverage(activeIds: string[]): number {
  return INSURANCE_PLANS.filter((p) => activeIds.includes(p.id)).reduce(
    (m, p) => Math.max(m, p.coverage),
    0
  );
}

/** Total monthly premium for the active plans. */
export function totalPremium(activeIds: string[]): number {
  return INSURANCE_PLANS.filter((p) => activeIds.includes(p.id)).reduce((s, p) => s + p.premium, 0);
}
