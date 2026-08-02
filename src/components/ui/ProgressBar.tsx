interface Props {
  /** 0..1 */
  value: number;
  height?: number;
  gradient?: string;
}

export function ProgressBar({ value, height = 8, gradient }: Props) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="progress" style={{ height }}>
      <span style={{ width: `${pct}%`, background: gradient }} />
    </div>
  );
}
