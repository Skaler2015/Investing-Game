import { useState } from 'react';
import { ArrowLeft, Trash2, Lock, KeyRound } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { Icon } from '../components/ui/Icon';
import { PROPERTIES, getPropertyDef } from '../data/realEstate';
import {
  propertyMonthlyNet,
  propertyTax,
  propertiesEquity,
} from '../engine/realEstate';
import { formatCurrency, formatCurrencyFull, formatPct } from '../utils/format';

type Tab = 'owned' | 'market';

export function RealEstate() {
  const setScreen = useGameStore((s) => s.setScreen);
  const properties = useGameStore((s) => s.properties);
  const [tab, setTab] = useState<Tab>(properties.length ? 'owned' : 'market');

  return (
    <>
      <header className="app-header">
        <button className="icon-btn" onClick={() => setScreen('dashboard')} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <span style={{ fontWeight: 800, fontSize: 16 }}>Real Estate</span>
        <span style={{ width: 38 }} />
      </header>

      <div className="screen-scroll">
        {properties.length > 0 && (
          <div className="glass-card" style={{ marginTop: 4 }}>
            <div className="row between">
              <span className="faint" style={{ fontSize: 12 }}>Portfolio value</span>
              <span className="mono" style={{ fontWeight: 800 }}>
                {formatCurrencyFull(propertiesEquity(properties))}
              </span>
            </div>
          </div>
        )}

        <div className="seg-tabs" style={{ marginTop: 12 }}>
          <button className={`seg-tab ${tab === 'owned' ? 'active' : ''}`} onClick={() => setTab('owned')}>
            My Properties ({properties.length})
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
  const properties = useGameStore((s) => s.properties);
  const toggleRent = useGameStore((s) => s.togglePropertyRent);
  const sell = useGameStore((s) => s.sellProperty);

  if (properties.length === 0) {
    return (
      <div className="empty-state">
        <span style={{ fontSize: 30 }}>🏠</span>
        <span className="muted" style={{ fontSize: 13, textAlign: 'center', maxWidth: 260 }}>
          You don't own any property yet. Switch to Buy to start your real-estate portfolio.
        </span>
      </div>
    );
  }

  return (
    <div className="col" style={{ gap: 12, marginTop: 14 }}>
      {properties.map((p) => {
        const def = getPropertyDef(p.defId);
        if (!def) return null;
        const net = propertyMonthlyNet(def, p);
        const gainPct = ((p.currentValue - p.purchasePrice) / p.purchasePrice) * 100;
        return (
          <div key={p.id} className="glass-card col" style={{ gap: 12 }}>
            <div className="row gap-12">
              <div className="career-ic">
                <Icon name={def.icon} size={22} />
              </div>
              <div className="col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 700, fontSize: 14.5 }}>{def.name}</span>
                <span className="faint" style={{ fontSize: 11, textTransform: 'capitalize' }}>
                  {def.type} · value {formatCurrency(p.currentValue)}{' '}
                  <span className={gainPct >= 0 ? 'up' : 'down'}>({formatPct(gainPct, { sign: true })})</span>
                </span>
              </div>
              <div className="col" style={{ alignItems: 'flex-end' }}>
                <span className={`mono ${net >= 0 ? 'up' : 'down'}`} style={{ fontWeight: 800, fontSize: 15 }}>
                  {formatCurrency(net, { sign: true })}
                </span>
                <span className="faint" style={{ fontSize: 10 }}>/ month</span>
              </div>
            </div>

            <div className="row between" style={{ fontSize: 11.5 }}>
              <span className="faint">Rent {formatCurrency(p.rented ? def.monthlyRent : 0)}</span>
              <span className="faint">Upkeep {formatCurrency(def.maintenance)}</span>
              <span className="faint">Tax {formatCurrency(propertyTax(def, p))}</span>
            </div>

            <div className="grid-2" style={{ gap: 8 }}>
              <button
                className={`btn ${p.rented ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => toggleRent(p.id)}
              >
                <KeyRound size={15} /> {p.rented ? 'Rented' : 'Vacant'}
              </button>
              <button className="btn btn-ghost" onClick={() => sell(p.id)}>
                <Trash2 size={15} /> Sell {formatCurrency(Math.round(p.currentValue * 0.98))}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MarketPanel() {
  const cash = useGameStore((s) => s.player.cash);
  const buy = useGameStore((s) => s.buyProperty);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="col" style={{ gap: 12, marginTop: 14 }}>
      <span className="faint" style={{ fontSize: 12, margin: '0 4px' }}>
        Property earns monthly rent and appreciates over time. Your cash:{' '}
        {formatCurrencyFull(cash)}
      </span>
      {msg && <div className="trade-err">{msg}</div>}
      {PROPERTIES.map((def) => {
        const affordable = def.price <= cash;
        const grossYield = (def.monthlyRent * 12) / def.price;
        return (
          <div key={def.id} className="glass-card col" style={{ gap: 10 }}>
            <div className="row gap-12">
              <div className="career-ic">
                <Icon name={def.icon} size={22} />
              </div>
              <div className="col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 700, fontSize: 14.5 }}>{def.name}</span>
                <span className="faint" style={{ fontSize: 11 }}>
                  Rent {formatCurrency(def.monthlyRent)}/mo · {formatPct(grossYield * 100)} yield ·{' '}
                  {formatPct(def.appreciation * 100)}/yr growth
                </span>
              </div>
            </div>
            <p className="faint" style={{ fontSize: 11.5, lineHeight: 1.4 }}>{def.description}</p>
            <button
              className="btn btn-primary btn-block"
              disabled={!affordable}
              onClick={() => { const r = buy(def.id); setMsg(r.ok ? null : r.message); }}
            >
              {affordable ? <>Buy for {formatCurrency(def.price)}</> : <><Lock size={14} /> Needs {formatCurrency(def.price)}</>}
            </button>
          </div>
        );
      })}
    </div>
  );
}
