/**
 * Hardcoded demo data for the KBC Moments proof of concept.
 *
 * All names (employers, merchants, notaries...) are fictional.
 * There are no predefined moments: the break detector + LLM infer them.
 * Nothing in the UI imports this file directly: go through `src/api/*`.
 */
import { SENSITIVE_CATEGORIES } from '../detection/guardrails.ts';
import type { ConsentCategory, ConsentSettings, Customer, MonthData, Transaction, TransactionCategory } from '../types';

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

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const BASELINE = ['04', '05', '06', '07', '08', '09'];

function month(mm: string, transactions: Transaction[], extra: Partial<MonthData> = {}): MonthData {
  return { key: `2026-${mm}`, label: MONTH_LABELS[Number(mm) - 1], transactions, ...extra };
}

const PAYROLL = 'payroll · employer';
const RENT = 'rent · landlord';

export const consentCategories: ConsentCategory[] = [
  { id: 'career', label: 'New job & income changes', description: 'Salary changes, a new employer or a first job.', sensitive: false },
  { id: 'business', label: 'Starting a business', description: 'Becoming self-employed or launching a company.', sensitive: false },
  { id: 'home', label: 'Buying or renovating a home', description: 'Notary payments, mortgage simulations, renovation costs.', sensitive: false },
  { id: 'moving', label: 'Moving house', description: 'A new address, new utility contracts or rent payments.', sensitive: false },
  { id: 'car', label: 'Buying a car', description: 'Car dealer payments, leasing or vehicle registration.', sensitive: false },
  { id: 'retirement', label: 'Preparing for retirement', description: 'End-of-career schemes, pension planning and savings.', sensitive: false },
  { id: 'wealth', label: 'Large amounts & inheritance', description: 'An inheritance, a bonus or another exceptional income.', sensitive: false },
  { id: 'family', label: 'Family, baby & separation', description: 'Birth allowances, childcare, changes in household.', sensitive: true },
  { id: 'health', label: 'Health & care', description: 'Hospital, pharmacy and care-related payments.', sensitive: true },
  { id: 'finances', label: 'Financial difficulty', description: 'Signs that making ends meet gets harder.', sensitive: true },
];

/** Sensitive moments are OFF until the customer explicitly opts in. */
export const defaultConsent: ConsentSettings = consentCategories.reduce(
  (acc, c) => ({ ...acc, [c.id]: !SENSITIVE_CATEGORIES.includes(c.id) }),
  {} as ConsentSettings,
);

/* ------------------------------------------------------------------ */
/* Emma, 27                                                            */
/* ------------------------------------------------------------------ */

function emmaMonth(m: string): Transaction[] {
  return [
    tx(`2026-${m}-28`, 'Brusselia Retail NV', 'salary', 2450, { description: 'Salary', kind: PAYROLL }),
    tx(`2026-${m}-26`, 'FreshMarkt Ixelles', 'groceries', -64.3, { kind: 'supermarket' }),
    tx(`2026-${m}-22`, 'Café De Kroon', 'restaurant', -18.5, { kind: 'café' }),
    tx(`2026-${m}-15`, 'TelNet Belgium', 'utilities', -39.99, { description: 'Mobile & internet', kind: 'telecom' }),
    tx(`2026-${m}-08`, 'FreshMarkt Ixelles', 'groceries', -52.1, { kind: 'supermarket' }),
    tx(`2026-${m}-03`, 'MealCard Benelux', 'meal-vouchers', 176, { description: 'Meal vouchers · Brusselia Retail', kind: 'meal vouchers' }),
    tx(`2026-${m}-02`, 'BrusselsMove', 'transport', -49, { description: 'Monthly transit pass', kind: 'public transport pass' }),
    tx(`2026-${m}-01`, 'Immo Louise', 'housing', -875, { description: 'Rent', kind: RENT }),
  ];
}

const emma: Customer = {
  id: 'emma',
  firstName: 'Emma',
  displayName: 'Emma Janssens',
  age: 27,
  persona: 'Salaried, stable for months',
  city: 'Ixelles, Brussels',
  avatarColor: '#00AEEF',
  balances: { current: 1842.35, savings: 3250 },
  history: BASELINE.map((m) => month(m, emmaMonth(m))),
  upcoming: [
    month('10', [
      tx('2026-10-30', 'Lumen Analytics BV', 'salary', 2850, { description: 'Salary · first payment', kind: PAYROLL }),
      tx('2026-10-24', 'Frituur ’t Hoekske', 'restaurant', -14.8, { kind: 'café' }),
      tx('2026-10-20', 'FreshMarkt Ixelles', 'groceries', -71.25, { kind: 'supermarket' }),
      tx('2026-10-15', 'TelNet Belgium', 'utilities', -39.99, { description: 'Mobile & internet', kind: 'telecom' }),
      tx('2026-10-06', 'Brusselia Retail NV', 'salary', 1124.6, {
        description: 'Final settlement & exit holiday pay',
        kind: 'payroll · final settlement & exit holiday pay',
      }),
      tx('2026-10-03', 'MealCard Benelux', 'meal-vouchers', 220, { description: 'Meal vouchers · Lumen Analytics', kind: 'meal vouchers' }),
      tx('2026-10-02', 'BrusselsMove', 'transport', -49, { description: 'Monthly transit pass', kind: 'public transport pass' }),
      tx('2026-10-01', 'Immo Louise', 'housing', -875, { description: 'Rent', kind: RENT }),
    ]),
  ],
};

/* ------------------------------------------------------------------ */
/* Lucas & Sarah, 32                                                   */
/* ------------------------------------------------------------------ */

function lucasSarahMonth(m: string): Transaction[] {
  return [
    tx(`2026-${m}-28`, 'Vandenbroeck Engineering NV', 'salary', 3120, { description: 'Salary · Lucas', kind: PAYROLL }),
    tx(`2026-${m}-27`, 'AZ Sint-Rombout', 'salary', 2780, { description: 'Salary · Sarah', kind: PAYROLL }),
    tx(`2026-${m}-21`, 'Marché Frais Mechelen', 'groceries', -118.4, { kind: 'supermarket' }),
    tx(`2026-${m}-12`, 'Groeipakket', 'family', 181.02, { description: 'Family allowance', kind: 'family allowance fund' }),
    tx(`2026-${m}-10`, 'Kinderdagverblijf Het Bijtje', 'family', -420, { description: 'Daycare', kind: 'daycare' }),
    tx(`2026-${m}-05`, 'MealCard Benelux', 'meal-vouchers', 352, { description: 'Meal vouchers', kind: 'meal vouchers' }),
    tx(`2026-${m}-01`, 'Residentie Dijle', 'housing', -1150, { description: 'Rent', kind: RENT }),
  ];
}

const lucasSarah: Customer = {
  id: 'lucas-sarah',
  firstName: 'Lucas & Sarah',
  displayName: 'Lucas & Sarah Peeters',
  age: 32,
  persona: 'Young family, renting',
  city: 'Mechelen',
  avatarColor: '#7B61FF',
  balances: { current: 4320.18, savings: 38540 },
  history: BASELINE.map((m) => month(m, lucasSarahMonth(m))),
  upcoming: [
    month(
      '10',
      [
        tx('2026-10-28', 'Vandenbroeck Engineering NV', 'salary', 3120, { description: 'Salary · Lucas', kind: PAYROLL }),
        tx('2026-10-27', 'AZ Sint-Rombout', 'salary', 2780, { description: 'Salary · Sarah', kind: PAYROLL }),
        tx('2026-10-18', 'Bouwkeuring Mertens BV', 'housing', -350, {
          description: 'Pre-purchase building inspection',
          kind: 'building inspection',
        }),
        tx('2026-10-12', 'Groeipakket', 'family', 181.02, { description: 'Family allowance', kind: 'family allowance fund' }),
        tx('2026-10-10', 'Kinderdagverblijf Het Bijtje', 'family', -420, { description: 'Daycare', kind: 'daycare' }),
        tx('2026-10-05', 'MealCard Benelux', 'meal-vouchers', 352, { description: 'Meal vouchers', kind: 'meal vouchers' }),
        tx('2026-10-01', 'Residentie Dijle', 'housing', -1150, { description: 'Rent', kind: RENT }),
      ],
      { appEvents: [{ feature: 'mortgage simulator', count: 4 }] },
    ),
    month(
      '11',
      [
        tx('2026-11-27', 'Vandenbroeck Engineering NV', 'salary', 3120, { description: 'Salary · Lucas', kind: PAYROLL }),
        tx('2026-11-26', 'AZ Sint-Rombout', 'salary', 2780, { description: 'Salary · Sarah', kind: PAYROLL }),
        tx('2026-11-14', 'Notariskantoor Peeters & De Smet', 'notary', -32000, {
          description: '10% deposit · sales agreement',
          kind: 'notary office',
        }),
        tx('2026-11-13', 'Transfer from savings', 'savings', 32000, {
          description: 'From savings account',
          kind: 'transfer from own savings account',
        }),
        tx('2026-11-12', 'Groeipakket', 'family', 181.02, { description: 'Family allowance', kind: 'family allowance fund' }),
        tx('2026-11-05', 'MealCard Benelux', 'meal-vouchers', 352, { description: 'Meal vouchers', kind: 'meal vouchers' }),
        tx('2026-11-01', 'Residentie Dijle', 'housing', -1150, { description: 'Rent', kind: RENT }),
      ],
      { savingsDelta: -32000, appEvents: [{ feature: 'mortgage simulator', count: 2 }] },
    ),
  ],
};

/* ------------------------------------------------------------------ */
/* Marc, 63                                                            */
/* ------------------------------------------------------------------ */

function marcMonth(m: string): Transaction[] {
  return [
    tx(`2026-${m}-28`, 'Brabant Logistics NV', 'salary', 3640, { description: 'Salary', kind: PAYROLL }),
    tx(`2026-${m}-24`, 'Tennisclub Heverlee', 'leisure', -45, { kind: 'sports club' }),
    tx(`2026-${m}-19`, 'Marché Frais Leuven', 'groceries', -96.7, { kind: 'supermarket' }),
    tx(`2026-${m}-15`, 'Pension savings plan', 'pension', -85, { description: 'Monthly contribution', kind: 'pension savings contribution' }),
    tx(`2026-${m}-09`, 'Stroom Energie', 'utilities', -132, { description: 'Gas & electricity', kind: 'energy supplier' }),
    tx(`2026-${m}-04`, 'Restaurant De Molen', 'restaurant', -68, { kind: 'restaurant' }),
  ];
}

const marc: Customer = {
  id: 'marc',
  firstName: 'Marc',
  displayName: 'Marc Dubois',
  age: 63,
  persona: 'Long career, same employer',
  city: 'Leuven',
  avatarColor: '#F5A623',
  balances: { current: 6780.4, savings: 72300 },
  history: BASELINE.map((m) => month(m, marcMonth(m))),
  upcoming: [
    month(
      '10',
      [
        tx('2026-10-28', 'Brabant Logistics NV', 'salary', 2980, { description: 'Salary · 4/5 end-of-career scheme', kind: PAYROLL }),
        tx('2026-10-24', 'Tennisclub Heverlee', 'leisure', -45, { kind: 'sports club' }),
        tx('2026-10-15', 'Pension savings plan', 'pension', -85, { description: 'Monthly contribution', kind: 'pension savings contribution' }),
        tx('2026-10-09', 'Stroom Energie', 'utilities', -132, { description: 'Gas & electricity', kind: 'energy supplier' }),
        tx('2026-10-05', 'Marché Frais Leuven', 'groceries', -88.7, { kind: 'supermarket' }),
      ],
      { appEvents: [{ feature: 'pension planner', count: 3 }] },
    ),
    month(
      '11',
      [
        tx('2026-11-28', 'Brabant Logistics NV', 'salary', 2980, { description: 'Salary · 4/5 end-of-career scheme', kind: PAYROLL }),
        tx('2026-11-20', 'Fidelia Group Insurance', 'pension', 0, {
          description: 'Statement: supplementary pension payout 2028',
          kind: 'group insurance statement · supplementary pension payout planned',
        }),
        tx('2026-11-15', 'Pension savings plan', 'pension', -85, { description: 'Monthly contribution', kind: 'pension savings contribution' }),
        tx('2026-11-09', 'Stroom Energie', 'utilities', -132, { description: 'Gas & electricity', kind: 'energy supplier' }),
        tx('2026-11-03', 'Travel Horizon', 'leisure', -123, { description: 'Travel brochure & booking fee', kind: 'travel agency' }),
      ],
      { appEvents: [{ feature: 'pension planner', count: 2 }] },
    ),
  ],
};

/* ------------------------------------------------------------------ */
/* Julie, 34 — nothing predefined: the detector has to find it          */
/* ------------------------------------------------------------------ */

function julieMonth(m: string): Transaction[] {
  return [
    tx(`2026-${m}-28`, 'Studio Pixel SRL', 'salary', 2600, { description: 'Salary', kind: PAYROLL }),
    tx(`2026-${m}-25`, 'Delhaize Namur', 'groceries', -82.4, { kind: 'supermarket' }),
    tx(`2026-${m}-20`, 'Le Comptoir', 'restaurant', -24, { kind: 'restaurant' }),
    tx(`2026-${m}-15`, 'Proximus', 'utilities', -45, { description: 'Mobile & internet', kind: 'telecom' }),
    tx(`2026-${m}-05`, 'Savings account', 'savings', -300, { description: 'Monthly transfer to savings', kind: 'transfer to own savings account' }),
    tx(`2026-${m}-03`, 'Edenred', 'meal-vouchers', 160, { description: 'Meal vouchers', kind: 'meal vouchers' }),
    tx(`2026-${m}-02`, 'TEC', 'transport', -42, { description: 'Monthly bus pass', kind: 'public transport pass' }),
    tx(`2026-${m}-01`, 'Résidence Meuse', 'housing', -820, { description: 'Rent', kind: RENT }),
  ];
}

const julie: Customer = {
  id: 'julie',
  firstName: 'Julie',
  displayName: 'Julie Lambert',
  age: 34,
  persona: 'Graphic designer, salaried',
  city: 'Namur',
  avatarColor: '#E5487F',
  balances: { current: 3120.6, savings: 14800 },
  history: BASELINE.map((m) => month(m, julieMonth(m))),
  upcoming: [
    month('10', [
      tx('2026-10-28', 'Studio Pixel SRL', 'salary', 2600, { description: 'Salary', kind: PAYROLL }),
      tx('2026-10-24', 'Atelier Moreau', 'invoice-income', 650, {
        description: 'Invoice 2026-001',
        kind: 'client transfer · invoice payment',
      }),
      tx('2026-10-22', 'Delhaize Namur', 'groceries', -79.9, { kind: 'supermarket' }),
      tx('2026-10-16', 'Fiduciaire Collard', 'accounting', -150, { description: 'Accounting · onboarding', kind: 'accountant / fiduciary' }),
      tx('2026-10-15', 'Proximus', 'utilities', -45, { description: 'Mobile & internet', kind: 'telecom' }),
      tx('2026-10-09', 'Guichet d’entreprises UCM', 'business-admin', -95, {
        description: 'Registration in the Crossroads Bank for Enterprises',
        kind: 'enterprise counter · business registration',
      }),
      tx('2026-10-05', 'Savings account', 'savings', -300, { description: 'Monthly transfer to savings', kind: 'transfer to own savings account' }),
      tx('2026-10-03', 'Edenred', 'meal-vouchers', 160, { description: 'Meal vouchers', kind: 'meal vouchers' }),
      tx('2026-10-01', 'Résidence Meuse', 'housing', -820, { description: 'Rent', kind: RENT }),
    ]),
    month('11', [
      tx('2026-11-27', 'Brasserie Sauvage', 'invoice-income', 2350, { description: 'Invoice 2026-004', kind: 'client transfer · invoice payment' }),
      tx('2026-11-21', 'Maison Delvaux', 'invoice-income', 1800, { description: 'Invoice 2026-003', kind: 'client transfer · invoice payment' }),
      tx('2026-11-18', 'Cameo Pro Namur', 'pro-equipment', -2190, {
        description: 'Laptop & drawing tablet',
        kind: 'professional IT & photo equipment store',
      }),
      tx('2026-11-16', 'Fiduciaire Collard', 'accounting', -150, { description: 'Accounting · monthly', kind: 'accountant / fiduciary' }),
      tx('2026-11-15', 'Proximus', 'utilities', -45, { description: 'Mobile & internet', kind: 'telecom' }),
      tx('2026-11-12', 'Atelier Moreau', 'invoice-income', 420, { description: 'Invoice 2026-002', kind: 'client transfer · invoice payment' }),
      tx('2026-11-10', 'Caisse d’assurances sociales', 'business-admin', -780, {
        description: 'Quarterly social contributions',
        kind: 'social insurance fund for self-employed',
      }),
      tx('2026-11-04', 'Coworking Le Phare', 'pro-equipment', -180, { description: 'Monthly desk', kind: 'coworking space' }),
      tx('2026-11-01', 'Résidence Meuse', 'housing', -820, { description: 'Rent', kind: RENT }),
    ]),
  ],
};

export const customers: Customer[] = [emma, lucasSarah, marc, julie];
