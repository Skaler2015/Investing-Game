import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { TICK_INTERVAL_MS } from '../store/constants';

/**
 * Drives the live market. Prices update every TICK_INTERVAL_MS while the tab
 * is visible; ticking pauses in the background to save cycles and resumes on
 * return.
 */
export function useMarketTick() {
  const initialized = useGameStore((s) => s.initialized);

  useEffect(() => {
    if (!initialized) return;
    let id: number | undefined;

    const start = () => {
      if (id === undefined) {
        id = window.setInterval(() => useGameStore.getState().advanceTick(), TICK_INTERVAL_MS);
      }
    };
    const stop = () => {
      if (id !== undefined) {
        window.clearInterval(id);
        id = undefined;
      }
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [initialized]);
}
