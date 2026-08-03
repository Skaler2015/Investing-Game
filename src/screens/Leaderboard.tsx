import { useEffect, useState } from 'react';
import { Crown, TrendingUp, TrendingDown, RefreshCw, Globe } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { useGameStore } from '../store/gameStore';
import { computeNetWorth } from '../engine/economy';
import { bankEquity } from '../engine/banking';
import { businessesEquity } from '../engine/business';
import { propertiesEquity } from '../engine/realEstate';
import { persistence, type LeaderRow } from '../services/backend';
import type { LeaderboardEntry } from '../types';
import { formatCurrency, formatPct, formatNumber } from '../utils/format';

type Board = 'global' | 'friends' | 'weekly';

export function Leaderboard() {
  const player = useGameStore((s) => s.player);
  const assets = useGameStore((s) => s.assets);
  const holdings = useGameStore((s) => s.holdings);
  const rivals = useGameStore((s) => s.leaderboard);
  const netWorthDayStart = useGameStore((s) => s.netWorthDayStart);
  const bank = useGameStore((s) => s.bank);
  const businesses = useGameStore((s) => s.businesses);
  const properties = useGameStore((s) => s.properties);
  const [board, setBoard] = useState<Board>('global');

  // Live (server) board state.
  const [live, setLive] = useState<{ top: LeaderRow[]; rank: number; total: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const netWorth =
    computeNetWorth(player.cash, holdings, assets) +
    bankEquity(bank) +
    businessesEquity(businesses) +
    propertiesEquity(properties);
  const playerWeekly =
    netWorthDayStart > 0 ? ((netWorth - netWorthDayStart) / netWorthDayStart) * 100 : 0;

  // Publish my score and fetch the live board on open (and on manual refresh).
  const refresh = () => {
    setLoading(true);
    void persistence
      .publishScore(netWorth, playerWeekly, player.name)
      .then((res) => setLive(res))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Global tab uses the real server board when available ────────────────
  const useLiveGlobal = board === 'global' && live !== null;

  const liveEntries: LeaderboardEntry[] = (live?.top ?? []).map((r) => ({
    id: r.id,
    name: r.id === player.id ? `${r.name} (You)` : r.name,
    netWorth: r.netWorth,
    weeklyGain: r.weekGain,
    isPlayer: r.id === player.id,
    isFriend: false,
  }));

  // ── Offline / other tabs: simulated rivals + the player ─────────────────
  const playerEntry: LeaderboardEntry = {
    id: player.id,
    name: `${player.name} (You)`,
    netWorth,
    weeklyGain: playerWeekly,
    isPlayer: true,
    isFriend: true,
  };
  let simEntries = [...rivals, playerEntry];
  if (board === 'friends') simEntries = simEntries.filter((e) => e.isFriend || e.isPlayer);
  simEntries.sort((a, b) =>
    board === 'weekly' ? b.weeklyGain - a.weeklyGain : b.netWorth - a.netWorth
  );

  const entries = useLiveGlobal ? liveEntries : simEntries;
  const podium = entries.slice(0, 3);
  const meInList = useLiveGlobal && liveEntries.some((e) => e.isPlayer);

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

        {/* Live status strip (global tab, server mode) */}
        {board === 'global' && (
          <div className="live-strip">
            {live ? (
              <>
                <span className="live-badge"><Globe size={12} /> LIVE</span>
                <span className="faint" style={{ fontSize: 12 }}>
                  {formatNumber(live.total)} real player{live.total === 1 ? '' : 's'} · you’re #{live.rank}
                </span>
              </>
            ) : (
              <span className="faint" style={{ fontSize: 12 }}>
                {loading ? 'Loading live rankings…' : 'Offline ranking (practice rivals)'}
              </span>
            )}
            <button className="link-btn" onClick={refresh} disabled={loading} style={{ marginLeft: 'auto' }}>
              <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh
            </button>
          </div>
        )}

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

        {/* If you're outside the visible top on the live board, show your rank. */}
        {useLiveGlobal && !meInList && live && (
          <div className="rank-row me" style={{ marginTop: 8 }}>
            <span className="rank-num">{live.rank}</span>
            <div className="rank-avatar">{player.name.charAt(0).toUpperCase()}</div>
            <span style={{ fontSize: 14, fontWeight: 700, flex: 1 }} className="truncate">
              {player.name} (You)
            </span>
            <span className="mono" style={{ fontSize: 13, fontWeight: 700 }}>
              {formatCurrency(netWorth)}
            </span>
          </div>
        )}

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
