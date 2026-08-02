import { useMemo, useState } from 'react';
import { Search, Star, X } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { AssetCard } from '../components/game/AssetCard';
import { AssetSheet } from '../components/game/AssetSheet';
import { useGameStore } from '../store/gameStore';
import { ASSET_CLASS_META } from '../data/assets';
import { windowChangePct } from '../engine/market';
import { holdingValue } from '../engine/economy';
import type { Asset, AssetClass } from '../types';

type Filter = 'all' | AssetClass;
type SortId = 'gainers' | 'losers' | 'priceHigh' | 'priceLow' | 'name';

const SORTS: { id: SortId; label: string }[] = [
  { id: 'gainers', label: 'Top gainers' },
  { id: 'losers', label: 'Top losers' },
  { id: 'priceHigh', label: 'Price: high → low' },
  { id: 'priceLow', label: 'Price: low → high' },
  { id: 'name', label: 'Name (A–Z)' },
];

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'stock', label: 'Stocks' },
  { id: 'mutualfund', label: 'Mutual Funds' },
  { id: 'etf', label: 'ETFs' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'bond', label: 'Bonds' },
  { id: 'reit', label: 'REITs' },
  { id: 'gold', label: 'Gold' },
  { id: 'realestate', label: 'Real Estate' },
  { id: 'fd', label: 'Fixed Dep.' },
  { id: 'startup', label: 'Startups' },
];

export function Market() {
  const assets = useGameStore((s) => s.assets);
  const holdings = useGameStore((s) => s.holdings);
  const watchlist = useGameStore((s) => s.watchlist);
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<SortId>('gainers');
  const [query, setQuery] = useState('');
  const [watchOnly, setWatchOnly] = useState(false);
  const [selected, setSelected] = useState<Asset | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    let filtered = filter === 'all' ? assets : assets.filter((a) => a.assetClass === filter);
    if (watchOnly) filtered = filtered.filter((a) => watchlist.includes(a.id));
    if (q) filtered = filtered.filter((a) => a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q));
    const sorted = [...filtered];
    switch (sort) {
      case 'gainers': sorted.sort((a, b) => windowChangePct(b) - windowChangePct(a)); break;
      case 'losers': sorted.sort((a, b) => windowChangePct(a) - windowChangePct(b)); break;
      case 'priceHigh': sorted.sort((a, b) => b.price - a.price); break;
      case 'priceLow': sorted.sort((a, b) => a.price - b.price); break;
      case 'name': sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return sorted;
  }, [assets, filter, sort, query, watchOnly, watchlist]);

  return (
    <>
      <Header title="Market" subtitle="Live prices update in real time" />
      <div className="screen-scroll">
        <div className="market-controls">
          <div className="search-box">
            <Search size={16} className="faint" />
            <input
              className="search-input"
              type="text"
              placeholder="Search name or symbol…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button className="icon-x" onClick={() => setQuery('')} aria-label="Clear search"><X size={14} /></button>
            )}
          </div>
          <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value as SortId)}>
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <button
            className={`watch-toggle ${watchOnly ? 'on' : ''}`}
            onClick={() => setWatchOnly((v) => !v)}
            aria-pressed={watchOnly}
            title="Show only your watchlist"
          >
            <Star size={15} fill={watchOnly ? 'currentColor' : 'none'} />
            <span>Watchlist{watchlist.length ? ` (${watchlist.length})` : ''}</span>
          </button>
        </div>

        <div className="filter-row">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`filter-chip ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
              style={
                filter === f.id && f.id !== 'all'
                  ? {
                      background: ASSET_CLASS_META[f.id].color,
                      borderColor: ASSET_CLASS_META[f.id].color,
                    }
                  : undefined
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="col" style={{ gap: 10, marginTop: 14 }}>
          {list.map((a) => {
            const h = holdings.find((x) => x.assetId === a.id);
            return (
              <AssetCard
                key={a.id}
                asset={a}
                onClick={setSelected}
                ownedValue={h ? holdingValue(h, assets) : undefined}
              />
            );
          })}
          {list.length === 0 && (
            <div className="empty-note">
              {watchOnly
                ? 'Your watchlist is empty. Open any asset and tap the ★ to add it.'
                : 'No assets match your search.'}
            </div>
          )}
        </div>
      </div>

      <AssetSheet asset={selected} open={!!selected} onClose={() => setSelected(null)} />
    </>
  );
}
