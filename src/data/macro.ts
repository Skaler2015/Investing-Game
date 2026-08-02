import type { EconomyPhase, EconomyState } from '../types';

export interface PhaseConfig {
  phase: EconomyPhase;
  label: string;
  emoji: string;
  /** Annual drift bias added to every asset while this phase is active. */
  driftBias: number;
  /** Volatility multiplier applied market-wide. */
  volMult: number;
  /** Targets the macro numbers drift toward. */
  inflation: number;
  gdp: number;
  interestRate: number;
  minMonths: number;
  /** Weighted transitions once minMonths have elapsed. */
  next: { phase: EconomyPhase; weight: number }[];
}

export const PHASES: Record<EconomyPhase, PhaseConfig> = {
  boom: {
    phase: 'boom', label: 'Boom', emoji: '🚀', driftBias: 0.07, volMult: 1.1,
    inflation: 6.8, gdp: 8.2, interestRate: 6.75, minMonths: 2,
    next: [{ phase: 'expansion', weight: 0.5 }, { phase: 'slowdown', weight: 0.5 }],
  },
  expansion: {
    phase: 'expansion', label: 'Expansion', emoji: '📈', driftBias: 0.03, volMult: 1.0,
    inflation: 5.2, gdp: 6.5, interestRate: 6.0, minMonths: 3,
    next: [{ phase: 'boom', weight: 0.3 }, { phase: 'expansion', weight: 0.35 }, { phase: 'slowdown', weight: 0.35 }],
  },
  slowdown: {
    phase: 'slowdown', label: 'Slowdown', emoji: '🐌', driftBias: -0.02, volMult: 1.12,
    inflation: 5.6, gdp: 3.0, interestRate: 6.5, minMonths: 2,
    next: [{ phase: 'recession', weight: 0.4 }, { phase: 'recovery', weight: 0.3 }, { phase: 'slowdown', weight: 0.3 }],
  },
  recession: {
    phase: 'recession', label: 'Recession', emoji: '📉', driftBias: -0.08, volMult: 1.45,
    inflation: 4.0, gdp: -1.2, interestRate: 5.0, minMonths: 2,
    next: [{ phase: 'recovery', weight: 0.65 }, { phase: 'recession', weight: 0.35 }],
  },
  recovery: {
    phase: 'recovery', label: 'Recovery', emoji: '🌱', driftBias: 0.045, volMult: 1.18,
    inflation: 4.6, gdp: 4.2, interestRate: 5.5, minMonths: 2,
    next: [{ phase: 'expansion', weight: 0.6 }, { phase: 'recovery', weight: 0.4 }],
  },
};

export function freshEconomy(): EconomyState {
  const p = PHASES.expansion;
  return {
    phase: 'expansion',
    monthsInPhase: 0,
    inflation: p.inflation,
    gdp: p.gdp,
    interestRate: p.interestRate,
  };
}
