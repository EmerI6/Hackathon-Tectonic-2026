/**
 * Rule-based guardrails applied AFTER the LLM. The LLM only proposes; these
 * rules decide whether the customer is contacted. Pure, shared by server and client.
 */
import type { BreakSummary } from './breakDetection.ts';
import type { ConsentCategoryId, ConsentSettings, DetectionStatus, ProductCategory, SignalSource } from '../types.ts';

export const ACTION_THRESHOLD = 70;

export const MOMENT_CATEGORIES: ConsentCategoryId[] = [
  'career',
  'business',
  'home',
  'moving',
  'car',
  'retirement',
  'wealth',
  'family',
  'health',
  'finances',
];
export const SENSITIVE_CATEGORIES: ConsentCategoryId[] = ['family', 'health', 'finances'];

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'savings-plan',
  'mortgage',
  'home-insurance',
  'rental-guarantee',
  'car-loan',
  'retirement-planning',
  'investment',
  'professional-account',
  'child-savings',
  'budget-coaching',
];

const SIGNAL_SOURCES: SignalSource[] = ['Transactions', 'Income', 'Savings', 'In-app behaviour', 'Profile'];

/** One life moment as proposed by the LLM. */
export interface MomentCandidate {
  moment: string;
  category: ConsentCategoryId;
  confidence: number;
  signals: { label: string; explanation: string; source: SignalSource }[];
  customerNeed: string;
  productCategory: ProductCategory;
  sensitive: boolean;
  headline: string;
  customerMessage: string;
}

export interface InterpretRequest {
  /** "customerId/monthKey": used for fixtures and feedback only, never sent to the LLM. */
  demoKey: string;
  summary: BreakSummary;
  consent: ConsentSettings;
}

export interface GuardrailCheck {
  rule: string;
  result: 'pass' | 'fail' | 'skip';
  detail: string;
}

export interface Decision {
  status: DetectionStatus;
  chosen: MomentCandidate | null;
  guardrails: GuardrailCheck[];
}

export interface InterpretResponse {
  source: 'live-gemini' | 'fallback' | 'no-break';
  fallbackReason?: string;
  model?: string;
  candidates: MomentCandidate[];
  decision: Decision;
}

export interface DismissedMoment {
  category: ConsentCategoryId;
  moment: string;
}

const clamp = (n: unknown) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
const str = (v: unknown, max = 240) => (typeof v === 'string' ? v.slice(0, max) : '');

/** Coerces untrusted LLM output into valid candidates; anything off-list is dropped. */
export function sanitizeCandidates(raw: unknown): MomentCandidate[] {
  const list = (raw as { candidates?: unknown })?.candidates;
  if (!Array.isArray(list)) return [];
  return list.flatMap((c): MomentCandidate[] => {
    if (!c || typeof c !== 'object') return [];
    const o = c as Record<string, unknown>;
    const category = o.category as ConsentCategoryId;
    const productCategory = o.productCategory as ProductCategory;
    if (!MOMENT_CATEGORIES.includes(category) || !PRODUCT_CATEGORIES.includes(productCategory)) return [];
    const signals = Array.isArray(o.signals) ? o.signals : [];
    return [
      {
        moment: str(o.moment, 80) || 'Life moment',
        category,
        confidence: clamp(o.confidence),
        signals: signals.slice(0, 5).map((s: Record<string, unknown>) => ({
          label: str(s?.label, 80),
          explanation: str(s?.explanation),
          source: SIGNAL_SOURCES.includes(s?.source as SignalSource) ? (s.source as SignalSource) : 'Transactions',
        })),
        customerNeed: str(o.customerNeed),
        productCategory,
        sensitive: o.sensitive === true || SENSITIVE_CATEGORIES.includes(category),
        headline: str(o.headline, 90),
        customerMessage: str(o.customerMessage, 320),
      },
    ];
  });
}

export function applyGuardrails(
  candidates: MomentCandidate[],
  consent: ConsentSettings,
  dismissed: DismissedMoment[] = [],
): Decision {
  const guardrails: GuardrailCheck[] = [];
  const sorted = [...candidates].sort((a, b) => b.confidence - a.confidence);
  const chosen = sorted[0] ?? null;

  if (!chosen) {
    guardrails.push({ rule: 'One moment only', result: 'skip', detail: 'LLM proposed no moment' });
    return { status: 'idle', chosen: null, guardrails };
  }

  const dropped = sorted.slice(1).map((c) => `${c.moment} (${c.confidence})`);
  guardrails.push({
    rule: 'One moment only',
    result: 'pass',
    detail: dropped.length ? `Kept the highest score · dropped ${dropped.join(', ')}` : 'Single candidate',
  });

  const above = chosen.confidence >= ACTION_THRESHOLD;
  guardrails.push({
    rule: `Action threshold ≥ ${ACTION_THRESHOLD}`,
    result: above ? 'pass' : 'fail',
    detail: `${chosen.confidence}% ${above ? '≥' : '<'} ${ACTION_THRESHOLD}%${above ? '' : ' · keep monitoring'}`,
  });
  if (!above) return { status: 'monitoring', chosen, guardrails };

  const wasDismissed = dismissed.some((d) => d.category === chosen.category);
  guardrails.push({
    rule: 'Customer feedback',
    result: wasDismissed ? 'fail' : 'pass',
    detail: wasDismissed ? 'Customer already marked this kind of moment as not relevant' : 'No negative feedback',
  });
  if (wasDismissed) return { status: 'suppressed', chosen, guardrails };

  const consented = consent[chosen.category] === true;
  guardrails.push({
    rule: chosen.sensitive ? 'Sensitive moment needs explicit consent' : 'Customer consent',
    result: consented ? 'pass' : 'fail',
    detail: consented
      ? `Consent given for “${chosen.category}”`
      : `No consent for “${chosen.category}”${chosen.sensitive ? ' (sensitive)' : ''} · blocked`,
  });
  if (!consented) return { status: 'blocked', chosen, guardrails };

  return { status: 'detected', chosen, guardrails };
}
