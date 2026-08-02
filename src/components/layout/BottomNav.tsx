import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  CandlestickChart,
  Briefcase,
  Target,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import type { ScreenId } from '../../types';

const TABS: { id: ScreenId; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'market', label: 'Market', icon: CandlestickChart },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'missions', label: 'Missions', icon: Target },
  { id: 'leaderboard', label: 'Ranks', icon: Trophy },
];

export function BottomNav() {
  const current = useGameStore((s) => s.currentScreen);
  const setScreen = useGameStore((s) => s.setScreen);

  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => {
        const active = current === tab.id;
        const IconCmp = tab.icon;
        return (
          <button
            key={tab.id}
            className={`nav-item ${active ? 'active' : ''}`}
            onClick={() => setScreen(tab.id)}
            aria-label={tab.label}
          >
            {active && (
              <motion.span
                layoutId="nav-glow"
                className="nav-glow"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <IconCmp size={22} strokeWidth={active ? 2.6 : 2} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
