/**
 * Generic break detection: compares the most recent months (up to 2) with the
 * baseline (up to 6 months before). Pure and dependency-free so it can run on
 * the customer's phone: only the anonymised summary leaves the device.
 *
 * The summary never contains names or exact amounts — only categories,
 * generic merchant types, percentages and ratios to the usual monthly income.
 */
import type { MonthData, Transaction } from '../types.ts';

export const RECENT_MONTHS = 2;
export const BASELINE_MONTHS = 6;
const CHANGE_MIN_PCT = 20;
const UNUSUAL_MIN_INCOME_RATIO = 0.2;

type Direction = 'in' | 'out';

export interface CategoryItem {
  category: string;
  kind: string;
  direction: Direction;
  occurrences: number;
  /** Total of these transactions over the recent window, as % of the usual monthly income. */
  pctOfMonthlyIncome: number;
}

export interface BreakSummary {
  profile: { ageBracket: string };
  window: { recentMonths: number; baselineMonths: number };
  newItems: CategoryItem[];
  stoppedItems: Omit<CategoryItem, 'pctOfMonthlyIncome' | 'occurrences'>[];
  categoryChanges: { category: string; direction: Direction; changePct: number }[];
  income: {
    changePct: number;
    newSources: { category: string; kind: string; count: number }[];
    stoppedSources: number;
    paymentsPerMonth: { baseline: number; recent: number };
    /** Coefficient of variation of individual incoming payments, in %. */
    paymentVariationPct: { baseline: number; recent: number };
  };
  savings: { transfersChangePct: number; balanceChangePct: number };
  unusualAmounts: { category: string; kind: string; direction: Direction; xMonthlyIncome: number }[];
  appBehaviour: { feature: string; recentPerMonth: number; baselinePerMonth: number }[];
  hasBreak: boolean;
}

export interface BreakInput {
  baseline: MonthData[];
  recent: MonthData[];
  age: number;
  savingsBalance: number;
}

const dir = (t: Transaction): Direction => (t.amount >= 0 ? 'in' : 'out');
const kindOf = (t: Transaction) => t.kind ?? t.category;
const itemKey = (t: Transaction) => `${dir(t)}|${t.category}|${kindOf(t)}`;
const isIncome = (t: Transaction) => t.amount > 0 && t.category !== 'savings';
const round = (n: number) => Math.round(n);
const pctChange = (from: number, to: number) => (from === 0 ? (to === 0 ? 0 : 100) : round(((to - from) / from) * 100));

function cv(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sd = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);
  return mean ? round((sd / mean) * 100) : 0;
}

function ageBracket(age: number): string {
  if (age < 25) return '18-24';
  if (age >= 65) return '65+';
  const lo = Math.floor((age - 25) / 10) * 10 + 25;
  return `${lo}-${lo + 9}`;
}

function sumBy<T>(items: T[], key: (i: T) => string, value: (i: T) => number) {
  const out = new Map<string, number>();
  for (const i of items) out.set(key(i), (out.get(key(i)) ?? 0) + value(i));
  return out;
}

export function detectBreak({ baseline, recent, age, savingsBalance }: BreakInput): BreakSummary {
  const base = baseline.slice(-BASELINE_MONTHS);
  const rec = recent.slice(-RECENT_MONTHS);
  const nb = Math.max(base.length, 1);
  const nr = Math.max(rec.length, 1);
  const baseTx = base.flatMap((m) => m.transactions);
  const recTx = rec.flatMap((m) => m.transactions);

  const baseIncome = baseTx.filter(isIncome).reduce((s, t) => s + t.amount, 0) / nb;
  const recIncome = recTx.filter(isIncome).reduce((s, t) => s + t.amount, 0) / nr;
  const ofIncome = (total: number) => (baseIncome ? round((Math.abs(total) / baseIncome) * 100) : 0);

  // Items (category + merchant type) never seen in the baseline, or no longer seen.
  const baseKeys = new Set(baseTx.map(itemKey));
  const recKeys = new Set(recTx.map(itemKey));
  const newGroups = new Map<string, Transaction[]>();
  for (const t of recTx) {
    if (baseKeys.has(itemKey(t))) continue;
    newGroups.set(itemKey(t), [...(newGroups.get(itemKey(t)) ?? []), t]);
  }
  const newItems: CategoryItem[] = [...newGroups.values()].map((txs) => ({
    category: txs[0].category,
    kind: kindOf(txs[0]),
    direction: dir(txs[0]),
    occurrences: txs.length,
    pctOfMonthlyIncome: ofIncome(txs.reduce((s, t) => s + t.amount, 0)),
  }));

  const monthsWithKey = (key: string) => base.filter((m) => m.transactions.some((t) => itemKey(t) === key)).length;
  // Only income and savings flows count as "stopped": a skipped grocery run is not a break.
  const stoppedItems = [...baseKeys]
    .filter((k) => !recKeys.has(k) && monthsWithKey(k) >= Math.ceil(nb / 2))
    .filter((k) => k.startsWith('in|') || k.includes('|savings|'))
    .map((k) => {
      const [direction, category, kind] = k.split('|');
      return { direction: direction as Direction, category, kind };
    });

  // Monthly totals per category present in both windows.
  const catKey = (t: Transaction) => `${dir(t)}|${t.category}`;
  const baseCat = sumBy(baseTx, catKey, (t) => Math.abs(t.amount) / nb);
  const recCat = sumBy(recTx, catKey, (t) => Math.abs(t.amount) / nr);
  const categoryChanges = [...recCat]
    .filter(([k]) => baseCat.has(k))
    .map(([k, v]) => {
      const [direction, category] = k.split('|');
      return { category, direction: direction as Direction, changePct: pctChange(baseCat.get(k)!, v) };
    })
    .filter((c) => Math.abs(c.changePct) >= CHANGE_MIN_PCT);

  // Income sources are tracked by counterparty internally but only reported as counts / types.
  const baseSources = new Set(baseTx.filter(isIncome).map((t) => t.merchant));
  const recSources = new Set(recTx.filter(isIncome).map((t) => t.merchant));
  const newSourceKinds = new Map<string, { category: string; kind: string; count: number }>();
  for (const merchant of recSources) {
    if (baseSources.has(merchant)) continue;
    const t = recTx.find((o) => o.merchant === merchant)!;
    const k = `${t.category}|${kindOf(t)}`;
    const entry = newSourceKinds.get(k) ?? { category: t.category, kind: kindOf(t), count: 0 };
    newSourceKinds.set(k, { ...entry, count: entry.count + 1 });
  }
  const newSources = [...newSourceKinds.values()];
  const stoppedSources = [...baseSources].filter((s) => !recSources.has(s)).length;
  const payments = (txs: Transaction[]) => txs.filter((t) => isIncome(t) && t.category !== 'meal-vouchers');

  const savingsOut = (txs: Transaction[], n: number) =>
    txs.filter((t) => t.category === 'savings' && t.amount < 0).reduce((s, t) => s - t.amount, 0) / n;
  const savingsDelta = rec.reduce((s, m) => s + (m.savingsDelta ?? 0), 0);

  const unusualAmounts = recTx
    .filter((t) => {
      const usual = baseCat.get(catKey(t)) ?? 0;
      const amount = Math.abs(t.amount);
      return usual > 0
        ? amount >= baseIncome * UNUSUAL_MIN_INCOME_RATIO && amount > usual * 3
        : amount >= baseIncome;
    })
    .map((t) => ({
      category: t.category,
      kind: kindOf(t),
      direction: dir(t),
      xMonthlyIncome: baseIncome ? Math.round((Math.abs(t.amount) / baseIncome) * 10) / 10 : 0,
    }));

  const appCount = (months: MonthData[]) =>
    sumBy(months.flatMap((m) => m.appEvents ?? []), (e) => e.feature, (e) => e.count);
  const baseApp = appCount(base);
  const appBehaviour = [...appCount(rec)]
    .map(([feature, count]) => ({
      feature,
      recentPerMonth: Math.round((count / nr) * 10) / 10,
      baselinePerMonth: Math.round(((baseApp.get(feature) ?? 0) / nb) * 10) / 10,
    }))
    .filter((a) => a.recentPerMonth > a.baselinePerMonth * 1.5);

  const summary: BreakSummary = {
    profile: { ageBracket: ageBracket(age) },
    window: { recentMonths: rec.length, baselineMonths: base.length },
    newItems,
    stoppedItems,
    categoryChanges,
    income: {
      changePct: pctChange(baseIncome, recIncome),
      newSources,
      stoppedSources,
      paymentsPerMonth: {
        baseline: Math.round((payments(baseTx).length / nb) * 10) / 10,
        recent: Math.round((payments(recTx).length / nr) * 10) / 10,
      },
      paymentVariationPct: {
        baseline: cv(payments(baseTx).map((t) => t.amount)),
        recent: cv(payments(recTx).map((t) => t.amount)),
      },
    },
    savings: {
      transfersChangePct: pctChange(savingsOut(baseTx, nb), savingsOut(recTx, nr)),
      balanceChangePct: savingsBalance ? round((savingsDelta / savingsBalance) * 100) : 0,
    },
    unusualAmounts,
    appBehaviour,
    hasBreak: false,
  };
  summary.hasBreak =
    newItems.length > 0 ||
    stoppedItems.length > 0 ||
    categoryChanges.length > 0 ||
    unusualAmounts.length > 0 ||
    appBehaviour.length > 0 ||
    Math.abs(summary.income.changePct) >= CHANGE_MIN_PCT ||
    Math.abs(summary.savings.balanceChangePct) >= CHANGE_MIN_PCT;
  return summary;
}
