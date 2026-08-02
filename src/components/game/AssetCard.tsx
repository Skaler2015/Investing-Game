import { memo } from 'react';
import type { Asset } from '../../types';
import { Sparkline } from '../ui/Sparkline';
import { Icon } from '../ui/Icon';
import { ASSET_CLASS_META } from '../../data/assets';
import { lastTickChangePct, windowChangePct } from '../../engine/market';
import { formatCurrencyFull, formatPct } from '../../utils/format';

interface Props {
  asset: Asset;
  onClick: (asset: Asset) => void;
  ownedValue?: number;
}

/** Compact market row: icon, name, price, live change, mini chart. */
function AssetCardBase({ asset, onClick, ownedValue }: Props) {
  const meta = ASSET_CLASS_META[asset.assetClass];
  const tickChange = lastTickChangePct(asset);
  const windowChange = windowChangePct(asset);
  const up = windowChange >= 0;

  return (
    <button className="asset-card" onClick={() => onClick(asset)}>
      <div className="asset-ic" style={{ background: `${meta.color}1f`, color: meta.color }}>
        <Icon name={meta.icon} size={20} color={meta.color} />
      </div>

      <div className="col" style={{ gap: 3, minWidth: 0, flex: 1, textAlign: 'left' }}>
        <div className="row gap-8" style={{ minWidth: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }} className="truncate">
            {asset.name}
          </span>
          <span className={`risk risk-${asset.risk.replace(' ', '')}`}>{asset.risk}</span>
        </div>
        <span className="faint" style={{ fontSize: 11 }}>
          {asset.symbol}
          {ownedValue ? ` · Held ${formatCurrencyFull(ownedValue)}` : ''}
        </span>
      </div>

      <div className="asset-chart">
        <Sparkline data={asset.history} />
      </div>

      <div className="col" style={{ alignItems: 'flex-end', gap: 3, minWidth: 78 }}>
        <span className="mono" style={{ fontWeight: 700, fontSize: 13 }}>
          {formatCurrencyFull(asset.price)}
        </span>
        <span
          className={`pill ${up ? 'pill-up' : 'pill-down'}`}
          style={{ opacity: Math.abs(tickChange) > 0.001 ? 1 : 0.85 }}
        >
          {formatPct(windowChange, { sign: true })}
        </span>
      </div>
    </button>
  );
}

export const AssetCard = memo(AssetCardBase);
