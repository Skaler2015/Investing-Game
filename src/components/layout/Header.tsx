import { Sun, Moon, Coins, Flame } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { resolveLevel } from '../../data/levels';
import { formatNumber } from '../../utils/format';

interface Props {
  title: string;
  subtitle?: string;
}

/** Sticky top bar: greeting/level on the left, coins + theme on the right. */
export function Header({ title, subtitle }: Props) {
  const player = useGameStore((s) => s.player);
  const theme = useGameStore((s) => s.theme);
  const toggleTheme = useGameStore((s) => s.toggleTheme);
  const setScreen = useGameStore((s) => s.setScreen);
  const level = resolveLevel(player.xp);

  return (
    <header className="app-header">
      <button
        className="row gap-8 clickable"
        style={{ minWidth: 0 }}
        onClick={() => setScreen('profile')}
        aria-label="Open profile"
      >
        <div className="avatar" aria-hidden="true">
          {player.name.charAt(0).toUpperCase()}
        </div>
        <div className="col" style={{ gap: 1, minWidth: 0, textAlign: 'left' }}>
          <span style={{ fontSize: 15, fontWeight: 800 }}>{title}</span>
          <span className="faint" style={{ fontSize: 11 }}>
            {subtitle ?? `Lv ${level.level} · ${level.title}`}
          </span>
        </div>
      </button>

      <div className="row gap-8">
        {player.loginStreak > 1 && (
          <span className="pill" style={{ background: 'rgba(245,158,11,0.14)', color: 'var(--gold)' }}>
            <Flame size={13} /> {player.loginStreak}
          </span>
        )}
        <span className="coin-chip">
          <Coins size={15} /> {formatNumber(player.coins)}
        </span>
        <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
