/**
 * Shimmer skeleton primitives for premium loading states. Purely presentational
 * — they mimic the shape of the content that's about to appear so the app feels
 * instant and polished instead of flashing a blank spinner.
 */
interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ width = '100%', height = 16, radius = 8, className = '', style }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

/** A full-page shimmer that mirrors the dashboard layout while the game loads. */
export function DashboardSkeleton() {
  return (
    <div className="skeleton-page" aria-busy="true" aria-label="Loading your dashboard">
      {/* header */}
      <div className="row between" style={{ padding: '18px 16px 8px' }}>
        <div className="row gap-8">
          <Skeleton width={38} height={38} radius={12} />
          <div className="col" style={{ gap: 6 }}>
            <Skeleton width={110} height={13} />
            <Skeleton width={70} height={10} />
          </div>
        </div>
        <Skeleton width={92} height={30} radius={999} />
      </div>

      <div className="col" style={{ gap: 12, padding: '4px 16px' }}>
        {/* hero */}
        <div className="skeleton-card" style={{ height: 150 }}>
          <Skeleton width={120} height={12} />
          <Skeleton width={200} height={30} style={{ marginTop: 10 }} />
          <Skeleton width={140} height={20} radius={999} style={{ marginTop: 12 }} />
          <div className="grid-2" style={{ marginTop: 16, gap: 10 }}>
            <Skeleton height={44} radius={12} />
            <Skeleton height={44} radius={12} />
          </div>
        </div>
        {/* score cards */}
        <div className="grid-2" style={{ gap: 12 }}>
          <Skeleton height={92} radius={16} />
          <Skeleton height={92} radius={16} />
        </div>
        {/* rows */}
        <Skeleton height={72} radius={16} />
        <Skeleton height={72} radius={16} />
        <Skeleton height={110} radius={16} />
      </div>
    </div>
  );
}
