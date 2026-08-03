import type { Career } from '../types';

/**
 * Careers give the player a monthly income to invest with, plus living costs —
 * turning the game from a pure trading sim into a wealth-building life sim.
 * Values are virtual ₹ per in-game month. Designed to be expandable: add
 * promotions, bonuses, taxes and job-loss on top of these base numbers.
 */
export const CAREERS: Career[] = [
  {
    id: 'student',
    title: 'Student',
    icon: 'GraduationCap',
    salary: 8000,
    expenses: 5000,
    description: 'Small stipend, low costs. A humble start — invest every rupee wisely.',
    volatility: 0.05,
  },
  {
    id: 'teacher',
    title: 'Teacher',
    icon: 'BookOpen',
    salary: 35000,
    expenses: 22000,
    description: 'Stable income with steady growth. Slow and steady wealth building.',
    volatility: 0.05,
  },
  {
    id: 'govt',
    title: 'Government Employee',
    icon: 'Landmark',
    salary: 45000,
    expenses: 26000,
    description: 'Rock-solid job security and a pension mindset. Rarely any surprises.',
    volatility: 0.02,
  },
  {
    id: 'farmer',
    title: 'Farmer',
    icon: 'Wheat',
    salary: 28000,
    expenses: 16000,
    description: 'Seasonal, weather-dependent income — but low living costs.',
    volatility: 0.25,
  },
  {
    id: 'engineer',
    title: 'Engineer',
    icon: 'Wrench',
    salary: 65000,
    expenses: 34000,
    description: 'Solid salary with good raises. A dependable path to the top.',
    volatility: 0.08,
  },
  {
    id: 'software',
    title: 'Software Engineer',
    icon: 'Code2',
    salary: 95000,
    expenses: 46000,
    description: 'High pay, high lifestyle. Fast track to serious capital.',
    volatility: 0.12,
  },
  {
    id: 'doctor',
    title: 'Doctor',
    icon: 'Stethoscope',
    salary: 130000,
    expenses: 60000,
    description: 'Top-tier income after a demanding start. Big money to deploy.',
    volatility: 0.06,
  },
  {
    id: 'lawyer',
    title: 'Lawyer',
    icon: 'Scale',
    salary: 90000,
    expenses: 48000,
    description: 'Lucrative but lumpy. Case wins can bring healthy bonuses.',
    volatility: 0.18,
  },
  {
    id: 'trader',
    title: 'Trader',
    icon: 'TrendingUp',
    salary: 55000,
    expenses: 32000,
    description: 'Income swings with the market. High risk, high reward lifestyle.',
    volatility: 0.3,
  },
  {
    id: 'freelancer',
    title: 'Freelancer',
    icon: 'Laptop',
    salary: 58000,
    expenses: 30000,
    description: 'Flexible and independent — but income is never guaranteed.',
    volatility: 0.28,
  },
  {
    id: 'business',
    title: 'Business Owner',
    icon: 'Store',
    salary: 85000,
    expenses: 47000,
    description: 'Your income is what your venture earns. Volatile, with big upside.',
    volatility: 0.35,
  },
];

export function getCareer(id: string | null | undefined): Career | undefined {
  if (!id) return undefined;
  return CAREERS.find((c) => c.id === id);
}

// ── Promotions ────────────────────────────────────────────────────────────
/** Highest promotion tier (0-based, so 5 = six pay grades). */
export const MAX_CAREER_LEVEL = 5;
/** Salary raise per promotion level. */
export const PROMO_RAISE = 0.12;
/** In-game months required at the current grade before the next promotion. */
export const PROMO_MONTHS = 6;

/** Effective monthly salary for a career at a given promotion level. */
export function careerSalary(career: Career, level: number): number {
  const lvl = Math.max(0, Math.min(MAX_CAREER_LEVEL, level));
  return Math.round(career.salary * (1 + lvl * PROMO_RAISE));
}

/** Rank title prefix for a promotion level, e.g. "Senior", "Lead". */
export function careerRankLabel(level: number): string {
  const ranks = ['Junior', 'Associate', 'Senior', 'Lead', 'Principal', 'Head'];
  return ranks[Math.max(0, Math.min(ranks.length - 1, level))];
}
