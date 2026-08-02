import type { BusinessDef } from '../types';

/**
 * Buyable businesses. Roughly tuned so net monthly profit ≈ 5% of cost
 * (≈ 20-month payback) at level 1, scaling with the player's wealth. Upgrades
 * and marketing improve the return. Expandable: add employees, competition,
 * events, loans-against-business later.
 */
export const BUSINESSES: BusinessDef[] = [
  {
    id: 'cafe', name: 'Coffee Café', icon: 'Coffee', sector: 'Food & Beverage',
    cost: 150000, baseRevenue: 20000, operatingCost: 12500, maxLevel: 10,
    description: 'A cosy neighbourhood café. Cheap to start, steady footfall.',
  },
  {
    id: 'taxi', name: 'Taxi Service', icon: 'Car', sector: 'Transport',
    cost: 220000, baseRevenue: 28000, operatingCost: 17000, maxLevel: 10,
    description: 'A small fleet of cabs. Fuel and drivers eat into margins.',
  },
  {
    id: 'restaurant', name: 'Restaurant', icon: 'UtensilsCrossed', sector: 'Food & Beverage',
    cost: 350000, baseRevenue: 45000, operatingCost: 28000, maxLevel: 10,
    description: 'A full-service restaurant. Higher revenue, higher costs.',
  },
  {
    id: 'warehouse', name: 'Warehouse', icon: 'Warehouse', sector: 'Logistics',
    cost: 500000, baseRevenue: 55000, operatingCost: 31000, maxLevel: 10,
    description: 'Rent out storage space. Low effort, stable income.',
  },
  {
    id: 'startup', name: 'Tech Startup', icon: 'Rocket', sector: 'Technology',
    cost: 500000, baseRevenue: 90000, operatingCost: 62000, maxLevel: 12,
    description: 'High burn, high upside. Scales fast once it clicks.',
  },
  {
    id: 'school', name: 'Coaching School', icon: 'GraduationCap', sector: 'Education',
    cost: 800000, baseRevenue: 100000, operatingCost: 60000, maxLevel: 10,
    description: 'Educate the next generation — and earn tuition every month.',
  },
  {
    id: 'cinema', name: 'Cinema', icon: 'Film', sector: 'Entertainment',
    cost: 1200000, baseRevenue: 150000, operatingCost: 90000, maxLevel: 10,
    description: 'A multiplex. Big weekends, big maintenance bills.',
  },
  {
    id: 'it', name: 'IT Company', icon: 'Code2', sector: 'Technology',
    cost: 1800000, baseRevenue: 230000, operatingCost: 140000, maxLevel: 12,
    description: 'A software services firm. Strong margins, talent costs.',
  },
  {
    id: 'hotel', name: 'Hotel', icon: 'Hotel', sector: 'Hospitality',
    cost: 2500000, baseRevenue: 320000, operatingCost: 195000, maxLevel: 10,
    description: 'A boutique hotel. Occupancy swings with the economy.',
  },
  {
    id: 'factory', name: 'Factory', icon: 'Factory', sector: 'Manufacturing',
    cost: 3000000, baseRevenue: 400000, operatingCost: 250000, maxLevel: 10,
    description: 'A manufacturing unit. Serious scale for serious capital.',
  },
  {
    id: 'hospital', name: 'Hospital', icon: 'Stethoscope', sector: 'Healthcare',
    cost: 4000000, baseRevenue: 520000, operatingCost: 320000, maxLevel: 10,
    description: 'A private hospital. Dependable demand, heavy overheads.',
  },
  {
    id: 'mall', name: 'Shopping Mall', icon: 'Building2', sector: 'Real Estate',
    cost: 6000000, baseRevenue: 780000, operatingCost: 480000, maxLevel: 10,
    description: 'The crown jewel. Rent from dozens of tenants.',
  },
];

export function getBusinessDef(id: string): BusinessDef | undefined {
  return BUSINESSES.find((b) => b.id === id);
}
