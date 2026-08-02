/**
 * Simplified progressive income-tax slabs (annual, virtual ₹) plus a flat
 * short-term capital-gains rate. Educational, not real tax advice.
 */
export const TAX_SLABS: { upTo: number; rate: number }[] = [
  { upTo: 300000, rate: 0 },
  { upTo: 600000, rate: 0.05 },
  { upTo: 900000, rate: 0.1 },
  { upTo: 1200000, rate: 0.15 },
  { upTo: 1500000, rate: 0.2 },
  { upTo: Infinity, rate: 0.3 },
];

/** Short-term capital-gains tax rate applied to realised trading profit. */
export const CAPITAL_GAINS_RATE = 0.15;

/** Annual income tax owed on a given annual income, via marginal slabs. */
export function incomeTaxAnnual(annualIncome: number): number {
  let tax = 0;
  let lower = 0;
  for (const slab of TAX_SLABS) {
    if (annualIncome <= lower) break;
    const taxable = Math.min(annualIncome, slab.upTo) - lower;
    tax += taxable * slab.rate;
    lower = slab.upTo;
  }
  return Math.round(tax);
}

/** Monthly income tax for a monthly salary. */
export function incomeTaxMonthly(monthlySalary: number): number {
  return Math.round(incomeTaxAnnual(monthlySalary * 12) / 12);
}
