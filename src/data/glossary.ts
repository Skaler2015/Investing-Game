/**
 * Plain-language glossary of the financial terms used across the game.
 * Definitions are intentionally short and beginner-friendly (Hinglish-aware
 * English). Educational content only.
 */
export interface GlossaryTerm {
  term: string;
  short: string;
  detail: string;
}

export const GLOSSARY: GlossaryTerm[] = [
  { term: 'Net Worth', short: 'What you truly own', detail: 'Everything you own (cash, investments, savings, business, property) minus everything you owe (loans). The single best number for tracking wealth.' },
  { term: 'Portfolio', short: 'All your investments together', detail: 'The full collection of assets you hold — stocks, funds, crypto, gold and more.' },
  { term: 'Diversification', short: "Don't put all eggs in one basket", detail: 'Spreading money across different assets so one bad performer can’t sink you. Lowers risk without killing returns.' },
  { term: 'SIP', short: 'Auto-invest every month', detail: 'Systematic Investment Plan — a fixed amount invested automatically each month. Smooths out price ups and downs over time (rupee-cost averaging).' },
  { term: 'Dividend', short: 'Income just for holding', detail: 'A share of profits some companies/funds pay out to holders — passive income while you keep the asset.' },
  { term: 'P/E Ratio', short: 'Price vs earnings', detail: 'Price ÷ earnings-per-share. A rough gauge of how expensive a stock is relative to its profits. Very high can mean overpriced.' },
  { term: 'EPS', short: 'Profit per share', detail: 'Earnings Per Share — the company’s profit divided by its number of shares.' },
  { term: 'Market Cap', short: 'Company size', detail: 'Total value of a company: share price × number of shares. Large-cap = big & stable, small-cap = riskier & faster-moving.' },
  { term: 'Volatility', short: 'How wildly price swings', detail: 'Bigger swings = higher volatility = more risk (and more chance for quick gains or losses).' },
  { term: 'Bull / Bear Market', short: 'Rising vs falling market', detail: 'Bull = prices generally rising and optimistic; Bear = prices falling and fearful.' },
  { term: 'Capital Gains', short: 'Profit on a sale', detail: 'The profit you make when you sell an asset for more than you paid. Often taxed (short-term gains are taxed in this game).' },
  { term: 'Liquidity', short: 'How fast you can cash out', detail: 'How quickly an asset can be sold for cash without losing value. Stocks are liquid; property is not.' },
  { term: 'Emergency Fund', short: '3–6 months of expenses, safe', detail: 'Money kept safe (like savings) to cover several months of costs if income stops. Your first financial safety net.' },
  { term: 'EMI', short: 'Monthly loan payment', detail: 'Equated Monthly Instalment — the fixed amount you repay on a loan each month (part interest, part principal).' },
  { term: 'Credit Score', short: 'Your borrowing trust score', detail: 'A number (300–900 here) showing how reliably you repay. Higher = bigger, cheaper loans. On-time EMIs raise it; misses drop it.' },
  { term: 'Compound Interest', short: 'Interest on your interest', detail: 'When your earnings also start earning. The reason starting early and staying invested matters so much.' },
  { term: 'Asset Allocation', short: 'Your mix of investments', detail: 'How your money is split across asset types (stocks vs bonds vs gold…). Drives most of your risk and return.' },
  { term: 'Stop-Loss', short: 'Auto-sell to limit loss', detail: 'A resting order that sells automatically if the price falls to a level you set — caps how much you can lose.' },
  { term: 'Take-Profit', short: 'Auto-sell to lock a gain', detail: 'A resting order that sells automatically once the price rises to your target — locks in profit without watching.' },
  { term: 'Passive Income', short: 'Money without active work', detail: 'Earnings that keep coming with little effort — dividends, rent, interest, business profit.' },
];
