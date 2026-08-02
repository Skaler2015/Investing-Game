import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Coins, Zap, GraduationCap } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { Icon } from '../components/ui/Icon';
import { Sheet } from '../components/ui/Sheet';
import { LESSONS } from '../data/lessons';
import type { Lesson } from '../types';

export function Learn() {
  const setScreen = useGameStore((s) => s.setScreen);
  const completed = useGameStore((s) => s.completedLessons);
  const [active, setActive] = useState<Lesson | null>(null);

  const done = LESSONS.filter((l) => completed.includes(l.id)).length;

  return (
    <>
      <header className="app-header">
        <button className="icon-btn" onClick={() => setScreen('dashboard')} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <span style={{ fontWeight: 800, fontSize: 16 }}>Learn & Earn</span>
        <span style={{ width: 38 }} />
      </header>

      <div className="screen-scroll">
        <div className="glass-card row gap-12" style={{ marginTop: 4, alignItems: 'center' }}>
          <div className="career-hero-ic"><GraduationCap size={22} /></div>
          <div className="col" style={{ gap: 2, flex: 1 }}>
            <span style={{ fontWeight: 800, fontSize: 15 }}>Financial literacy</span>
            <span className="faint" style={{ fontSize: 12 }}>Learn a concept, ace the quiz, earn rewards.</span>
          </div>
          <span className="pill pill-up">{done}/{LESSONS.length}</span>
        </div>

        <div className="col" style={{ gap: 10, marginTop: 14 }}>
          {LESSONS.map((l) => {
            const isDone = completed.includes(l.id);
            return (
              <button key={l.id} className="glass-card row gap-12" onClick={() => setActive(l)} style={{ textAlign: 'left' }}>
                <div className="career-ic"><Icon name={l.icon} size={20} /></div>
                <div className="col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{l.title}</span>
                  <span className="faint" style={{ fontSize: 11.5 }}>{l.summary}</span>
                </div>
                {isDone ? (
                  <CheckCircle2 size={18} style={{ color: 'var(--up)' }} />
                ) : (
                  <div className="reward-tag"><Coins size={12} /> {l.rewardCoins}</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <LessonSheet key={active?.id ?? 'none'} lesson={active} onClose={() => setActive(null)} />
    </>
  );
}

function LessonSheet({ lesson, onClose }: { lesson: Lesson | null; onClose: () => void }) {
  const completed = useGameStore((s) => s.completedLessons);
  const complete = useGameStore((s) => s.completeLesson);
  const [choice, setChoice] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  if (!lesson) return <Sheet open={false} onClose={onClose} />;
  const isDone = completed.includes(lesson.id);
  const correct = choice === lesson.answer;

  const submit = () => {
    if (choice === null) return;
    setAnswered(true);
    if (choice === lesson.answer && !isDone) {
      complete(lesson.id, lesson.rewardCoins, lesson.rewardXp);
    }
  };

  const retry = () => {
    setAnswered(false);
    setChoice(null);
  };

  return (
    <Sheet open={!!lesson} onClose={onClose} title={lesson.title}>
      <div className="col" style={{ gap: 12 }}>
        {lesson.body.map((p, i) => (
          <p key={i} className="muted" style={{ fontSize: 13, lineHeight: 1.55 }}>{p}</p>
        ))}

        <div className="card card-pad col" style={{ gap: 10 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700 }}>Quick quiz</span>
          <span style={{ fontSize: 13 }}>{lesson.question}</span>
          <div className="col" style={{ gap: 8 }}>
            {lesson.options.map((opt, i) => {
              const state = !answered
                ? ''
                : i === lesson.answer
                ? 'correct'
                : i === choice
                ? 'wrong'
                : '';
              return (
                <button
                  key={i}
                  className={`quiz-opt ${choice === i ? 'sel' : ''} ${state}`}
                  onClick={() => !answered && setChoice(i)}
                  disabled={answered}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {answered ? (
            <div className={`quiz-result ${correct ? 'up' : 'down'}`}>
              {correct
                ? isDone
                  ? '✅ Correct! (already completed)'
                  : `✅ Correct! +${lesson.rewardCoins} coins · +${lesson.rewardXp} XP`
                : '❌ Not quite — review the lesson and try again.'}
            </div>
          ) : (
            <button className="btn btn-primary btn-block" onClick={submit} disabled={choice === null}>
              Submit Answer
            </button>
          )}

          {answered && !correct && (
            <button className="btn btn-ghost btn-block" onClick={retry}>
              Try again
            </button>
          )}
          {isDone && (
            <div className="row gap-8 up" style={{ fontSize: 12, fontWeight: 700, justifyContent: 'center' }}>
              <Zap size={13} /> Lesson completed
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}
