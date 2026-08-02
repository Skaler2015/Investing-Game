import { useMemo, useState } from 'react';
import type { PricePoint } from '../../types';
import { formatCurrencyFull } from '../../utils/format';

interface Props {
  data: PricePoint[];
  height?: number;
}

/**
 * Larger, interactive price chart used on the asset detail sheet. Tapping /
 * hovering reveals a crosshair with the price at that point.
 */
export function PriceChart({ data, height = 160 }: Props) {
  const width = 340;
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const { path, area, coords, min, max, up } = useMemo(() => {
    const pts = data.length >= 2 ? data : [{ t: 0, price: 0 }, { t: 1, price: 0 }];
    const prices = pts.map((p) => p.price);
    const mn = Math.min(...prices);
    const mx = Math.max(...prices);
    const span = mx - mn || 1;
    const stepX = width / (pts.length - 1);
    const pad = 8;
    const y = (v: number) => height - pad - ((v - mn) / span) * (height - pad * 2);
    const c = pts.map((p, i) => ({ x: i * stepX, y: y(p.price), price: p.price }));
    let d = '';
    c.forEach((p, i) => {
      d += `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)} `;
    });
    return {
      path: d.trim(),
      area: `${d}L${width},${height} L0,${height} Z`,
      coords: c,
      min: mn,
      max: mx,
      up: prices[prices.length - 1] >= prices[0],
    };
  }, [data, height]);

  const stroke = up ? 'var(--up)' : 'var(--down)';
  const hovered = hoverIdx !== null ? coords[hoverIdx] : null;

  const handleMove = (clientX: number, target: SVGSVGElement) => {
    const rect = target.getBoundingClientRect();
    const rel = ((clientX - rect.left) / rect.width) * width;
    const idx = Math.max(0, Math.min(coords.length - 1, Math.round(rel / (width / (coords.length - 1)))));
    setHoverIdx(idx);
  };

  return (
    <div className="col" style={{ gap: 8 }}>
      <div className="row between" style={{ fontSize: 11 }}>
        <span className="faint mono">L: {formatCurrencyFull(min)}</span>
        <span className="faint mono">H: {formatCurrencyFull(max)}</span>
      </div>
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        style={{ touchAction: 'none', display: 'block' }}
        onMouseMove={(e) => handleMove(e.clientX, e.currentTarget)}
        onMouseLeave={() => setHoverIdx(null)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX, e.currentTarget)}
        onTouchEnd={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="pc-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#pc-fill)" />
        <path
          d={path}
          fill="none"
          stroke={stroke}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {hovered && (
          <g>
            <line
              x1={hovered.x}
              y1={0}
              x2={hovered.x}
              y2={height}
              stroke="var(--text-faint)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle cx={hovered.x} cy={hovered.y} r={4.5} fill={stroke} stroke="var(--bg)" strokeWidth={2} />
          </g>
        )}
      </svg>
      <div className="center" style={{ height: 16, fontSize: 12, fontWeight: 700 }}>
        {hovered ? (
          <span className="mono">{formatCurrencyFull(hovered.price)}</span>
        ) : (
          <span className="faint">Tap and drag to inspect</span>
        )}
      </div>
    </div>
  );
}
