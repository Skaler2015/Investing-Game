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
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  Gauge as GaugeIcon,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { AssetCard } from '../components/game/AssetCard';
import { AssetSheet } from '../components/game/AssetSheet';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Sparkline } from '../components/ui/Sparkline';
import { Icon } from '../components/ui/Icon';
import { useGameStore } from '../store/gameStore';
import { resolveLevel } from '../data/levels';
import { getCareer } from '../data/careers';
import {
  computeNetWorth,
  computePortfolioStats,
} from '../engine/economy';
import { windowChangePct } from '../engine/market';
import {
  marketSentiment,
  economicCondition,
  portfolioRisk,
} from '../engine/insights';
import { bankEquity } from '../engine/banking';
import { creditLabel } from '../data/banking';
import type { Asset } from '../types';
import {
  formatCurrency,
  formatCurrencyFull,
  formatPct,
  relativeTime,
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
  const trades = useGameStore((s) => s.trades);
  const netWorthHistory = useGameStore((s) => s.netWorthHistory);
  const month = useGameStore((s) => s.month);
  const bank = useGameStore((s) => s.bank);

  const [selected, setSelected] = useState<Asset | null>(null);

  const stats = computePortfolioStats(holdings, assets);
  const bankNet = bankEquity(bank);
  const loanBalance = bank.loans.reduce((sum, l) => sum + l.balance, 0);
  const netWorth = computeNetWorth(player.cash, holdings, assets) + bankNet;
  const dailyPnl = netWorth - netWorthDayStart;
  const dailyPnlPct = netWorthDayStart > 0 ? (dailyPnl / netWorthDayStart) * 100 : 0;
  const level = resolveLevel(player.xp);
  const rewardAvailable = dailyRewardClaimedDay !== day;

  // Cash-flow (tycoon economy).
  const career = getCareer(player.careerId);
  const monthlyIncome = career?.salary ?? 0;
  const monthlyExpenses = career?.expenses ?? 0;
  const passiveIncome = Math.round(stats.dailyPassiveIncome);
  const monthlyNet = monthlyIncome + passiveIncome - monthlyExpenses;

  // Lifetime return (realised + unrealised P&L).
  const lifetimeReturn = player.realizedPnl + stats.unrealizedPnl;

  // Market pulse gauges.
  const sentiment = marketSentiment(assets, events);
  const condition = economicCondition(assets);
  const risk = portfolioRisk(holdings, assets);

  const growthData = netWorthHistory.map((p) => ({ t: p.month, price: p.value }));

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

        {/* Monthly cash flow (tycoon economy) */}
        <div className="glass-card cashflow-card">
          <div className="row between" style={{ marginBottom: 12 }}>
            <div className="row gap-8">
              {career ? <Icon name={career.icon} size={16} /> : <Briefcase size={16} />}
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                {career ? career.title : 'Monthly Cash Flow'}
              </span>
            </div>
            <button className="link-btn" onClick={() => setScreen('profile')}>
              Month {month}
            </button>
          </div>
          <div className="grid-2" style={{ gap: 10 }}>
            <FlowStat icon={<ArrowUpRight size={14} />} label="Salary" value={formatCurrency(monthlyIncome)} tone="up" />
            <FlowStat icon={<Coins size={14} />} label="Passive" value={formatCurrency(passiveIncome)} tone="up" />
            <FlowStat icon={<ArrowDownRight size={14} />} label="Expenses" value={formatCurrency(monthlyExpenses)} tone="down" />
            <FlowStat
              icon={monthlyNet >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              label="Net / month"
              value={formatCurrency(monthlyNet, { sign: true })}
              tone={monthlyNet >= 0 ? 'up' : 'down'}
              strong
            />
          </div>
        </div>

        {/* Net-worth growth chart */}
        {growthData.length >= 2 && (
          <div className="glass-card" style={{ marginTop: 12, padding: 16 }}>
            <div className="row between" style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Net Worth Growth</span>
              <span className={`pill ${lifetimeReturn >= 0 ? 'pill-up' : 'pill-down'}`}>
                Lifetime {formatCurrency(lifetimeReturn, { sign: true })}
              </span>
            </div>
            <Sparkline data={growthData} width={320} height={64} strokeWidth={2.5} />
          </div>
        )}

        {/* Market pulse: sentiment, economy, risk */}
        <div className="glass-card" style={{ marginTop: 12, padding: 16 }}>
          <div className="row gap-8" style={{ marginBottom: 12 }}>
            <GaugeIcon size={16} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>Market Pulse</span>
          </div>
          <div className="col" style={{ gap: 12 }}>
            <GaugeRow label="Market Sentiment" g={sentiment} />
            <GaugeRow label="Economic Condition" g={condition} />
            <GaugeRow label="Portfolio Risk" g={risk} />
          </div>
        </div>

        {/* Bank quick access */}
        <button className="glass-card bank-card" onClick={() => setScreen('bank')}>
          <div className="bank-card-ic">🏦</div>
          <div className="col" style={{ gap: 3, flex: 1, minWidth: 0, textAlign: 'left' }}>
            <span style={{ fontWeight: 800, fontSize: 14 }}>Bank</span>
            <span className="faint" style={{ fontSize: 11.5 }}>
              Savings {formatCurrency(bank.savings)}
              {loanBalance > 0 ? ` · Loans ${formatCurrency(loanBalance)}` : ''} · CIBIL{' '}
              {bank.creditScore} ({creditLabel(bank.creditScore)})
            </span>
          </div>
          <ChevronRight size={18} className="faint" />
        </button>

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

        {/* Recent transactions */}
        {trades.length > 0 && (
          <>
            <div className="section-title">
              <span>Recent Transactions</span>
              <button className="link-btn" onClick={() => setScreen('portfolio')}>
                View all
              </button>
            </div>
            <div className="col" style={{ gap: 8 }}>
              {trades.slice(0, 4).map((t) => (
                <div key={t.id} className="history-row">
                  <div className={`hist-badge ${t.side === 'buy' ? 'buy' : 'sell'}`}>
                    {t.side === 'buy' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                  </div>
                  <div className="col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }} className="truncate">
                      {t.side === 'buy' ? 'Bought' : 'Sold'} {t.assetName}
                    </span>
                    <span className="faint" style={{ fontSize: 11 }}>
                      {relativeTime(t.timestamp)}
                    </span>
                  </div>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 700 }}>
                    {formatCurrency(t.total)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <AssetSheet asset={selected} open={!!selected} onClose={() => setSelected(null)} />
    </>
  );
}

function FlowStat({
  icon,
  label,
  value,
  tone,
  strong,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'up' | 'down';
  strong?: boolean;
}) {
  return (
    <div className="flow-stat">
      <div className={`row gap-8 ${tone}`}>
        {icon}
        <span className="faint" style={{ fontSize: 11 }}>
          {label}
        </span>
      </div>
      <span
        className={`mono ${tone}`}
        style={{ fontWeight: strong ? 800 : 700, fontSize: strong ? 16 : 14 }}
      >
        {value}
      </span>
    </div>
  );
}

function GaugeRow({ label, g }: { label: string; g: { score: number; label: string; tone: string } }) {
  const color = g.tone === 'up' ? 'var(--up)' : g.tone === 'down' ? 'var(--down)' : 'var(--gold)';
  return (
    <div className="col" style={{ gap: 5 }}>
      <div className="row between">
        <span className="faint" style={{ fontSize: 12 }}>
          {label}
        </span>
        <span style={{ fontSize: 12, fontWeight: 800, color }}>{g.label}</span>
      </div>
      <div className="gauge-track">
        <div className="gauge-fill" style={{ width: `${g.score}%`, background: color }} />
      </div>
    </div>
  );
}
