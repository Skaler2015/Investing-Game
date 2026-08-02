import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Lock, Gift, Flame, CalendarCheck, Award, Coins, Zap } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Icon } from '../components/ui/Icon';
import { useGameStore, getMissionViews } from '../store/gameStore';
import { ACHIEVEMENTS, TIER_COLOR } from '../data/achievements';
import { WEEKLY_CHALLENGES } from '../data/weekly';
import { DAILY_REWARD_BASE_COINS, DAILY_REWARD_STREAK_CAP } from '../store/constants';
import { formatCompactNumber, formatCurrency } from '../utils/format';

type Tab = 'missions' | 'rewards' | 'achievements';

export function Quests() {
  const [tab, setTab] = useState<Tab>('missions');

  return (
    <>
      <Header title="Quests" subtitle="Missions, rewards & achievements" />
      <div className="screen-scroll">
        <div className="seg-tabs" style={{ marginTop: 4 }}>
          {(['missions', 'rewards', 'achievements'] as Tab[]).map((t) => (
            <button
              key={t}
              className={`seg-tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'missions' && <MissionsPanel />}
        {tab === 'rewards' && <RewardsPanel />}
        {tab === 'achievements' && <AchievementsPanel />}
      </div>
    </>
  );
}

function MissionsPanel() {
  const views = useGameStore(getMissionViews);
  const claim = useGameStore((s) => s.claimMission);

  return (
    <div className="col" style={{ gap: 12, marginTop: 16 }}>
      <p className="faint" style={{ fontSize: 12, margin: '0 4px' }}>
        Daily missions refresh every day. Complete them for coins, XP and badges.
      </p>
      {views.map((v) => (
        <div key={v.def.id} className="card card-pad col" style={{ gap: 10 }}>
          <div className="row between">
            <div className="col" style={{ gap: 2 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{v.def.title}</span>
              <span className="faint" style={{ fontSize: 12 }}>
                {v.def.description}
              </span>
            </div>
            <div className="reward-tag">
              <Coins size={12} /> {v.def.rewardCoins}
              <Zap size={12} style={{ marginLeft: 6 }} /> {v.def.rewardXp}
            </div>
          </div>
          <ProgressBar value={v.target > 0 ? v.progress / v.target : 0} />
          <div className="row between">
            <span className="faint mono" style={{ fontSize: 11 }}>
              {v.def.type === 'profit_amount' || v.def.type === 'net_worth'
                ? `${formatCurrency(v.progress)} / ${formatCurrency(v.target)}`
                : `${v.progress} / ${v.target}`}
            </span>
            {v.claimed ? (
              <span className="pill pill-up">
                <Check size={12} /> Claimed
              </span>
            ) : v.completed ? (
              <button className="claim-btn" onClick={() => claim(v.def.id)}>
                Claim
              </button>
            ) : (
              <span className="faint" style={{ fontSize: 11 }}>
                In progress
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RewardsPanel() {
  const player = useGameStore((s) => s.player);
  const day = useGameStore((s) => s.day);
  const dailyRewardClaimedDay = useGameStore((s) => s.dailyRewardClaimedDay);
  const claimDaily = useGameStore((s) => s.claimDailyReward);
  const weeklyTrades = useGameStore((s) => s.weeklyTrades);
  const weeklyProfit = useGameStore((s) => s.weeklyProfit);
  const claimedWeekly = useGameStore((s) => s.claimedWeekly);
  const claimWeekly = useGameStore((s) => s.claimWeekly);

  const rewardAvailable = dailyRewardClaimedDay !== day;
  const streakDay = ((player.loginStreak - 1) % DAILY_REWARD_STREAK_CAP) + 1;

  return (
    <div className="col" style={{ gap: 14, marginTop: 16 }}>
      {/* Daily login */}
      <div className="card card-pad col" style={{ gap: 12 }}>
        <div className="row between">
          <div className="row gap-8">
            <CalendarCheck size={18} className="muted" />
            <span style={{ fontWeight: 800, fontSize: 15 }}>Daily Login Reward</span>
          </div>
          <span className="pill" style={{ background: 'rgba(245,158,11,0.14)', color: 'var(--gold)' }}>
            <Flame size={12} /> {player.loginStreak} day
          </span>
        </div>
        <div className="streak-row">
          {Array.from({ length: DAILY_REWARD_STREAK_CAP }, (_, i) => {
            const dayNo = i + 1;
            const reached = dayNo <= streakDay;
            return (
              <div key={i} className={`streak-cell ${reached ? 'on' : ''}`}>
                <Gift size={15} />
                <span>{DAILY_REWARD_BASE_COINS * dayNo}</span>
              </div>
            );
          })}
        </div>
        <button className="btn btn-primary btn-block" onClick={claimDaily} disabled={!rewardAvailable}>
          {rewardAvailable ? 'Claim Today’s Reward' : 'Claimed — come back tomorrow'}
        </button>
      </div>

      {/* Weekly challenges */}
      <div className="section-title" style={{ margin: '4px 4px 0' }}>
        <span>Weekly Challenges</span>
      </div>
      {WEEKLY_CHALLENGES.map((w) => {
        const progress = w.metric === 'trades' ? weeklyTrades : weeklyProfit;
        const pct = Math.min(1, progress / w.target);
        const done = progress >= w.target;
        const claimed = claimedWeekly.includes(w.id);
        return (
          <div key={w.id} className="card card-pad col" style={{ gap: 10 }}>
            <div className="row between">
              <div className="col" style={{ gap: 2 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{w.title}</span>
                <span className="faint" style={{ fontSize: 12 }}>
                  {w.description}
                </span>
              </div>
              <div className="reward-tag">
                <Coins size={12} /> {w.rewardCoins}
              </div>
            </div>
            <ProgressBar value={pct} gradient="linear-gradient(90deg, var(--gold), #f97316)" />
            <div className="row between">
              <span className="faint mono" style={{ fontSize: 11 }}>
                {w.metric === 'profit'
                  ? `${formatCurrency(Math.min(progress, w.target))} / ${formatCurrency(w.target)}`
                  : `${Math.min(progress, w.target)} / ${w.target}`}
              </span>
              {claimed ? (
                <span className="pill pill-up">
                  <Check size={12} /> Claimed
                </span>
              ) : done ? (
                <button className="claim-btn" onClick={() => claimWeekly(w.id)}>
                  Claim
                </button>
              ) : (
                <span className="faint" style={{ fontSize: 11 }}>
                  {formatCompactNumber(w.target - progress > 0 ? w.target - progress : 0)} to go
                </span>
              )}
            </div>
          </div>
        );
      })}

      <div className="info-note" style={{ marginTop: 4 }}>
        🎉 Event bonuses arrive with special market events — keep an eye on the news ticker!
      </div>
    </div>
  );
}

function AchievementsPanel() {
  const unlocked = useGameStore((s) => s.player.unlockedAchievements);
  const earned = ACHIEVEMENTS.filter((a) => unlocked.includes(a.id)).length;
  // Unlocked first, then by tier weight, so progress feels rewarding.
  const order = ['Legendary', 'Diamond', 'Gold', 'Silver', 'Bronze'];
  const sorted = [...ACHIEVEMENTS].sort((a, b) => {
    const ua = unlocked.includes(a.id) ? 0 : 1;
    const ub = unlocked.includes(b.id) ? 0 : 1;
    if (ua !== ub) return ua - ub;
    return order.indexOf(a.tier) - order.indexOf(b.tier);
  });

  return (
    <div className="col" style={{ gap: 10, marginTop: 16 }}>
      <div className="row between" style={{ margin: '0 4px' }}>
        <span className="faint" style={{ fontSize: 12 }}>
          {earned} of {ACHIEVEMENTS.length} unlocked across 5 tiers.
        </span>
        <span className="pill pill-up">
          <Award size={12} /> {earned}/{ACHIEVEMENTS.length}
        </span>
      </div>
      {sorted.map((a) => {
        const isUnlocked = unlocked.includes(a.id);
        const color = TIER_COLOR[a.tier];
        return (
          <motion.div
            key={a.id}
            className={`card card-pad row gap-12 ${isUnlocked ? 'ach-on' : 'ach-off'}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div
              className="ach-ic"
              style={isUnlocked ? { color, background: `${color}22` } : undefined}
            >
              {isUnlocked ? <Icon name={a.icon} size={22} /> : <Lock size={20} />}
            </div>
            <div className="col" style={{ gap: 3, flex: 1, minWidth: 0 }}>
              <div className="row gap-8">
                <span style={{ fontWeight: 700, fontSize: 14 }} className="truncate">{a.title}</span>
                <span
                  className="tier-chip"
                  style={{ color, background: `${color}1f`, borderColor: `${color}55` }}
                >
                  {a.tier}
                </span>
              </div>
              <span className="faint" style={{ fontSize: 12 }}>{a.description}</span>
            </div>
            <div className="reward-tag">
              <Coins size={12} /> {a.rewardCoins}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
