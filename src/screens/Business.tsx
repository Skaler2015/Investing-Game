import { useState } from 'react';
import { ArrowLeft, ArrowUpCircle, Megaphone, Trash2, Lock } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { Icon } from '../components/ui/Icon';
import { BUSINESSES, getBusinessDef } from '../data/businesses';
import {
  businessEconomyFactor,
  businessProfit,
  businessRevenue,
  businessValue,
  upgradeCost,
} from '../engine/business';
import type { Business, BusinessDef } from '../types';
import { formatCurrency, formatCurrencyFull } from '../utils/format';

type Tab = 'owned' | 'market';

export function BusinessScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const businesses = useGameStore((s) => s.businesses);
  const [tab, setTab] = useState<Tab>(businesses.length ? 'owned' : 'market');

  return (
    <>
      <header className="app-header">
        <button className="icon-btn" onClick={() => setScreen('dashboard')} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <span style={{ fontWeight: 800, fontSize: 16 }}>Businesses</span>
        <span style={{ width: 38 }} />
      </header>

      <div className="screen-scroll">
        <div className="seg-tabs" style={{ marginTop: 4 }}>
          <button className={`seg-tab ${tab === 'owned' ? 'active' : ''}`} onClick={() => setTab('owned')}>
            My Empire ({businesses.length})
          </button>
          <button className={`seg-tab ${tab === 'market' ? 'active' : ''}`} onClick={() => setTab('market')}>
            Buy
          </button>
        </div>

        {tab === 'owned' ? <OwnedPanel /> : <MarketPanel />}
      </div>
    </>
  );
}

function OwnedPanel() {
  const businesses = useGameStore((s) => s.businesses);
  const assets = useGameStore((s) => s.assets);
  const cash = useGameStore((s) => s.player.cash);
  const upgrade = useGameStore((s) => s.upgradeBusiness);
  const toggleMarketing = useGameStore((s) => s.toggleMarketing);
  const sell = useGameStore((s) => s.sellBusiness);
  const ef = businessEconomyFactor(assets);

  if (businesses.length === 0) {
    return (
      <div className="empty-state">
        <span style={{ fontSize: 30 }}>🏢</span>
        <span className="muted" style={{ fontSize: 13, textAlign: 'center', maxWidth: 260 }}>
          You don't own any businesses yet. Switch to the Buy tab to start your empire.
        </span>
      </div>
    );
  }

  return (
    <div className="col" style={{ gap: 12, marginTop: 14 }}>
      {businesses.map((b) => {
        const def = getBusinessDef(b.defId);
        if (!def) return null;
        const profit = businessProfit(def, b, ef);
        const revenue = businessRevenue(def, b, ef);
        const up = upgradeCost(def, b.level);
        const maxed = b.level >= def.maxLevel;
        return (
          <div key={b.id} className="glass-card col" style={{ gap: 12 }}>
            <div className="row gap-12">
              <div className="career-ic">
                <Icon name={def.icon} size={22} />
              </div>
              <div className="col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 700, fontSize: 14.5 }}>{def.name}</span>
                <span className="faint" style={{ fontSize: 11 }}>
                  Level {b.level} · value {formatCurrency(businessValue(def, b))}
                </span>
              </div>
              <div className="col" style={{ alignItems: 'flex-end' }}>
                <span className={`mono ${profit >= 0 ? 'up' : 'down'}`} style={{ fontWeight: 800, fontSize: 15 }}>
                  {formatCurrency(profit, { sign: true })}
                </span>
                <span className="faint" style={{ fontSize: 10 }}>/ month</span>
              </div>
            </div>

            <div className="row between" style={{ fontSize: 11.5 }}>
              <span className="faint">Revenue {formatCurrency(revenue)}/mo</span>
              <span className="faint">Marketing {b.marketing ? 'ON (+35%)' : 'off'}</span>
            </div>

            <div className="grid-2" style={{ gap: 8 }}>
              <button
                className={`btn ${b.marketing ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => toggleMarketing(b.id)}
              >
                <Megaphone size={15} /> {b.marketing ? 'Marketing On' : 'Market'}
              </button>
              <button
                className="btn btn-buy"
                disabled={maxed || up > cash}
                onClick={() => upgrade(b.id)}
              >
                <ArrowUpCircle size={15} /> {maxed ? 'Max level' : `Upgrade ${formatCurrency(up)}`}
              </button>
            </div>
            <button className="sell-biz" onClick={() => sell(b.id)}>
              <Trash2 size={13} /> Sell for {formatCurrency(Math.round(businessValue(def, b) * 0.85))}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function MarketPanel() {
  const assets = useGameStore((s) => s.assets);
  const cash = useGameStore((s) => s.player.cash);
  const buy = useGameStore((s) => s.buyBusiness);
  const [msg, setMsg] = useState<string | null>(null);
  const ef = businessEconomyFactor(assets);

  const sample = (def: BusinessDef): Business => ({
    id: '', defId: def.id, level: 1, marketing: false, purchasedMonth: 0,
  });

  return (
    <div className="col" style={{ gap: 12, marginTop: 14 }}>
      <span className="faint" style={{ fontSize: 12, margin: '0 4px' }}>
        Buy a business to earn monthly profit that scales with the economy. Your
        cash: {formatCurrencyFull(cash)}
      </span>
      {msg && <div className="trade-err">{msg}</div>}
      {BUSINESSES.map((def) => {
        const profit = businessProfit(def, sample(def), ef);
        const affordable = def.cost <= cash;
        return (
          <div key={def.id} className="glass-card col" style={{ gap: 10 }}>
            <div className="row gap-12">
              <div className="career-ic">
                <Icon name={def.icon} size={22} />
              </div>
              <div className="col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 700, fontSize: 14.5 }}>{def.name}</span>
                <span className="faint" style={{ fontSize: 11 }}>{def.sector}</span>
              </div>
              <div className="col" style={{ alignItems: 'flex-end' }}>
                <span className="up mono" style={{ fontWeight: 800, fontSize: 14 }}>
                  {formatCurrency(profit, { sign: true })}
                </span>
                <span className="faint" style={{ fontSize: 10 }}>/ month</span>
              </div>
            </div>
            <p className="faint" style={{ fontSize: 11.5, lineHeight: 1.4 }}>{def.description}</p>
            <button
              className="btn btn-primary btn-block"
              disabled={!affordable}
              onClick={() => { const r = buy(def.id); setMsg(r.ok ? null : r.message); }}
            >
              {affordable ? (
                <>Buy for {formatCurrency(def.cost)}</>
              ) : (
                <><Lock size={14} /> Needs {formatCurrency(def.cost)}</>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
