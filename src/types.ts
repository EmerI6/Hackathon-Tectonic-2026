import type { BreakSummary } from './detection/breakDetection.ts';
import type { GuardrailCheck, InterpretResponse, MomentCandidate } from './detection/guardrails.ts';

export type CustomerId = 'emma' | 'lucas-sarah' | 'marc' | 'julie';

export type TransactionCategory =
  | 'salary'
  | 'groceries'
  | 'restaurant'
  | 'transport'
  | 'housing'
  | 'utilities'
  | 'shopping'
  | 'meal-vouchers'
  | 'family'
  | 'savings'
  | 'notary'
  | 'insurance'
  | 'health'
  | 'leisure'
  | 'pension'
  | 'business-admin'
  | 'pro-equipment'
  | 'accounting'
  | 'invoice-income'
  | 'other';

export interface Transaction {
  id: string;
  /** ISO date, e.g. 2026-10-01 */
  date: string;
  merchant: string;
  description?: string;
  category: TransactionCategory;
  /**
   * Generic merchant type from the bank's categoriser (never a name), e.g. "notary office".
   * This is what the break detector sends to the LLM instead of the merchant name.
   */
  kind?: string;
  /** Negative = outgoing, positive = incoming (EUR). */
  amount: number;
  /** Marks a transaction the break detector flagged. */
  signal?: {
    label: string;
  };
}

export interface AppEvent {
  /** In-app feature, e.g. "mortgage simulator". */
  feature: string;
  count: number;
}

export interface MonthData {
  /** e.g. "2026-09" */
  key: string;
  label: string;
  transactions: Transaction[];
  /** Change to the savings account when this month is simulated. */
  savingsDelta?: number;
  appEvents?: AppEvent[];
}

export type SignalSource = 'Transactions' | 'Income' | 'Savings' | 'In-app behaviour' | 'Profile';

export interface Signal {
  /** Short technical label shown to the jury. */
  label: string;
  /** Plain-language explanation shown to the customer. */
  explanation: string;
  source: SignalSource;
}

export type ConsentCategoryId =
  | 'career'
  | 'business'
  | 'home'
  | 'moving'
  | 'car'
  | 'retirement'
  | 'wealth'
  | 'family'
  | 'health'
  | 'finances';

export interface ConsentCategory {
  id: ConsentCategoryId;
  label: string;
  description: string;
  sensitive: boolean;
}

export type ConsentSettings = Record<ConsentCategoryId, boolean>;

export type ProductCategory =
  | 'savings-plan'
  | 'mortgage'
  | 'home-insurance'
  | 'rental-guarantee'
  | 'car-loan'
  | 'retirement-planning'
  | 'investment'
  | 'professional-account'
  | 'child-savings'
  | 'budget-coaching';

export interface Recommendation {
  title: string;
  description: string;
  ctaLabel: string;
  confirmation: string;
  product: string;
}

/** A moment ready to show on the phone: LLM interpretation + product copy from the catalogue. */
export interface LifeMoment {
  id: string;
  type: ConsentCategoryId;
  title: string;
  headline: string;
  message: string;
  notification: string;
  signals: Signal[];
  recommendation: Recommendation;
  channel: string;
}

export interface Customer {
  id: CustomerId;
  firstName: string;
  displayName: string;
  age: number;
  persona: string;
  city: string;
  avatarColor: string;
  balances: { current: number; savings: number };
  /** Months already on file when the demo starts (the detector's baseline). */
  history: MonthData[];
  /** Months unlocked one by one with "Simulate next month". */
  upcoming: MonthData[];
}

export type MomentResponse = 'accepted' | 'advisor' | 'dismissed';

export type DetectionStatus =
  /** No break in the data, the LLM is not called. */
  | 'idle'
  /** Best candidate is below the action threshold. */
  | 'monitoring'
  /** Above threshold, consent given: the customer is notified. */
  | 'detected'
  /** Above threshold but the customer did not consent to this (sensitive) moment. */
  | 'blocked'
  /** The customer already marked this kind of moment as not relevant. */
  | 'suppressed';

export type InterpretationSource = InterpretResponse['source'];

export interface Detection {
  /** "customerId/monthKey" */
  demoKey: string;
  status: DetectionStatus;
  summary: BreakSummary;
  source: InterpretationSource;
  fallbackReason?: string;
  model?: string;
  candidates: MomentCandidate[];
  chosen: MomentCandidate | null;
  guardrails: GuardrailCheck[];
  moment: LifeMoment | null;
  confidence: number;
  threshold: number;
}

export interface SimulationResult {
  month: MonthData;
  detection: Detection;
}

export interface FeedbackEntry {
  at: string;
  demoKey: string;
  customerId: string;
  moment: string;
  category: ConsentCategoryId;
  response: MomentResponse;
}
