import { useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { PHASES } from '../data/macro';
import { relativeTime } from '../utils/format';
import type { NewsCategory } from '../types';

const CATEGORIES: { id: NewsCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'economic', label: 'Economy' },
  { id: 'business', label: 'Business' },
  { id: 'company', label: 'Company' },
  { id: 'political', label: 'Policy' },
  { id: 'crypto', label: 'Crypto' },
];

const CAT_COLOR: Record<NewsCategory, string> = {
  economic: '#6366f1',
  business: '#06b6d4',
  company: '#3b82f6',
  political: '#f59e0b',
  crypto: '#f59e0b',
};

export function News() {
  const setScreen = useGameStore((s) => s.setScreen);
  const news = useGameStore((s) => s.news);
  const economy = useGameStore((s) => s.economy);
  const [filter, setFilter] = useState<NewsCategory | 'all'>('all');
  const cfg = PHASES[economy.phase];

  const list = filter === 'all' ? news : news.filter((n) => n.category === filter);

  return (
    <>
      <header className="app-header">
        <button className="icon-btn" onClick={() => setScreen('dashboard')} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <span style={{ fontWeight: 800, fontSize: 16 }}>News & Economy</span>
        <span style={{ width: 38 }} />
      </header>

      <div className="screen-scroll">
        {/* Macro snapshot */}
        <div className="glass-card" style={{ marginTop: 4 }}>
          <div className="row between" style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Economic Phase</span>
            <span style={{ fontSize: 14, fontWeight: 800 }}>
              {cfg.emoji} {cfg.label}
            </span>
          </div>
          <div className="grid-2" style={{ gap: 10 }}>
            <MacroStat label="Inflation" value={`${economy.inflation.toFixed(1)}%`} />
            <MacroStat label="GDP Growth" value={`${economy.gdp.toFixed(1)}%`} tone={economy.gdp >= 0 ? 'up' : 'down'} />
            <MacroStat label="Interest Rate" value={`${economy.interestRate.toFixed(2)}%`} />
            <MacroStat label="Market Bias" value={`${(cfg.driftBias * 100).toFixed(0)}%/yr`} tone={cfg.driftBias >= 0 ? 'up' : 'down'} />
          </div>
        </div>

        <div className="filter-row" style={{ marginTop: 14 }}>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`filter-chip ${filter === c.id ? 'active' : ''}`}
              onClick={() => setFilter(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="col" style={{ gap: 8, marginTop: 14 }}>
          {list.length === 0 && (
            <div className="empty-state">
              <span className="muted" style={{ fontSize: 13 }}>No news yet — check back as the market moves.</span>
            </div>
          )}
          {list.map((n) => {
            const tone = n.sentiment > 0.15 ? 'up' : n.sentiment < -0.15 ? 'down' : 'neutral';
            const Icon = tone === 'up' ? TrendingUp : tone === 'down' ? TrendingDown : Minus;
            return (
              <div key={n.id} className="news-item">
                <div
                  className="news-cat"
                  style={{ background: `${CAT_COLOR[n.category]}22`, color: CAT_COLOR[n.category] }}
                >
                  {n.category}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, flex: 1, lineHeight: 1.4 }}>
                  {n.headline}
                </span>
                <div className="col" style={{ alignItems: 'flex-end', gap: 3 }}>
                  <Icon size={15} className={tone === 'neutral' ? 'faint' : tone} />
                  <span className="faint" style={{ fontSize: 10 }}>{relativeTime(n.timestamp)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function MacroStat({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  return (
    <div className="flow-stat">
      <span className="faint" style={{ fontSize: 11 }}>{label}</span>
      <span className={`mono ${tone ?? ''}`} style={{ fontWeight: 800, fontSize: 16 }}>{value}</span>
    </div>
  );
}
