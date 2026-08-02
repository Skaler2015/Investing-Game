import { create } from 'zustand';
import type {
  Asset,
  Holding,
  Trade,
  MarketEvent,
  Player,
  ThemeMode,
  ScreenId,
  Toast,
  LeaderboardEntry,
  AchievementContext,
} from '../types';
import { createInitialAssets, ASSET_CLASS_META } from '../data/assets';
import { selectDailyMissions } from '../data/missions';
import { ACHIEVEMENTS } from '../data/achievements';
import { buildRivalEntries } from '../data/leaderboard';
import {
  stepMarket,
  ageEvents,
  maybeSpawnEvent,
} from '../engine/market';
import {
  computeNetWorth,
  computePortfolioStats,
  findAsset,
} from '../engine/economy';
import { storage } from '../services/storage';
import { auth } from '../services/auth';
import { WEEKLY_CHALLENGES } from '../data/weekly';
import { dayKey, weekKey } from '../utils/format';
import { uid } from '../utils/id';
import {
  STARTING_CASH,
  XP_PER_TRADE,
  TRADE_HISTORY_LIMIT,
  DAILY_REWARD_BASE_COINS,
  DAILY_REWARD_BASE_XP,
  DAILY_REWARD_STREAK_CAP,
  STORAGE_SNAPSHOT_KEY,
} from './constants';

/** Per-day activity counters that drive daily missions. */
interface DailyCounters {
  buys: number;
  sells: number;
  trades: number;
  realizedProfit: number;
  classesInvested: string[];
}

interface Lifetime {
  trades: number;
  profitableTrades: number;
}

/** The serialisable slice of state we persist. */
interface GameSnapshot {
  player: Player;
  assets: Asset[];
  holdings: Holding[];
  trades: Trade[];
  events: MarketEvent[];
  tick: number;
  theme: ThemeMode;
  day: string;
  netWorthDayStart: number;
  dailyRewardClaimedDay: string | null;
  claimedMissions: string[];
  missionDefIds: string[];
  dailyCounters: DailyCounters;
  lifetime: Lifetime;
  leaderboard: LeaderboardEntry[];
  week: string;
  weeklyTrades: number;
  weeklyProfit: number;
  claimedWeekly: string[];
}

interface GameState extends GameSnapshot {
  currentScreen: ScreenId;
  toasts: Toast[];
  initialized: boolean;

  // lifecycle
  init: () => Promise<void>;
  advanceTick: () => void;
  save: () => void;
  resetGame: () => Promise<void>;

  // trading
  buy: (assetId: string, quantity: number) => { ok: boolean; message: string };
  sell: (assetId: string, quantity: number) => { ok: boolean; message: string };

  // progression
  claimMission: (defId: string) => void;
  claimDailyReward: () => void;
  claimWeekly: (id: string) => void;

  // ui
  setScreen: (screen: ScreenId) => void;
  toggleTheme: () => void;
  setPlayerName: (name: string) => void;
  pushToast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

function emptyDailyCounters(): DailyCounters {
  return { buys: 0, sells: 0, trades: 0, realizedProfit: 0, classesInvested: [] };
}

function colorForClass(assetClass: string): string {
  return ASSET_CLASS_META[assetClass as keyof typeof ASSET_CLASS_META]?.color ?? '#3b82f6';
}

function yesterdayKey(today: string): string {
  const d = new Date(today + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return dayKey(d);
}

function freshPlayer(name: string): Player {
  return {
    id: uid('player'),
    name,
    avatarSeed: uid('av'),
    cash: STARTING_CASH,
    coins: 0,
    xp: 0,
    realizedPnl: 0,
    createdAt: Date.now(),
    lastLoginDay: dayKey(),
    loginStreak: 1,
    unlockedAchievements: [],
    earnedBadges: [],
  };
}

function freshSnapshot(name: string): GameSnapshot {
  const assets = createInitialAssets();
  const today = dayKey();
  return {
    player: freshPlayer(name),
    assets,
    holdings: [],
    trades: [],
    events: [],
    tick: 0,
    theme: 'dark',
    day: today,
    netWorthDayStart: STARTING_CASH,
    dailyRewardClaimedDay: null,
    claimedMissions: [],
    missionDefIds: selectDailyMissions(today).map((m) => m.id),
    dailyCounters: emptyDailyCounters(),
    lifetime: { trades: 0, profitableTrades: 0 },
    leaderboard: buildRivalEntries(),
    week: weekKey(),
    weeklyTrades: 0,
    weeklyProfit: 0,
    claimedWeekly: [],
  };
}

/** Build the achievement context from current state. */
function achievementContext(s: GameState): AchievementContext {
  const netWorth = computeNetWorth(s.player.cash, s.holdings, s.assets);
  const classes = new Set(
    s.holdings
      .filter((h) => h.quantity > 0)
      .map((h) => findAsset(s.assets, h.assetId)?.assetClass)
      .filter(Boolean)
  );
  return {
    netWorth,
    totalTrades: s.lifetime.trades,
    profitableTrades: s.lifetime.profitableTrades,
    realizedPnl: s.player.realizedPnl,
    distinctClassesHeld: classes.size,
    hasAnyHolding: s.holdings.some((h) => h.quantity > 0),
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  ...freshSnapshot('Guest Investor'),
  currentScreen: 'dashboard',
  toasts: [],
  initialized: false,

  init: async () => {
    const user = await auth.signInAsGuest();
    const saved = await storage.get<GameSnapshot>(STORAGE_SNAPSHOT_KEY);
    let snap: GameSnapshot = saved ?? freshSnapshot(user.name);

    // Keep the player's display name in sync with the auth identity.
    snap = { ...snap, player: { ...snap.player, name: user.name } };

    const today = dayKey();
    if (snap.day !== today) {
      // Roll over to a new day: streak, missions, counters, P/L baseline.
      const wasYesterday = snap.player.lastLoginDay === yesterdayKey(today);
      const streak = wasYesterday ? snap.player.loginStreak + 1 : 1;
      const netWorth = computeNetWorth(snap.player.cash, snap.holdings, snap.assets);
      snap = {
        ...snap,
        day: today,
        netWorthDayStart: netWorth,
        missionDefIds: selectDailyMissions(today).map((m) => m.id),
        claimedMissions: [],
        dailyCounters: emptyDailyCounters(),
        dailyRewardClaimedDay: null,
        player: { ...snap.player, lastLoginDay: today, loginStreak: streak },
      };
    }

    const thisWeek = weekKey();
    if (snap.week !== thisWeek) {
      snap = {
        ...snap,
        week: thisWeek,
        weeklyTrades: 0,
        weeklyProfit: 0,
        claimedWeekly: [],
      };
    }

    set({ ...snap, initialized: true });
    get().save();
  },

  save: () => {
    const s = get();
    const snapshot: GameSnapshot = {
      player: s.player,
      assets: s.assets,
      holdings: s.holdings,
      trades: s.trades,
      events: s.events,
      tick: s.tick,
      theme: s.theme,
      day: s.day,
      netWorthDayStart: s.netWorthDayStart,
      dailyRewardClaimedDay: s.dailyRewardClaimedDay,
      claimedMissions: s.claimedMissions,
      missionDefIds: s.missionDefIds,
      dailyCounters: s.dailyCounters,
      lifetime: s.lifetime,
      leaderboard: s.leaderboard,
      week: s.week,
      weeklyTrades: s.weeklyTrades,
      weeklyProfit: s.weeklyProfit,
      claimedWeekly: s.claimedWeekly,
    };
    void storage.set(STORAGE_SNAPSHOT_KEY, snapshot);
  },

  advanceTick: () => {
    const s = get();
    const nextTick = s.tick + 1;

    let events = ageEvents(s.events);
    const spawned = maybeSpawnEvent(nextTick);
    if (spawned) {
      events = [spawned, ...events].slice(0, 6);
      get().pushToast({
        title: 'Market News',
        message: spawned.headline,
        kind: 'event',
      });
    }

    const assets = stepMarket(s.assets, nextTick, events);

    // Nudge rival net worths slightly so the leaderboard feels alive.
    const leaderboard = s.leaderboard.map((e) =>
      e.isPlayer
        ? e
        : { ...e, netWorth: Math.max(10000, e.netWorth * (1 + (Math.random() - 0.49) * 0.01)) }
    );

    set({ assets, events, tick: nextTick, leaderboard });

    // Re-evaluate achievements against the fresh prices.
    evaluateAchievements(get, set);

    // Persist roughly every ~8 ticks to limit write churn.
    if (nextTick % 8 === 0) get().save();
  },

  buy: (assetId, quantity) => {
    const s = get();
    const asset = findAsset(s.assets, assetId);
    if (!asset) return { ok: false, message: 'Asset not found' };
    if (quantity < asset.minQty) {
      return { ok: false, message: `Minimum quantity is ${asset.minQty}` };
    }
    const cost = asset.price * quantity;
    if (cost > s.player.cash) {
      return { ok: false, message: 'Not enough cash' };
    }

    const existing = s.holdings.find((h) => h.assetId === assetId);
    let holdings: Holding[];
    if (existing) {
      const totalQty = existing.quantity + quantity;
      const avgCost =
        (existing.avgCost * existing.quantity + asset.price * quantity) / totalQty;
      holdings = s.holdings.map((h) =>
        h.assetId === assetId ? { ...h, quantity: totalQty, avgCost } : h
      );
    } else {
      holdings = [...s.holdings, { assetId, quantity, avgCost: asset.price }];
    }

    const trade: Trade = {
      id: uid('trade'),
      assetId,
      assetName: asset.name,
      side: 'buy',
      quantity,
      price: asset.price,
      total: cost,
      realizedPnl: 0,
      timestamp: Date.now(),
    };

    const classesInvested = s.dailyCounters.classesInvested.includes(asset.assetClass)
      ? s.dailyCounters.classesInvested
      : [...s.dailyCounters.classesInvested, asset.assetClass];

    set({
      holdings,
      trades: [trade, ...s.trades].slice(0, TRADE_HISTORY_LIMIT),
      player: { ...s.player, cash: s.player.cash - cost, xp: s.player.xp + XP_PER_TRADE },
      dailyCounters: {
        ...s.dailyCounters,
        buys: s.dailyCounters.buys + 1,
        trades: s.dailyCounters.trades + 1,
        classesInvested,
      },
      lifetime: { ...s.lifetime, trades: s.lifetime.trades + 1 },
      weeklyTrades: s.weeklyTrades + 1,
    });

    get().pushToast({
      title: 'Bought',
      message: `${quantity} ${asset.symbol} for ₹${cost.toLocaleString('en-IN')}`,
      kind: 'success',
    });
    evaluateAchievements(get, set);
    get().save();
    return { ok: true, message: 'Order filled' };
  },

  sell: (assetId, quantity) => {
    const s = get();
    const asset = findAsset(s.assets, assetId);
    if (!asset) return { ok: false, message: 'Asset not found' };
    const holding = s.holdings.find((h) => h.assetId === assetId);
    if (!holding || holding.quantity <= 0) {
      return { ok: false, message: "You don't own this asset" };
    }
    if (quantity > holding.quantity) {
      return { ok: false, message: 'Not enough units to sell' };
    }

    const proceeds = asset.price * quantity;
    const realized = (asset.price - holding.avgCost) * quantity;
    const remaining = holding.quantity - quantity;
    const holdings =
      remaining > 0
        ? s.holdings.map((h) =>
            h.assetId === assetId ? { ...h, quantity: remaining } : h
          )
        : s.holdings.filter((h) => h.assetId !== assetId);

    const trade: Trade = {
      id: uid('trade'),
      assetId,
      assetName: asset.name,
      side: 'sell',
      quantity,
      price: asset.price,
      total: proceeds,
      realizedPnl: realized,
      timestamp: Date.now(),
    };

    const profitable = realized > 0;

    set({
      holdings,
      trades: [trade, ...s.trades].slice(0, TRADE_HISTORY_LIMIT),
      player: {
        ...s.player,
        cash: s.player.cash + proceeds,
        xp: s.player.xp + XP_PER_TRADE,
        realizedPnl: s.player.realizedPnl + realized,
      },
      dailyCounters: {
        ...s.dailyCounters,
        sells: s.dailyCounters.sells + 1,
        trades: s.dailyCounters.trades + 1,
        realizedProfit: s.dailyCounters.realizedProfit + Math.max(0, realized),
      },
      lifetime: {
        trades: s.lifetime.trades + 1,
        profitableTrades: s.lifetime.profitableTrades + (profitable ? 1 : 0),
      },
      weeklyTrades: s.weeklyTrades + 1,
      weeklyProfit: s.weeklyProfit + Math.max(0, realized),
    });

    get().pushToast({
      title: profitable ? 'Sold at a profit 🎉' : 'Sold',
      message: `${quantity} ${asset.symbol} · ${realized >= 0 ? '+' : ''}₹${Math.round(
        realized
      ).toLocaleString('en-IN')}`,
      kind: profitable ? 'success' : 'info',
    });
    evaluateAchievements(get, set);
    get().save();
    return { ok: true, message: 'Order filled' };
  },

  claimMission: (defId) => {
    const s = get();
    if (s.claimedMissions.includes(defId)) return;
    const view = getMissionViews(s).find((m) => m.def.id === defId);
    if (!view || !view.completed) return;

    const badges = view.def.rewardBadge
      ? Array.from(new Set([...s.player.earnedBadges, view.def.rewardBadge]))
      : s.player.earnedBadges;

    set({
      claimedMissions: [...s.claimedMissions, defId],
      player: {
        ...s.player,
        coins: s.player.coins + view.def.rewardCoins,
        xp: s.player.xp + view.def.rewardXp,
        earnedBadges: badges,
      },
    });
    get().pushToast({
      title: 'Mission Complete!',
      message: `+${view.def.rewardCoins} coins · +${view.def.rewardXp} XP`,
      kind: 'reward',
    });
    get().save();
  },

  claimDailyReward: () => {
    const s = get();
    if (s.dailyRewardClaimedDay === s.day) return;
    const streak = Math.min(s.player.loginStreak, DAILY_REWARD_STREAK_CAP);
    const coins = DAILY_REWARD_BASE_COINS * streak;
    const xp = DAILY_REWARD_BASE_XP * streak;
    set({
      dailyRewardClaimedDay: s.day,
      player: {
        ...s.player,
        coins: s.player.coins + coins,
        xp: s.player.xp + xp,
      },
    });
    get().pushToast({
      title: `Day ${s.player.loginStreak} Reward!`,
      message: `+${coins} coins · +${xp} XP`,
      kind: 'reward',
    });
    get().save();
  },

  claimWeekly: (id) => {
    const s = get();
    if (s.claimedWeekly.includes(id)) return;
    const def = WEEKLY_CHALLENGES.find((w) => w.id === id);
    if (!def) return;
    const progress = def.metric === 'trades' ? s.weeklyTrades : s.weeklyProfit;
    if (progress < def.target) return;
    set({
      claimedWeekly: [...s.claimedWeekly, id],
      player: {
        ...s.player,
        coins: s.player.coins + def.rewardCoins,
        xp: s.player.xp + def.rewardXp,
      },
    });
    get().pushToast({
      title: 'Weekly Challenge Complete!',
      message: `+${def.rewardCoins} coins · +${def.rewardXp} XP`,
      kind: 'reward',
    });
    get().save();
  },

  resetGame: async () => {
    await storage.remove(STORAGE_SNAPSHOT_KEY);
    const user = await auth.getCurrentUser();
    const snap = freshSnapshot(user?.name ?? 'Guest Investor');
    set({ ...snap, currentScreen: 'dashboard', toasts: [], initialized: true });
    get().save();
    get().pushToast({ title: 'New game started', kind: 'info' });
  },

  setScreen: (screen) => set({ currentScreen: screen }),

  toggleTheme: () => {
    set({ theme: get().theme === 'dark' ? 'light' : 'dark' });
    get().save();
  },

  setPlayerName: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    void auth.updateName(trimmed);
    set({ player: { ...get().player, name: trimmed } });
    get().save();
  },

  pushToast: (t) => {
    const toast: Toast = { ...t, id: uid('toast') };
    set({ toasts: [...get().toasts, toast] });
    // Auto-dismiss after 4s.
    setTimeout(() => get().dismissToast(toast.id), 4000);
  },

  dismissToast: (id) =>
    set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

/**
 * Evaluate achievement predicates, unlocking any newly-earned ones and
 * granting their rewards. Kept outside the store object so both tick() and
 * trade actions can call it.
 */
function evaluateAchievements(
  get: () => GameState,
  set: (partial: Partial<GameState>) => void
) {
  const s = get();
  const ctx = achievementContext(s);
  const newlyUnlocked = ACHIEVEMENTS.filter(
    (a) => !s.player.unlockedAchievements.includes(a.id) && a.check(ctx)
  );
  if (newlyUnlocked.length === 0) return;

  let coins = 0;
  let xp = 0;
  const badges = [...s.player.earnedBadges];
  for (const a of newlyUnlocked) {
    coins += a.rewardCoins;
    xp += a.rewardXp;
    s.pushToast({
      title: `🏆 Achievement: ${a.title}`,
      message: `+${a.rewardCoins} coins · +${a.rewardXp} XP`,
      kind: 'reward',
    });
  }

  set({
    player: {
      ...s.player,
      coins: s.player.coins + coins,
      xp: s.player.xp + xp,
      unlockedAchievements: [
        ...s.player.unlockedAchievements,
        ...newlyUnlocked.map((a) => a.id),
      ],
      earnedBadges: badges,
    },
  });
}

// ── Mission view helper (progress computed from live counters) ────────────

export interface MissionView {
  def: import('../types').MissionDef;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
}

export function getMissionViews(s: GameState): MissionView[] {
  const netWorth = computeNetWorth(s.player.cash, s.holdings, s.assets);
  const defs = selectDailyMissions(s.day).filter((d) => s.missionDefIds.includes(d.id));
  return defs.map((def) => {
    let progress = 0;
    switch (def.type) {
      case 'buy_count':
        progress = s.dailyCounters.buys;
        break;
      case 'sell_count':
        progress = s.dailyCounters.sells;
        break;
      case 'trade_count':
        progress = s.dailyCounters.trades;
        break;
      case 'profit_amount':
        progress = s.dailyCounters.realizedProfit;
        break;
      case 'invest_class':
        progress = s.dailyCounters.classesInvested.includes(def.assetClass ?? '')
          ? 1
          : 0;
        break;
      case 'net_worth':
        progress = netWorth;
        break;
    }
    const completed = progress >= def.target;
    return {
      def,
      progress: Math.min(progress, def.target),
      target: def.target,
      completed,
      claimed: s.claimedMissions.includes(def.id),
    };
  });
}

// Re-export for convenience.
export { computePortfolioStats, computeNetWorth, colorForClass };
