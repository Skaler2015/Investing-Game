import { useEffect, useState } from 'react';
import { Crown, TrendingUp, TrendingDown, RefreshCw, Globe, Copy, UserPlus, X, Users } from 'lucide-react';
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
  const [weekly, setWeekly] = useState<{ top: LeaderRow[]; rank: number; total: number; endsIn: number } | null>(null);
  const [loading, setLoading] = useState(false);

  // Friends state (server-backed).
  const [friendsData, setFriendsData] = useState<{ code: string; friends: LeaderRow[] } | null>(null);
  const [friendsLoaded, setFriendsLoaded] = useState(false);
  const [addCode, setAddCode] = useState('');
  const [friendMsg, setFriendMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const netWorth =
    computeNetWorth(player.cash, holdings, assets) +
    bankEquity(bank) +
    businessesEquity(businesses) +
    propertiesEquity(properties);
  const playerWeekly =
    netWorthDayStart > 0 ? ((netWorth - netWorthDayStart) / netWorthDayStart) * 100 : 0;

  // Publish my score and fetch the live boards (global + weekly) on open.
  const refresh = () => {
    setLoading(true);
    Promise.all([
      persistence.publishScore(netWorth, playerWeekly, player.name).then((res) => setLive(res)),
      persistence.publishWeekly(netWorth, player.name).then((res) => setWeekly(res)),
    ]).finally(() => setLoading(false));
  };
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load friends lazily the first time the Friends tab is opened.
  const loadFriends = () => {
    void persistence.friends('list').then((res) => {
      setFriendsLoaded(true);
      if (res.ok && res.data) setFriendsData(res.data);
    });
  };
  useEffect(() => {
    if (board === 'friends' && !friendsLoaded) loadFriends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  const addFriend = () => {
    const code = addCode.trim().toUpperCase();
    if (!code) return;
    setFriendMsg(null);
    void persistence.friends('add', { code }).then((res) => {
      setFriendMsg(res.message ?? (res.ok ? 'Friend added' : 'Could not add friend'));
      if (res.ok && res.data) {
        setFriendsData(res.data);
        setAddCode('');
      }
    });
  };
  const removeFriend = (id: string) => {
    void persistence.friends('remove', { friendId: id }).then((res) => {
      if (res.ok && res.data) setFriendsData(res.data);
    });
  };
  const copyCode = () => {
    if (!friendsData) return;
    try {
      void navigator.clipboard?.writeText(friendsData.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const toEntries = (rows: LeaderRow[]): LeaderboardEntry[] =>
    rows.map((r) => ({
      id: r.id,
      name: r.id === player.id ? `${r.name} (You)` : r.name,
      netWorth: r.netWorth,
      weeklyGain: r.weekGain,
      isPlayer: r.id === player.id,
      isFriend: false,
    }));

  // ── Global / Weekly / Friends tabs use the real server board when able ──
  const useLiveGlobal = board === 'global' && live !== null;
  const useLiveWeekly = board === 'weekly' && weekly !== null;
  const useLiveFriends = board === 'friends' && friendsData !== null;

  let liveEntries: LeaderboardEntry[] = [];
  if (useLiveWeekly) liveEntries = toEntries(weekly!.top);
  else if (useLiveFriends) {
    const me: LeaderRow = { id: player.id, name: player.name, netWorth, weekGain: playerWeekly };
    liveEntries = toEntries([me, ...friendsData!.friends]).sort((a, b) => b.netWorth - a.netWorth);
  } else liveEntries = toEntries(live?.top ?? []);

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

  const useLive = useLiveGlobal || useLiveWeekly || useLiveFriends;
  const entries = useLive ? liveEntries : simEntries;
  const podium = entries.slice(0, 3);
  const meInList = useLive && liveEntries.some((e) => e.isPlayer);
  const myRank = useLiveWeekly ? weekly?.rank ?? 0 : live?.rank ?? 0;

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

        {/* Friends management (Friends tab) */}
        {board === 'friends' && (
          friendsData ? (
            <div className="card card-pad col" style={{ gap: 12, marginTop: 10 }}>
              <div className="row between">
                <div className="col" style={{ gap: 2 }}>
                  <span className="faint" style={{ fontSize: 11 }}>Your friend code</span>
                  <span className="mono" style={{ fontSize: 20, fontWeight: 800, letterSpacing: '0.12em' }}>
                    {friendsData.code}
                  </span>
                </div>
                <button className="btn btn-ghost" onClick={copyCode}>
                  <Copy size={14} /> {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <span className="faint" style={{ fontSize: 11.5 }}>
                Share your code with friends. Add theirs below to compete together.
              </span>
              <div className="row gap-8">
                <input
                  className="amount-field mono"
                  style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  placeholder="ENTER CODE"
                  maxLength={6}
                  value={addCode}
                  onChange={(e) => { setAddCode(e.target.value.toUpperCase()); setFriendMsg(null); }}
                />
                <button className="btn btn-primary" onClick={addFriend}>
                  <UserPlus size={15} /> Add
                </button>
              </div>
              {friendMsg && <div className="faint" style={{ fontSize: 12 }}>{friendMsg}</div>}
              {friendsData.friends.length > 0 && (
                <div className="col" style={{ gap: 6 }}>
                  <span className="faint" style={{ fontSize: 11 }}>Your friends ({friendsData.friends.length})</span>
                  {friendsData.friends.map((f) => (
                    <div key={f.id} className="tool-row">
                      <span style={{ fontSize: 13, fontWeight: 700 }} className="truncate">{f.name}</span>
                      <button className="icon-x" onClick={() => removeFriend(f.id)} aria-label={`Remove ${f.name}`}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="live-strip">
              <Users size={14} className="faint" />
              <span className="faint" style={{ fontSize: 12 }}>
                {!friendsLoaded ? 'Loading friends…' : 'Friends need the online server (offline rivals shown).'}
              </span>
            </div>
          )
        )}

        {/* Live status strip (global + weekly tabs) */}
        {(board === 'global' || board === 'weekly') && (
          <div className="live-strip">
            {board === 'global' && live ? (
              <>
                <span className="live-badge"><Globe size={12} /> LIVE</span>
                <span className="faint" style={{ fontSize: 12 }}>
                  {formatNumber(live.total)} real player{live.total === 1 ? '' : 's'} · you’re #{live.rank}
                </span>
              </>
            ) : board === 'weekly' && weekly ? (
              <>
                <span className="live-badge"><Globe size={12} /> LEAGUE</span>
                <span className="faint truncate" style={{ fontSize: 12 }}>
                  {formatNumber(weekly.total)} player{weekly.total === 1 ? '' : 's'} · #{weekly.rank} · resets in {countdown(weekly.endsIn)}
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
        {useLive && !meInList && myRank > 0 && (
          <div className="rank-row me" style={{ marginTop: 8 }}>
            <span className="rank-num">{myRank}</span>
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

/** Format seconds-until-reset as a compact "2d 5h" / "5h 12m" / "8m" string. */
function countdown(seconds: number): string {
  if (seconds <= 0) return 'soon';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
