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

  const [qty, setQty] = useState<number>(asset.minQty);
  const [err, setErr] = useState<string | null>(null);

  const step = asset.minQty;
  const cost = asset.price * qty;
  const owned = holding?.quantity ?? 0;

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
    const res = buy(asset.id, qty);
    setErr(res.ok ? null : res.message);
  };
  const doSell = () => {
    const res = sell(asset.id, qty);
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

      <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
        {maxBuyQty >= step && (
          <button className="chip-btn" onClick={() => setQty(maxBuyQty)}>
            Max buy ({formatQty(maxBuyQty)})
          </button>
        )}
        {owned > 0 && (
          <button className="chip-btn" onClick={() => setQty(owned)}>
            Sell all ({formatQty(owned)})
          </button>
        )}
      </div>

      {err && <div className="trade-err">{err}</div>}

      <div className="grid-2">
        <button className="btn btn-buy btn-block" onClick={doBuy} disabled={cost > cash}>
          Buy
        </button>
        <button
          className="btn btn-sell btn-block"
          onClick={doSell}
          disabled={owned <= 0 || qty > owned}
        >
          Sell
        </button>
      </div>
    </div>
  );
}
