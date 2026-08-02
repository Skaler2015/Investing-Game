import { useState } from 'react';
import { PieChart, ArrowUpRight, ArrowDownRight, Inbox } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { AssetSheet } from '../components/game/AssetSheet';
import { DonutChart } from '../components/ui/DonutChart';
import { Icon } from '../components/ui/Icon';
import { useGameStore, colorForClass } from '../store/gameStore';
import { ASSET_CLASS_META } from '../data/assets';
import {
  computePortfolioStats,
  computeAllocation,
  findAsset,
} from '../engine/economy';
import type { Asset } from '../types';
import {
  formatCurrency,
  formatCurrencyFull,
  formatPct,
  formatQty,
  relativeTime,
} from '../utils/format';

type Tab = 'holdings' | 'allocation' | 'analytics' | 'history';

export function Portfolio() {
  const assets = useGameStore((s) => s.assets);
  const holdings = useGameStore((s) => s.holdings);
  const trades = useGameStore((s) => s.trades);
  const sips = useGameStore((s) => s.sips);
  const player = useGameStore((s) => s.player);
  const cancelSIP = useGameStore((s) => s.cancelSIP);
  const [tab, setTab] = useState<Tab>('holdings');
  const [selected, setSelected] = useState<Asset | null>(null);

  const stats = computePortfolioStats(holdings, assets);
  const allocation = computeAllocation(holdings, assets, colorForClass);
  const activeHoldings = holdings.filter((h) => h.quantity > 0);

  return (
    <>
      <Header title="Portfolio" subtitle="Track your investments" />
      <div className="screen-scroll">
        {/* Summary */}
        <div className="hero-card">
          <span className="muted" style={{ fontSize: 13 }}>
            Portfolio Value
          </span>
          <span className="mono" style={{ fontSize: 28, fontWeight: 800, marginTop: 2 }}>
            {formatCurrencyFull(stats.investedValue)}
          </span>
          <div className="row gap-8" style={{ marginTop: 6 }}>
            <span className={`pill ${stats.unrealizedPnl >= 0 ? 'pill-up' : 'pill-down'}`}>
              {stats.unrealizedPnl >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {formatCurrency(stats.unrealizedPnl, { sign: true })} (
              {formatPct(stats.unrealizedPnlPct, { sign: true })})
            </span>
            <span className="faint" style={{ fontSize: 12 }}>
              unrealised
            </span>
          </div>
          {stats.dailyPassiveIncome > 0 && (
            <div className="passive-strip">
              💸 Passive income: {formatCurrency(stats.dailyPassiveIncome)} / month
            </div>
          )}
        </div>

        {/* Active SIPs */}
        {sips.length > 0 && (
          <>
            <div className="section-title"><span>Active SIPs</span></div>
            <div className="col" style={{ gap: 8 }}>
              {sips.map((sip) => {
                const asset = findAsset(assets, sip.assetId);
                if (!asset) return null;
                return (
                  <div key={sip.id} className="history-row">
                    <div className="hist-badge buy">📅</div>
                    <div className="col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }} className="truncate">
                        {asset.name}
                      </span>
                      <span className="faint" style={{ fontSize: 11 }}>
                        {formatCurrency(sip.amount)} / month
                      </span>
                    </div>
                    <button className="link-btn" onClick={() => cancelSIP(sip.id)}>
                      Stop
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Tabs */}
        <div className="seg-tabs" style={{ marginTop: 14 }}>
          {(['holdings', 'allocation', 'analytics', 'history'] as Tab[]).map((t) => (
            <button
              key={t}
              className={`seg-tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'analytics' && (
          <AnalyticsPanel
            assets={assets}
            activeHoldings={activeHoldings}
            investedValue={stats.investedValue}
            unrealizedPnl={stats.unrealizedPnl}
            realizedPnl={player.realizedPnl}
          />
        )}

        {tab === 'holdings' && (
          <div className="col" style={{ gap: 10, marginTop: 14 }}>
            {activeHoldings.length === 0 && (
              <EmptyState text="You don't own any assets yet. Head to the Market to start investing." />
            )}
            {activeHoldings.map((h) => {
              const asset = findAsset(assets, h.assetId);
              if (!asset) return null;
              const value = asset.price * h.quantity;
              const pnl = (asset.price - h.avgCost) * h.quantity;
              const pnlPct = h.avgCost > 0 ? ((asset.price - h.avgCost) / h.avgCost) * 100 : 0;
              const meta = ASSET_CLASS_META[asset.assetClass];
              return (
                <button
                  key={h.assetId}
                  className="asset-card"
                  onClick={() => setSelected(asset)}
                >
                  <div
                    className="asset-ic"
                    style={{ background: `${meta.color}1f`, color: meta.color }}
                  >
                    <Icon name={meta.icon} size={20} color={meta.color} />
                  </div>
                  <div className="col" style={{ gap: 3, flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }} className="truncate">
                      {asset.name}
                    </span>
                    <span className="faint" style={{ fontSize: 11 }}>
                      {formatQty(h.quantity)} @ {formatCurrencyFull(h.avgCost)}
                    </span>
                  </div>
                  <div className="col" style={{ alignItems: 'flex-end', gap: 3 }}>
                    <span className="mono" style={{ fontWeight: 700, fontSize: 13 }}>
                      {formatCurrencyFull(value)}
                    </span>
                    <span className={`pill ${pnl >= 0 ? 'pill-up' : 'pill-down'}`}>
                      {formatPct(pnlPct, { sign: true })}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {tab === 'allocation' && (
          <div className="col" style={{ gap: 14, marginTop: 14, alignItems: 'center' }}>
            {allocation.length === 0 ? (
              <EmptyState text="No allocation to show. Buy assets to see your mix." />
            ) : (
              <>
                <DonutChart
                  slices={allocation.map((a) => ({
                    value: a.value,
                    color: a.color,
                    label: a.name,
                  }))}
                  centerLabel={`${allocation.length}`}
                  centerSub="assets"
                />
                <div className="col" style={{ gap: 8, width: '100%' }}>
                  {allocation.map((a) => (
                    <div key={a.assetId} className="row between alloc-row">
                      <div className="row gap-8">
                        <span className="dot" style={{ background: a.color }} />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</span>
                      </div>
                      <div className="row gap-12">
                        <span className="faint mono" style={{ fontSize: 12 }}>
                          {formatCurrency(a.value)}
                        </span>
                        <span className="mono" style={{ fontSize: 13, fontWeight: 700, minWidth: 44, textAlign: 'right' }}>
                          {a.pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'history' && (
          <div className="col" style={{ gap: 8, marginTop: 14 }}>
            {trades.length === 0 && (
              <EmptyState text="No trades yet. Your buy and sell history will appear here." />
            )}
            {trades.map((t) => (
              <div key={t.id} className="history-row">
                <div
                  className={`hist-badge ${t.side === 'buy' ? 'buy' : 'sell'}`}
                >
                  {t.side === 'buy' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                </div>
                <div className="col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }} className="truncate">
                    {t.side === 'buy' ? 'Bought' : 'Sold'} {t.assetName}
                  </span>
                  <span className="faint" style={{ fontSize: 11 }}>
                    {formatQty(t.quantity)} @ {formatCurrencyFull(t.price)} · {relativeTime(t.timestamp)}
                  </span>
                </div>
                <div className="col" style={{ alignItems: 'flex-end' }}>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 700 }}>
                    {formatCurrency(t.total)}
                  </span>
                  {t.side === 'sell' && (
                    <span
                      className={`mono ${t.realizedPnl >= 0 ? 'up' : 'down'}`}
                      style={{ fontSize: 11, fontWeight: 700 }}
                    >
                      {formatCurrency(t.realizedPnl, { sign: true })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'allocation' && allocation.length > 0 && (
          <div className="row gap-8 faint" style={{ justifyContent: 'center', marginTop: 16, fontSize: 11 }}>
            <PieChart size={13} /> Diversify to reduce risk
          </div>
        )}
      </div>

      <AssetSheet asset={selected} open={!!selected} onClose={() => setSelected(null)} />
    </>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="empty-state">
      <Inbox size={30} className="faint" />
      <span className="muted" style={{ fontSize: 13, textAlign: 'center', maxWidth: 260 }}>
        {text}
      </span>
    </div>
  );
}

/** Deeper portfolio analytics: returns, best/worst holding, invested cost. */
function AnalyticsPanel({
  assets,
  activeHoldings,
  investedValue,
  unrealizedPnl,
  realizedPnl,
}: {
  assets: Asset[];
  activeHoldings: { assetId: string; quantity: number; avgCost: number }[];
  investedValue: number;
  unrealizedPnl: number;
  realizedPnl: number;
}) {
  const costBasis = activeHoldings.reduce((sum, h) => sum + h.avgCost * h.quantity, 0);
  const totalReturnPct = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0;

  const ranked = activeHoldings
    .map((h) => {
      const asset = findAsset(assets, h.assetId);
      const price = asset?.price ?? h.avgCost;
      const pnl = (price - h.avgCost) * h.quantity;
      const pnlPct = h.avgCost > 0 ? ((price - h.avgCost) / h.avgCost) * 100 : 0;
      return { name: asset?.name ?? h.assetId, symbol: asset?.symbol ?? '', pnl, pnlPct };
    })
    .sort((a, b) => b.pnlPct - a.pnlPct);
  const best = ranked[0];
  const worst = ranked.length > 1 ? ranked[ranked.length - 1] : undefined;

  if (activeHoldings.length === 0) {
    return (
      <div style={{ marginTop: 14 }}>
        <EmptyState text="Buy a few assets to unlock your performance analytics." />
      </div>
    );
  }

  const Stat = ({ label, value, cls }: { label: string; value: string; cls?: string }) => (
    <div className="mini-stat">
      <span className="faint" style={{ fontSize: 11 }}>{label}</span>
      <span className={`mono ${cls ?? ''}`} style={{ fontWeight: 700 }}>{value}</span>
    </div>
  );

  return (
    <div className="col" style={{ gap: 12, marginTop: 14 }}>
      <div className="grid-2">
        <Stat label="Invested (cost)" value={formatCurrency(costBasis)} />
        <Stat label="Current value" value={formatCurrency(investedValue)} />
        <Stat label="Unrealised P&L" value={formatCurrency(unrealizedPnl, { sign: true })} cls={unrealizedPnl >= 0 ? 'up' : 'down'} />
        <Stat label="Realised P&L" value={formatCurrency(realizedPnl, { sign: true })} cls={realizedPnl >= 0 ? 'up' : 'down'} />
      </div>

      <div className="card card-pad col" style={{ gap: 6 }}>
        <span className="faint" style={{ fontSize: 11 }}>Overall return on holdings</span>
        <span className={`mono ${totalReturnPct >= 0 ? 'up' : 'down'}`} style={{ fontSize: 24, fontWeight: 800 }}>
          {formatPct(totalReturnPct, { sign: true })}
        </span>
      </div>

      {best && (
        <div className="card card-pad row between">
          <div className="col" style={{ gap: 2 }}>
            <span className="faint" style={{ fontSize: 11 }}>🏆 Best performer</span>
            <span style={{ fontWeight: 700, fontSize: 14 }} className="truncate">{best.name}</span>
          </div>
          <span className={`mono ${best.pnlPct >= 0 ? 'up' : 'down'}`} style={{ fontWeight: 800 }}>
            {formatPct(best.pnlPct, { sign: true })}
          </span>
        </div>
      )}
      {worst && (
        <div className="card card-pad row between">
          <div className="col" style={{ gap: 2 }}>
            <span className="faint" style={{ fontSize: 11 }}>📉 Weakest performer</span>
            <span style={{ fontWeight: 700, fontSize: 14 }} className="truncate">{worst.name}</span>
          </div>
          <span className={`mono ${worst.pnlPct >= 0 ? 'up' : 'down'}`} style={{ fontWeight: 800 }}>
            {formatPct(worst.pnlPct, { sign: true })}
          </span>
        </div>
      )}
    </div>
  );
}
