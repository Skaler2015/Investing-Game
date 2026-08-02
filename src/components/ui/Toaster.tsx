import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { Newspaper, PartyPopper, Info, Gift, AlertTriangle } from 'lucide-react';
import type { Toast } from '../../types';

const ICONS = {
  info: Info,
  success: PartyPopper,
  reward: Gift,
  event: Newspaper,
  warning: AlertTriangle,
} as const;

function ToastRow({ toast }: { toast: Toast }) {
  const dismiss = useGameStore((s) => s.dismissToast);
  const IconCmp = ICONS[toast.kind];
  return (
    <motion.div
      layout
      className={`toast toast-${toast.kind}`}
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
      onClick={() => dismiss(toast.id)}
    >
      <div className="toast-ic">
        <IconCmp size={18} />
      </div>
      <div className="col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
        <span style={{ fontWeight: 700, fontSize: 13 }}>{toast.title}</span>
        {toast.message && (
          <span className="muted" style={{ fontSize: 12 }}>
            {toast.message}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export function Toaster() {
  const toasts = useGameStore((s) => s.toasts);
  return (
    <div className="toaster">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastRow key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
