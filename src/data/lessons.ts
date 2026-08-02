import type { Lesson } from '../types';

/** Bite-sized financial-literacy lessons, each with a reward-bearing quiz. */
export const LESSONS: Lesson[] = [
  {
    id: 'basics', title: 'Investing Basics', icon: 'Sparkles',
    summary: 'Why invest at all?',
    body: [
      'Investing means putting money into assets that can grow in value or pay income, instead of leaving it idle.',
      'Over long periods, investments like stocks and funds have historically beaten inflation, growing your real wealth.',
      'The earlier you start, the more time compounding has to work — small amounts add up dramatically over years.',
    ],
    question: 'What is the main reason to invest rather than hold only cash?',
    options: ['To beat inflation and grow wealth', 'To avoid all risk', 'Because cash is illegal', 'To pay more tax'],
    answer: 0, rewardCoins: 80, rewardXp: 60,
  },
  {
    id: 'compounding', title: 'The Power of Compounding', icon: 'TrendingUp',
    summary: 'Interest on your interest.',
    body: [
      'Compounding is when your returns themselves start earning returns.',
      'At 12% a year, money roughly doubles every 6 years — ₹1 lakh becomes ₹8 lakh in ~18 years without adding a rupee.',
      'The key ingredients are time and consistency, not timing the market.',
    ],
    question: 'What makes compounding so powerful over time?',
    options: ['Returns earning further returns', 'Guaranteed profits', 'Zero risk', 'Government subsidy'],
    answer: 0, rewardCoins: 90, rewardXp: 70,
  },
  {
    id: 'diversify', title: 'Diversification', icon: 'LayoutGrid',
    summary: "Don't put all eggs in one basket.",
    body: [
      'Diversification means spreading money across different assets and classes (stocks, funds, gold, bonds, real estate).',
      'When one asset falls, others may rise or hold steady — this smooths your overall returns and cuts risk.',
      'A diversified portfolio is far less likely to be wiped out by any single bad bet.',
    ],
    question: 'Diversification mainly helps you to…',
    options: ['Reduce overall portfolio risk', 'Guarantee the highest return', 'Avoid all taxes', 'Trade faster'],
    answer: 0, rewardCoins: 90, rewardXp: 70,
  },
  {
    id: 'sip', title: 'SIP & Rupee-Cost Averaging', icon: 'PiggyBank',
    summary: 'Invest a fixed amount every month.',
    body: [
      'A SIP (Systematic Investment Plan) invests a fixed sum on a schedule, regardless of price.',
      'You automatically buy more units when prices are low and fewer when high — this is rupee-cost averaging.',
      'SIPs build discipline and remove the stress of trying to time the market.',
    ],
    question: 'A SIP helps investors by…',
    options: ['Averaging cost and building discipline', 'Timing the market perfectly', 'Removing all risk', 'Doubling money monthly'],
    answer: 0, rewardCoins: 90, rewardXp: 70,
  },
  {
    id: 'emergency', title: 'Emergency Fund', icon: 'Sparkles',
    summary: 'Your financial safety net.',
    body: [
      'An emergency fund is easily-accessible savings covering 3–6 months of expenses.',
      'It stops you from selling investments at a loss or taking costly loans when life throws surprises.',
      'Build it first, before chasing high-risk, high-return bets.',
    ],
    question: 'How large should an emergency fund typically be?',
    options: ['3–6 months of expenses', '1 day of expenses', '10 years of salary', 'It is unnecessary'],
    answer: 0, rewardCoins: 80, rewardXp: 60,
  },
  {
    id: 'risk', title: 'Risk vs Reward', icon: 'Activity',
    summary: 'Higher returns come with higher risk.',
    body: [
      'Every investment trades off risk and reward: safer assets (FDs, bonds) return less; riskier ones (stocks, crypto) can return more — or lose more.',
      'Your right mix depends on your goals and how long you can stay invested.',
      'Never invest money you will need soon into volatile assets.',
    ],
    question: 'Which is generally the riskiest of these?',
    options: ['Cryptocurrency', 'Fixed Deposit', 'Government Bond', 'Savings account'],
    answer: 0, rewardCoins: 90, rewardXp: 70,
  },
  {
    id: 'tax', title: 'Taxes on Investing', icon: 'TrendingUp',
    summary: 'Keep more of what you earn.',
    body: [
      'Salary is taxed via income-tax slabs; profits from selling investments attract capital-gains tax.',
      'Holding longer can reduce tax, and some instruments offer tax benefits.',
      'Always think in after-tax returns — that is the money you actually keep.',
    ],
    question: 'What is taxed when you sell an investment at a profit?',
    options: ['Capital gains', 'Nothing ever', 'Only the loss', 'Your salary'],
    answer: 0, rewardCoins: 100, rewardXp: 80,
  },
  {
    id: 'debt', title: 'Good Debt vs Bad Debt', icon: 'Activity',
    summary: 'Not all loans are equal.',
    body: [
      'Debt used to build wealth (a home, a business) can be "good" if the return exceeds the interest.',
      '"Bad" debt funds consumption at high interest and drags you down — like unpaid credit-card balances.',
      'Keep EMIs comfortable and protect your credit score by paying on time.',
    ],
    question: 'Which is usually an example of "bad" debt?',
    options: ['High-interest credit-card balance', 'A sensible home loan', 'A business loan that grows profit', 'None are debt'],
    answer: 0, rewardCoins: 100, rewardXp: 80,
  },
];
