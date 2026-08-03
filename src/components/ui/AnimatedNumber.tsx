import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  /** Formats the (possibly fractional) tween value for display. */
  format: (n: number) => string;
  /** Count-up duration in ms. */
  duration?: number;
}

/**
 * Counts up from 0 to `value` once on mount for a premium reveal, then tracks
 * the live value directly (no re-tween) so frequent updates stay smooth and
 * jitter-free. Respects prefers-reduced-motion.
 */
export function AnimatedNumber({ value, format, duration = 850 }: Props) {
  const [display, setDisplay] = useState(value);
  const started = useRef(false);

  useEffect(() => {
    // After the first reveal, follow the live value with no animation.
    if (started.current) {
      setDisplay(value);
      return;
    }
    started.current = true;

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof requestAnimationFrame === 'undefined') {
      setDisplay(value);
      return;
    }

    const to = value;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(to * eased);
      if (t < 1) raf = requestAnimationFrame(step);
      else setDisplay(to);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{format(display)}</>;
}
