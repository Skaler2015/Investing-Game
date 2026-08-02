import type { Asset, Holding, MarketEvent, RiskLevel } from '../types';
import { windowChangePct } from './market';
import { holdingValue } from './economy';

export interface Gauge {
  /** 0..100 score. */
  score: number;
  label: string;
  tone: 'up' | 'down' | 'neutral';
}

/** Aggregate market sentiment from active events + broad price action. */
export function marketSentiment(assets: Asset[], events: MarketEvent[]): Gauge {
  let signal = 0;
  if (events.length > 0) {
    signal = events.reduce((s, e) => s + e.sentiment, 0) / events.length;
  } else if (assets.length > 0) {
    const avg = assets.reduce((s, a) => s + windowChangePct(a), 0) / assets.length;
    signal = Math.max(-1, Math.min(1, avg / 5));
  }
  const score = Math.round((signal + 1) * 50);
  const label = score >= 66 ? 'Bullish' : score >= 40 ? 'Neutral' : 'Bearish';
  const tone = score >= 66 ? 'up' : score >= 40 ? 'neutral' : 'down';
  return { score, label, tone };
}

/** Derive the broad economic condition from market breadth. */
export function economicCondition(assets: Asset[]): Gauge {
  if (assets.length === 0) return { score: 50, label: 'Stable', tone: 'neutral' };
  const avg = assets.reduce((s, a) => s + windowChangePct(a), 0) / assets.length;
  let label: string;
  let tone: Gauge['tone'];
  if (avg > 2.5) { label = 'Boom'; tone = 'up'; }
  else if (avg > 0.6) { label = 'Growth'; tone = 'up'; }
  else if (avg > -0.6) { label = 'Stable'; tone = 'neutral'; }
  else if (avg > -2.5) { label = 'Slowdown'; tone = 'down'; }
  else { label = 'Recession'; tone = 'down'; }
  const score = Math.round(Math.max(0, Math.min(100, 50 + avg * 8)));
  return { score, label, tone };
}

const RISK_WEIGHT: Record<RiskLevel, number> = {
  Low: 20,
  Medium: 48,
  High: 74,
  'Very High': 95,
};

/** Portfolio risk 0..100, value-weighted across held assets' risk levels. */
export function portfolioRisk(holdings: Holding[], assets: Asset[]): Gauge {
  let total = 0;
  let weighted = 0;
  for (const h of holdings) {
    const asset = assets.find((a) => a.id === h.assetId);
    if (!asset) continue;
    const v = holdingValue(h, assets);
    total += v;
    weighted += v * RISK_WEIGHT[asset.risk];
  }
  const score = total > 0 ? Math.round(weighted / total) : 0;
  const label = score >= 75 ? 'Aggressive' : score >= 45 ? 'Balanced' : score > 0 ? 'Conservative' : 'No risk';
  const tone = score >= 75 ? 'down' : score >= 45 ? 'neutral' : 'up';
  return { score, label, tone };
}

/** Diversification score 0..100 based on distinct asset classes held. */
export function diversificationScore(holdings: Holding[], assets: Asset[]): number {
  const classes = new Set(
    holdings
      .filter((h) => h.quantity > 0)
      .map((h) => assets.find((a) => a.id === h.assetId)?.assetClass)
      .filter(Boolean)
  );
  return Math.min(100, Math.round((classes.size / 6) * 100));
}
