import { useMemo, useState } from 'react';
import { CalendarClock, X, Star, Bell, TrendingUp } from 'lucide-react';
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

  const watched = useGameStore((s) => (asset ? s.watchlist.includes(asset.id) : false));
  const toggleWatch = useGameStore((s) => s.toggleWatch);
  const alerts = useGameStore((s) => (asset ? s.alerts.filter((a) => a.assetId === asset.id) : []));
  const addAlert = useGameStore((s) => s.addAlert);
  const removeAlert = useGameStore((s) => s.removeAlert);
  const orders = useGameStore((s) => (asset ? s.orders.filter((o) => o.assetId === asset.id) : []));
  const placeOrder = useGameStore((s) => s.placeOrder);
  const cancelOrder = useGameStore((s) => s.cancelOrder);

  const [chartMode, setChartMode] = useState<'line' | 'candle'>('line');
  const [range, setRange] = useState<'1D' | '1W' | '1M' | 'All'>('All');
  const [sipAmount, setSipAmount] = useState(1000);
  const [showSip, setShowSip] = useState(false);

  const [alertPrice, setAlertPrice] = useState<number>(0);
  const [orderKind, setOrderKind] = useState<'limit' | 'stop' | 'take'>('limit');
  const [orderPrice, setOrderPrice] = useState<number>(0);
  const [orderQty, setOrderQty] = useState<number>(1);
  const [toolMsg, setToolMsg] = useState<string | null>(null);

  const rangedHistory = useMemo(() => {
    if (!asset) return [];
    const n = range === '1D' ? 30 : range === '1W' ? 90 : range === '1M' ? 180 : asset.history.length;
    return asset.history.slice(-n);
  }, [asset, range]);

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
        <button
          className={`star-btn ${watched ? 'on' : ''}`}
          onClick={() => toggleWatch(asset.id)}
          aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}
          title={watched ? 'In your watchlist' : 'Add to watchlist'}
        >
          <Star size={18} fill={watched ? 'currentColor' : 'none'} />
        </button>
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

      {/* Chart with line/candle toggle + time range */}
      <div className="card card-pad" style={{ marginBottom: 14 }}>
        <div className="row between" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
          <div className="seg-tabs" style={{ flex: 1, minWidth: 150 }}>
            <button className={`seg-tab ${chartMode === 'line' ? 'active' : ''}`} onClick={() => setChartMode('line')}>
              Line
            </button>
            <button className={`seg-tab ${chartMode === 'candle' ? 'active' : ''}`} onClick={() => setChartMode('candle')}>
              Candles
            </button>
          </div>
          <div className="range-tabs">
            {(['1D', '1W', '1M', 'All'] as const).map((r) => (
              <button key={r} className={`range-tab ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>
                {r}
              </button>
            ))}
          </div>
        </div>
        {chartMode === 'line' ? <PriceChart data={rangedHistory} /> : <CandleChart data={rangedHistory} />}
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

      {/* Price alert */}
      <div className="card card-pad col" style={{ gap: 10, marginBottom: 14 }}>
        <div className="row gap-8">
          <Bell size={16} className="muted" />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Price alert</span>
        </div>
        {alerts.length > 0 && (
          <div className="col" style={{ gap: 6 }}>
            {alerts.map((a) => (
              <div key={a.id} className="tool-row">
                <span className="mono" style={{ fontSize: 13 }}>
                  {a.dir === 'above' ? '↑ above' : '↓ below'} {formatCurrencyFull(a.price)}
                </span>
                <button className="icon-x" onClick={() => removeAlert(a.id)} aria-label="Remove alert"><X size={14} /></button>
              </div>
            ))}
          </div>
        )}
        <div className="row gap-8">
          <input
            className="amount-field mono" type="number" placeholder={`${Math.round(asset.price)}`}
            value={alertPrice || ''} style={{ flex: 1 }}
            onChange={(e) => { setAlertPrice(Math.max(0, Number(e.target.value) || 0)); setToolMsg(null); }}
          />
        </div>
        <div className="grid-2">
          <button className="btn btn-ghost btn-block" onClick={() => {
            const r = addAlert({ assetId: asset.id, price: alertPrice || asset.price, dir: 'above' });
            setToolMsg(r.message); if (r.ok) setAlertPrice(0);
          }}>Alert ↑ above</button>
          <button className="btn btn-ghost btn-block" onClick={() => {
            const r = addAlert({ assetId: asset.id, price: alertPrice || asset.price, dir: 'below' });
            setToolMsg(r.message); if (r.ok) setAlertPrice(0);
          }}>Alert ↓ below</button>
        </div>
      </div>

      {/* Auto orders: limit buy / stop-loss / take-profit */}
      <div className="card card-pad col" style={{ gap: 10, marginBottom: 14 }}>
        <div className="row gap-8">
          <TrendingUp size={16} className="muted" />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Auto orders</span>
        </div>
        <span className="faint" style={{ fontSize: 11.5 }}>
          Set it and forget it — fills automatically when the price is hit.
        </span>
        {orders.length > 0 && (
          <div className="col" style={{ gap: 6 }}>
            {orders.map((o) => (
              <div key={o.id} className="tool-row">
                <span style={{ fontSize: 12.5 }}>
                  <b>{o.kind === 'limit' ? 'Limit buy' : o.kind === 'stop' ? 'Stop-loss' : 'Take-profit'}</b>{' '}
                  <span className="mono">{formatQty(o.quantity)} @ {formatCurrencyFull(o.price)}</span>
                </span>
                <button className="icon-x" onClick={() => cancelOrder(o.id)} aria-label="Cancel order"><X size={14} /></button>
              </div>
            ))}
          </div>
        )}
        <div className="seg-tabs">
          <button className={`seg-tab ${orderKind === 'limit' ? 'active' : ''}`} onClick={() => setOrderKind('limit')}>Limit buy</button>
          <button className={`seg-tab ${orderKind === 'stop' ? 'active' : ''}`} onClick={() => setOrderKind('stop')}>Stop-loss</button>
          <button className={`seg-tab ${orderKind === 'take' ? 'active' : ''}`} onClick={() => setOrderKind('take')}>Take-profit</button>
        </div>
        <div className="grid-2">
          <label className="tool-field">
            <span className="faint" style={{ fontSize: 10.5 }}>Trigger price ₹</span>
            <input className="amount-field mono" type="number" placeholder={`${Math.round(asset.price)}`}
              value={orderPrice || ''} onChange={(e) => { setOrderPrice(Math.max(0, Number(e.target.value) || 0)); setToolMsg(null); }} />
          </label>
          <label className="tool-field">
            <span className="faint" style={{ fontSize: 10.5 }}>Quantity</span>
            <input className="amount-field mono" type="number" placeholder={`${asset.minQty}`}
              value={orderQty || ''} onChange={(e) => { setOrderQty(Math.max(0, Number(e.target.value) || 0)); setToolMsg(null); }} />
          </label>
        </div>
        <button className="btn btn-primary btn-block" onClick={() => {
          const r = placeOrder({
            assetId: asset.id,
            side: orderKind === 'limit' ? 'buy' : 'sell',
            kind: orderKind,
            price: orderPrice || asset.price,
            quantity: orderQty || asset.minQty,
          });
          setToolMsg(r.message); if (r.ok) { setOrderPrice(0); setOrderQty(asset.minQty); }
        }}>Place order</button>
        {toolMsg && <div className="faint" style={{ fontSize: 12, textAlign: 'center' }}>{toolMsg}</div>}
      </div>

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
