import { useState } from 'react';
import { Crown, TrendingUp, TrendingDown } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { useGameStore } from '../store/gameStore';
import { computeNetWorth } from '../engine/economy';
import { bankEquity } from '../engine/banking';
import { businessesEquity } from '../engine/business';
import { propertiesEquity } from '../engine/realEstate';
import type { LeaderboardEntry } from '../types';
import { formatCurrency, formatPct } from '../utils/format';

type Board = 'global' | 'friends' | 'weekly';

export function Leaderboard() {
  const player = useGameStore((s) => s.player);
  const assets = useGameStore((s) => s.assets);
  const holdings = useGameStore((s) => s.holdings);
  const rivals = useGameStore((s) => s.leaderboard);
  const netWorthDayStart = useGameStore((s) => s.netWorthDayStart);
  const [board, setBoard] = useState<Board>('global');

  const bank = useGameStore((s) => s.bank);
  const businesses = useGameStore((s) => s.businesses);
  const properties = useGameStore((s) => s.properties);
  const netWorth =
    computeNetWorth(player.cash, holdings, assets) +
    bankEquity(bank) +
    businessesEquity(businesses) +
    propertiesEquity(properties);
  const playerWeekly =
    netWorthDayStart > 0 ? ((netWorth - netWorthDayStart) / netWorthDayStart) * 100 : 0;

  const playerEntry: LeaderboardEntry = {
    id: player.id,
    name: `${player.name} (You)`,
    netWorth,
    weeklyGain: playerWeekly,
    isPlayer: true,
    isFriend: true,
  };

  let entries = [...rivals, playerEntry];
  if (board === 'friends') entries = entries.filter((e) => e.isFriend || e.isPlayer);

  entries.sort((a, b) =>
    board === 'weekly' ? b.weeklyGain - a.weeklyGain : b.netWorth - a.netWorth
  );

  const podium = entries.slice(0, 3);

  return (
    <>
      <Header title="Leaderboard" subtitle="Climb the ranks of investors" />
      <div className="screen-scroll">
        <div className="seg-tabs" style={{ marginTop: 4 }}>
          {(['global', 'friends', 'weekly'] as Board[]).map((b) => (
            <button
              key={b}
              className={`seg-tab ${board === b ? 'active' : ''}`}
              onClick={() => setBoard(b)}
            >
              {b.charAt(0).toUpperCase() + b.slice(1)}
            </button>
          ))}
        </div>

        {/* Podium */}
        <div className="podium">
          {[1, 0, 2].map((pos) => {
            const e = podium[pos];
            if (!e) return <div key={pos} className="podium-col" />;
            const heights = ['podium-2', 'podium-1', 'podium-3'];
            const rankClass = pos === 0 ? 'podium-1' : pos === 1 ? 'podium-2' : 'podium-3';
            return (
              <div key={pos} className={`podium-col ${e.isPlayer ? 'me' : ''}`}>
                <div className={`podium-avatar rank-${pos + 1}`}>
                  {pos === 0 && <Crown size={16} className="crown" />}
                  {e.name.charAt(0).toUpperCase()}
                </div>
                <span className="podium-name truncate">{e.name.replace(' (You)', '')}</span>
                <span className="podium-val mono">
                  {board === 'weekly'
                    ? formatPct(e.weeklyGain, { sign: true })
                    : formatCurrency(e.netWorth)}
                </span>
                <div className={`podium-bar ${heights[pos === 0 ? 1 : pos === 1 ? 0 : 2]} ${rankClass}`}>
                  #{pos + 1}
                </div>
              </div>
            );
          })}
        </div>

        {/* Full list */}
        <div className="col" style={{ gap: 8, marginTop: 8 }}>
          {entries.map((e, i) => (
            <div key={e.id} className={`rank-row ${e.isPlayer ? 'me' : ''}`}>
              <span className="rank-num">{i + 1}</span>
              <div className="rank-avatar">{e.name.charAt(0).toUpperCase()}</div>
              <span style={{ fontSize: 14, fontWeight: 700, flex: 1 }} className="truncate">
                {e.name}
              </span>
              <div className="col" style={{ alignItems: 'flex-end', gap: 2 }}>
                <span className="mono" style={{ fontSize: 13, fontWeight: 700 }}>
                  {formatCurrency(e.netWorth)}
                </span>
                <span
                  className={`row gap-8 ${e.weeklyGain >= 0 ? 'up' : 'down'}`}
                  style={{ fontSize: 11, fontWeight: 700 }}
                >
                  {e.weeklyGain >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {formatPct(e.weeklyGain, { sign: true })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
