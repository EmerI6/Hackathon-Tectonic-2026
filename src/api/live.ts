import { customers } from '../data/mockData';
import { detectBreak, BASELINE_MONTHS, RECENT_MONTHS, type BreakSummary } from '../detection/breakDetection.ts';
import type { InterpretRequest, InterpretResponse } from '../detection/guardrails.ts';
import type { ConsentSettings, MonthData, Transaction, TransactionCategory } from '../types';

export const LIVE_CATEGORIES: TransactionCategory[] = [
  'salary',
  'invoice-income',
  'meal-vouchers',
  'groceries',
  'restaurant',
  'transport',
  'housing',
  'utilities',
  'shopping',
  'family',
  'savings',
  'notary',
  'insurance',
  'health',
  'leisure',
  'pension',
  'business-admin',
  'pro-equipment',
  'accounting',
  'other',
];

let seq = 0;
export const newTxId = () => `live-${Date.now().toString(36)}-${(seq += 1)}`;

/**
 * In live mode the merchant/description stays on the device: the generic merchant type sent to the
 * LLM is the category itself.
 */
export function liveTx(date: string, description: string, amount: number, category: TransactionCategory): Transaction {
  return { id: newTxId(), date, merchant: description, category, kind: category, amount };
}

function toIsoDate(v: unknown): string | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const d = new Date(v.getTime() - v.getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 10);
  }
  const s = String(v ?? '').trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return null;
}

function toAmount(v: unknown): number | null {
  if (typeof v === 'number') return v;
  const s = String(v ?? '').replace(/[€\s]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  const n = Number(s);
  return s && Number.isFinite(n) ? n : null;
}

export interface ImportResult {
  transactions: Transaction[];
  errors: string[];
}

/** Rows with columns date, description, amount, category and optional type (income / expense). */
export function parseRows(rows: Record<string, unknown>[]): ImportResult {
  const transactions: Transaction[] = [];
  const errors: string[] = [];
  rows.forEach((raw, i) => {
    const row = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k.trim().toLowerCase(), v]));
    const line = i + 2;
    const date = toIsoDate(row.date);
    let amount = toAmount(row.amount);
    if (!date) return errors.push(`Row ${line}: invalid date “${String(row.date ?? '')}”`);
    if (amount === null) return errors.push(`Row ${line}: invalid amount “${String(row.amount ?? '')}”`);
    const type = String(row.type ?? '').trim().toLowerCase();
    if (/^(income|revenu|in)/.test(type)) amount = Math.abs(amount);
    if (/^(expense|dépense|depense|out)/.test(type)) amount = -Math.abs(amount);
    const cat = String(row.category ?? '').trim().toLowerCase() as TransactionCategory;
    const category = LIVE_CATEGORIES.includes(cat) ? cat : 'other';
    transactions.push(liveTx(date, String(row.description ?? '').trim() || category, amount, category));
  });
  return { transactions, errors };
}

/** Reads a .csv / .xlsx / .xls file with SheetJS (loaded on demand). */
export async function importFile(file: File): Promise<ImportResult> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return { transactions: [], errors: ['The file has no sheet'] };
  return parseRows(XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' }));
}

export function groupByMonth(txs: Transaction[]): MonthData[] {
  const byKey = new Map<string, Transaction[]>();
  for (const t of txs) byKey.set(t.date.slice(0, 7), [...(byKey.get(t.date.slice(0, 7)) ?? []), t]);
  return [...byKey.keys()].sort().map((key) => ({ key, label: key, transactions: byKey.get(key)! }));
}

export function liveBreak(txs: Transaction[], age: number, savingsBalance: number) {
  const months = groupByMonth(txs);
  const recent = months.slice(-RECENT_MONTHS);
  const baseline = months.slice(0, -RECENT_MONTHS).slice(-BASELINE_MONTHS);
  return { months, summary: detectBreak({ baseline, recent, age, savingsBalance }), recent };
}

/** Pre-recorded answer to use when the user explicitly allows it: the demo profile with the most similar break. */
function signature(s: BreakSummary): Set<string> {
  return new Set([
    ...s.newItems.map((i) => `new|${i.direction}|${i.category}`),
    ...s.stoppedItems.map((i) => `stop|${i.direction}|${i.category}`),
    ...s.categoryChanges.map((c) => `chg|${c.direction}|${c.category}|${Math.sign(c.changePct)}`),
    ...s.appBehaviour.map((a) => `app|${a.feature}`),
    ...(s.savings.balanceChangePct <= -20 ? ['savings-down'] : []),
  ]);
}

export function closestFixtureKey(summary: BreakSummary): string {
  const target = signature(summary);
  let best = { key: 'emma/2026-10', score: -1 };
  for (const c of customers) {
    c.upcoming.forEach((m, i) => {
      const sig = signature(
        detectBreak({
          baseline: c.history,
          recent: c.upcoming.slice(0, i + 1),
          age: c.age,
          savingsBalance: c.balances.savings,
        }),
      );
      const inter = [...sig].filter((x) => target.has(x)).length;
      const score = inter / (new Set([...sig, ...target]).size || 1);
      if (score > best.score) best = { key: `${c.id}/${m.key}`, score };
    });
  }
  return best.key;
}

export async function interpretLive(
  summary: BreakSummary,
  consent: ConsentSettings,
  allowFallback: boolean,
): Promise<InterpretResponse> {
  const req: InterpretRequest = {
    demoKey: 'live/session',
    summary,
    consent,
    mode: 'live',
    allowFallback,
    fixtureKey: closestFixtureKey(summary),
  };
  let res: Response;
  try {
    res = await fetch('/api/interpret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
  } catch {
    throw new Error('The API server is not reachable. Run the app with `npm run dev` or `npm run preview`.');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (body as { error?: string }).error ?? `API ${res.status}`;
    throw new Error(
      res.status === 503
        ? `${msg}. Add GEMINI_API_KEY to .env and restart the server (see .env.example).`
        : msg,
    );
  }
  return body as InterpretResponse;
}
