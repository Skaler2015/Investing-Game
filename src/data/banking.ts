import type { LoanType } from '../types';

/** Annual interest paid on the savings balance. */
export const SAVINGS_APR = 0.04;

/** Credit-score tuning. */
export const CREDIT = {
  start: 650,
  min: 300,
  max: 900,
  onTimeBonus: 6,
  missedPenalty: 45,
  /** Score gained when an FD matures / a loan is fully repaid. */
  goodEventBonus: 8,
};

export interface FdProduct {
  termMonths: number;
  rate: number;
  label: string;
}

/** Fixed-deposit tenures and their (simple) annual rates. */
export const FD_PRODUCTS: FdProduct[] = [
  { termMonths: 6, rate: 0.06, label: '6 months' },
  { termMonths: 12, rate: 0.07, label: '1 year' },
  { termMonths: 24, rate: 0.085, label: '2 years' },
];

export interface LoanProduct {
  type: LoanType;
  title: string;
  icon: string;
  rate: number;
  termMonths: number;
  /** Max principal as a multiple of monthly salary. */
  salaryMultiple: number;
  /** Minimum credit score required to qualify. */
  minScore: number;
  description: string;
}

export const LOAN_PRODUCTS: LoanProduct[] = [
  {
    type: 'personal',
    title: 'Personal Loan',
    icon: 'Wallet',
    rate: 0.16,
    termMonths: 24,
    salaryMultiple: 10,
    minScore: 550,
    description: 'Quick cash, no collateral — but high interest.',
  },
  {
    type: 'gold',
    title: 'Gold Loan',
    icon: 'Gem',
    rate: 0.11,
    termMonths: 24,
    salaryMultiple: 6,
    minScore: 450,
    description: 'Lower rate, secured against gold. Easy to get.',
  },
  {
    type: 'home',
    title: 'Home Loan',
    icon: 'Building2',
    rate: 0.085,
    termMonths: 120,
    salaryMultiple: 60,
    minScore: 650,
    description: 'Large, long-term, low-rate financing for big moves.',
  },
];

export function loanProduct(type: LoanType): LoanProduct {
  return LOAN_PRODUCTS.find((p) => p.type === type) ?? LOAN_PRODUCTS[0];
}

export function creditLabel(score: number): string {
  if (score >= 800) return 'Excellent';
  if (score >= 720) return 'Very Good';
  if (score >= 650) return 'Good';
  if (score >= 550) return 'Fair';
  return 'Poor';
}
