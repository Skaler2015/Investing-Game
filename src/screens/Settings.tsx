import { useState } from 'react';
import {
  ArrowLeft, Volume2, VolumeX, Sun, Moon, FileDown, RotateCcw, Cloud, ShieldCheck,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { isSoundEnabled, setSoundEnabled } from '../services/sound';
import { activeSeason } from '../data/seasons';
import { computeNetWorth, computePortfolioStats, findAsset } from '../engine/economy';
import { bankEquity, fdMaturityValue } from '../engine/banking';
import { businessesEquity } from '../engine/business';
import { propertiesEquity } from '../engine/realEstate';
import { PHASES } from '../data/macro';
import { downloadStatement } from '../utils/statement';
import { formatQty } from '../utils/format';

export function Settings() {
  const setScreen = useGameStore((s) => s.setScreen);
  const theme = useGameStore((s) => s.theme);
  const toggleTheme = useGameStore((s) => s.toggleTheme);
  const resetGame = useGameStore((s) => s.resetGame);
  const state = useGameStore((s) => s);
  const [sound, setSound] = useState(isSoundEnabled());
  const [confirmReset, setConfirmReset] = useState(false);
  const season = activeSeason();

  const exportStatement = () => {
    const stats = computePortfolioStats(state.holdings, state.assets);
    const netWorth =
      computeNetWorth(state.player.cash, state.holdings, state.assets) +
      bankEquity(state.bank) +
      businessesEquity(state.businesses) +
      propertiesEquity(state.properties);
    downloadStatement({
      name: state.player.name,
      month: state.month,
      economyPhase: PHASES[state.economy.phase].label,
      netWorth,
      cash: state.player.cash,
      investedValue: stats.investedValue,
      savings: state.bank.savings,
      depositsValue: state.bank.deposits.reduce((a, d) => a + fdMaturityValue(d), 0),
      loanBalance: state.bank.loans.reduce((a, l) => a + l.balance, 0),
      businessesValue: businessesEquity(state.businesses),
      propertiesValue: propertiesEquity(state.properties),
      creditScore: state.bank.creditScore,
      realizedPnl: state.player.realizedPnl,
      taxIncome: state.taxPaid.income,
      taxCapitalGains: state.taxPaid.capitalGains,
      holdings: state.holdings
        .filter((h) => h.quantity > 0)
        .map((h) => {
          const a = findAsset(state.assets, h.assetId);
          return {
            name: a?.name ?? h.assetId,
            detail: `${formatQty(h.quantity)} ${a?.symbol ?? ''}`,
            value: (a?.price ?? 0) * h.quantity,
          };
        }),
    });
  };

  return (
    <>
      <header className="app-header">
        <button className="icon-btn" onClick={() => setScreen('profile')} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <span style={{ fontWeight: 800, fontSize: 16 }}>Settings</span>
        <span style={{ width: 38 }} />
      </header>

      <div className="screen-scroll">
        {season && (
          <div className="glass-card row gap-12" style={{ marginTop: 4, alignItems: 'center', borderColor: `${season.color}55` }}>
            <span style={{ fontSize: 26 }}>{season.emoji}</span>
            <div className="col" style={{ gap: 2 }}>
              <span style={{ fontWeight: 800, fontSize: 14 }}>{season.name}</span>
              <span className="faint" style={{ fontSize: 12 }}>{season.message}</span>
            </div>
          </div>
        )}

        <div className="section-title"><span>Preferences</span></div>
        <div className="col" style={{ gap: 10 }}>
          <button className="settings-row" onClick={() => { const v = !sound; setSound(v); setSoundEnabled(v); }}>
            <div className="row gap-12">
              {sound ? <Volume2 size={18} /> : <VolumeX size={18} className="faint" />}
              <span style={{ fontWeight: 600 }}>Sound effects</span>
            </div>
            <span className={`toggle ${sound ? 'on' : ''}`}><span /></span>
          </button>

          <button className="settings-row" onClick={toggleTheme}>
            <div className="row gap-12">
              {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
              <span style={{ fontWeight: 600 }}>{theme === 'dark' ? 'Dark' : 'Light'} theme</span>
            </div>
            <span className={`toggle ${theme === 'dark' ? 'on' : ''}`}><span /></span>
          </button>
        </div>

        <div className="section-title"><span>Data</span></div>
        <div className="col" style={{ gap: 10 }}>
          <button className="settings-row" onClick={exportStatement}>
            <div className="row gap-12">
              <FileDown size={18} />
              <div className="col" style={{ gap: 1, textAlign: 'left' }}>
                <span style={{ fontWeight: 600 }}>Export statement (PDF)</span>
                <span className="faint" style={{ fontSize: 11 }}>Download a printable financial report</span>
              </div>
            </div>
          </button>

          <div className="settings-row" style={{ cursor: 'default' }}>
            <div className="row gap-12">
              <Cloud size={18} className="faint" />
              <div className="col" style={{ gap: 1 }}>
                <span style={{ fontWeight: 600 }}>Cloud sync</span>
                <span className="faint" style={{ fontSize: 11 }}>Cross-device accounts — coming soon</span>
              </div>
            </div>
            <span className="pill" style={{ background: 'var(--surface-2)' }}>Local</span>
          </div>
        </div>

        <div className="section-title"><span>Danger zone</span></div>
        {confirmReset ? (
          <div className="card card-pad col" style={{ gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Reset all progress for this account?</span>
            <div className="grid-2">
              <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
              <button className="btn btn-sell" onClick={() => { void resetGame(); setConfirmReset(false); setScreen('dashboard'); }}>Reset</button>
            </div>
          </div>
        ) : (
          <button className="btn btn-ghost btn-block" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={16} /> Reset Game
          </button>
        )}

        <div className="disclaimer" style={{ marginTop: 18 }}>
          <ShieldCheck size={18} style={{ flexShrink: 0 }} />
          <span><strong>Simulation only.</strong> Invest Master is an educational game. All money, prices and assets are virtual — no real money or trading is involved.</span>
        </div>
      </div>
    </>
  );
}
