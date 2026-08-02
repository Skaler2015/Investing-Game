import { ArrowLeft, Sparkles, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { computeNetWorth, computePortfolioStats } from '../engine/economy';
import { bankEquity } from '../engine/banking';
import { businessesEquity } from '../engine/business';
import { propertiesEquity } from '../engine/realEstate';
import { portfolioRisk, diversificationScore } from '../engine/insights';
import { buildAdvice } from '../engine/advisor';
import { getCareer } from '../data/careers';
import type { Advice } from '../types';
import { CashChip } from '../components/layout/CashChip';

const SEV = {
  warn: { icon: AlertTriangle, color: 'var(--down)', bg: 'rgba(239,68,68,0.12)' },
  info: { icon: Info, color: 'var(--brand)', bg: 'rgba(99,102,241,0.12)' },
  good: { icon: CheckCircle2, color: 'var(--up)', bg: 'rgba(34,197,94,0.12)' },
} as const;

export function Advisor() {
  const setScreen = useGameStore((s) => s.setScreen);
  const s = useGameStore((st) => st);

  const stats = computePortfolioStats(s.holdings, s.assets);
  const netWorth =
    computeNetWorth(s.player.cash, s.holdings, s.assets) +
    bankEquity(s.bank) +
    businessesEquity(s.businesses) +
    propertiesEquity(s.properties);
  const career = getCareer(s.player.careerId);

  const advice: Advice[] = buildAdvice({
    netWorth,
    cash: s.player.cash,
    investedValue: stats.investedValue,
    savings: s.bank.savings,
    monthlyIncome: career?.salary ?? 0,
    monthlyExpenses: career?.expenses ?? 0,
    loanBalance: s.bank.loans.reduce((a, l) => a + l.balance, 0),
    creditScore: s.bank.creditScore,
    diversification: diversificationScore(s.holdings, s.assets),
    portfolioRisk: portfolioRisk(s.holdings, s.assets).score,
    sipCount: s.sips.length,
    hasCareer: !!career,
  });

  return (
    <>
      <header className="app-header">
        <button className="icon-btn" onClick={() => setScreen('dashboard')} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <span style={{ fontWeight: 800, fontSize: 16 }}>AI Advisor</span>
        <CashChip />
      </header>

      <div className="screen-scroll">
        <div className="glass-card row gap-12" style={{ marginTop: 4, alignItems: 'center' }}>
          <div className="career-hero-ic"><Sparkles size={22} /></div>
          <div className="col" style={{ gap: 2 }}>
            <span style={{ fontWeight: 800, fontSize: 15 }}>Your financial check-up</span>
            <span className="faint" style={{ fontSize: 12 }}>
              Personalised tips based on your whole portfolio.
            </span>
          </div>
        </div>

        <div className="col" style={{ gap: 10, marginTop: 14 }}>
          {advice.map((a) => {
            const sev = SEV[a.severity];
            const IconCmp = sev.icon;
            return (
              <div key={a.id} className="glass-card row gap-12" style={{ alignItems: 'flex-start' }}>
                <div
                  className="advisor-ic"
                  style={{ color: sev.color, background: sev.bg }}
                >
                  <IconCmp size={18} />
                </div>
                <div className="col" style={{ gap: 3, flex: 1 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{a.title}</span>
                  <span className="faint" style={{ fontSize: 12.5, lineHeight: 1.45 }}>{a.detail}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="info-note" style={{ marginTop: 16 }}>
          🎓 New to investing? Try <strong>Learn</strong> from the dashboard for quick lessons and rewards.
        </div>
      </div>
    </>
  );
}
