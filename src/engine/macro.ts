import type { AssetClass, EconomyState, NewsCategory } from '../types';
import { PHASES } from '../data/macro';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;

function weightedPick(next: { phase: EconomyState['phase']; weight: number }[]): EconomyState['phase'] {
  const total = next.reduce((s, n) => s + n.weight, 0);
  let r = Math.random() * total;
  for (const n of next) {
    r -= n.weight;
    if (r <= 0) return n.phase;
  }
  return next[next.length - 1].phase;
}

/** Advance the macro economy one month: drift the numbers toward the current
 *  phase's targets and occasionally transition to a new phase. */
export function stepEconomy(state: EconomyState): { next: EconomyState; changed: boolean } {
  const cfg = PHASES[state.phase];
  const monthsInPhase = state.monthsInPhase + 1;
  const inflation = round1(lerp(state.inflation, cfg.inflation, 0.3));
  const gdp = round1(lerp(state.gdp, cfg.gdp, 0.3));
  const interestRate = round2(lerp(state.interestRate, cfg.interestRate, 0.3));

  let phase = state.phase;
  let mip = monthsInPhase;
  let changed = false;
  if (monthsInPhase >= cfg.minMonths && Math.random() < 0.45) {
    phase = weightedPick(cfg.next);
    changed = phase !== state.phase;
    mip = 0;
  }
  return { next: { phase, monthsInPhase: mip, inflation, gdp, interestRate }, changed };
}

/** Annual drift bias applied market-wide for the current phase. */
export function economyDrift(state: EconomyState): number {
  return PHASES[state.phase].driftBias;
}

/** Market-wide volatility multiplier for the current phase. */
export function economyVol(state: EconomyState): number {
  return PHASES[state.phase].volMult;
}

/** Classify a market-event headline into a news category for the feed. */
export function categoryFor(ev: { headline: string; affects: AssetClass[] }): NewsCategory {
  if (ev.affects.includes('crypto')) return 'crypto';
  if (ev.affects.length === 0) return 'economic';
  const h = ev.headline.toLowerCase();
  if (/(policy|government|central bank|election|trade deal|regulat)/.test(h)) return 'political';
  if (ev.affects.includes('stock') && /(profit|reports|results|jobs)/.test(h)) return 'company';
  return 'business';
}
