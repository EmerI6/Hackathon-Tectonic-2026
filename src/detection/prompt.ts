/**
 * LLM prompt. The few-shot examples are the detection factors from the team's
 * idea doc (new job, home purchase, birth, inheritance, retirement), rewritten
 * as anonymised break summaries so the model learns the pattern, not a list.
 */
import type { BreakSummary } from './breakDetection.ts';
import type { DismissedMoment } from './guardrails.ts';
import { MOMENT_CATEGORIES, PRODUCT_CATEGORIES, SENSITIVE_CATEGORIES } from './guardrails.ts';

export const SYSTEM_PROMPT = `You are the life-moment analyst of a Belgian retail bank (KBC).
You receive an ANONYMISED summary of a break in one customer's account activity: the last months compared with the previous ones.
It only contains categories, generic merchant types, percentages and ratios to the usual monthly income. Never ask for more data.

Task: infer which life moment(s) could explain the break. Do not rely on a fixed list of moments: describe the moment in free text.

Reply with JSON only, no prose:
{"candidates":[{
  "moment": "short free-text name of the life moment",
  "category": one of ${JSON.stringify(MOMENT_CATEGORIES)},
  "confidence": 0-100 integer,
  "signals": [{"label": "short technical label", "explanation": "one plain sentence for the customer, no exact amounts", "source": one of ["Transactions","Income","Savings","In-app behaviour","Profile"]}],
  "customerNeed": "what the customer probably needs now",
  "productCategory": one of ${JSON.stringify(PRODUCT_CATEGORIES)},
  "sensitive": true if it touches health, family, separation or financial difficulty,
  "headline": "warm headline for the customer, max 8 words",
  "customerMessage": "1-2 warm sentences for the customer, no exact amounts, no judgement"
}]}

Rules:
- 1 to 3 candidates, most likely first. Use 2-4 signals per candidate, each tied to an item of the summary.
- Confidence scale: 0-39 nothing significant, 40-69 possible, 70-89 probable, 90-100 near certain.
  Lower the confidence when evidence is a single one-off payment or could be a gift/one-off purchase.
- Categories ${JSON.stringify(SENSITIVE_CATEGORIES)} are always sensitive.
- If the customer marked a moment as not relevant before, only propose it again with much stronger new evidence.`;

interface Example {
  summary: Partial<BreakSummary>;
  answer: object;
}

const EXAMPLES: Example[] = [
  {
    summary: {
      profile: { ageBracket: '25-34' },
      newItems: [{ category: 'salary', kind: 'payroll · employer', direction: 'in', occurrences: 1, pctOfMonthlyIncome: 115 }],
      stoppedItems: [{ category: 'salary', kind: 'payroll · employer', direction: 'in' }],
      income: { changePct: 15, newSources: [{ category: 'salary', kind: 'payroll · employer', count: 1 }], stoppedSources: 1, paymentsPerMonth: { baseline: 1, recent: 1 }, paymentVariationPct: { baseline: 0, recent: 0 } },
    },
    answer: { moment: 'New job', category: 'career', confidence: 90, productCategory: 'savings-plan', sensitive: false, customerNeed: 'Put part of the raise aside (about 20% of the income increase)' },
  },
  {
    summary: {
      profile: { ageBracket: '25-34' },
      newItems: [
        { category: 'notary', kind: 'notary office', direction: 'out', occurrences: 1, pctOfMonthlyIncome: 540 },
        { category: 'housing', kind: 'property valuation', direction: 'out', occurrences: 1, pctOfMonthlyIncome: 6 },
      ],
      savings: { transfersChangePct: 0, balanceChangePct: -80 },
      appBehaviour: [{ feature: 'mortgage simulator', recentPerMonth: 3, baselinePerMonth: 0 }],
    },
    answer: { moment: 'Buying a home', category: 'home', confidence: 92, productCategory: 'mortgage', sensitive: false, customerNeed: 'Mortgage offer and home insurance at signing' },
  },
  {
    summary: {
      profile: { ageBracket: '25-34' },
      newItems: [
        { category: 'family', kind: 'family allowance fund', direction: 'in', occurrences: 1, pctOfMonthlyIncome: 5 },
        { category: 'health', kind: 'maternity ward', direction: 'out', occurrences: 1, pctOfMonthlyIncome: 10 },
        { category: 'shopping', kind: 'baby store', direction: 'out', occurrences: 3, pctOfMonthlyIncome: 12 },
      ],
    },
    answer: { moment: 'Birth of a child', category: 'family', confidence: 88, productCategory: 'child-savings', sensitive: true, customerNeed: 'Child savings account and family protection' },
  },
  {
    summary: {
      profile: { ageBracket: '45-54' },
      newItems: [{ category: 'notary', kind: 'notary office · estate settlement', direction: 'in', occurrences: 1, pctOfMonthlyIncome: 2400 }],
      unusualAmounts: [{ category: 'notary', kind: 'notary office · estate settlement', direction: 'in', xMonthlyIncome: 24 }],
    },
    answer: { moment: 'Inheritance received', category: 'wealth', confidence: 82, productCategory: 'investment', sensitive: false, customerNeed: 'Advice on managing and investing a large one-off amount' },
  },
  {
    summary: {
      profile: { ageBracket: '55-64' },
      newItems: [{ category: 'pension', kind: 'legal pension', direction: 'in', occurrences: 1, pctOfMonthlyIncome: 65 }],
      stoppedItems: [{ category: 'salary', kind: 'payroll · employer', direction: 'in' }],
      income: { changePct: -35, newSources: [{ category: 'pension', kind: 'legal pension', count: 1 }], stoppedSources: 1, paymentsPerMonth: { baseline: 1, recent: 1 }, paymentVariationPct: { baseline: 0, recent: 0 } },
    },
    answer: { moment: 'Retirement', category: 'retirement', confidence: 93, productCategory: 'retirement-planning', sensitive: false, customerNeed: 'Keep the same lifestyle: turn savings into a monthly income' },
  },
];

export function buildUserPrompt(summary: BreakSummary, dismissed: DismissedMoment[]): string {
  const examples = EXAMPLES.map(
    (e, i) => `Example ${i + 1}\nSummary: ${JSON.stringify(e.summary)}\nKey fields of the expected candidate: ${JSON.stringify(e.answer)}`,
  ).join('\n\n');
  const feedback = dismissed.length
    ? `The customer marked these moments as NOT relevant before: ${JSON.stringify(dismissed)}`
    : 'No previous feedback from this customer.';
  return `${examples}\n\n---\n${feedback}\n\nBreak summary to interpret:\n${JSON.stringify(summary)}`;
}
