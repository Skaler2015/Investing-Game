import { useMemo } from 'react';
import type { PricePoint } from '../../types';

interface Props {
  data: PricePoint[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  /** Override the auto up/down colour. */
  color?: string;
  fill?: boolean;
}

/**
 * Lightweight, dependency-free SVG sparkline. Colour is derived from the
 * overall trend (green up / red down) unless explicitly provided.
 */
export function Sparkline({
  data,
  width = 96,
  height = 36,
  strokeWidth = 2,
  color,
  fill = true,
}: Props) {
  const { path, area, stroke, id } = useMemo(() => {
    const pts = data.length >= 2 ? data : [{ t: 0, price: 0 }, { t: 1, price: 0 }];
    const prices = pts.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const span = max - min || 1;
    const stepX = width / (pts.length - 1);
    const y = (v: number) => height - ((v - min) / span) * (height - 4) - 2;

    let d = '';
    pts.forEach((p, i) => {
      const x = i * stepX;
      d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y(p.price).toFixed(2)} `;
    });
    const areaPath = `${d}L${width},${height} L0,${height} Z`;
    const up = prices[prices.length - 1] >= prices[0];
    const col = color ?? (up ? 'var(--up)' : 'var(--down)');
    return {
      path: d.trim(),
      area: areaPath,
      stroke: col,
      id: `spark-${Math.round(min)}-${Math.round(max)}-${pts.length}`,
    };
  }, [data, width, height, color]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {fill && (
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {fill && <path d={area} fill={`url(#${id})`} />}
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
