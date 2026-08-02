import type { PropertyDef } from '../types';

/**
 * Buyable properties. Tuned for a safer, lower cash-yield than businesses
 * (~0.4%/month net rent) plus steady appreciation (5–9%/yr) — a passive,
 * value-growing asset class. Expandable: mortgages, vacancy, renovation.
 */
export const PROPERTIES: PropertyDef[] = [
  {
    id: 'studio', name: 'Studio Apartment', icon: 'DoorOpen', type: 'residential',
    price: 800000, monthlyRent: 5000, maintenance: 1200, taxRate: 0.01, appreciation: 0.07,
    description: 'A compact starter flat. Easy to rent, low upkeep.',
  },
  {
    id: 'farmland', name: 'Farmland', icon: 'Trees', type: 'agricultural',
    price: 1500000, monthlyRent: 7000, maintenance: 1000, taxRate: 0.005, appreciation: 0.09,
    description: 'Low rent, minimal tax — but strong long-term appreciation.',
  },
  {
    id: 'flat2bhk', name: '2BHK Flat', icon: 'Building', type: 'residential',
    price: 2500000, monthlyRent: 16000, maintenance: 3500, taxRate: 0.01, appreciation: 0.07,
    description: 'A family apartment in a growing neighbourhood.',
  },
  {
    id: 'shop', name: 'Retail Shop', icon: 'Store', type: 'commercial',
    price: 3000000, monthlyRent: 20000, maintenance: 3500, taxRate: 0.015, appreciation: 0.06,
    description: 'A high-street shop. Higher rent, higher tax.',
  },
  {
    id: 'warehouse', name: 'Industrial Shed', icon: 'Warehouse', type: 'industrial',
    price: 4000000, monthlyRent: 25000, maintenance: 5000, taxRate: 0.012, appreciation: 0.05,
    description: 'Leased to manufacturers. Stable, unglamorous income.',
  },
  {
    id: 'office', name: 'Office Space', icon: 'Building2', type: 'commercial',
    price: 5000000, monthlyRent: 32000, maintenance: 6000, taxRate: 0.015, appreciation: 0.06,
    description: 'Corporate tenants on long leases. Reliable cash flow.',
  },
  {
    id: 'villa', name: 'Luxury Villa', icon: 'Home', type: 'residential',
    price: 6000000, monthlyRent: 38000, maintenance: 9000, taxRate: 0.012, appreciation: 0.08,
    description: 'Premium address. Strong appreciation, premium upkeep.',
  },
  {
    id: 'mallunit', name: 'Mall Retail Unit', icon: 'Building2', type: 'commercial',
    price: 8000000, monthlyRent: 52000, maintenance: 10000, taxRate: 0.015, appreciation: 0.06,
    description: 'Prime mall frontage with heavy footfall.',
  },
];

export function getPropertyDef(id: string): PropertyDef | undefined {
  return PROPERTIES.find((p) => p.id === id);
}
