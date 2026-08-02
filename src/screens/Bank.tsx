import { useState } from 'react';
import { ArrowLeft, PiggyBank, Landmark, Lock, CreditCard, Plus, Minus, ShieldCheck, Check } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { Icon } from '../components/ui/Icon';
import { ProgressBar } from '../components/ui/ProgressBar';
import {
  SAVINGS_APR,
  FD_PRODUCTS,
  LOAN_PRODUCTS,
  creditLabel,
  CREDIT,
} from '../data/banking';
import { INSURANCE_PLANS } from '../data/insurance';
import { emiFor, fdAccrued, loanEligibility } from '../engine/banking';
import { getCareer } from '../data/careers';
import type { LoanType } from '../types';
import { formatCurrency, formatCurrencyFull } from '../utils/format';

type Tab = 'savings' | 'deposits' | 'loans' | 'insurance';

export function Bank() {
  const setScreen = useGameStore((s) => s.setScreen);
  const bank = useGameStore((s) => s.bank);
  const cash = useGameStore((s) => s.player.cash);
  const creditScore = bank.creditScore;
  const [tab, setTab] = useState<Tab>('savings');

  const scorePct = (creditScore - CREDIT.min) / (CREDIT.max - CREDIT.min);
  const scoreColor =
    creditScore >= 720 ? 'var(--up)' : creditScore >= 550 ? 'var(--gold)' : 'var(--down)';

  return (
    <>
      <header className="app-header">
        <button className="icon-btn" onClick={() => setScreen('dashboard')} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <span style={{ fontWeight: 800, fontSize: 16 }}>Bank</span>
        <span style={{ width: 38 }} />
      </header>

      <div className="screen-scroll">
        {/* Credit score */}
        <div className="glass-card" style={{ marginTop: 4 }}>
          <div className="row between" style={{ marginBottom: 8 }}>
            <div className="row gap-8">
              <CreditCard size={16} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>Credit Score (CIBIL)</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: scoreColor }}>
              {creditLabel(creditScore)}
            </span>
          </div>
          <div className="row gap-12" style={{ alignItems: 'baseline' }}>
            <span className="mono" style={{ fontSize: 30, fontWeight: 800, color: scoreColor }}>
              {creditScore}
            </span>
            <span className="faint" style={{ fontSize: 11 }}>/ 900</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <ProgressBar value={scorePct} gradient={`linear-gradient(90deg, var(--down), var(--gold), var(--up))`} />
          </div>
          <span className="faint" style={{ fontSize: 11 }}>
            Pay EMIs on time to raise it. Missed payments hurt your score.
          </span>
        </div>

        <div className="seg-tabs" style={{ marginTop: 12 }}>
          {(['savings', 'deposits', 'loans', 'insurance'] as Tab[]).map((t) => (
            <button key={t} className={`seg-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t === 'savings' ? 'Savings' : t === 'deposits' ? 'Deposits' : t === 'loans' ? 'Loans' : 'Insurance'}
            </button>
          ))}
        </div>

        {tab === 'savings' && <SavingsPanel savings={bank.savings} cash={cash} />}
        {tab === 'deposits' && <DepositsPanel />}
        {tab === 'loans' && <LoansPanel />}
        {tab === 'insurance' && <InsurancePanel />}
      </div>
    </>
  );
}

function InsurancePanel() {
  const active = useGameStore((s) => s.insurance);
  const buyInsurance = useGameStore((s) => s.buyInsurance);
  const cancelInsurance = useGameStore((s) => s.cancelInsurance);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="col" style={{ gap: 12, marginTop: 16 }}>
      <p className="faint" style={{ fontSize: 12, margin: '0 4px' }}>
        Insurance costs a small monthly premium but softens the blow when an
        unexpected expense event hits. A core part of a safe financial plan.
      </p>
      {INSURANCE_PLANS.map((plan) => {
        const on = active.includes(plan.id);
        return (
          <div key={plan.id} className="card card-pad col" style={{ gap: 10 }}>
            <div className="row between">
              <div className="row gap-8">
                <ShieldCheck size={18} className={on ? 'up' : 'muted'} />
                <div className="col" style={{ gap: 2 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{plan.name}</span>
                  <span className="faint" style={{ fontSize: 12 }}>{plan.description}</span>
                </div>
              </div>
              {on && <span className="pill pill-up"><Check size={12} /> Active</span>}
            </div>
            <div className="row between">
              <span className="faint mono" style={{ fontSize: 12 }}>
                {formatCurrency(plan.premium)}/mo · covers {Math.round(plan.coverage * 100)}%
              </span>
              {on ? (
                <button className="btn btn-ghost" onClick={() => { cancelInsurance(plan.id); setMsg('Cover cancelled'); }}>
                  Cancel
                </button>
              ) : (
                <button className="btn btn-primary" onClick={() => setMsg(buyInsurance(plan.id).message)}>
                  Get covered
                </button>
              )}
            </div>
          </div>
        );
      })}
      {msg && <div className="info-note">{msg}</div>}
    </div>
  );
}

/** Reusable amount stepper + input. */
function AmountInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="row gap-8">
      <button className="qty-btn" onClick={() => onChange(Math.max(0, value - 1000))} aria-label="Less">
        <Minus size={16} />
      </button>
      <input
        className="amount-field mono"
        type="number"
        value={value || ''}
        placeholder="0"
        onChange={(e) => onChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
      />
      <button className="qty-btn" onClick={() => onChange(value + 1000)} aria-label="More">
        <Plus size={16} />
      </button>
    </div>
  );
}

function SavingsPanel({ savings, cash }: { savings: number; cash: number }) {
  const deposit = useGameStore((s) => s.depositSavings);
  const withdraw = useGameStore((s) => s.withdrawSavings);
  const [amount, setAmount] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="col" style={{ gap: 12, marginTop: 14 }}>
      <div className="glass-card">
        <div className="row gap-8" style={{ marginBottom: 10 }}>
          <PiggyBank size={18} />
          <span style={{ fontWeight: 700 }}>Savings Account</span>
        </div>
        <div className="row between">
          <span className="faint" style={{ fontSize: 12 }}>Balance</span>
          <span className="mono" style={{ fontWeight: 800, fontSize: 18 }}>{formatCurrencyFull(savings)}</span>
        </div>
        <div className="row between" style={{ marginTop: 4 }}>
          <span className="faint" style={{ fontSize: 12 }}>Interest</span>
          <span className="up" style={{ fontWeight: 700, fontSize: 12 }}>{(SAVINGS_APR * 100).toFixed(1)}% p.a.</span>
        </div>
      </div>

      <div className="glass-card col" style={{ gap: 12 }}>
        <span className="faint" style={{ fontSize: 12 }}>Available cash: {formatCurrencyFull(cash)}</span>
        <AmountInput value={amount} onChange={(v) => { setAmount(v); setMsg(null); }} />
        {msg && <div className="trade-err">{msg}</div>}
        <div className="grid-2">
          <button
            className="btn btn-buy"
            onClick={() => { const r = deposit(amount); setMsg(r.ok ? null : r.message); if (r.ok) setAmount(0); }}
          >
            Deposit
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => { const r = withdraw(amount); setMsg(r.ok ? null : r.message); if (r.ok) setAmount(0); }}
          >
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
}

function DepositsPanel() {
  const bank = useGameStore((s) => s.bank);
  const cash = useGameStore((s) => s.player.cash);
  const month = useGameStore((s) => s.month);
  const openFD = useGameStore((s) => s.openFD);
  const [amount, setAmount] = useState(10000);
  const [term, setTerm] = useState(FD_PRODUCTS[1].termMonths);
  const [msg, setMsg] = useState<string | null>(null);
  const product = FD_PRODUCTS.find((p) => p.termMonths === term)!;
  const maturity = Math.round(amount * (1 + product.rate * (term / 12)));

  return (
    <div className="col" style={{ gap: 12, marginTop: 14 }}>
      <div className="glass-card col" style={{ gap: 12 }}>
        <div className="row gap-8">
          <Lock size={16} />
          <span style={{ fontWeight: 700 }}>Open Fixed Deposit</span>
        </div>
        <span className="faint" style={{ fontSize: 12 }}>Available cash: {formatCurrencyFull(cash)}</span>
        <AmountInput value={amount} onChange={(v) => { setAmount(v); setMsg(null); }} />
        <div className="row gap-8">
          {FD_PRODUCTS.map((p) => (
            <button
              key={p.termMonths}
              className={`chip-select ${term === p.termMonths ? 'on' : ''}`}
              onClick={() => setTerm(p.termMonths)}
            >
              {p.label} · {(p.rate * 100).toFixed(1)}%
            </button>
          ))}
        </div>
        <div className="row between">
          <span className="faint" style={{ fontSize: 12 }}>Matures in {term} months at</span>
          <span className="mono up" style={{ fontWeight: 800 }}>{formatCurrency(maturity)}</span>
        </div>
        {msg && <div className="trade-err">{msg}</div>}
        <button
          className="btn btn-primary btn-block"
          onClick={() => { const r = openFD(amount, term); setMsg(r.ok ? null : r.message); }}
        >
          Lock in Deposit
        </button>
      </div>

      {bank.deposits.length > 0 && (
        <>
          <div className="section-title" style={{ margin: '4px 4px 0' }}><span>Active Deposits</span></div>
          {bank.deposits.map((fd) => (
            <div key={fd.id} className="glass-card row between">
              <div className="col" style={{ gap: 3 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{formatCurrency(fd.principal)} FD</span>
                <span className="faint" style={{ fontSize: 11 }}>
                  {(fd.rate * 100).toFixed(1)}% · matures month {fd.maturityMonth} (in {Math.max(0, fd.maturityMonth - month)} mo)
                </span>
              </div>
              <div className="col" style={{ alignItems: 'flex-end' }}>
                <span className="up mono" style={{ fontWeight: 700, fontSize: 13 }}>
                  +{formatCurrency(fdAccrued(fd, month))}
                </span>
                <span className="faint" style={{ fontSize: 10 }}>accrued</span>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function LoansPanel() {
  const bank = useGameStore((s) => s.bank);
  const cash = useGameStore((s) => s.player.cash);
  const careerId = useGameStore((s) => s.player.careerId);
  const takeLoan = useGameStore((s) => s.takeLoan);
  const repayLoan = useGameStore((s) => s.repayLoan);
  const salary = getCareer(careerId)?.salary ?? 0;
  const [type, setType] = useState<LoanType>('personal');
  const [amount, setAmount] = useState(50000);
  const [msg, setMsg] = useState<string | null>(null);

  const product = LOAN_PRODUCTS.find((p) => p.type === type)!;
  const elig = loanEligibility(type, salary, bank.creditScore, bank);
  const emi = emiFor(Math.min(amount, elig.maxAmount || amount), product.rate, product.termMonths);

  return (
    <div className="col" style={{ gap: 12, marginTop: 14 }}>
      <div className="glass-card col" style={{ gap: 12 }}>
        <div className="row gap-8">
          <Landmark size={16} />
          <span style={{ fontWeight: 700 }}>Take a Loan</span>
        </div>
        <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
          {LOAN_PRODUCTS.map((p) => (
            <button
              key={p.type}
              className={`chip-select ${type === p.type ? 'on' : ''}`}
              onClick={() => { setType(p.type); setMsg(null); }}
            >
              <Icon name={p.icon} size={13} /> {p.title}
            </button>
          ))}
        </div>
        <p className="faint" style={{ fontSize: 12 }}>{product.description}</p>
        <div className="row between" style={{ fontSize: 12 }}>
          <span className="faint">Rate {(product.rate * 100).toFixed(1)}% · {product.termMonths} mo</span>
          <span className="faint">
            {elig.eligible ? `Eligible up to ${formatCurrency(elig.maxAmount)}` : elig.reason}
          </span>
        </div>
        <AmountInput value={amount} onChange={(v) => { setAmount(v); setMsg(null); }} />
        <div className="row between">
          <span className="faint" style={{ fontSize: 12 }}>Estimated EMI</span>
          <span className="mono" style={{ fontWeight: 800 }}>{formatCurrency(emi)}/mo</span>
        </div>
        {msg && <div className="trade-err">{msg}</div>}
        <button
          className="btn btn-primary btn-block"
          disabled={!elig.eligible}
          onClick={() => { const r = takeLoan(type, amount, product.termMonths); setMsg(r.ok ? null : r.message); }}
        >
          Borrow {formatCurrency(Math.min(amount, elig.maxAmount || amount))}
        </button>
      </div>

      {bank.loans.length > 0 && (
        <>
          <div className="section-title" style={{ margin: '4px 4px 0' }}><span>Active Loans</span></div>
          {bank.loans.map((l) => (
            <div key={l.id} className="glass-card col" style={{ gap: 10 }}>
              <div className="row between">
                <div className="col" style={{ gap: 3 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, textTransform: 'capitalize' }}>{l.type} loan</span>
                  <span className="faint" style={{ fontSize: 11 }}>
                    EMI {formatCurrency(l.emi)}/mo · {l.remainingMonths} mo left
                    {l.missedPayments > 0 ? ` · ${l.missedPayments} missed` : ''}
                  </span>
                </div>
                <div className="col" style={{ alignItems: 'flex-end' }}>
                  <span className="down mono" style={{ fontWeight: 800, fontSize: 14 }}>{formatCurrency(l.balance)}</span>
                  <span className="faint" style={{ fontSize: 10 }}>outstanding</span>
                </div>
              </div>
              <button
                className="btn btn-ghost btn-block"
                disabled={l.balance > cash}
                onClick={() => repayLoan(l.id)}
              >
                {l.balance > cash ? 'Not enough cash to close' : `Repay in full (${formatCurrency(l.balance)})`}
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
