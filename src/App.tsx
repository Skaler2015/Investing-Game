import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from './store/gameStore';
import { useMarketTick } from './hooks/useMarketTick';
import { BottomNav } from './components/layout/BottomNav';
import { Toaster } from './components/ui/Toaster';
import { InstallPrompt } from './components/pwa/InstallPrompt';
import { Dashboard } from './screens/Dashboard';
import { Market } from './screens/Market';
import { Portfolio } from './screens/Portfolio';
import { Quests } from './screens/Quests';
import { Leaderboard } from './screens/Leaderboard';
import { Profile } from './screens/Profile';
import { AuthGate } from './screens/AuthGate';
import { CareerSelect } from './screens/CareerSelect';
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
  const authChecked = useGameStore((s) => s.authChecked);
  const authUser = useGameStore((s) => s.authUser);
  const careerId = useGameStore((s) => s.player.careerId);
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
    <div className="stage">
      <DesktopHero />
      <div className="app-shell">
        {!authChecked ? (
          <Splash />
        ) : !authUser ? (
          <AuthGate />
        ) : !initialized ? (
          <Splash />
        ) : !careerId ? (
          <CareerSelect />
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
            <InstallPrompt />
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Branding panel shown alongside the phone frame on desktop/wide screens so
 * the page reads as a full website. Hidden on mobile via CSS.
 */
function DesktopHero() {
  return (
    <aside className="desktop-hero" aria-hidden="true">
      <div className="dh-logo">₹</div>
      <h1 className="dh-title">Invest Master</h1>
      <p className="dh-tag">
        Learn investing the fun way. Start with ₹1,00,000 in virtual cash, build a
        portfolio across stocks, crypto, gold, real estate and more, and grow your
        net worth on a live, event-driven market.
      </p>
      <ul className="dh-features">
        <li>📈 6 asset classes with live, moving prices</li>
        <li>🎯 Daily missions, streak rewards & achievements</li>
        <li>🏆 Level up and climb the global leaderboard</li>
        <li>📱 Installs to your phone · works offline</li>
      </ul>
      <div className="dh-cta">
        <span className="dh-arrow">←</span> Play it right here, or install it on your
        phone
      </div>
      <span className="dh-note">🛡️ Simulation only · No real money involved</span>
    </aside>
  );
}
