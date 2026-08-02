import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from './store/gameStore';
import { useMarketTick } from './hooks/useMarketTick';
import { BottomNav } from './components/layout/BottomNav';
import { Toaster } from './components/ui/Toaster';
import { Dashboard } from './screens/Dashboard';
import { Market } from './screens/Market';
import { Portfolio } from './screens/Portfolio';
import { Quests } from './screens/Quests';
import { Leaderboard } from './screens/Leaderboard';
import { Profile } from './screens/Profile';
import type { ScreenId } from './types';

const SCREENS: Record<ScreenId, () => JSX.Element> = {
  dashboard: Dashboard,
  market: Market,
  portfolio: Portfolio,
  missions: Quests,
  rewards: Quests,
  leaderboard: Leaderboard,
  profile: Profile,
};

function Splash() {
  return (
    <div className="splash">
      <motion.div
        className="splash-logo"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        ₹
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        Invest Master
      </motion.h1>
      <span className="faint">Loading your portfolio…</span>
    </div>
  );
}

export default function App() {
  const initialized = useGameStore((s) => s.initialized);
  const theme = useGameStore((s) => s.theme);
  const currentScreen = useGameStore((s) => s.currentScreen);
  const init = useGameStore((s) => s.init);

  useMarketTick();

  // Boot the game once.
  useEffect(() => {
    void init();
  }, [init]);

  // Apply theme to the document root.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0b1020' : '#eef1f8');
  }, [theme]);

  const Screen = SCREENS[currentScreen] ?? Dashboard;
  const isProfile = currentScreen === 'profile';

  return (
    <div className="app-shell">
      {!initialized ? (
        <Splash />
      ) : (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreen}
              className="screen-motion"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <Screen />
            </motion.div>
          </AnimatePresence>
          {!isProfile && <BottomNav />}
          <Toaster />
        </>
      )}
    </div>
  );
}
