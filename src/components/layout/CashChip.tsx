import { Wallet } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency } from '../../utils/format';

/**
 * Always-visible spendable-cash pill. Rendered inside every screen's header
 * (which stays fixed above the scroll area), so the player's cash is on screen
 * on every page and at any scroll position. Tap it to jump to the Market.
 */
export function CashChip() {
  const cash = useGameStore((s) => s.player.cash);
  const setScreen = useGameStore((s) => s.setScreen);

  return (
    <button
      className="cash-chip"
      onClick={() => setScreen('market')}
      aria-label={`Cash balance ${formatCurrency(cash)} — open Market`}
      title="Spendable cash · tap for Market"
    >
      <Wallet size={14} />
      <span className="mono">{formatCurrency(cash)}</span>
    </button>
  );
}
