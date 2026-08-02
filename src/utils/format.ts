/** Formatting helpers. All money is virtual ₹ (Indian Rupees). */

/** Compact Indian-style currency: ₹1.2L, ₹3.4Cr, ₹9.9K. */
export function formatCurrency(value: number, opts?: { sign?: boolean }): string {
  const sign = opts?.sign && value > 0 ? '+' : '';
  const abs = Math.abs(value);
  const neg = value < 0 ? '-' : '';
  let out: string;
  if (abs >= 1e7) out = `₹${(abs / 1e7).toFixed(2)}Cr`;
  else if (abs >= 1e5) out = `₹${(abs / 1e5).toFixed(2)}L`;
  else if (abs >= 1e3) out = `₹${(abs / 1e3).toFixed(1)}K`;
  else out = `₹${abs.toFixed(0)}`;
  return `${sign}${neg}${out}`;
}

/** Full, grouped Indian-format currency: ₹1,23,456.78 */
export function formatCurrencyFull(value: number): string {
  const neg = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  const [intPart, decPart] = abs.toFixed(2).split('.');
  // Indian grouping: last 3 digits, then groups of 2.
  const lastThree = intPart.slice(-3);
  const other = intPart.slice(0, -3);
  const grouped = other
    ? other.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
    : lastThree;
  return `${neg}₹${grouped}.${decPart}`;
}

export function formatPct(value: number, opts?: { sign?: boolean }): string {
  const sign = opts?.sign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-IN');
}

/** Trim trailing zeros for fractional quantities (e.g. crypto). */
export function formatQty(value: number): string {
  if (Number.isInteger(value)) return value.toLocaleString('en-IN');
  return parseFloat(value.toFixed(4)).toString();
}

export function formatCompactNumber(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}L Cr`;
  if (value >= 1e7) return `${(value / 1e7).toFixed(1)}Cr`;
  if (value >= 1e5) return `${(value / 1e5).toFixed(1)}L`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return `${value}`;
}

/** YYYY-MM-DD in local time — used as a stable "day" key. */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** A stable week key (YYYY-Www) used to reset weekly challenges. */
export function weekKey(d: Date = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // nearest Thursday
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((date.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7
    );
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
