import type { Asset } from '../../types';
import { Sheet } from '../ui/Sheet';
import { PriceChart } from '../ui/PriceChart';
import { TradePanel } from './TradePanel';
import { Icon } from '../ui/Icon';
import { ASSET_CLASS_META } from '../../data/assets';
import { useGameStore } from '../../store/gameStore';
import { windowChangePct } from '../../engine/market';
import { formatCurrencyFull, formatPct, formatQty } from '../../utils/format';

interface Props {
  asset: Asset | null;
  open: boolean;
  onClose: () => void;
}

/** Full asset detail: header, live chart, position, and trade controls. */
export function AssetSheet({ asset, open, onClose }: Props) {
  const holding = useGameStore((s) =>
    asset ? s.holdings.find((h) => h.assetId === asset.id) : undefined
  );

  if (!asset) return <Sheet open={open} onClose={onClose} />;

  const meta = ASSET_CLASS_META[asset.assetClass];
  const change = windowChangePct(asset);
  const up = change >= 0;
  const unrealized = holding
    ? (asset.price - holding.avgCost) * holding.quantity
    : 0;

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="row gap-12" style={{ marginBottom: 14 }}>
        <div
          className="asset-ic"
          style={{ background: `${meta.color}1f`, color: meta.color, width: 46, height: 46 }}
        >
          <Icon name={meta.icon} size={24} color={meta.color} />
        </div>
        <div className="col" style={{ gap: 2, flex: 1 }}>
          <div className="row gap-8">
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>{asset.name}</h3>
            <span className={`risk risk-${asset.risk.replace(' ', '')}`}>{asset.risk}</span>
          </div>
          <span className="faint" style={{ fontSize: 12 }}>
            {asset.symbol} · {meta.label}
          </span>
        </div>
        <div className="col" style={{ alignItems: 'flex-end' }}>
          <span className="mono" style={{ fontWeight: 800, fontSize: 16 }}>
            {formatCurrencyFull(asset.price)}
          </span>
          <span className={up ? 'up' : 'down'} style={{ fontWeight: 700, fontSize: 12 }}>
            {formatPct(change, { sign: true })}
          </span>
        </div>
      </div>

      <p className="muted" style={{ fontSize: 12.5, marginBottom: 14, lineHeight: 1.5 }}>
        {asset.description}
      </p>

      <div className="card card-pad" style={{ marginBottom: 14 }}>
        <PriceChart data={asset.history} />
      </div>

      {holding && holding.quantity > 0 && (
        <div className="card card-pad col" style={{ gap: 8, marginBottom: 14 }}>
          <div className="row between">
            <span className="muted" style={{ fontSize: 13 }}>
              Your position
            </span>
            <span className="mono" style={{ fontWeight: 700 }}>
              {formatQty(holding.quantity)} @ {formatCurrencyFull(holding.avgCost)}
            </span>
          </div>
          <div className="row between">
            <span className="muted" style={{ fontSize: 13 }}>
              Unrealised P&L
            </span>
            <span className={`mono ${unrealized >= 0 ? 'up' : 'down'}`} style={{ fontWeight: 800 }}>
              {formatCurrencyFull(unrealized)}
            </span>
          </div>
        </div>
      )}

      {asset.dividendYield > 0 && (
        <div className="info-note">
          💰 Earns passive income: {formatPct(asset.dividendYield * 100)} per day on holdings.
        </div>
      )}

      <TradePanel asset={asset} />
    </Sheet>
  );
}
