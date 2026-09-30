import { customers } from '../data/mockData';
import { detectBreak, type BreakSummary } from '../detection/breakDetection.ts';
import { toLifeMoment } from '../detection/catalog.ts';
import fixtures from '../detection/fixtures.json';
import {
  ACTION_THRESHOLD,
  applyGuardrails,
  sanitizeCandidates,
  type InterpretRequest,
  type InterpretResponse,
} from '../detection/guardrails.ts';
import type {
  ConsentSettings,
  Customer,
  CustomerId,
  Detection,
  FeedbackEntry,
  MomentResponse,
  SimulationResult,
  Transaction,
} from '../types';

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

/** Same pre-recorded answers as the server, for when the page is served without it. */
function offlineInterpret(req: InterpretRequest): InterpretResponse {
  const candidates = req.summary.hasBreak
    ? sanitizeCandidates((fixtures as Record<string, unknown>)[req.demoKey])
    : [];
  return {
    source: req.summary.hasBreak ? 'fallback' : 'no-break',
    fallbackReason: 'API server unreachable · offline copy',
    candidates,
    decision: applyGuardrails(candidates, req.consent),
  };
}

function flagTransactions(txs: Transaction[], summary: BreakSummary): Transaction[] {
  const key = (t: Transaction) => `${t.amount >= 0 ? 'in' : 'out'}|${t.category}|${t.kind ?? t.category}`;
  const unusual = new Set(summary.unusualAmounts.map((u) => `${u.direction}|${u.category}|${u.kind}`));
  const fresh = new Set(summary.newItems.map((n) => `${n.direction}|${n.category}|${n.kind}`));
  return txs.map((t) => {
    if (unusual.has(key(t))) return { ...t, signal: { label: 'Unusual amount' } };
    if (fresh.has(key(t))) return { ...t, signal: { label: 'New pattern' } };
    return t;
  });
}

export function buildDetection(customer: Customer, demoKey: string, summary: BreakSummary, r: InterpretResponse): Detection {
  const { chosen, status, guardrails } = r.decision;
  return {
    demoKey,
    status,
    summary,
    source: r.source,
    fallbackReason: r.fallbackReason,
    model: r.model,
    candidates: r.candidates,
    chosen,
    guardrails,
    moment: chosen ? toLifeMoment(chosen, customer.firstName, demoKey) : null,
    confidence: chosen?.confidence ?? 0,
    threshold: ACTION_THRESHOLD,
  };
}

/**
 * Pushes the next month for a demo customer, runs the break detector locally
 * (last ≤2 months vs the 6 before) and asks the server to interpret the anonymised summary.
 */
export async function simulateNextMonth(
  customerId: CustomerId,
  monthIndex: number,
  consent: ConsentSettings,
): Promise<SimulationResult> {
  const customer = customers.find((c) => c.id === customerId);
  const month = customer?.upcoming[monthIndex];
  if (!customer || !month) throw new Error('No month left to simulate');

  const summary = detectBreak({
    baseline: customer.history,
    recent: customer.upcoming.slice(0, monthIndex + 1),
    age: customer.age,
    savingsBalance: customer.balances.savings,
  });
  const demoKey = `${customer.id}/${month.key}`;
  const req: InterpretRequest = { demoKey, summary, consent };

  let result: InterpretResponse;
  try {
    result = await postJson<InterpretResponse>('/api/interpret', req);
  } catch {
    result = offlineInterpret(req);
  }

  return {
    month: { ...structuredClone(month), transactions: flagTransactions(month.transactions, summary) },
    detection: buildDetection(customer, demoKey, summary, result),
  };
}

/** Re-applies the guardrails locally, e.g. after the customer changes consent. */
export function reapplyGuardrails(detection: Detection, consent: ConsentSettings, customerFirstName: string): Detection {
  const { status, chosen, guardrails } = applyGuardrails(detection.candidates, consent);
  const moment = chosen ? toLifeMoment(chosen, customerFirstName, detection.demoKey) : null;
  return { ...detection, status, chosen, guardrails, moment };
}

export async function submitMomentResponse(
  detection: Detection,
  response: MomentResponse,
): Promise<FeedbackEntry | null> {
  if (!detection.chosen) return null;
  try {
    return await postJson<FeedbackEntry>('/api/feedback', {
      demoKey: detection.demoKey,
      moment: detection.chosen.moment,
      category: detection.chosen.category,
      response,
    });
  } catch {
    return null;
  }
}

export async function listFeedback(): Promise<FeedbackEntry[]> {
  try {
    const res = await fetch('/api/feedback');
    return res.ok ? res.json() : [];
  } catch {
    return [];
  }
}

export async function clearFeedback(): Promise<void> {
  await fetch('/api/feedback', { method: 'DELETE' }).catch(() => undefined);
}
