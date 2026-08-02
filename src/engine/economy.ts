import type { Asset, Holding } from '../types';

export interface PortfolioStats {
  investedValue: number;
  costBasis: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  /** Per in-game-day passive income from dividends / interest / rent. */
  dailyPassiveIncome: number;
}

/** Look up an asset by id from a list. */
export function findAsset(assets: Asset[], id: string): Asset | undefined {
  return assets.find((a) => a.id === id);
}

/** Current market value of a single holding. */
export function holdingValue(holding: Holding, assets: Asset[]): number {
  const asset = findAsset(assets, holding.assetId);
  if (!asset) return 0;
  return asset.price * holding.quantity;
}

/** Aggregate portfolio statistics across all holdings. */
export function computePortfolioStats(
  holdings: Holding[],
  assets: Asset[]
): PortfolioStats {
  let investedValue = 0;
  let costBasis = 0;
  let dailyPassiveIncome = 0;

  for (const h of holdings) {
    const asset = findAsset(assets, h.assetId);
    if (!asset) continue;
    investedValue += asset.price * h.quantity;
    costBasis += h.avgCost * h.quantity;
    dailyPassiveIncome += asset.price * h.quantity * asset.dividendYield;
  }

  const unrealizedPnl = investedValue - costBasis;
  const unrealizedPnlPct = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0;

  return {
    investedValue,
    costBasis,
    unrealizedPnl,
    unrealizedPnlPct,
    dailyPassiveIncome,
  };
}

/** Net worth = cash + invested value. */
export function computeNetWorth(
  cash: number,
  holdings: Holding[],
  assets: Asset[]
): number {
  return cash + computePortfolioStats(holdings, assets).investedValue;
}

export interface AllocationSlice {
  assetId: string;
  name: string;
  assetClass: string;
  value: number;
  pct: number;
  color: string;
}

/** Portfolio allocation as slices, largest first. */
export function computeAllocation(
  holdings: Holding[],
  assets: Asset[],
  colorForClass: (assetClass: string) => string
): AllocationSlice[] {
  const total = holdings.reduce((sum, h) => sum + holdingValue(h, assets), 0);
  if (total <= 0) return [];
  return holdings
    .map((h) => {
      const asset = findAsset(assets, h.assetId);
      const value = holdingValue(h, assets);
      return {
        assetId: h.assetId,
        name: asset?.name ?? h.assetId,
        assetClass: asset?.assetClass ?? 'stock',
        value,
        pct: (value / total) * 100,
        color: colorForClass(asset?.assetClass ?? 'stock'),
      };
    })
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);
}
