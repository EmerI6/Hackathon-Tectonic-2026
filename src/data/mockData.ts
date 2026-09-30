/**
 * Hardcoded demo data for the KBC Moments proof of concept.
 *
 * All names (employers, merchants, notaries...) are fictional.
 * Nothing in the UI imports this file directly: go through `src/api/*`
 * so this module can be replaced by real API calls later.
 */
import type {
  ConsentCategory,
  ConsentSettings,
  Customer,
  Transaction,
  TransactionCategory,
} from '../types';

let seq = 0;
function tx(
  date: string,
  merchant: string,
  category: TransactionCategory,
  amount: number,
  extra: Partial<Transaction> = {},
): Transaction {
  seq += 1;
  return { id: `tx-${seq}`, date, merchant, category, amount, ...extra };
}

export const consentCategories: ConsentCategory[] = [
  {
    id: 'career',
    label: 'New job & income changes',
    description: 'Salary changes, a new employer or a first job.',
    sensitive: false,
  },
  {
    id: 'home',
    label: 'Buying or renovating a home',
    description: 'Notary payments, mortgage simulations, renovation costs.',
    sensitive: false,
  },
  {
    id: 'moving',
    label: 'Moving house',
    description: 'A new address, new utility contracts or rent payments.',
    sensitive: false,
  },
  {
    id: 'car',
    label: 'Buying a car',
    description: 'Car dealer payments, leasing or vehicle registration.',
    sensitive: false,
  },
  {
    id: 'retirement',
    label: 'Preparing for retirement',
    description: 'End-of-career schemes, pension planning and savings.',
    sensitive: false,
  },
  {
    id: 'family',
    label: 'Family & new baby',
    description: 'Birth allowances, childcare and maternity-related spending.',
    sensitive: true,
  },
  {
    id: 'health',
    label: 'Health & care',
    description: 'Hospital, pharmacy and care-related payments.',
    sensitive: true,
  },
];

/** Sensitive moments are OFF until the customer explicitly opts in. */
export const defaultConsent: ConsentSettings = consentCategories.reduce(
  (acc, c) => ({ ...acc, [c.id]: !c.sensitive }),
  {} as ConsentSettings,
);

/* ------------------------------------------------------------------ */
/* Emma, 27 — new job                                                  */
/* ------------------------------------------------------------------ */

function emmaMonth(month: string): Transaction[] {
  return [
    tx(`2026-${month}-28`, 'Brusselia Retail NV', 'salary', 2450, { description: 'Salary' }),
    tx(`2026-${month}-26`, 'FreshMarkt Ixelles', 'groceries', -64.3),
    tx(`2026-${month}-22`, 'Café De Kroon', 'restaurant', -18.5),
    tx(`2026-${month}-15`, 'TelNet Belgium', 'utilities', -39.99, { description: 'Mobile & internet' }),
    tx(`2026-${month}-08`, 'FreshMarkt Ixelles', 'groceries', -52.1),
    tx(`2026-${month}-03`, 'MealCard Benelux', 'meal-vouchers', 176, {
      description: 'Meal vouchers · Brusselia Retail',
    }),
    tx(`2026-${month}-02`, 'BrusselsMove', 'transport', -49, { description: 'Monthly transit pass' }),
    tx(`2026-${month}-01`, 'Immo Louise', 'housing', -875, { description: 'Rent' }),
  ];
}

const emma: Customer = {
  id: 'emma',
  firstName: 'Emma',
  displayName: 'Emma Janssens',
  age: 27,
  persona: 'Just started a new job',
  city: 'Ixelles, Brussels',
  avatarColor: '#00AEEF',
  balances: { current: 1842.35, savings: 3250 },
  history: [
    { key: '2026-07', label: 'Jul', transactions: emmaMonth('07'), },
    { key: '2026-08', label: 'Aug', transactions: emmaMonth('08'), },
    { key: '2026-09', label: 'Sep', transactions: emmaMonth('09'), },
  ],
  upcoming: [
    {
      key: '2026-10',
      label: 'Oct',
      unlocksSignals: ['emma-new-employer', 'emma-salary-stopped', 'emma-income-up'],
      transactions: [
        tx('2026-10-30', 'Lumen Analytics BV', 'salary', 2850, {
          description: 'Salary · first payment',
          signal: { label: 'New employer' },
        }),
        tx('2026-10-24', 'Frituur ’t Hoekske', 'restaurant', -14.8),
        tx('2026-10-20', 'FreshMarkt Ixelles', 'groceries', -71.25),
        tx('2026-10-15', 'TelNet Belgium', 'utilities', -39.99, { description: 'Mobile & internet' }),
        tx('2026-10-06', 'Brusselia Retail NV', 'salary', 1124.6, {
          description: 'Final settlement & exit holiday pay',
          signal: { label: 'Previous salary stopped' },
        }),
        tx('2026-10-03', 'MealCard Benelux', 'meal-vouchers', 220, {
          description: 'Meal vouchers · Lumen Analytics',
          signal: { label: 'New employer' },
        }),
        tx('2026-10-02', 'BrusselsMove', 'transport', -49, { description: 'Monthly transit pass' }),
        tx('2026-10-01', 'Immo Louise', 'housing', -875, { description: 'Rent' }),
      ],
    },
  ],
  moment: {
    id: 'moment-emma-new-job',
    type: 'career',
    title: 'New job',
    headline: 'Congratulations on your new job!',
    message:
      'Exciting times, Emma! Your income went up by €400 a month. Setting a little aside now is the easiest way to build a safety net without even noticing it.',
    notification: 'Congratulations on your new job, Emma! We have a small tip to make the most of it.',
    threshold: 75,
    channel: 'Push notification · KBC Mobile',
    signals: [
      {
        id: 'emma-new-employer',
        label: 'New employer salary',
        customerExplanation: 'Your salary now comes from a new employer, Lumen Analytics.',
        source: 'Income',
        weight: 40,
      },
      {
        id: 'emma-salary-stopped',
        label: 'Previous salary stopped',
        customerExplanation: 'Brusselia Retail paid a final settlement instead of your usual salary.',
        source: 'Transactions',
        weight: 30,
      },
      {
        id: 'emma-income-up',
        label: 'Income change',
        customerExplanation: 'Your monthly income increased by €400.',
        source: 'Income',
        weight: 22,
      },
    ],
    recommendation: {
      id: 'rec-emma-autosave',
      title: 'Save €100 automatically every month',
      description:
        'A monthly transfer to your savings account on payday. That is €1,200 extra in a year — and you can pause it anytime.',
      ctaLabel: 'Start saving €100/month',
      confirmation: 'Done! €100 will move to your savings account on the 1st of every month.',
      product: 'Automatic savings plan',
    },
  },
};

/* ------------------------------------------------------------------ */
/* Lucas & Sarah, 32 — buying a house                                  */
/* ------------------------------------------------------------------ */

function lucasSarahMonth(month: string): Transaction[] {
  return [
    tx(`2026-${month}-28`, 'Vandenbroeck Engineering NV', 'salary', 3120, { description: 'Salary · Lucas' }),
    tx(`2026-${month}-27`, 'AZ Sint-Rombout', 'salary', 2780, { description: 'Salary · Sarah' }),
    tx(`2026-${month}-21`, 'Marché Frais Mechelen', 'groceries', -118.4),
    tx(`2026-${month}-12`, 'Groeipakket', 'family', 181.02, { description: 'Family allowance' }),
    tx(`2026-${month}-10`, 'Kinderdagverblijf Het Bijtje', 'family', -420, { description: 'Daycare' }),
    tx(`2026-${month}-05`, 'MealCard Benelux', 'meal-vouchers', 352, { description: 'Meal vouchers' }),
    tx(`2026-${month}-01`, 'Residentie Dijle', 'housing', -1150, { description: 'Rent' }),
  ];
}

const lucasSarah: Customer = {
  id: 'lucas-sarah',
  firstName: 'Lucas & Sarah',
  displayName: 'Lucas & Sarah Peeters',
  age: 32,
  persona: 'Buying their first house',
  city: 'Mechelen',
  avatarColor: '#7B61FF',
  balances: { current: 4320.18, savings: 38540 },
  history: [
    { key: '2026-08', label: 'Aug', transactions: lucasSarahMonth('08'), },
    { key: '2026-09', label: 'Sep', transactions: lucasSarahMonth('09'), },
  ],
  upcoming: [
    {
      key: '2026-10',
      label: 'Oct',
      unlocksSignals: ['ls-simulator', 'ls-inspection'],
      transactions: [
        tx('2026-10-28', 'Vandenbroeck Engineering NV', 'salary', 3120, { description: 'Salary · Lucas' }),
        tx('2026-10-27', 'AZ Sint-Rombout', 'salary', 2780, { description: 'Salary · Sarah' }),
        tx('2026-10-18', 'Bouwkeuring Mertens BV', 'housing', -350, {
          description: 'Pre-purchase building inspection',
          signal: { label: 'Home purchase' },
        }),
        tx('2026-10-12', 'Groeipakket', 'family', 181.02, { description: 'Family allowance' }),
        tx('2026-10-10', 'Kinderdagverblijf Het Bijtje', 'family', -420, { description: 'Daycare' }),
        tx('2026-10-01', 'Residentie Dijle', 'housing', -1150, { description: 'Rent' }),
      ],
    },
    {
      key: '2026-11',
      label: 'Nov',
      savingsDelta: -32000,
      unlocksSignals: ['ls-notary', 'ls-savings'],
      transactions: [
        tx('2026-11-27', 'Vandenbroeck Engineering NV', 'salary', 3120, { description: 'Salary · Lucas' }),
        tx('2026-11-26', 'AZ Sint-Rombout', 'salary', 2780, { description: 'Salary · Sarah' }),
        tx('2026-11-14', 'Notariskantoor Peeters & De Smet', 'notary', -32000, {
          description: '10% deposit · sales agreement',
          signal: { label: 'Notary payment' },
        }),
        tx('2026-11-13', 'Transfer from savings', 'savings', 32000, {
          description: 'From savings account',
          signal: { label: 'Large savings withdrawal' },
        }),
        tx('2026-11-12', 'Groeipakket', 'family', 181.02, { description: 'Family allowance' }),
        tx('2026-11-01', 'Residentie Dijle', 'housing', -1150, { description: 'Rent' }),
      ],
    },
  ],
  moment: {
    id: 'moment-ls-home',
    type: 'home',
    title: 'Buying a home',
    headline: 'Your new home is getting closer!',
    message:
      'Signing a sales agreement is a big step, Lucas & Sarah. Let’s make the next one simple: your personal mortgage offer is ready to review.',
    notification: 'Big step, Lucas & Sarah! Your personal mortgage offer is ready.',
    threshold: 75,
    channel: 'Push notification + advisor follow-up',
    signals: [
      {
        id: 'ls-notary',
        label: 'Notary deposit payment',
        customerExplanation: 'You paid a €32,000 deposit to a notary office.',
        source: 'Transactions',
        weight: 35,
      },
      {
        id: 'ls-simulator',
        label: 'Mortgage simulator used',
        customerExplanation: 'You used the mortgage simulator in the app 4 times this month.',
        source: 'In-app behaviour',
        weight: 25,
      },
      {
        id: 'ls-inspection',
        label: 'Building inspection',
        customerExplanation: 'You paid for a pre-purchase building inspection.',
        source: 'Transactions',
        weight: 15,
      },
      {
        id: 'ls-savings',
        label: 'Large savings withdrawal',
        customerExplanation: 'You moved €32,000 from your savings account.',
        source: 'Savings',
        weight: 13,
      },
    ],
    recommendation: {
      id: 'rec-ls-mortgage',
      title: 'Get your personal mortgage offer',
      description:
        '€288,000 over 25 years, from €1,295/month. Includes the home insurance you need at signing.',
      ctaLabel: 'View my mortgage offer',
      confirmation: 'Your offer is saved. A home-loan expert will confirm it within 24 hours.',
      product: 'Home loan + home insurance',
    },
  },
};

/* ------------------------------------------------------------------ */
/* Marc, 63 — approaching retirement                                   */
/* ------------------------------------------------------------------ */

function marcMonth(month: string): Transaction[] {
  return [
    tx(`2026-${month}-28`, 'Brabant Logistics NV', 'salary', 3640, { description: 'Salary' }),
    tx(`2026-${month}-24`, 'Tennisclub Heverlee', 'leisure', -45),
    tx(`2026-${month}-19`, 'Marché Frais Leuven', 'groceries', -96.7),
    tx(`2026-${month}-15`, 'Pension savings plan', 'pension', -85, { description: 'Monthly contribution' }),
    tx(`2026-${month}-09`, 'Stroom Energie', 'utilities', -132, { description: 'Gas & electricity' }),
    tx(`2026-${month}-04`, 'Restaurant De Molen', 'restaurant', -68),
  ];
}

const marc: Customer = {
  id: 'marc',
  firstName: 'Marc',
  displayName: 'Marc Dubois',
  age: 63,
  persona: 'Approaching retirement',
  city: 'Leuven',
  avatarColor: '#F5A623',
  balances: { current: 6780.4, savings: 72300 },
  history: [
    { key: '2026-08', label: 'Aug', transactions: marcMonth('08'), },
    { key: '2026-09', label: 'Sep', transactions: marcMonth('09'), },
  ],
  upcoming: [
    {
      key: '2026-10',
      label: 'Oct',
      unlocksSignals: ['marc-salary', 'marc-planner'],
      transactions: [
        tx('2026-10-28', 'Brabant Logistics NV', 'salary', 2980, {
          description: 'Salary · 4/5 end-of-career scheme',
          signal: { label: 'Salary decreased' },
        }),
        tx('2026-10-24', 'Tennisclub Heverlee', 'leisure', -45),
        tx('2026-10-15', 'Pension savings plan', 'pension', -85, { description: 'Monthly contribution' }),
        tx('2026-10-09', 'Stroom Energie', 'utilities', -132, { description: 'Gas & electricity' }),
        tx('2026-10-05', 'Marché Frais Leuven', 'groceries', -88.7),
      ],
    },
    {
      key: '2026-11',
      label: 'Nov',
      unlocksSignals: ['marc-group-insurance', 'marc-age'],
      transactions: [
        tx('2026-11-28', 'Brabant Logistics NV', 'salary', 2980, {
          description: 'Salary · 4/5 end-of-career scheme',
        }),
        tx('2026-11-20', 'Fidelia Group Insurance', 'insurance', 0, {
          description: 'Statement: supplementary pension payout 2028',
          signal: { label: 'Pension payout planned' },
        }),
        tx('2026-11-15', 'Pension savings plan', 'pension', -85, { description: 'Monthly contribution' }),
        tx('2026-11-09', 'Stroom Energie', 'utilities', -132, { description: 'Gas & electricity' }),
        tx('2026-11-03', 'Travel Horizon', 'leisure', -123, { description: 'Travel brochure & booking fee' }),
      ],
    },
  ],
  moment: {
    id: 'moment-marc-retirement',
    type: 'retirement',
    title: 'Preparing for retirement',
    headline: 'Your retirement is coming into view',
    message:
      'You’ve worked hard for this, Marc. With a clear plan, your savings can turn into a comfortable extra monthly income from day one of your retirement.',
    notification: 'Marc, let’s turn your savings into a steady retirement income.',
    threshold: 75,
    channel: 'In-app message + advisor call',
    signals: [
      {
        id: 'marc-salary',
        label: 'Salary reduced to 4/5',
        customerExplanation: 'Your salary decreased by 18%, in line with an end-of-career scheme.',
        source: 'Income',
        weight: 30,
      },
      {
        id: 'marc-planner',
        label: 'Pension planner visits',
        customerExplanation: 'You opened the pension planner in the app 3 times.',
        source: 'In-app behaviour',
        weight: 25,
      },
      {
        id: 'marc-group-insurance',
        label: 'Group insurance payout 2028',
        customerExplanation: 'Your employer’s group insurance plans a payout in 2028.',
        source: 'Transactions',
        weight: 18,
      },
      {
        id: 'marc-age',
        label: 'Close to legal pension age',
        customerExplanation: 'You are 2 years away from the legal pension age.',
        source: 'Profile',
        weight: 12,
      },
    ],
    recommendation: {
      id: 'rec-marc-plan',
      title: 'Start your retirement income plan',
      description:
        'Move €20,000 of savings into a low-risk retirement portfolio: about €310 extra per month from 2028.',
      ctaLabel: 'Start my retirement plan',
      confirmation: 'Your plan is set up. You will find your projected monthly income under Investments.',
      product: 'Retirement income portfolio',
    },
  },
};

export const customers: Customer[] = [emma, lucasSarah, marc];
