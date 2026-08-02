import type { Advice } from '../types';

export interface AdviceInput {
  netWorth: number;
  cash: number;
  investedValue: number;
  savings: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  loanBalance: number;
  creditScore: number;
  diversification: number; // 0..100
  portfolioRisk: number; // 0..100
  sipCount: number;
  hasCareer: boolean;
}

/**
 * The "AI Financial Advisor": a rules engine that inspects the player's whole
 * financial picture and returns prioritised, plain-language guidance
 * (warnings first). Deterministic and side-effect free.
 */
export function buildAdvice(i: AdviceInput): Advice[] {
  const out: Advice[] = [];
  const emergencyTarget = i.monthlyExpenses * 6;

  if (!i.hasCareer) {
    out.push({ id: 'career', severity: 'warn', title: 'Choose a career',
      detail: 'A career gives you monthly income to invest. Pick one from your profile.' });
  }
  if (i.monthlyExpenses > 0 && i.savings < emergencyTarget) {
    out.push({ id: 'emergency', severity: 'warn', title: 'Build an emergency fund',
      detail: `Aim for 6 months of expenses (~₹${Math.round(emergencyTarget).toLocaleString('en-IN')}) in savings before taking big risks.` });
  }
  if (i.creditScore < 600) {
    out.push({ id: 'credit', severity: 'warn', title: 'Improve your credit score',
      detail: 'Pay loan EMIs on time — a higher score unlocks bigger, cheaper loans.' });
  }
  if (i.monthlyIncome > 0 && i.loanBalance > i.monthlyIncome * 12) {
    out.push({ id: 'debt', severity: 'warn', title: 'Your debt is high',
      detail: 'Loan balance exceeds a year of income. Consider repaying before borrowing more.' });
  }
  if (i.investedValue > 0 && i.diversification < 40) {
    out.push({ id: 'diversify', severity: 'warn', title: 'Diversify your portfolio',
      detail: 'You are concentrated in a few asset classes. Spread across stocks, funds, gold and more to cut risk.' });
  }
  if (i.portfolioRisk >= 75) {
    out.push({ id: 'risk', severity: 'warn', title: 'Portfolio is very aggressive',
      detail: 'A large share sits in high-risk assets. Adding bonds, gold or FDs would steady returns.' });
  }
  if (i.investedValue === 0 && i.cash > 50000) {
    out.push({ id: 'invest', severity: 'info', title: 'Put your money to work',
      detail: 'Your cash is idle. Even a simple index ETF or mutual-fund SIP beats cash over time.' });
  } else if (i.netWorth > 0 && i.cash > i.netWorth * 0.4 && i.cash > 200000) {
    out.push({ id: 'idle', severity: 'info', title: 'Too much idle cash',
      detail: 'A big chunk of your wealth is uninvested. Deploy some into investments, FDs or a business.' });
  }
  if (i.sipCount === 0 && i.netWorth > 150000) {
    out.push({ id: 'sip', severity: 'info', title: 'Start a SIP',
      detail: 'Automating a monthly investment builds wealth steadily and removes emotion from investing.' });
  }

  if (out.length === 0) {
    out.push({ id: 'healthy', severity: 'good', title: 'Your finances look healthy',
      detail: 'Good diversification, sensible risk and a safety net. Keep compounding!' });
  }
  return out.slice(0, 6);
}
