import {
  LayoutDashboard, CandlestickChart, Briefcase, Target, Trophy,
  Landmark, Building2, Home, Newspaper, Sparkles, GraduationCap,
  User, Settings as SettingsIcon, type LucideIcon,
} from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import type { ScreenId } from '../../types';

interface Item {
  id: ScreenId;
  label: string;
  icon: LucideIcon;
  /** Other screen ids that should also highlight this item. */
  alias?: ScreenId[];
}

const PRIMARY: Item[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'market', label: 'Market', icon: CandlestickChart },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'missions', label: 'Quests', icon: Target, alias: ['rewards'] },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
];

const WEALTH: Item[] = [
  { id: 'bank', label: 'Bank', icon: Landmark },
  { id: 'business', label: 'Businesses', icon: Building2 },
  { id: 'realestate', label: 'Real Estate', icon: Home },
  { id: 'news', label: 'News & Economy', icon: Newspaper },
  { id: 'advisor', label: 'AI Advisor', icon: Sparkles },
  { id: 'learn', label: 'Learn & Earn', icon: GraduationCap },
];

const FOOTER: Item[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

/** Desktop-only left navigation. Hidden on mobile via CSS (bottom nav there). */
export function Sidebar() {
  const current = useGameStore((s) => s.currentScreen);
  const setScreen = useGameStore((s) => s.setScreen);
  const name = useGameStore((s) => s.player.name);

  const renderItem = (it: Item) => {
    const active = current === it.id || it.alias?.includes(current);
    const IconCmp = it.icon;
    return (
      <button
        key={it.id}
        className={`side-item ${active ? 'active' : ''}`}
        onClick={() => setScreen(it.id)}
      >
        <IconCmp size={19} strokeWidth={active ? 2.5 : 2} />
        <span>{it.label}</span>
      </button>
    );
  };

  return (
    <aside className="sidebar">
      <button className="side-brand" onClick={() => setScreen('dashboard')}>
        <div className="side-logo">₹</div>
        <div className="col" style={{ gap: 1, textAlign: 'left', minWidth: 0 }}>
          <span style={{ fontWeight: 800, fontSize: 16 }}>Invest Master</span>
          <span className="faint truncate" style={{ fontSize: 11 }}>{name}</span>
        </div>
      </button>

      <nav className="side-nav">
        {PRIMARY.map(renderItem)}
        <div className="side-sep">Wealth</div>
        {WEALTH.map(renderItem)}
      </nav>

      <div className="side-footer">
        {FOOTER.map(renderItem)}
        <div className="side-sim">🛡️ Simulation only · virtual money</div>
      </div>
    </aside>
  );
}
