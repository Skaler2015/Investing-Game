import { useState } from 'react';
import {
  ArrowLeft,
  Pencil,
  Check,
  Trophy,
  Repeat,
  TrendingUp,
  Wallet,
  Sun,
  Moon,
  RotateCcw,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { resolveLevel } from '../data/levels';
import { computeNetWorth } from '../engine/economy';
import { ProgressBar } from '../components/ui/ProgressBar';
import { formatCurrency, formatCurrencyFull, formatNumber } from '../utils/format';

const FUTURE_FEATURES = [
  'Multiplayer Mode',
  'AI Investment Advisor',
  'Business Management',
  'Loan System',
  'Property Management',
  'Seasonal Events',
  'Clubs & Tournaments',
];

export function Profile() {
  const player = useGameStore((s) => s.player);
  const assets = useGameStore((s) => s.assets);
  const holdings = useGameStore((s) => s.holdings);
  const lifetime = useGameStore((s) => s.lifetime);
  const theme = useGameStore((s) => s.theme);
  const toggleTheme = useGameStore((s) => s.toggleTheme);
  const setScreen = useGameStore((s) => s.setScreen);
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const resetGame = useGameStore((s) => s.resetGame);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(player.name);
  const [confirmReset, setConfirmReset] = useState(false);

  const level = resolveLevel(player.xp);
  const netWorth = computeNetWorth(player.cash, holdings, assets);

  const saveName = () => {
    setPlayerName(name);
    setEditing(false);
  };

  return (
    <>
      <header className="app-header">
        <button className="icon-btn" onClick={() => setScreen('dashboard')} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <span style={{ fontWeight: 800, fontSize: 16 }}>Profile</span>
        <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      <div className="screen-scroll">
        {/* Identity */}
        <div className="hero-card center col" style={{ gap: 10, alignItems: 'center' }}>
          <div className="avatar-lg">{player.name.charAt(0).toUpperCase()}</div>
          {editing ? (
            <div className="row gap-8">
              <input
                className="name-input"
                value={name}
                maxLength={20}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <button className="icon-btn" onClick={saveName} aria-label="Save name">
                <Check size={18} />
              </button>
            </div>
          ) : (
            <button className="row gap-8 clickable" onClick={() => setEditing(true)}>
              <span style={{ fontSize: 20, fontWeight: 800 }}>{player.name}</span>
              <Pencil size={15} className="faint" />
            </button>
          )}
          <span className="pill" style={{ background: 'var(--surface-2)' }}>
            Lv {level.level} · {level.title}
          </span>
          <div style={{ width: '100%', marginTop: 4 }}>
            <ProgressBar value={level.progress} />
            <span className="faint" style={{ fontSize: 11 }}>
              {level.isMax ? 'Max level' : `${level.xpIntoLevel}/${level.xpForNextLevel} XP to next level`}
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid-2" style={{ marginTop: 12 }}>
          <StatTile icon={<Wallet size={16} />} label="Net Worth" value={formatCurrency(netWorth)} />
          <StatTile
            icon={<TrendingUp size={16} />}
            label="Realised P&L"
            value={formatCurrency(player.realizedPnl, { sign: true })}
            positive={player.realizedPnl >= 0}
          />
          <StatTile icon={<Repeat size={16} />} label="Total Trades" value={formatNumber(lifetime.trades)} />
          <StatTile
            icon={<Trophy size={16} />}
            label="Achievements"
            value={formatNumber(player.unlockedAchievements.length)}
          />
        </div>

        {/* Cash detail */}
        <div className="card card-pad col" style={{ gap: 8, marginTop: 12 }}>
          <div className="row between">
            <span className="muted" style={{ fontSize: 13 }}>Cash Balance</span>
            <span className="mono" style={{ fontWeight: 700 }}>{formatCurrencyFull(player.cash)}</span>
          </div>
          <div className="row between">
            <span className="muted" style={{ fontSize: 13 }}>Coins</span>
            <span className="mono" style={{ fontWeight: 700 }}>{formatNumber(player.coins)}</span>
          </div>
          <div className="row between">
            <span className="muted" style={{ fontSize: 13 }}>Profitable Trades</span>
            <span className="mono" style={{ fontWeight: 700 }}>{formatNumber(lifetime.profitableTrades)}</span>
          </div>
        </div>

        {/* Badges */}
        {player.earnedBadges.length > 0 && (
          <>
            <div className="section-title"><span>Badges</span></div>
            <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
              {player.earnedBadges.map((b) => (
                <span key={b} className="badge-chip">
                  <Sparkles size={13} /> {b}
                </span>
              ))}
            </div>
          </>
        )}

        {/* Coming soon */}
        <div className="section-title"><span>Coming Soon</span></div>
        <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
          {FUTURE_FEATURES.map((f) => (
            <span key={f} className="soon-chip">{f}</span>
          ))}
        </div>

        {/* Simulation disclaimer */}
        <div className="disclaimer">
          <ShieldCheck size={18} style={{ flexShrink: 0 }} />
          <span>
            <strong>Simulation only.</strong> Invest Master is an educational game. All money,
            prices and assets are virtual. No real money or real-world trading is involved.
          </span>
        </div>

        {/* Reset */}
        <div style={{ marginTop: 16 }}>
          {confirmReset ? (
            <div className="card card-pad col" style={{ gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                Reset all progress and start a new game?
              </span>
              <div className="grid-2">
                <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-sell"
                  onClick={() => {
                    void resetGame();
                    setConfirmReset(false);
                    setScreen('dashboard');
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          ) : (
            <button className="btn btn-ghost btn-block" onClick={() => setConfirmReset(true)}>
              <RotateCcw size={16} /> Reset Game
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function StatTile({
  icon,
  label,
  value,
  positive,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="card card-pad col" style={{ gap: 6 }}>
      <div className="row gap-8 faint">
        {icon}
        <span style={{ fontSize: 11 }}>{label}</span>
      </div>
      <span
        className={`mono ${positive === undefined ? '' : positive ? 'up' : 'down'}`}
        style={{ fontSize: 18, fontWeight: 800 }}
      >
        {value}
      </span>
    </div>
  );
}
