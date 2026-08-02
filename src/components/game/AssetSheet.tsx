import { useState } from 'react';
import { CalendarClock, X } from 'lucide-react';
import type { Asset } from '../../types';
import { Sheet } from '../ui/Sheet';
import { PriceChart } from '../ui/PriceChart';
import { CandleChart } from '../ui/CandleChart';
import { TradePanel } from './TradePanel';
import { Icon } from '../ui/Icon';
import { ASSET_CLASS_META } from '../../data/assets';
import { useGameStore } from '../../store/gameStore';
import { windowChangePct } from '../../engine/market';
import {
  formatCurrencyFull,
  formatCompactNumber,
  formatPct,
  formatQty,
  formatCurrency,
} from '../../utils/format';

interface Props {
  asset: Asset | null;
  open: boolean;
  onClose: () => void;
}

/** Full asset detail: header, chart (line/candle), fundamentals, SIP, trade. */
export function AssetSheet({ asset, open, onClose }: Props) {
  const holding = useGameStore((s) =>
    asset ? s.holdings.find((h) => h.assetId === asset.id) : undefined
  );
  const sip = useGameStore((s) => (asset ? s.sips.find((p) => p.assetId === asset.id) : undefined));
  const addSIP = useGameStore((s) => s.addSIP);
  const cancelSIP = useGameStore((s) => s.cancelSIP);

  const [chartMode, setChartMode] = useState<'line' | 'candle'>('line');
  const [sipAmount, setSipAmount] = useState(1000);
  const [showSip, setShowSip] = useState(false);

  if (!asset) return <Sheet open={open} onClose={onClose} />;

  const meta = ASSET_CLASS_META[asset.assetClass];
  const change = windowChangePct(asset);
  const up = change >= 0;
  const unrealized = holding ? (asset.price - holding.avgCost) * holding.quantity : 0;
  const prices = asset.history.map((p) => p.price);
  const low = prices.length ? Math.min(...prices) : asset.price;
  const high = prices.length ? Math.max(...prices) : asset.price;
  const hasFundamentals = asset.pe != null || asset.marketCap != null;
  const isFund = asset.assetClass === 'etf' || asset.assetClass === 'mutualfund';
  const sipEligible = asset.assetClass !== 'fd';

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

      <p className="muted" style={{ fontSize: 12.5, marginBottom: 12, lineHeight: 1.5 }}>
        {asset.description}
      </p>

      {/* Chart with line/candle toggle */}
      <div className="card card-pad" style={{ marginBottom: 14 }}>
        <div className="seg-tabs" style={{ marginBottom: 12 }}>
          <button className={`seg-tab ${chartMode === 'line' ? 'active' : ''}`} onClick={() => setChartMode('line')}>
            Line
          </button>
          <button className={`seg-tab ${chartMode === 'candle' ? 'active' : ''}`} onClick={() => setChartMode('candle')}>
            Candles
          </button>
        </div>
        {chartMode === 'line' ? <PriceChart data={asset.history} /> : <CandleChart data={asset.history} />}
      </div>

      {/* Fundamentals */}
      {(hasFundamentals || isFund) && (
        <div className="card card-pad" style={{ marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>
            {isFund ? 'Fund Details' : 'Fundamentals'}
          </span>
          <div className="fund-grid" style={{ marginTop: 10 }}>
            {asset.sector && <Metric label="Sector" value={asset.sector} />}
            <Metric label="52W Range" value={`${formatCurrency(low)} – ${formatCurrency(high)}`} />
            {asset.marketCap != null && <Metric label="Market Cap" value={`₹${formatCompactNumber(asset.marketCap)}`} />}
            {asset.pe != null && <Metric label="P/E" value={asset.pe.toFixed(1)} />}
            {asset.eps != null && <Metric label="EPS" value={`₹${asset.eps.toFixed(1)}`} />}
            {asset.divYieldAnnual != null && <Metric label="Div Yield" value={formatPct(asset.divYieldAnnual * 100)} />}
            {asset.ceo && <Metric label="CEO" value={asset.ceo} />}
            {asset.expenseRatio != null && <Metric label="Expense Ratio" value={formatPct(asset.expenseRatio * 100)} />}
            {asset.return1y != null && <Metric label="1Y Return" value={formatPct(asset.return1y * 100, { sign: true })} />}
          </div>
        </div>
      )}

      {holding && holding.quantity > 0 && (
        <div className="card card-pad col" style={{ gap: 8, marginBottom: 14 }}>
          <div className="row between">
            <span className="muted" style={{ fontSize: 13 }}>Your position</span>
            <span className="mono" style={{ fontWeight: 700 }}>
              {formatQty(holding.quantity)} @ {formatCurrencyFull(holding.avgCost)}
            </span>
          </div>
          <div className="row between">
            <span className="muted" style={{ fontSize: 13 }}>Unrealised P&L</span>
            <span className={`mono ${unrealized >= 0 ? 'up' : 'down'}`} style={{ fontWeight: 800 }}>
              {formatCurrencyFull(unrealized)}
            </span>
          </div>
        </div>
      )}

      {/* SIP */}
      {sipEligible && (
        <div className="card card-pad col" style={{ gap: 10, marginBottom: 14 }}>
          <div className="row between">
            <div className="row gap-8">
              <CalendarClock size={16} className="muted" />
              <span style={{ fontSize: 13, fontWeight: 700 }}>Monthly SIP</span>
            </div>
            {sip ? (
              <span className="pill pill-up">Active · {formatCurrency(sip.amount)}/mo</span>
            ) : (
              <button className="link-btn" onClick={() => setShowSip((v) => !v)}>
                {showSip ? 'Cancel' : 'Set up'}
              </button>
            )}
          </div>
          {sip ? (
            <button className="btn btn-ghost btn-block" onClick={() => cancelSIP(sip.id)}>
              <X size={15} /> Stop SIP
            </button>
          ) : (
            showSip && (
              <div className="col" style={{ gap: 8 }}>
                <span className="faint" style={{ fontSize: 11.5 }}>
                  Auto-invests this amount every month. Great for rupee-cost averaging.
                </span>
                <input
                  className="amount-field mono"
                  type="number"
                  value={sipAmount || ''}
                  onChange={(e) => setSipAmount(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                />
                <button
                  className="btn btn-primary btn-block"
                  onClick={() => { addSIP(asset.id, sipAmount); setShowSip(false); }}
                >
                  Start SIP · {formatCurrency(sipAmount)}/mo
                </button>
              </div>
            )
          )}
        </div>
      )}

      {asset.dividendYield > 0 && (
        <div className="info-note">
          💰 Pays regular income while you hold it{asset.divYieldAnnual ? ` (~${formatPct(asset.divYieldAnnual * 100)}/yr yield)` : ''}.
        </div>
      )}

      <TradePanel asset={asset} />
    </Sheet>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="fund-metric">
      <span className="faint" style={{ fontSize: 10.5 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700 }} className="truncate">{value}</span>
    </div>
  );
}
