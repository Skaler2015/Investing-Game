import type { AssetClass } from '../types';

export interface MarketEventTemplate {
  headline: string;
  sentiment: number;
  affects: AssetClass[];
  driftImpact: number;
  duration: number;
}

/**
 * Pool of market events. The market engine periodically samples one and
 * applies its drift impact to affected assets for `duration` ticks.
 */
export const MARKET_EVENTS: MarketEventTemplate[] = [
  {
    headline: '📈 Tech Corp reports record quarterly profit!',
    sentiment: 0.8,
    affects: ['stock'],
    driftImpact: 2.4,
    duration: 8,
  },
  {
    headline: '🏦 Central bank cuts interest rates',
    sentiment: 0.5,
    affects: ['stock', 'realestate'],
    driftImpact: 1.8,
    duration: 10,
  },
  {
    headline: '🚀 Global tech boom lifts markets',
    sentiment: 0.9,
    affects: ['stock', 'crypto', 'startup'],
    driftImpact: 2.6,
    duration: 9,
  },
  {
    headline: '💥 Market crash! Investors flee to safety',
    sentiment: -0.9,
    affects: ['stock', 'crypto', 'startup'],
    driftImpact: -3.2,
    duration: 7,
  },
  {
    headline: '🌍 Global recession fears grip markets',
    sentiment: -0.7,
    affects: [],
    driftImpact: -2.2,
    duration: 12,
  },
  {
    headline: '📊 Inflation rises more than expected',
    sentiment: -0.4,
    affects: ['stock', 'realestate'],
    driftImpact: -1.5,
    duration: 9,
  },
  {
    headline: '🪙 Crypto adoption surges worldwide',
    sentiment: 0.85,
    affects: ['crypto'],
    driftImpact: 3.0,
    duration: 6,
  },
  {
    headline: '⚠️ Regulators crack down on crypto exchanges',
    sentiment: -0.8,
    affects: ['crypto'],
    driftImpact: -2.8,
    duration: 7,
  },
  {
    headline: '🥇 Gold hits record high amid uncertainty',
    sentiment: 0.6,
    affects: ['gold'],
    driftImpact: 2.5,
    duration: 8,
  },
  {
    headline: '🏗️ New infrastructure policy boosts real estate',
    sentiment: 0.7,
    affects: ['realestate'],
    driftImpact: 2.2,
    duration: 11,
  },
  {
    headline: '💡 Startup unicorn valuation frenzy',
    sentiment: 0.9,
    affects: ['startup'],
    driftImpact: 3.4,
    duration: 5,
  },
  {
    headline: '📉 Startup funding winter sets in',
    sentiment: -0.85,
    affects: ['startup'],
    driftImpact: -3.6,
    duration: 6,
  },
  {
    headline: '🛢️ Oil prices spike, rattling equities',
    sentiment: -0.5,
    affects: ['stock'],
    driftImpact: -1.7,
    duration: 8,
  },
  {
    headline: '🤝 Landmark trade deal signed',
    sentiment: 0.65,
    affects: ['stock', 'gold'],
    driftImpact: 1.9,
    duration: 9,
  },
  {
    headline: '💼 Strong jobs report cheers investors',
    sentiment: 0.55,
    affects: ['stock'],
    driftImpact: 1.6,
    duration: 7,
  },

  // ── World events that ripple across sectors ───────────────────────────
  {
    headline: '⚔️ Geopolitical conflict erupts — markets rattled',
    sentiment: -0.8,
    affects: ['stock', 'crypto', 'startup', 'nft'],
    driftImpact: -2.8,
    duration: 10,
  },
  {
    headline: '⚔️ War fears send oil and gold soaring',
    sentiment: -0.3,
    affects: ['commodity', 'gold'],
    driftImpact: 2.6,
    duration: 9,
  },
  {
    headline: '🗳️ Election result brings political stability',
    sentiment: 0.6,
    affects: ['stock', 'realestate', 'reit'],
    driftImpact: 1.9,
    duration: 10,
  },
  {
    headline: '🗳️ Shock election upset spooks investors',
    sentiment: -0.6,
    affects: ['stock', 'realestate'],
    driftImpact: -2.0,
    duration: 8,
  },
  {
    headline: '📜 Union Budget: big infrastructure push',
    sentiment: 0.55,
    affects: ['stock', 'realestate', 'reit', 'commodity'],
    driftImpact: 1.8,
    duration: 11,
  },
  {
    headline: '🦠 New pandemic wave triggers lockdown fears',
    sentiment: -0.85,
    affects: [],
    driftImpact: -3.0,
    duration: 12,
  },
  {
    headline: '🛢️ Oil shock: crude prices spike on supply cut',
    sentiment: -0.4,
    affects: ['commodity', 'stock'],
    driftImpact: -1.8,
    duration: 9,
  },
  {
    headline: '🤖 AI boom: investors pile into tech and chips',
    sentiment: 0.9,
    affects: ['stock', 'startup', 'etf'],
    driftImpact: 2.8,
    duration: 10,
  },
  {
    headline: '🏚️ Housing bubble bursts — property values slide',
    sentiment: -0.7,
    affects: ['realestate', 'reit'],
    driftImpact: -2.6,
    duration: 11,
  },
  {
    headline: '🚨 Corporate scandal: accounting fraud exposed',
    sentiment: -0.75,
    affects: ['stock'],
    driftImpact: -2.4,
    duration: 8,
  },
  {
    headline: '💱 Rupee slides against the dollar',
    sentiment: -0.35,
    affects: ['stock', 'commodity'],
    driftImpact: -1.4,
    duration: 8,
  },
  {
    headline: '🖼️ NFT mania grips collectors — floor prices surge',
    sentiment: 0.8,
    affects: ['nft', 'crypto'],
    driftImpact: 3.0,
    duration: 7,
  },
  {
    headline: '❄️ Crypto winter: regulators crack down hard',
    sentiment: -0.8,
    affects: ['crypto', 'nft'],
    driftImpact: -3.1,
    duration: 10,
  },
];
