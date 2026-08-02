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
  LedgerEntry,
  NetWorthPoint,
  BankState,
  LoanType,
  Business,
  Property,
  SIP,
  EconomyState,
  NewsItem,
} from '../types';
import { createInitialAssets, ASSET_CLASS_META } from '../data/assets';
import { getCareer } from '../data/careers';
import { maybeLifeEvent } from '../data/lifeEvents';
import { CREDIT, FD_PRODUCTS, loanProduct } from '../data/banking';
import { getBusinessDef } from '../data/businesses';
import { getPropertyDef } from '../data/realEstate';
import {
  emiFor,
  bankEquity,
  loanEligibility,
  processBankMonth,
} from '../engine/banking';
import {
  businessEconomyFactor,
  businessProfit,
  businessValue,
  businessesEquity,
  upgradeCost,
} from '../engine/business';
import {
  propertyMonthlyNet,
  appreciate,
  propertiesEquity,
  realEstateEconomyFactor,
} from '../engine/realEstate';
import { freshEconomy, PHASES } from '../data/macro';
import { stepEconomy, economyDrift, economyVol, categoryFor } from '../engine/macro';
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
import { auth, type AuthUser } from '../services/auth';
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
  TICKS_PER_MONTH,
  NET_WORTH_HISTORY_LIMIT,
  XP_PER_MONTH,
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
  /** In-game month counter (advances every TICKS_PER_MONTH). */
  month: number;
  /** Monthly net-worth samples for the growth chart. */
  netWorthHistory: NetWorthPoint[];
  /** Recent cash-flow ledger (salary / expenses / passive / events). */
  ledger: LedgerEntry[];
  /** Banking position: savings, deposits, loans, credit score. */
  bank: BankState;
  /** Owned businesses (tycoon layer). */
  businesses: Business[];
  /** Owned real-estate properties. */
  properties: Property[];
  /** Active systematic investment plans (auto-invest monthly). */
  sips: SIP[];
  /** Macro economic backdrop. */
  economy: EconomyState;
  /** Rolling news feed. */
  news: NewsItem[];
}

interface GameState extends GameSnapshot {
  currentScreen: ScreenId;
  toasts: Toast[];
  initialized: boolean;
  authUser: AuthUser | null;
  authChecked: boolean;

  // lifecycle
  init: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ ok: boolean; message: string }>;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; message: string }>;
  signOut: () => Promise<void>;
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

  // life / career
  setCareer: (careerId: string) => void;

  // banking
  depositSavings: (amount: number) => { ok: boolean; message: string };
  withdrawSavings: (amount: number) => { ok: boolean; message: string };
  openFD: (amount: number, termMonths: number) => { ok: boolean; message: string };
  takeLoan: (type: LoanType, amount: number, termMonths: number) => { ok: boolean; message: string };
  repayLoan: (loanId: string) => { ok: boolean; message: string };

  // businesses
  buyBusiness: (defId: string) => { ok: boolean; message: string };
  upgradeBusiness: (id: string) => { ok: boolean; message: string };
  toggleMarketing: (id: string) => void;
  sellBusiness: (id: string) => { ok: boolean; message: string };

  // real estate
  buyProperty: (defId: string) => { ok: boolean; message: string };
  togglePropertyRent: (id: string) => void;
  sellProperty: (id: string) => { ok: boolean; message: string };

  // SIP (systematic investment plan)
  addSIP: (assetId: string, amount: number) => { ok: boolean; message: string };
  cancelSIP: (id: string) => void;

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
    careerId: null,
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
    month: 0,
    netWorthHistory: [{ month: 0, value: STARTING_CASH }],
    ledger: [],
    bank: freshBank(),
    businesses: [],
    properties: [],
    sips: [],
    economy: freshEconomy(),
    news: [],
  };
}

/** Merge a buy into the holdings list, updating weighted-average cost. */
function mergeHolding(holdings: Holding[], assetId: string, qty: number, price: number): Holding[] {
  const existing = holdings.find((h) => h.assetId === assetId);
  if (existing) {
    const totalQty = existing.quantity + qty;
    const avgCost = (existing.avgCost * existing.quantity + price * qty) / totalQty;
    return holdings.map((h) => (h.assetId === assetId ? { ...h, quantity: totalQty, avgCost } : h));
  }
  return [...holdings, { assetId, quantity: qty, avgCost: price }];
}

function freshBank(): BankState {
  return { savings: 0, deposits: [], loans: [], creditScore: CREDIT.start };
}

/** Backfill fields missing from snapshots saved by earlier versions. */
function migrateSnapshot(snap: GameSnapshot): GameSnapshot {
  return {
    ...snap,
    month: snap.month ?? 0,
    netWorthHistory:
      snap.netWorthHistory && snap.netWorthHistory.length > 0
        ? snap.netWorthHistory
        : [{ month: 0, value: computeNetWorth(snap.player.cash, snap.holdings, snap.assets) }],
    ledger: snap.ledger ?? [],
    bank: snap.bank ?? freshBank(),
    businesses: snap.businesses ?? [],
    properties: snap.properties ?? [],
    sips: snap.sips ?? [],
    economy: snap.economy ?? freshEconomy(),
    news: snap.news ?? [],
    player: { ...snap.player, careerId: snap.player.careerId ?? null },
  };
}

/** Per-account snapshot storage key. */
function snapshotKey(userId: string): string {
  return `${STORAGE_SNAPSHOT_KEY}:${userId}`;
}

/** Apply day/week rollovers (login streak, daily missions, weekly reset). */
function applyRollovers(input: GameSnapshot): GameSnapshot {
  let snap = input;
  const today = dayKey();
  if (snap.day !== today) {
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
    snap = { ...snap, week: thisWeek, weeklyTrades: 0, weeklyProfit: 0, claimedWeekly: [] };
  }
  return snap;
}

type SetFn = (partial: Partial<GameState>) => void;
type GetFn = () => GameState;

/** Load (or create) the signed-in user's game and make it active. */
async function loadGameForUser(user: AuthUser, set: SetFn, get: GetFn) {
  const saved = await storage.get<GameSnapshot>(snapshotKey(user.id));
  let snap: GameSnapshot = saved ? migrateSnapshot(saved) : freshSnapshot(user.name);
  snap = { ...snap, player: { ...snap.player, name: user.name } };
  snap = applyRollovers(snap);
  set({ ...snap, authUser: user, currentScreen: 'dashboard', toasts: [], initialized: true });
  get().save();
}

/** Build the achievement context from current state. */
function achievementContext(s: GameState): AchievementContext {
  const netWorth =
    computeNetWorth(s.player.cash, s.holdings, s.assets) +
    bankEquity(s.bank) +
    businessesEquity(s.businesses) +
    propertiesEquity(s.properties);
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
  ...freshSnapshot('Investor'),
  currentScreen: 'dashboard',
  toasts: [],
  initialized: false,
  authUser: null,
  authChecked: false,

  init: async () => {
    const user = await auth.getCurrentUser();
    set({ authUser: user, authChecked: true });
    if (user) {
      await loadGameForUser(user, set, get);
    }
  },

  signUp: async (email, password) => {
    const res = await auth.signUp(email, password);
    if (res.ok && res.user) await loadGameForUser(res.user, set, get);
    return { ok: res.ok, message: res.message };
  },

  signIn: async (email, password) => {
    const res = await auth.signIn(email, password);
    if (res.ok && res.user) await loadGameForUser(res.user, set, get);
    return { ok: res.ok, message: res.message };
  },

  signOut: async () => {
    get().save();
    await auth.signOut();
    set({
      ...freshSnapshot('Investor'),
      authUser: null,
      authChecked: true,
      initialized: false,
      currentScreen: 'dashboard',
      toasts: [],
    });
  },

  save: () => {
    const s = get();
    if (!s.authUser) return;
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
      month: s.month,
      netWorthHistory: s.netWorthHistory,
      ledger: s.ledger,
      bank: s.bank,
      businesses: s.businesses,
      properties: s.properties,
      sips: s.sips,
      economy: s.economy,
      news: s.news,
    };
    void storage.set(snapshotKey(s.authUser.id), snapshot);
  },

  advanceTick: () => {
    const s = get();
    const nextTick = s.tick + 1;

    let events = ageEvents(s.events);
    let news = s.news;
    const spawned = maybeSpawnEvent(nextTick);
    if (spawned) {
      events = [spawned, ...events].slice(0, 6);
      const item: NewsItem = {
        id: uid('news'),
        headline: spawned.headline,
        category: categoryFor(spawned),
        sentiment: spawned.sentiment,
        month: s.month,
        timestamp: Date.now(),
      };
      news = [item, ...s.news].slice(0, 40);
      get().pushToast({
        title: 'Market News',
        message: spawned.headline,
        kind: 'event',
      });
    }

    const macro = { drift: economyDrift(s.economy), volMult: economyVol(s.economy) };
    const assets = stepMarket(s.assets, nextTick, events, macro);

    // Nudge rival net worths slightly so the leaderboard feels alive.
    const leaderboard = s.leaderboard.map((e) =>
      e.isPlayer
        ? e
        : { ...e, netWorth: Math.max(10000, e.netWorth * (1 + (Math.random() - 0.49) * 0.01)) }
    );

    set({ assets, events, news, tick: nextTick, leaderboard });

    // Monthly cash-flow cycle: salary, passive income, living costs, events.
    if (nextTick % TICKS_PER_MONTH === 0) {
      advanceMonth(get, set);
    }

    // Re-evaluate achievements against the fresh prices.
    evaluateAchievements(get, set);

    // Persist roughly every ~8 ticks to limit write churn.
    if (nextTick % 8 === 0) get().save();
  },

  setCareer: (careerId) => {
    const career = getCareer(careerId);
    if (!career) return;
    set({ player: { ...get().player, careerId } });
    get().pushToast({
      title: `Career: ${career.title}`,
      message: `Salary ₹${career.salary.toLocaleString('en-IN')}/mo`,
      kind: 'success',
    });
    get().save();
  },

  depositSavings: (amount) => {
    const s = get();
    amount = Math.floor(amount);
    if (amount <= 0) return { ok: false, message: 'Enter an amount' };
    if (amount > s.player.cash) return { ok: false, message: 'Not enough cash' };
    set({
      player: { ...s.player, cash: s.player.cash - amount },
      bank: { ...s.bank, savings: s.bank.savings + amount },
    });
    get().save();
    return { ok: true, message: 'Deposited to savings' };
  },

  withdrawSavings: (amount) => {
    const s = get();
    amount = Math.floor(amount);
    if (amount <= 0) return { ok: false, message: 'Enter an amount' };
    if (amount > s.bank.savings) return { ok: false, message: 'Not enough in savings' };
    set({
      player: { ...s.player, cash: s.player.cash + amount },
      bank: { ...s.bank, savings: s.bank.savings - amount },
    });
    get().save();
    return { ok: true, message: 'Withdrawn to cash' };
  },

  openFD: (amount, termMonths) => {
    const s = get();
    amount = Math.floor(amount);
    const product = FD_PRODUCTS.find((p) => p.termMonths === termMonths);
    if (!product) return { ok: false, message: 'Invalid tenure' };
    if (amount < 1000) return { ok: false, message: 'Minimum FD is ₹1,000' };
    if (amount > s.player.cash) return { ok: false, message: 'Not enough cash' };
    const fd = {
      id: uid('fd'),
      principal: amount,
      rate: product.rate,
      termMonths,
      startMonth: s.month,
      maturityMonth: s.month + termMonths,
    };
    set({
      player: { ...s.player, cash: s.player.cash - amount },
      bank: { ...s.bank, deposits: [...s.bank.deposits, fd] },
    });
    get().pushToast({
      title: 'Fixed Deposit opened',
      message: `₹${amount.toLocaleString('en-IN')} @ ${(product.rate * 100).toFixed(1)}% for ${product.label}`,
      kind: 'success',
    });
    get().save();
    return { ok: true, message: 'FD created' };
  },

  takeLoan: (type, amount, termMonths) => {
    const s = get();
    amount = Math.floor(amount);
    const product = loanProduct(type);
    const salary = getCareer(s.player.careerId)?.salary ?? 0;
    const elig = loanEligibility(type, salary, s.bank.creditScore, s.bank);
    if (!elig.eligible) return { ok: false, message: elig.reason ?? 'Not eligible' };
    if (amount < 1000) return { ok: false, message: 'Minimum loan is ₹1,000' };
    if (amount > elig.maxAmount) {
      return { ok: false, message: `Max eligible: ₹${elig.maxAmount.toLocaleString('en-IN')}` };
    }
    const emi = emiFor(amount, product.rate, termMonths);
    const loan = {
      id: uid('loan'),
      type,
      principal: amount,
      balance: amount,
      rate: product.rate,
      emi,
      termMonths,
      remainingMonths: termMonths,
      startMonth: s.month,
      missedPayments: 0,
    };
    set({
      player: { ...s.player, cash: s.player.cash + amount },
      bank: { ...s.bank, loans: [...s.bank.loans, loan] },
    });
    get().pushToast({
      title: `${product.title} approved`,
      message: `+₹${amount.toLocaleString('en-IN')} · EMI ₹${emi.toLocaleString('en-IN')}/mo`,
      kind: 'reward',
    });
    get().save();
    return { ok: true, message: 'Loan disbursed' };
  },

  repayLoan: (loanId) => {
    const s = get();
    const loan = s.bank.loans.find((l) => l.id === loanId);
    if (!loan) return { ok: false, message: 'Loan not found' };
    if (loan.balance > s.player.cash) return { ok: false, message: 'Not enough cash to close' };
    set({
      player: { ...s.player, cash: s.player.cash - loan.balance },
      bank: {
        ...s.bank,
        loans: s.bank.loans.filter((l) => l.id !== loanId),
        creditScore: Math.min(CREDIT.max, s.bank.creditScore + CREDIT.goodEventBonus),
      },
    });
    get().pushToast({ title: 'Loan closed early 🎉', message: `${loan.type} fully repaid`, kind: 'success' });
    get().save();
    return { ok: true, message: 'Loan repaid' };
  },

  buyBusiness: (defId) => {
    const s = get();
    const def = getBusinessDef(defId);
    if (!def) return { ok: false, message: 'Business not found' };
    if (def.cost > s.player.cash) return { ok: false, message: 'Not enough cash' };
    const biz: Business = {
      id: uid('biz'),
      defId,
      level: 1,
      marketing: false,
      purchasedMonth: s.month,
    };
    set({
      player: { ...s.player, cash: s.player.cash - def.cost },
      businesses: [...s.businesses, biz],
    });
    get().pushToast({ title: `Acquired ${def.name}! 🏢`, message: `−${def.cost.toLocaleString('en-IN')} · earns monthly`, kind: 'success' });
    evaluateAchievements(get, set);
    get().save();
    return { ok: true, message: 'Business acquired' };
  },

  upgradeBusiness: (id) => {
    const s = get();
    const biz = s.businesses.find((b) => b.id === id);
    const def = biz && getBusinessDef(biz.defId);
    if (!biz || !def) return { ok: false, message: 'Business not found' };
    if (biz.level >= def.maxLevel) return { ok: false, message: 'Already at max level' };
    const cost = upgradeCost(def, biz.level);
    if (cost > s.player.cash) return { ok: false, message: 'Not enough cash' };
    set({
      player: { ...s.player, cash: s.player.cash - cost },
      businesses: s.businesses.map((b) => (b.id === id ? { ...b, level: b.level + 1 } : b)),
    });
    get().pushToast({ title: `${def.name} upgraded to Lv ${biz.level + 1}`, message: `−${cost.toLocaleString('en-IN')} · higher profit`, kind: 'success' });
    get().save();
    return { ok: true, message: 'Upgraded' };
  },

  toggleMarketing: (id) => {
    const s = get();
    set({
      businesses: s.businesses.map((b) => (b.id === id ? { ...b, marketing: !b.marketing } : b)),
    });
    get().save();
  },

  sellBusiness: (id) => {
    const s = get();
    const biz = s.businesses.find((b) => b.id === id);
    const def = biz && getBusinessDef(biz.defId);
    if (!biz || !def) return { ok: false, message: 'Business not found' };
    const proceeds = Math.round(businessValue(def, biz) * 0.85);
    set({
      player: { ...s.player, cash: s.player.cash + proceeds },
      businesses: s.businesses.filter((b) => b.id !== id),
    });
    get().pushToast({ title: `Sold ${def.name}`, message: `+${proceeds.toLocaleString('en-IN')} (85% of value)`, kind: 'info' });
    get().save();
    return { ok: true, message: 'Business sold' };
  },

  buyProperty: (defId) => {
    const s = get();
    const def = getPropertyDef(defId);
    if (!def) return { ok: false, message: 'Property not found' };
    if (def.price > s.player.cash) return { ok: false, message: 'Not enough cash' };
    const prop: Property = {
      id: uid('prop'),
      defId,
      purchaseMonth: s.month,
      purchasePrice: def.price,
      currentValue: def.price,
      rented: true,
    };
    set({
      player: { ...s.player, cash: s.player.cash - def.price },
      properties: [...s.properties, prop],
    });
    get().pushToast({ title: `Bought ${def.name} 🏠`, message: `−${def.price.toLocaleString('en-IN')} · earns rent`, kind: 'success' });
    evaluateAchievements(get, set);
    get().save();
    return { ok: true, message: 'Property acquired' };
  },

  togglePropertyRent: (id) => {
    const s = get();
    set({
      properties: s.properties.map((p) => (p.id === id ? { ...p, rented: !p.rented } : p)),
    });
    get().save();
  },

  sellProperty: (id) => {
    const s = get();
    const prop = s.properties.find((p) => p.id === id);
    const def = prop && getPropertyDef(prop.defId);
    if (!prop || !def) return { ok: false, message: 'Property not found' };
    // Selling costs ~2% in fees.
    const proceeds = Math.round(prop.currentValue * 0.98);
    const gain = proceeds - prop.purchasePrice;
    set({
      player: { ...s.player, cash: s.player.cash + proceeds },
      properties: s.properties.filter((p) => p.id !== id),
    });
    get().pushToast({
      title: `Sold ${def.name}`,
      message: `+${proceeds.toLocaleString('en-IN')} · ${gain >= 0 ? 'gain' : 'loss'} ${gain >= 0 ? '+' : ''}${gain.toLocaleString('en-IN')}`,
      kind: gain >= 0 ? 'success' : 'info',
    });
    get().save();
    return { ok: true, message: 'Property sold' };
  },

  addSIP: (assetId, amount) => {
    const s = get();
    amount = Math.floor(amount);
    const asset = findAsset(s.assets, assetId);
    if (!asset) return { ok: false, message: 'Asset not found' };
    if (amount < 500) return { ok: false, message: 'Minimum SIP is ₹500/month' };
    const existing = s.sips.find((p) => p.assetId === assetId);
    if (existing) {
      set({ sips: s.sips.map((p) => (p.assetId === assetId ? { ...p, amount } : p)) });
    } else {
      set({ sips: [...s.sips, { id: uid('sip'), assetId, amount, createdMonth: s.month }] });
    }
    get().pushToast({
      title: 'SIP set up 📅',
      message: `₹${amount.toLocaleString('en-IN')}/month into ${asset.symbol}`,
      kind: 'success',
    });
    get().save();
    return { ok: true, message: 'SIP active' };
  },

  cancelSIP: (id) => {
    set({ sips: get().sips.filter((p) => p.id !== id) });
    get().save();
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
    const user = get().authUser;
    if (!user) return;
    await storage.remove(snapshotKey(user.id));
    const snap = freshSnapshot(user.name);
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
 * Advance one in-game month: pay salary + passive income, deduct living
 * expenses, roll an optional life event, and record a net-worth sample. This
 * is the tycoon cash-flow heartbeat; businesses/real-estate/taxes will layer
 * additional entries onto the same monthly ledger.
 */
function advanceMonth(get: GetFn, set: SetFn) {
  const s = get();
  const month = s.month + 1;
  const career = getCareer(s.player.careerId);
  const salary = career?.salary ?? 0;
  const expenses = career?.expenses ?? 0;
  const passive = Math.round(computePortfolioStats(s.holdings, s.assets).dailyPassiveIncome);
  const now = Date.now();

  const entries: LedgerEntry[] = [];
  if (salary) entries.push({ id: uid('led'), month, label: `${career?.title} salary`, amount: salary, kind: 'salary', timestamp: now });
  if (passive > 0) entries.push({ id: uid('led'), month, label: 'Passive income', amount: passive, kind: 'passive', timestamp: now });
  if (expenses) entries.push({ id: uid('led'), month, label: 'Living expenses', amount: -expenses, kind: 'expense', timestamp: now });

  let lifeAmt = 0;
  const life = career ? maybeLifeEvent() : null;
  if (life && salary) {
    lifeAmt = Math.round(salary * life.salaryFraction) * (life.kind === 'expense' ? -1 : 1);
    entries.push({ id: uid('led'), month, label: life.label, amount: lifeAmt, kind: 'event', timestamp: now });
  }

  const incomeNet = salary + passive - expenses + lifeAmt;
  const cashAfterLife = Math.max(0, s.player.cash + incomeNet);

  // Banking: savings interest, FD maturities, loan EMIs.
  const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
  const bankResult = processBankMonth(s.bank, month, cashAfterLife, clamp);

  // Businesses: monthly profit from each owned venture.
  const ef = businessEconomyFactor(s.assets);
  const bizEntries: LedgerEntry[] = [];
  let bizProfit = 0;
  for (const b of s.businesses) {
    const def = getBusinessDef(b.defId);
    if (!def) continue;
    const p = businessProfit(def, b, ef);
    bizProfit += p;
    bizEntries.push({
      id: uid('led'),
      month,
      label: `${def.name} profit`,
      amount: p,
      kind: p >= 0 ? 'passive' : 'expense',
      timestamp: now,
    });
  }

  // Real estate: net rent + monthly appreciation of each property.
  const reEf = realEstateEconomyFactor(s.assets);
  const reEntries: LedgerEntry[] = [];
  let reNet = 0;
  const properties = s.properties.map((p) => {
    const def = getPropertyDef(p.defId);
    if (!def) return p;
    const net = propertyMonthlyNet(def, p);
    reNet += net;
    reEntries.push({
      id: uid('led'),
      month,
      label: `${def.name} rent`,
      amount: net,
      kind: net >= 0 ? 'passive' : 'expense',
      timestamp: now,
    });
    return { ...p, currentValue: appreciate(def, p, reEf) };
  });

  const cash = Math.max(0, cashAfterLife + bankResult.cashDelta + bizProfit + reNet);

  // SIPs: auto-invest a fixed amount into each plan's asset (if cash allows).
  let sipCash = cash;
  let holdings = s.holdings;
  const sipEntries: LedgerEntry[] = [];
  let sipTrades = 0;
  for (const sip of s.sips) {
    const asset = findAsset(s.assets, sip.assetId);
    if (!asset) continue;
    const rawQty = sip.amount / asset.price;
    const qty = parseFloat((Math.floor(rawQty / asset.minQty) * asset.minQty).toFixed(4));
    if (qty < asset.minQty) continue;
    const cost = Math.round(asset.price * qty);
    if (cost > sipCash) continue;
    sipCash -= cost;
    holdings = mergeHolding(holdings, sip.assetId, qty, asset.price);
    sipTrades += 1;
    sipEntries.push({
      id: uid('led'),
      month,
      label: `SIP · ${asset.symbol}`,
      amount: -cost,
      kind: 'expense',
      timestamp: now,
    });
  }

  const bankEntries: LedgerEntry[] = bankResult.ledger.map((e) => ({
    id: uid('led'),
    month,
    label: e.label,
    amount: e.amount,
    kind: e.kind,
    timestamp: now,
  }));

  const ledger = [...entries, ...bizEntries, ...reEntries, ...bankEntries, ...sipEntries, ...s.ledger].slice(0, 40);
  const netWorth =
    computeNetWorth(sipCash, holdings, s.assets) +
    bankEquity(bankResult.bank) +
    businessesEquity(s.businesses) +
    propertiesEquity(properties);
  const netWorthHistory = [
    ...s.netWorthHistory,
    { month, value: Math.round(netWorth) },
  ].slice(-NET_WORTH_HISTORY_LIMIT);
  const totalNet = cash - s.player.cash;

  // Advance the macro economy.
  const eco = stepEconomy(s.economy);

  set({
    month,
    ledger,
    netWorthHistory,
    bank: bankResult.bank,
    properties,
    holdings,
    economy: eco.next,
    lifetime: { ...s.lifetime, trades: s.lifetime.trades + sipTrades },
    player: { ...s.player, cash: sipCash, xp: s.player.xp + (career ? XP_PER_MONTH : 0) },
  });

  if (eco.changed) {
    const cfg = PHASES[eco.next.phase];
    get().pushToast({
      title: `${cfg.emoji} Economy: ${cfg.label}`,
      message:
        eco.next.phase === 'recession' || eco.next.phase === 'slowdown'
          ? 'Markets face headwinds — brace for volatility'
          : 'Tailwinds for the markets',
      kind: eco.next.phase === 'recession' || eco.next.phase === 'slowdown' ? 'warning' : 'event',
    });
  }

  if (career) {
    const missed = bankResult.creditScoreDelta < 0;
    get().pushToast({
      title: `Month ${month} · ${totalNet >= 0 ? '+' : ''}₹${totalNet.toLocaleString('en-IN')}`,
      message: missed
        ? '⚠️ Missed a loan EMI — credit score dropped'
        : `Salary ₹${salary.toLocaleString('en-IN')} · Expenses ₹${expenses.toLocaleString('en-IN')}${
            passive ? ` · Passive ₹${passive.toLocaleString('en-IN')}` : ''
          }`,
      kind: missed ? 'warning' : totalNet >= 0 ? 'reward' : 'warning',
    });
  }
  get().save();
}

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
