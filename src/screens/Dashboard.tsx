import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Gift,
  ChevronRight,
  Newspaper,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { AssetCard } from '../components/game/AssetCard';
import { AssetSheet } from '../components/game/AssetSheet';
import { ProgressBar } from '../components/ui/ProgressBar';
import { useGameStore } from '../store/gameStore';
import { resolveLevel } from '../data/levels';
import {
  computeNetWorth,
  computePortfolioStats,
} from '../engine/economy';
import { windowChangePct } from '../engine/market';
import type { Asset } from '../types';
import {
  formatCurrency,
  formatCurrencyFull,
  formatPct,
} from '../utils/format';

export function Dashboard() {
  const player = useGameStore((s) => s.player);
  const assets = useGameStore((s) => s.assets);
  const holdings = useGameStore((s) => s.holdings);
  const events = useGameStore((s) => s.events);
  const leaderboard = useGameStore((s) => s.leaderboard);
  const netWorthDayStart = useGameStore((s) => s.netWorthDayStart);
  const dailyRewardClaimedDay = useGameStore((s) => s.dailyRewardClaimedDay);
  const day = useGameStore((s) => s.day);
  const claimDailyReward = useGameStore((s) => s.claimDailyReward);
  const setScreen = useGameStore((s) => s.setScreen);

  const [selected, setSelected] = useState<Asset | null>(null);

  const stats = computePortfolioStats(holdings, assets);
  const netWorth = computeNetWorth(player.cash, holdings, assets);
  const dailyPnl = netWorth - netWorthDayStart;
  const dailyPnlPct = netWorthDayStart > 0 ? (dailyPnl / netWorthDayStart) * 100 : 0;
  const level = resolveLevel(player.xp);
  const rewardAvailable = dailyRewardClaimedDay !== day;

  // Player rank among rivals.
  const ranked = [...leaderboard, { netWorth, isPlayer: true }].sort(
    (a, b) => b.netWorth - a.netWorth
  );
  const rank = ranked.findIndex((e) => 'isPlayer' in e && e.isPlayer) + 1;

  // Top movers by window change.
  const movers = [...assets]
    .sort((a, b) => Math.abs(windowChangePct(b)) - Math.abs(windowChangePct(a)))
    .slice(0, 4);

  const latestEvent = events[0];

  return (
    <>
      <Header title={`Hi, ${player.name.split(' ')[0]}`} />
      <div className="screen-scroll">
        {/* Net worth hero */}
        <motion.div
          className="hero-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="muted" style={{ fontSize: 13 }}>
            Total Net Worth
          </span>
          <div className="row gap-8" style={{ alignItems: 'baseline', marginTop: 4 }}>
            <span className="mono" style={{ fontSize: 32, fontWeight: 800 }}>
              {formatCurrencyFull(netWorth)}
            </span>
          </div>
          <div className="row gap-8" style={{ marginTop: 6 }}>
            <span className={`pill ${dailyPnl >= 0 ? 'pill-up' : 'pill-down'}`}>
              {dailyPnl >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {formatCurrency(dailyPnl, { sign: true })} ({formatPct(dailyPnlPct, { sign: true })})
            </span>
            <span className="faint" style={{ fontSize: 12 }}>
              today
            </span>
          </div>

          <div className="grid-2" style={{ marginTop: 16 }}>
            <div className="mini-stat">
              <div className="row gap-8">
                <Wallet size={15} className="muted" />
                <span className="faint" style={{ fontSize: 11 }}>
                  Cash
                </span>
              </div>
              <span className="mono" style={{ fontWeight: 700 }}>
                {formatCurrency(player.cash)}
              </span>
            </div>
            <div className="mini-stat">
              <div className="row gap-8">
                <Briefcase size={15} className="muted" />
                <span className="faint" style={{ fontSize: 11 }}>
                  Invested
                </span>
              </div>
              <span className="mono" style={{ fontWeight: 700 }}>
                {formatCurrency(stats.investedValue)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Level + rank strip */}
        <div className="grid-2" style={{ marginTop: 12 }}>
          <div className="card card-pad col" style={{ gap: 8 }}>
            <div className="row between">
              <span className="faint" style={{ fontSize: 11 }}>
                Level {level.level}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{level.title}</span>
            </div>
            <ProgressBar value={level.progress} />
            <span className="faint" style={{ fontSize: 10.5 }}>
              {level.isMax
                ? 'Max level reached'
                : `${level.xpIntoLevel} / ${level.xpForNextLevel} XP`}
            </span>
          </div>
          <div
            className="card card-pad col clickable"
            style={{ gap: 4, justifyContent: 'center' }}
            onClick={() => setScreen('leaderboard')}
          >
            <span className="faint" style={{ fontSize: 11 }}>
              Global Rank
            </span>
            <div className="row between">
              <span style={{ fontSize: 22, fontWeight: 800 }}>#{rank}</span>
              <ChevronRight size={16} className="faint" />
            </div>
          </div>
        </div>

        {/* Daily reward CTA */}
        {rewardAvailable && (
          <motion.button
            className="reward-cta"
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            onClick={claimDailyReward}
          >
            <div className="row gap-12">
              <div className="reward-ic">
                <Gift size={22} />
              </div>
              <div className="col" style={{ gap: 2, textAlign: 'left' }}>
                <span style={{ fontWeight: 800 }}>Daily Login Reward</span>
                <span className="muted" style={{ fontSize: 12 }}>
                  Day {player.loginStreak} streak · tap to claim
                </span>
              </div>
            </div>
            <ChevronRight size={18} />
          </motion.button>
        )}

        {/* Market news ticker */}
        {latestEvent && (
          <div className="news-ticker">
            <Newspaper size={15} style={{ flexShrink: 0 }} />
            <span className="truncate" style={{ fontSize: 12.5 }}>
              {latestEvent.headline}
            </span>
          </div>
        )}

        {/* Top movers */}
        <div className="section-title">
          <span>Top Movers</span>
          <button className="link-btn" onClick={() => setScreen('market')}>
            See all
          </button>
        </div>
        <div className="col" style={{ gap: 10 }}>
          {movers.map((a) => (
            <AssetCard key={a.id} asset={a} onClick={setSelected} />
          ))}
        </div>
      </div>

      <AssetSheet asset={selected} open={!!selected} onClose={() => setSelected(null)} />
    </>
  );
}
