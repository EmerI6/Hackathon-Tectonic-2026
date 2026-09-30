export type CustomerId = 'emma' | 'lucas-sarah' | 'marc';

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
  | 'pension';

export interface Transaction {
  id: string;
  /** ISO date, e.g. 2026-10-01 */
  date: string;
  merchant: string;
  description?: string;
  category: TransactionCategory;
  /** Negative = outgoing, positive = incoming (EUR). */
  amount: number;
  /** Marks a transaction that fed the moment detector. */
  signal?: {
    label: string;
  };
}

export interface MonthData {
  /** e.g. "2026-09" */
  key: string;
  label: string;
  transactions: Transaction[];
  /** Change to the savings account when this month is simulated. */
  savingsDelta?: number;
  /** Signal ids (from the customer's moment) that become visible this month. */
  unlocksSignals?: string[];
}

export type SignalSource = 'Transactions' | 'Income' | 'Savings' | 'In-app behaviour' | 'Profile';

export interface Signal {
  id: string;
  /** Short technical label shown to the jury, e.g. "New employer salary". */
  label: string;
  /** Plain-language explanation shown to the customer. */
  customerExplanation: string;
  source: SignalSource;
  /** Contribution to the confidence score (points out of 100). */
  weight: number;
}

export type ConsentCategoryId =
  | 'career'
  | 'home'
  | 'moving'
  | 'car'
  | 'retirement'
  | 'family'
  | 'health';

export interface ConsentCategory {
  id: ConsentCategoryId;
  label: string;
  description: string;
  sensitive: boolean;
}

export type ConsentSettings = Record<ConsentCategoryId, boolean>;

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  confirmation: string;
  product: string;
}

export interface LifeMoment {
  id: string;
  type: ConsentCategoryId;
  title: string;
  headline: string;
  message: string;
  notification: string;
  /** Minimum confidence (0-100) before the customer is contacted. */
  threshold: number;
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
  /** Months already on file when the demo starts. */
  history: MonthData[];
  /** Months unlocked one by one with "Simulate next month". */
  upcoming: MonthData[];
  /** Moment the detector finds once all upcoming months are in. */
  moment: LifeMoment;
}

export type MomentResponse = 'accepted' | 'advisor' | 'dismissed';

export type DetectionStatus =
  /** No signals yet. */
  | 'idle'
  /** Some signals, but the confidence is below the action threshold. */
  | 'monitoring'
  /** Confidence above threshold and consent given: the customer is notified. */
  | 'detected'
  /** Confidence above threshold but the customer did not consent to this moment type. */
  | 'blocked';

export interface Detection {
  status: DetectionStatus;
  moment: LifeMoment;
  signals: Signal[];
  confidence: number;
}

export interface SimulationResult {
  month: MonthData;
  detection: Detection;
}
