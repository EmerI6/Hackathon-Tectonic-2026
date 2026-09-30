import { useCallback, useEffect, useMemo, useState } from 'react';
import { getConsent, getConsentCategories } from '../api/consent';
import { importFile, interpretLive, liveBreak } from '../api/live';
import { buildDetection, clearFeedback, listFeedback, reapplyGuardrails, submitMomentResponse } from '../api/moments';
import type {
  ConsentCategory,
  ConsentCategoryId,
  ConsentSettings,
  Customer,
  Detection,
  FeedbackEntry,
  MomentResponse,
  Transaction,
} from '../types';
import type { PhoneScreen } from './useDemo';

const STORAGE_KEY = 'kbc-moments-live-v1';

export interface LiveProfile {
  firstName: string;
  age: number;
  current: number;
  savings: number;
}

interface Stored {
  profile: LiveProfile;
  transactions: Transaction[];
}

const defaultProfile: LiveProfile = { firstName: 'Julie', age: 34, current: 3000, savings: 15000 };

function load(): Stored {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '') as Stored;
    if (Array.isArray(s.transactions) && s.profile) return s;
  } catch {
    /* first visit */
  }
  return { profile: defaultProfile, transactions: [] };
}

const byDateDesc = (a: Transaction, b: Transaction) => b.date.localeCompare(a.date);

export function useLive() {
  const [stored, setStored] = useState<Stored>(load);
  const [consentCategories, setConsentCategories] = useState<ConsentCategory[]>([]);
  const [consent, setConsent] = useState<ConsentSettings | null>(null);
  const [detection, setDetection] = useState<Detection | null>(null);
  const [flagged, setFlagged] = useState<Map<string, string>>(new Map());
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [allowFallback, setAllowFallback] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [response, setResponse] = useState<MomentResponse | null>(null);
  const [screen, setScreen] = useState<PhoneScreen>('home');
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);

  useEffect(() => {
    getConsentCategories().then(setConsentCategories);
    getConsent('julie').then(setConsent);
    listFeedback().then(setFeedback);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }, [stored]);

  const { profile } = stored;
  const customer: Customer = useMemo(() => {
    const { firstName, age, current, savings } = stored.profile;
    return {
      id: 'julie',
      firstName: firstName || 'You',
      displayName: firstName || 'You',
      age,
      persona: 'Live data',
      city: '',
      avatarColor: '#1E2A5A',
      balances: { current, savings },
      history: [],
      upcoming: [],
    };
  }, [stored.profile]);

  const transactions = useMemo(
    () =>
      stored.transactions
        .map((t) => (flagged.has(t.id) ? { ...t, signal: { label: flagged.get(t.id)! } } : t))
        .sort(byDateDesc),
    [stored.transactions, flagged],
  );

  const invalidate = () => {
    setDetection(null);
    setFlagged(new Map());
    setNotificationVisible(false);
    setResponse(null);
    setError(null);
  };

  const setProfile = useCallback((p: Partial<LiveProfile>) => {
    setStored((s) => ({ ...s, profile: { ...s.profile, ...p } }));
  }, []);

  const addTransactions = useCallback((txs: Transaction[]) => {
    setStored((s) => ({ ...s, transactions: [...s.transactions, ...txs] }));
    invalidate();
  }, []);

  const removeTransaction = useCallback((id: string) => {
    setStored((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) }));
    invalidate();
  }, []);

  const clearTransactions = useCallback(() => {
    setStored((s) => ({ ...s, transactions: [] }));
    setImportMessage(null);
    invalidate();
  }, []);

  const importFromFile = useCallback(
    async (file: File) => {
      try {
        const { transactions: txs, errors } = await importFile(file);
        addTransactions(txs);
        setImportMessage(
          `Imported ${txs.length} transactions from ${file.name}` +
            (errors.length ? ` · ${errors.length} rows skipped (${errors.slice(0, 2).join('; ')})` : ''),
        );
      } catch (e) {
        setImportMessage(`Could not read ${file.name}: ${(e as Error).message}`);
      }
    },
    [addTransactions],
  );

  const analyze = useCallback(async () => {
    if (!consent) return;
    invalidate();
    const { months, summary, recent } = liveBreak(stored.transactions, profile.age, profile.savings);
    if (months.length < 3) {
      setError(`Need at least 3 months of transactions (ideally 8: 6 baseline + 2 recent). Found ${months.length}.`);
      return;
    }
    setAnalyzing(true);
    try {
      const result = await interpretLive(summary, consent, allowFallback);
      const d = buildDetection(customer, 'live/session', summary, result);
      setDetection(d);

      const key = (t: Transaction) => `${t.amount >= 0 ? 'in' : 'out'}|${t.category}|${t.kind ?? t.category}`;
      const fresh = new Set(summary.newItems.map((n) => `${n.direction}|${n.category}|${n.kind}`));
      setFlagged(
        new Map(recent.flatMap((m) => m.transactions).filter((t) => fresh.has(key(t))).map((t) => [t.id, 'New pattern'])),
      );
      if (d.status === 'detected') setNotificationVisible(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAnalyzing(false);
    }
  }, [consent, stored.transactions, profile, allowFallback, customer]);

  const toggleConsent = useCallback(
    (category: ConsentCategoryId, enabled: boolean) => {
      if (!consent) return;
      const next = { ...consent, [category]: enabled };
      setConsent(next);
      if (detection && detection.chosen?.category === category) {
        const d = reapplyGuardrails(detection, next, customer.firstName);
        setDetection(d);
        setNotificationVisible(d.status === 'detected');
      }
    },
    [consent, detection, customer.firstName],
  );

  const respond = useCallback(
    async (r: MomentResponse) => {
      if (!detection) return;
      setResponse(r);
      const saved = await submitMomentResponse(detection, r);
      if (saved) setFeedback((f) => [saved, ...f]);
    },
    [detection],
  );

  const openMoment = useCallback(() => {
    setNotificationVisible(false);
    setScreen('moment');
  }, []);
  const dismissNotification = useCallback(() => setNotificationVisible(false), []);
  const resetFeedback = useCallback(async () => {
    await clearFeedback();
    setFeedback([]);
  }, []);

  return {
    profile,
    setProfile,
    customer,
    consent,
    consentCategories,
    balances: customer.balances,
    transactions,
    newTxIds: new Set(flagged.keys()),
    detection,
    activeMoment: detection?.status === 'detected' ? detection.moment : null,
    analyzing,
    error,
    importMessage,
    allowFallback,
    setAllowFallback,
    analyze,
    addTransactions,
    removeTransaction,
    clearTransactions,
    importFromFile,
    notificationVisible,
    dismissNotification,
    response,
    respond,
    openMoment,
    screen,
    setScreen,
    toggleConsent,
    feedback,
    resetFeedback,
  };
}

export type LiveState = ReturnType<typeof useLive>;
