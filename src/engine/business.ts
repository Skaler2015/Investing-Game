import type { Asset, Business, BusinessDef } from '../types';
import { getBusinessDef } from '../data/businesses';
import { economicCondition } from './insights';

/** Marketing revenue multiplier and its extra cost fraction of revenue. */
const MARKETING_BOOST = 1.35;
const MARKETING_COST_FRACTION = 0.15;

/** Economy multiplier for business revenue (0.9 slump … 1.1 boom). */
export function businessEconomyFactor(assets: Asset[]): number {
  const g = economicCondition(assets);
  return 0.9 + (g.score / 100) * 0.2;
}

export function businessRevenue(def: BusinessDef, biz: Business, economyFactor: number): number {
  const base = def.baseRevenue * biz.level;
  const marketed = biz.marketing ? base * MARKETING_BOOST : base;
  return Math.round(marketed * economyFactor);
}

export function businessOperatingCost(def: BusinessDef, biz: Business): number {
  const base = def.operatingCost * biz.level;
  const marketing = biz.marketing ? def.baseRevenue * biz.level * MARKETING_COST_FRACTION : 0;
  return Math.round(base + marketing);
}

export function businessProfit(def: BusinessDef, biz: Business, economyFactor: number): number {
  return businessRevenue(def, biz, economyFactor) - businessOperatingCost(def, biz);
}

/** Sale/appraised value of a business — grows with level. */
export function businessValue(def: BusinessDef, biz: Business): number {
  return Math.round(def.cost * (1 + 0.5 * (biz.level - 1)));
}

/** Cost to upgrade to the next level. */
export function upgradeCost(def: BusinessDef, level: number): number {
  return Math.round(def.cost * 0.7 * level);
}

/** Total appraised value of a portfolio of businesses (for net worth). */
export function businessesEquity(businesses: Business[]): number {
  return businesses.reduce((sum, b) => {
    const def = getBusinessDef(b.defId);
    return def ? sum + businessValue(def, b) : sum;
  }, 0);
}

/** Total monthly profit across all owned businesses. */
export function businessesMonthlyProfit(businesses: Business[], assets: Asset[]): number {
  const ef = businessEconomyFactor(assets);
  return businesses.reduce((sum, b) => {
    const def = getBusinessDef(b.defId);
    return def ? sum + businessProfit(def, b, ef) : sum;
  }, 0);
}
