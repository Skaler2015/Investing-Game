import { useMemo, useState } from 'react';
import { Header } from '../components/layout/Header';
import { AssetCard } from '../components/game/AssetCard';
import { AssetSheet } from '../components/game/AssetSheet';
import { useGameStore } from '../store/gameStore';
import { ASSET_CLASS_META } from '../data/assets';
import { windowChangePct } from '../engine/market';
import { holdingValue } from '../engine/economy';
import type { Asset, AssetClass } from '../types';

type Filter = 'all' | AssetClass;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'stock', label: 'Stocks' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'gold', label: 'Gold' },
  { id: 'realestate', label: 'Real Estate' },
  { id: 'fd', label: 'Fixed Dep.' },
  { id: 'startup', label: 'Startups' },
];

export function Market() {
  const assets = useGameStore((s) => s.assets);
  const holdings = useGameStore((s) => s.holdings);
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<Asset | null>(null);

  const list = useMemo(() => {
    const filtered =
      filter === 'all' ? assets : assets.filter((a) => a.assetClass === filter);
    return [...filtered].sort((a, b) => windowChangePct(b) - windowChangePct(a));
  }, [assets, filter]);

  return (
    <>
      <Header title="Market" subtitle="Live prices update in real time" />
      <div className="screen-scroll">
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
        </div>
      </div>

      <AssetSheet asset={selected} open={!!selected} onClose={() => setSelected(null)} />
    </>
  );
}
