import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Briefcase } from 'lucide-react';
import { CAREERS } from '../data/careers';
import { Icon } from '../components/ui/Icon';
import { useGameStore } from '../store/gameStore';
import { formatCurrency } from '../utils/format';

/**
 * One-time career picker shown after a player's first login. The chosen career
 * drives the monthly salary/expense cash-flow engine. Also reachable later
 * from the Profile screen to switch careers.
 */
export function CareerSelect({ onDone }: { onDone?: () => void }) {
  const setCareer = useGameStore((s) => s.setCareer);
  const current = useGameStore((s) => s.player.careerId);
  const [selected, setSelected] = useState<string | null>(current);

  const confirm = () => {
    if (!selected) return;
    setCareer(selected);
    onDone?.();
  };

  return (
    <div className="screen-scroll" style={{ paddingTop: 18 }}>
      <div className="row gap-12" style={{ marginBottom: 6 }}>
        <div className="career-hero-ic">
          <Briefcase size={22} />
        </div>
        <div className="col" style={{ gap: 2 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Choose your career</h1>
          <p className="muted" style={{ fontSize: 13 }}>
            Your job pays a monthly salary to invest — and has living costs.
          </p>
        </div>
      </div>

      <div className="col" style={{ gap: 10, marginTop: 14 }}>
        {CAREERS.map((c) => {
          const active = selected === c.id;
          const net = c.salary - c.expenses;
          return (
            <motion.button
              key={c.id}
              className={`career-card ${active ? 'active' : ''}`}
              onClick={() => setSelected(c.id)}
              whileTap={{ scale: 0.985 }}
            >
              <div className="career-ic">
                <Icon name={c.icon} size={22} />
              </div>
              <div className="col" style={{ gap: 3, flex: 1, minWidth: 0, textAlign: 'left' }}>
                <span style={{ fontWeight: 700, fontSize: 14.5 }}>{c.title}</span>
                <span className="faint" style={{ fontSize: 11.5, lineHeight: 1.4 }}>
                  {c.description}
                </span>
                <div className="row gap-8" style={{ marginTop: 3, flexWrap: 'wrap' }}>
                  <span className="career-tag up">+{formatCurrency(c.salary)}/mo</span>
                  <span className="career-tag down">−{formatCurrency(c.expenses)}/mo</span>
                  <span className="career-tag net">net {formatCurrency(net, { sign: true })}</span>
                </div>
              </div>
              <div className={`career-radio ${active ? 'on' : ''}`} />
            </motion.button>
          );
        })}
      </div>

      <button
        className="btn btn-primary btn-block career-confirm"
        onClick={confirm}
        disabled={!selected}
      >
        Start Building Wealth <ArrowRight size={17} />
      </button>
    </div>
  );
}
