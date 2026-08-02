import { useMemo } from 'react';
import type { PricePoint } from '../../types';

interface Props {
  data: PricePoint[];
  height?: number;
  /** Number of candles to render (history is grouped into this many buckets). */
  candles?: number;
}

interface Candle {
  open: number;
  close: number;
  high: number;
  low: number;
}

/** Group a flat price series into OHLC candles. */
function toCandles(data: PricePoint[], count: number): Candle[] {
  if (data.length < 2) return [];
  const size = Math.max(1, Math.floor(data.length / count));
  const candles: Candle[] = [];
  for (let i = 0; i < data.length; i += size) {
    const chunk = data.slice(i, i + size);
    if (chunk.length === 0) continue;
    const prices = chunk.map((p) => p.price);
    candles.push({
      open: prices[0],
      close: prices[prices.length - 1],
      high: Math.max(...prices),
      low: Math.min(...prices),
    });
  }
  return candles;
}

/** Dependency-free candlestick chart derived from the tick price history. */
export function CandleChart({ data, height = 160, candles = 16 }: Props) {
  const width = 340;
  const items = useMemo(() => toCandles(data, candles), [data, candles]);

  const { min, max } = useMemo(() => {
    if (items.length === 0) return { min: 0, max: 1 };
    let mn = Infinity;
    let mx = -Infinity;
    for (const c of items) {
      mn = Math.min(mn, c.low);
      mx = Math.max(mx, c.high);
    }
    return { min: mn, max: mx };
  }, [items]);

  const pad = 8;
  const span = max - min || 1;
  const y = (v: number) => height - pad - ((v - min) / span) * (height - pad * 2);
  const slot = width / Math.max(1, items.length);
  const bodyW = Math.max(2, slot * 0.6);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {items.map((c, i) => {
        const cx = i * slot + slot / 2;
        const up = c.close >= c.open;
        const color = up ? 'var(--up)' : 'var(--down)';
        const bodyTop = y(Math.max(c.open, c.close));
        const bodyBottom = y(Math.min(c.open, c.close));
        return (
          <g key={i}>
            <line x1={cx} y1={y(c.high)} x2={cx} y2={y(c.low)} stroke={color} strokeWidth={1} />
            <rect
              x={cx - bodyW / 2}
              y={bodyTop}
              width={bodyW}
              height={Math.max(1, bodyBottom - bodyTop)}
              fill={color}
              rx={1}
            />
          </g>
        );
      })}
    </svg>
  );
}
