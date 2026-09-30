/** Regenerates public/templates/* from the mock data: `npx tsx scripts/make-samples.ts` */
import { writeFileSync } from 'node:fs';
import * as XLSX from 'xlsx';
import { customers } from '../src/data/mockData.ts';

const header = ['date', 'description', 'amount', 'category', 'type'];
const julie = customers.find((c) => c.id === 'julie')!;
const rows = [...julie.history, ...julie.upcoming]
  .flatMap((m) => m.transactions)
  .sort((a, b) => a.date.localeCompare(b.date))
  .map((t) => [t.date, t.description ? `${t.merchant} · ${t.description}` : t.merchant, t.amount, t.category, t.amount >= 0 ? 'income' : 'expense']);

const csv = (data: (string | number)[][]) =>
  data.map((r) => r.map((v) => (typeof v === 'string' && /[",;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(',')).join('\n') + '\n';

writeFileSync('public/templates/julie-sample.csv', csv([header, ...rows]));
writeFileSync(
  'public/templates/kbc-moments-template.csv',
  csv([header, ['2026-09-28', 'Employer salary', 2600, 'salary', 'income'], ['2026-09-25', 'Supermarket', -82.4, 'groceries', 'expense']]),
);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([header, ...rows]), 'Transactions');
writeFileSync('public/templates/julie-sample.xlsx', XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
console.log(`${rows.length} rows`);
