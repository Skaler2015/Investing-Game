import { Wallet, Briefcase, TrendingUp } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency } from '../../utils/format';
import { computeNetWorth, computePortfolioStats } from '../../engine/economy';
import { bankEquity } from '../../engine/banking';
import { businessesEquity } from '../../engine/business';
import { propertiesEquity } from '../../engine/realEstate';

/**
 * Always-visible money summary rendered inside every screen's header (which
 * stays fixed above the scroll area), so the player's Cash, Invested value and
 * Net worth are on screen on every page at any scroll position.
 *
 * The Cash chip always shows; Invested and Net worth reveal on wider screens
 * (they're hidden on very narrow phones so the header never overflows). Each
 * chip taps through to the most relevant screen.
 */
export function CashChip() {
  const player = useGameStore((s) => s.player);
  const holdings = useGameStore((s) => s.holdings);
  const assets = useGameStore((s) => s.assets);
  const bank = useGameStore((s) => s.bank);
  const businesses = useGameStore((s) => s.businesses);
  const properties = useGameStore((s) => s.properties);
  const setScreen = useGameStore((s) => s.setScreen);

  const invested = computePortfolioStats(holdings, assets).investedValue;
  const netWorth =
    computeNetWorth(player.cash, holdings, assets) +
    bankEquity(bank) +
    businessesEquity(businesses) +
    propertiesEquity(properties);

  return (
    <div className="balance-bar">
      <button
        className="bchip cash"
        onClick={() => setScreen('market')}
        title={`Cash ${formatCurrency(player.cash)} · tap for Market`}
      >
        <Wallet size={13} />
        <span className="mono">{formatCurrency(player.cash)}</span>
      </button>
      <button
        className="bchip inv bchip-extra"
        onClick={() => setScreen('portfolio')}
        title={`Invested ${formatCurrency(invested)} · tap for Portfolio`}
      >
        <Briefcase size={13} />
        <span className="mono">{formatCurrency(invested)}</span>
      </button>
      <button
        className="bchip nw bchip-extra"
        onClick={() => setScreen('dashboard')}
        title={`Net worth ${formatCurrency(netWorth)} · tap for Home`}
      >
        <TrendingUp size={13} />
        <span className="mono">{formatCurrency(netWorth)}</span>
      </button>
    </div>
  );
}
