import type { BankState, FixedDeposit, Loan } from '../types';
import { loanProduct } from '../data/banking';

/** Standard amortising EMI for a principal at an annual rate over n months. */
export function emiFor(principal: number, annualRate: number, months: number): number {
  if (months <= 0) return principal;
  const r = annualRate / 12;
  if (r === 0) return principal / months;
  const pow = Math.pow(1 + r, months);
  return Math.round((principal * r * pow) / (pow - 1));
}

/** Value an FD pays out at maturity (simple interest over the full term). */
export function fdMaturityValue(fd: FixedDeposit): number {
  return Math.round(fd.principal * (1 + fd.rate * (fd.termMonths / 12)));
}

/** Interest accrued so far on an FD at a given month (for display). */
export function fdAccrued(fd: FixedDeposit, currentMonth: number): number {
  const elapsed = Math.max(0, Math.min(fd.termMonths, currentMonth - fd.startMonth));
  return Math.round(fd.principal * fd.rate * (elapsed / 12));
}

/** Net banking equity: savings + deposit principals − outstanding loan balances. */
export function bankEquity(bank: BankState): number {
  const deposits = bank.deposits.reduce((s, d) => s + d.principal, 0);
  const loans = bank.loans.reduce((s, l) => s + l.balance, 0);
  return bank.savings + deposits - loans;
}

/** Maximum loan a player qualifies for, given salary, credit score and existing debt. */
export function loanEligibility(
  type: Loan['type'],
  monthlySalary: number,
  creditScore: number,
  bank: BankState
): { eligible: boolean; maxAmount: number; reason?: string } {
  const p = loanProduct(type);
  if (creditScore < p.minScore) {
    return { eligible: false, maxAmount: 0, reason: `Needs credit score ${p.minScore}+` };
  }
  const existing = bank.loans
    .filter((l) => l.type === type)
    .reduce((s, l) => s + l.balance, 0);
  const scoreFactor = 0.6 + 0.4 * ((creditScore - 300) / 600); // 0.6..1.0
  const cap = Math.max(0, Math.round(monthlySalary * p.salaryMultiple * scoreFactor - existing));
  return { eligible: cap > 0, maxAmount: cap, reason: cap > 0 ? undefined : 'Existing debt too high' };
}

export interface BankMonthResult {
  bank: BankState;
  /** Net change to the player's cash from banking this month. */
  cashDelta: number;
  ledger: { label: string; amount: number; kind: 'passive' | 'expense' | 'event' }[];
  creditScoreDelta: number;
}

/**
 * Process one month of banking against the cash available AFTER salary and
 * living costs: credit savings interest, mature deposits, and collect EMIs
 * (marking missed payments when cash is short).
 */
export function processBankMonth(
  bank: BankState,
  month: number,
  cashAvailable: number,
  clamp: (n: number, lo: number, hi: number) => number
): BankMonthResult {
  const ledger: BankMonthResult['ledger'] = [];
  let cashDelta = 0;
  let creditDelta = 0;
  let running = cashAvailable;

  // 1. Savings interest (compounds inside the savings balance).
  let savings = bank.savings;
  const savingsInterest = Math.round((savings * 0.04) / 12);
  if (savingsInterest > 0) {
    savings += savingsInterest;
    ledger.push({ label: 'Savings interest', amount: savingsInterest, kind: 'passive' });
  }

  // 2. Mature fixed deposits.
  const remainingDeposits: FixedDeposit[] = [];
  for (const fd of bank.deposits) {
    if (month >= fd.maturityMonth) {
      const payout = fdMaturityValue(fd);
      cashDelta += payout;
      running += payout;
      creditDelta += 8;
      ledger.push({ label: `FD matured (+${payout})`, amount: payout, kind: 'passive' });
    } else {
      remainingDeposits.push(fd);
    }
  }

  // 3. Loan EMIs.
  const remainingLoans: Loan[] = [];
  for (const loan of bank.loans) {
    if (loan.balance <= 0 || loan.remainingMonths <= 0) continue;
    const r = loan.rate / 12;
    const interest = Math.round(loan.balance * r);
    const emi = Math.min(loan.emi, loan.balance + interest);

    if (running >= emi) {
      running -= emi;
      cashDelta -= emi;
      const principalPaid = emi - interest;
      const balance = Math.max(0, loan.balance - principalPaid);
      creditDelta += 6;
      ledger.push({ label: `EMI · ${loan.type}`, amount: -emi, kind: 'expense' });
      if (balance > 0.5) {
        remainingLoans.push({
          ...loan,
          balance,
          remainingMonths: loan.remainingMonths - 1,
        });
      } else {
        creditDelta += 8; // loan cleared
      }
    } else {
      // Missed payment: interest capitalises, credit score drops.
      creditDelta -= 45;
      ledger.push({ label: `Missed EMI · ${loan.type}`, amount: 0, kind: 'event' });
      remainingLoans.push({
        ...loan,
        balance: loan.balance + interest,
        missedPayments: loan.missedPayments + 1,
      });
    }
  }

  const creditScore = clamp(bank.creditScore + creditDelta, 300, 900);
  return {
    bank: { savings, deposits: remainingDeposits, loans: remainingLoans, creditScore },
    cashDelta,
    ledger,
    creditScoreDelta: creditDelta,
  };
}
