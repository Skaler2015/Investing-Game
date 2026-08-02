import type { Asset, AssetClass } from '../types';

/** A seed is a full Asset minus the runtime price history. */
type AssetSeed = Omit<Asset, 'history'>;

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
    sector: 'Information Technology',
    marketCap: 12500000000000,
    pe: 28.4,
    eps: 112.7,
    ceo: 'R. Menon',
    divYieldAnnual: 0.011,
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
    sector: 'Banking & Finance',
    marketCap: 8900000000000,
    pe: 19.2,
    eps: 75.5,
    ceo: 'S. Kapoor',
    divYieldAnnual: 0.008,
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
    sector: 'Automobile',
    marketCap: 3100000000000,
    pe: 44.8,
    eps: 18.3,
    ceo: 'A. Deshmukh',
    divYieldAnnual: 0.004,
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

  // ── ETFs ──────────────────────────────────────────────────────────────
  {
    id: 'etf-nifty', name: 'Nifty 50 ETF', symbol: 'NIFTYBEES', assetClass: 'etf',
    risk: 'Medium', drift: 0.11, volatility: 0.012, dividendYield: 0.0004, price: 245, minQty: 1,
    description: 'Tracks the Nifty 50 index. Instant diversification, low cost.',
    expenseRatio: 0.0005, return1y: 0.142,
  },
  {
    id: 'etf-gold', name: 'Gold ETF', symbol: 'GOLDBEES', assetClass: 'etf',
    risk: 'Low', drift: 0.06, volatility: 0.008, dividendYield: 0, price: 68, minQty: 1,
    description: 'Gold exposure without storing metal. A portfolio hedge.',
    expenseRatio: 0.005, return1y: 0.089,
  },

  // ── Mutual Funds ──────────────────────────────────────────────────────
  {
    id: 'mf-bluechip', name: 'Bluechip Equity Fund', symbol: 'BLUECHIP', assetClass: 'mutualfund',
    risk: 'Medium', drift: 0.13, volatility: 0.011, dividendYield: 0, price: 320, minQty: 0.1,
    description: 'Actively managed large-cap fund. Great for SIPs.',
    expenseRatio: 0.011, return1y: 0.163,
  },
  {
    id: 'mf-smallcap', name: 'Small Cap Fund', symbol: 'SMALLCAP', assetClass: 'mutualfund',
    risk: 'High', drift: 0.19, volatility: 0.022, dividendYield: 0, price: 92, minQty: 0.1,
    description: 'High-growth small companies. Volatile — ideal for long SIPs.',
    expenseRatio: 0.015, return1y: 0.241,
  },
  {
    id: 'mf-debt', name: 'Debt Fund', symbol: 'DEBTFUND', assetClass: 'mutualfund',
    risk: 'Low', drift: 0.07, volatility: 0.003, dividendYield: 0, price: 44, minQty: 0.1,
    description: 'Bonds & money-market instruments. Stable, low-risk returns.',
    expenseRatio: 0.006, return1y: 0.071,
  },

  // ── Bonds ─────────────────────────────────────────────────────────────
  {
    id: 'bond-govt', name: 'Govt Bond 10Y', symbol: 'GSEC10', assetClass: 'bond',
    risk: 'Low', drift: 0.015, volatility: 0.002, dividendYield: 0.006, price: 1000, minQty: 1,
    description: 'Sovereign-backed. Pays a steady coupon; near-zero default risk.',
    divYieldAnnual: 0.072,
  },
  {
    id: 'bond-corp', name: 'Corporate Bond', symbol: 'CORPBND', assetClass: 'bond',
    risk: 'Medium', drift: 0.02, volatility: 0.004, dividendYield: 0.0072, price: 1000, minQty: 1,
    description: 'Higher coupon than govt bonds, with some credit risk.',
    divYieldAnnual: 0.086,
  },

  // ── REITs ─────────────────────────────────────────────────────────────
  {
    id: 'reit-office', name: 'Office REIT', symbol: 'OFCREIT', assetClass: 'reit',
    risk: 'Medium', drift: 0.08, volatility: 0.009, dividendYield: 0.005, price: 350, minQty: 1,
    description: 'Owns premium office parks. Passes rent to you as dividends.',
    divYieldAnnual: 0.061,
  },
  {
    id: 'reit-retail', name: 'Retail REIT', symbol: 'RTLREIT', assetClass: 'reit',
    risk: 'Medium', drift: 0.085, volatility: 0.011, dividendYield: 0.0058, price: 415, minQty: 1,
    description: 'Malls and high-street retail. Higher yield, footfall-driven.',
    divYieldAnnual: 0.069,
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
  etf: { label: 'ETFs', icon: 'Layers', color: '#06b6d4' },
  mutualfund: { label: 'Mutual Funds', icon: 'PieChart', color: '#14b8a6' },
  bond: { label: 'Bonds', icon: 'Scroll', color: '#a3a3a3' },
  reit: { label: 'REITs', icon: 'Building', color: '#22c55e' },
};
