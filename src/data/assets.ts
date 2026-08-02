import type { Asset, AssetClass, RiskLevel } from '../types';

interface AssetSeed {
  id: string;
  name: string;
  symbol: string;
  assetClass: AssetClass;
  risk: RiskLevel;
  drift: number;
  volatility: number;
  dividendYield: number;
  price: number;
  minQty: number;
  description: string;
}

/**
 * Seed definitions for every tradable asset. Prices here are the starting
 * prices; the market engine mutates them from tick zero onward.
 */
export const ASSET_SEEDS: AssetSeed[] = [
  // ── Stocks ────────────────────────────────────────────────────────────
  {
    id: 'stk-tcs',
    name: 'Tech Corp',
    symbol: 'TECH',
    assetClass: 'stock',
    risk: 'Medium',
    drift: 0.12,
    volatility: 0.018,
    dividendYield: 0.0008,
    price: 3200,
    minQty: 1,
    description: 'Blue-chip IT services giant. Steady grower with modest dividends.',
  },
  {
    id: 'stk-bank',
    name: 'National Bank',
    symbol: 'NBNK',
    assetClass: 'stock',
    risk: 'Medium',
    drift: 0.09,
    volatility: 0.02,
    dividendYield: 0.0012,
    price: 1450,
    minQty: 1,
    description: 'Large private-sector bank. Sensitive to interest-rate policy.',
  },
  {
    id: 'stk-auto',
    name: 'Motor Works',
    symbol: 'MOTR',
    assetClass: 'stock',
    risk: 'High',
    drift: 0.14,
    volatility: 0.028,
    dividendYield: 0.0006,
    price: 820,
    minQty: 1,
    description: 'Electric-vehicle maker. High growth, high swings.',
  },
  // ── Cryptocurrency ────────────────────────────────────────────────────
  {
    id: 'crypto-btc',
    name: 'BitCoin',
    symbol: 'BTC',
    assetClass: 'crypto',
    risk: 'Very High',
    drift: 0.25,
    volatility: 0.05,
    dividendYield: 0,
    price: 5400000,
    minQty: 0.0001,
    description: 'The original cryptocurrency. Extreme volatility, huge potential.',
  },
  {
    id: 'crypto-eth',
    name: 'Etherium',
    symbol: 'ETH',
    assetClass: 'crypto',
    risk: 'Very High',
    drift: 0.28,
    volatility: 0.055,
    dividendYield: 0,
    price: 290000,
    minQty: 0.001,
    description: 'Smart-contract platform token. Volatile and innovation-driven.',
  },
  // ── Gold ──────────────────────────────────────────────────────────────
  {
    id: 'gold-24k',
    name: 'Gold (24K)',
    symbol: 'GOLD',
    assetClass: 'gold',
    risk: 'Low',
    drift: 0.06,
    volatility: 0.008,
    dividendYield: 0,
    price: 7200,
    minQty: 0.1,
    description: 'Safe-haven metal, priced per gram. Shines when markets panic.',
  },
  // ── Real Estate ───────────────────────────────────────────────────────
  {
    id: 're-metro',
    name: 'Metro Apartments',
    symbol: 'METRO',
    assetClass: 'realestate',
    risk: 'Medium',
    drift: 0.08,
    volatility: 0.006,
    dividendYield: 0.0015,
    price: 950000,
    minQty: 1,
    description: 'Rental property units. Slow, steady growth plus rental income.',
  },
  {
    id: 're-commercial',
    name: 'Business Park REIT',
    symbol: 'CREIT',
    assetClass: 'realestate',
    risk: 'Medium',
    drift: 0.09,
    volatility: 0.009,
    dividendYield: 0.002,
    price: 340,
    minQty: 1,
    description: 'Listed commercial real-estate trust paying regular rent yields.',
  },
  // ── Fixed Deposit ─────────────────────────────────────────────────────
  {
    id: 'fd-secure',
    name: 'Secure Fixed Deposit',
    symbol: 'FD',
    assetClass: 'fd',
    risk: 'Low',
    drift: 0.0,
    volatility: 0.0002,
    dividendYield: 0.00185,
    price: 1000,
    minQty: 1,
    description: 'Capital-protected deposit paying guaranteed daily interest.',
  },
  // ── Startup Investments ───────────────────────────────────────────────
  {
    id: 'startup-fintech',
    name: 'PayFast (Startup)',
    symbol: 'PAYF',
    assetClass: 'startup',
    risk: 'Very High',
    drift: 0.35,
    volatility: 0.07,
    dividendYield: 0,
    price: 150,
    minQty: 10,
    description: 'Early-stage fintech. Could 10x… or go to zero.',
  },
  {
    id: 'startup-space',
    name: 'OrbitX (Startup)',
    symbol: 'ORBX',
    assetClass: 'startup',
    risk: 'Very High',
    drift: 0.4,
    volatility: 0.08,
    dividendYield: 0,
    price: 220,
    minQty: 10,
    description: 'Space-launch venture. Moonshot risk and moonshot reward.',
  },
];

/** Build fresh, fully-initialised Asset objects (with seeded history). */
export function createInitialAssets(): Asset[] {
  return ASSET_SEEDS.map((seed) => ({
    ...seed,
    history: [{ t: 0, price: seed.price }],
  }));
}

export const ASSET_CLASS_META: Record<
  AssetClass,
  { label: string; icon: string; color: string }
> = {
  stock: { label: 'Stocks', icon: 'LineChart', color: '#3b82f6' },
  crypto: { label: 'Cryptocurrency', icon: 'Bitcoin', color: '#f59e0b' },
  gold: { label: 'Gold', icon: 'Gem', color: '#eab308' },
  realestate: { label: 'Real Estate', icon: 'Building2', color: '#10b981' },
  fd: { label: 'Fixed Deposit', icon: 'PiggyBank', color: '#8b5cf6' },
  startup: { label: 'Startups', icon: 'Rocket', color: '#ec4899' },
};
