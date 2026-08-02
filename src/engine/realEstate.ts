import type { Asset, Property, PropertyDef } from '../types';
import { getPropertyDef } from '../data/realEstate';
import { businessEconomyFactor } from './business';

/** Monthly property tax on current value. */
export function propertyTax(def: PropertyDef, prop: Property): number {
  return Math.round((prop.currentValue * def.taxRate) / 12);
}

/** Net monthly cash flow from a property: rent − maintenance − tax. */
export function propertyMonthlyNet(def: PropertyDef, prop: Property): number {
  const rent = prop.rented ? def.monthlyRent : 0;
  return rent - def.maintenance - propertyTax(def, prop);
}

/**
 * Appreciate a property's value one month, nudged by the economy so booms
 * lift prices and slumps soften them.
 */
export function appreciate(def: PropertyDef, prop: Property, economyFactor: number): number {
  const monthlyRate = (def.appreciation / 12) * economyFactor;
  return Math.round(prop.currentValue * (1 + monthlyRate));
}

/** Total current value of all owned properties (for net worth). */
export function propertiesEquity(properties: Property[]): number {
  return properties.reduce((s, p) => s + p.currentValue, 0);
}

/** Total net monthly rental cash flow across all properties. */
export function propertiesMonthlyIncome(properties: Property[]): number {
  return properties.reduce((s, p) => {
    const def = getPropertyDef(p.defId);
    return def ? s + propertyMonthlyNet(def, p) : s;
  }, 0);
}

/** Economy factor reused from the business engine (single source of truth). */
export function realEstateEconomyFactor(assets: Asset[]): number {
  return businessEconomyFactor(assets);
}
