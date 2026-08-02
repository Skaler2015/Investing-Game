import type { Asset, MarketEvent } from '../types';
import { MARKET_EVENTS } from '../data/events';

/** Maximum number of price points kept per asset (rolling window). */
export const HISTORY_LIMIT = 60;

/** Box–Muller transform → approx. standard normal random. */
function gaussian(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Advance a single asset by one tick using a discretised geometric
 * Brownian motion, biased by any active market events.
 *
 * @param asset       the asset to advance (not mutated)
 * @param tick        the new tick index
 * @param activeEvents events currently in effect
 * @returns a new Asset with updated price and history
 */
export function stepAsset(
  asset: Asset,
  tick: number,
  activeEvents: MarketEvent[]
): Asset {
  // Aggregate event drift for this asset.
  let eventDrift = 0;
  for (const ev of activeEvents) {
    const applies = ev.affects.length === 0 || ev.affects.includes(asset.assetClass);
    if (applies) {
      eventDrift += asset.drift * (ev.driftImpact - 1);
    }
  }

  // Per-tick drift (annual drift spread across ~250 ticks) + event bias.
  const baseDriftPerTick = asset.drift / 250;
  const totalDrift = baseDriftPerTick + eventDrift / 250;

  const shock = asset.volatility * gaussian();
  const changePct = totalDrift + shock;

  let nextPrice = asset.price * (1 + changePct);
  // Floor to avoid negative / zero prices (startups can crater but not vanish).
  const floor = asset.assetClass === 'fd' ? asset.price * 0.999 : 0.01;
  nextPrice = Math.max(nextPrice, floor);
  nextPrice = Math.round(nextPrice * 100) / 100;

  const history = [...asset.history, { t: tick, price: nextPrice }];
  if (history.length > HISTORY_LIMIT) history.shift();

  return { ...asset, price: nextPrice, history };
}

/** Advance the whole market one tick. */
export function stepMarket(
  assets: Asset[],
  tick: number,
  activeEvents: MarketEvent[]
): Asset[] {
  return assets.map((a) => stepAsset(a, tick, activeEvents));
}

/** Decrement remaining duration on active events, dropping expired ones. */
export function ageEvents(events: MarketEvent[]): MarketEvent[] {
  return events
    .map((e) => ({ ...e, duration: e.duration - 1 }))
    .filter((e) => e.duration > 0);
}

/**
 * With a small probability, generate a fresh random market event.
 * Returns null when no event fires this tick.
 */
export function maybeSpawnEvent(tick: number, probability = 0.12): MarketEvent | null {
  if (Math.random() > probability) return null;
  const tpl = MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)];
  return {
    id: `evt-${tick}-${Math.floor(Math.random() * 1e6)}`,
    headline: tpl.headline,
    sentiment: tpl.sentiment,
    affects: tpl.affects,
    driftImpact: tpl.driftImpact,
    duration: tpl.duration,
    timestamp: Date.now(),
  };
}

/** Percentage change of an asset over its available history window. */
export function windowChangePct(asset: Asset): number {
  if (asset.history.length < 2) return 0;
  const first = asset.history[0].price;
  const last = asset.history[asset.history.length - 1].price;
  if (first === 0) return 0;
  return ((last - first) / first) * 100;
}

/** Percentage change since the previous tick. */
export function lastTickChangePct(asset: Asset): number {
  const n = asset.history.length;
  if (n < 2) return 0;
  const prev = asset.history[n - 2].price;
  const last = asset.history[n - 1].price;
  if (prev === 0) return 0;
  return ((last - prev) / prev) * 100;
}
