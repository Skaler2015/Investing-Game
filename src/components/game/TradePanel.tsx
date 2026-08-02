import { useMemo, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { Asset } from '../../types';
import { useGameStore } from '../../store/gameStore';
import { formatCurrencyFull, formatQty } from '../../utils/format';

interface Props {
  asset: Asset;
}

/** Buy / sell controls with a quantity stepper and live cost preview. */
export function TradePanel({ asset }: Props) {
  const buy = useGameStore((s) => s.buy);
  const sell = useGameStore((s) => s.sell);
  const cash = useGameStore((s) => s.player.cash);
  const holding = useGameStore((s) =>
    s.holdings.find((h) => h.assetId === asset.id)
  );

  const [mode, setMode] = useState<'qty' | 'amount'>('qty');
  const [qty, setQty] = useState<number>(asset.minQty);
  const [amount, setAmount] = useState<number>(1000);
  const [err, setErr] = useState<string | null>(null);

  const step = asset.minQty;
  const owned = holding?.quantity ?? 0;

  // In amount mode the ₹ input drives the quantity (rounded down to a lot).
  const amountQty = useMemo(() => {
    const raw = Math.floor(amount / asset.price / step) * step;
    return Math.max(0, parseFloat(raw.toFixed(4)));
  }, [amount, asset.price, step]);
  const effQty = mode === 'amount' ? amountQty : qty;
  const cost = asset.price * effQty;

  const maxBuyQty = useMemo(() => {
    const raw = Math.floor(cash / asset.price / step) * step;
    return Math.max(0, parseFloat(raw.toFixed(4)));
  }, [cash, asset.price, step]);

  const adjust = (dir: 1 | -1) => {
    setErr(null);
    setQty((q) => {
      const next = parseFloat((q + dir * step).toFixed(4));
      return next < step ? step : next;
    });
  };

  const doBuy = () => {
    if (effQty < step) { setErr('Increase the amount — too small for one unit'); return; }
    const res = buy(asset.id, effQty);
    setErr(res.ok ? null : res.message);
  };
  const doSell = () => {
    const q = mode === 'amount' ? Math.min(effQty, owned) : qty;
    if (q < step) { setErr('Nothing to sell at this size'); return; }
    const res = sell(asset.id, q);
    setErr(res.ok ? null : res.message);
  };

  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="row between">
        <span className="muted" style={{ fontSize: 13 }}>
          Available cash
        </span>
        <span className="mono" style={{ fontWeight: 700 }}>
          {formatCurrencyFull(cash)}
        </span>
      </div>
      {owned > 0 && (
        <div className="row between">
          <span className="muted" style={{ fontSize: 13 }}>
            You own
          </span>
          <span className="mono" style={{ fontWeight: 700 }}>
            {formatQty(owned)} {asset.symbol}
          </span>
        </div>
      )}

      <div className="seg-tabs">
        <button className={`seg-tab ${mode === 'qty' ? 'active' : ''}`} onClick={() => { setMode('qty'); setErr(null); }}>
          By quantity
        </button>
        <button className={`seg-tab ${mode === 'amount' ? 'active' : ''}`} onClick={() => { setMode('amount'); setErr(null); }}>
          By amount ₹
        </button>
      </div>

      {mode === 'qty' ? (
        <div className="qty-stepper">
          <button className="qty-btn" onClick={() => adjust(-1)} aria-label="Decrease">
            <Minus size={18} />
          </button>
          <div className="col center" style={{ flex: 1 }}>
            <span style={{ fontSize: 22, fontWeight: 800 }} className="mono">
              {formatQty(qty)}
            </span>
            <span className="faint" style={{ fontSize: 11 }}>
              {asset.symbol} · {formatCurrencyFull(cost)}
            </span>
          </div>
          <button className="qty-btn" onClick={() => adjust(1)} aria-label="Increase">
            <Plus size={18} />
          </button>
        </div>
      ) : (
        <div className="col" style={{ gap: 6 }}>
          <div className="qty-stepper" style={{ padding: '10px 14px' }}>
            <span className="faint mono" style={{ fontSize: 18 }}>₹</span>
            <input
              className="amount-field mono"
              style={{ flex: 1, border: 'none', background: 'transparent', textAlign: 'center', fontSize: 20 }}
              type="number"
              value={amount || ''}
              onChange={(e) => { setAmount(Math.max(0, Math.floor(Number(e.target.value) || 0))); setErr(null); }}
            />
          </div>
          <span className="faint" style={{ fontSize: 11.5, textAlign: 'center' }}>
            = {formatQty(amountQty)} {asset.symbol} · {formatCurrencyFull(cost)}
          </span>
        </div>
      )}

      <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
        {mode === 'qty' && maxBuyQty >= step && (
          <button className="chip-btn" onClick={() => setQty(maxBuyQty)}>
            Max buy ({formatQty(maxBuyQty)})
          </button>
        )}
        {mode === 'qty' && owned > 0 && (
          <button className="chip-btn" onClick={() => setQty(owned)}>
            Sell all ({formatQty(owned)})
          </button>
        )}
        {mode === 'amount' && cash > 0 && (
          <button className="chip-btn" onClick={() => setAmount(Math.floor(cash))}>
            All cash ({formatCurrencyFull(cash)})
          </button>
        )}
      </div>

      {err && <div className="trade-err">{err}</div>}

      <div className="grid-2">
        <button className="btn btn-buy btn-block" onClick={doBuy} disabled={effQty < step || cost > cash}>
          Buy
        </button>
        <button
          className="btn btn-sell btn-block"
          onClick={doSell}
          disabled={owned <= 0 || (mode === 'qty' && qty > owned)}
        >
          Sell
        </button>
      </div>
    </div>
  );
}
