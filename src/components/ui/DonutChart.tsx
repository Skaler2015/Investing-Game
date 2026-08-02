interface Slice {
  value: number;
  color: string;
  label: string;
}

interface Props {
  slices: Slice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSub?: string;
}

/** Simple SVG donut chart for portfolio allocation. */
export function DonutChart({
  slices,
  size = 150,
  thickness = 20,
  centerLabel,
  centerSub,
}: Props) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  const arcs = slices.map((s, i) => {
    const frac = total > 0 ? s.value / total : 0;
    const len = frac * circ;
    const el = (
      <circle
        key={i}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={s.color}
        strokeWidth={thickness}
        strokeDasharray={`${len} ${circ - len}`}
        strokeDashoffset={-offset}
        strokeLinecap="butt"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    );
    offset += len;
    return el;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={thickness} />
      {total > 0 && arcs}
      {centerLabel && (
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fontSize="18"
          fontWeight="800"
          fill="var(--text)"
        >
          {centerLabel}
        </text>
      )}
      {centerSub && (
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="10" fill="var(--text-dim)">
          {centerSub}
        </text>
      )}
    </svg>
  );
}
