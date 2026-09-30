import { useCallback, useEffect, useRef, useState } from 'react';
import { getConsent, getConsentCategories, updateConsent } from '../api/consent';
import { getCustomer, listCustomers, type CustomerSummary } from '../api/customers';
import { simulateNextMonth, submitMomentResponse } from '../api/moments';
import type {
  ConsentCategory,
  ConsentCategoryId,
  ConsentSettings,
  Customer,
  CustomerId,
  Detection,
  MomentResponse,
  Transaction,
} from '../types';

export type PhoneScreen = 'home' | 'transactions' | 'moment' | 'consent';

/** 0 Signals · 1 Understanding · 2 Decision · 3 Channel */
export type PipelineStep = -1 | 0 | 1 | 2 | 3;
export type PipelineOutcome = 'running' | 'delivered' | 'monitoring' | 'blocked' | null;

const STEP_MS = 900;

const byDateDesc = (a: Transaction, b: Transaction) => b.date.localeCompare(a.date);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function useDemo() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [consentCategories, setConsentCategories] = useState<ConsentCategory[]>([]);
  const [customerId, setCustomerId] = useState<CustomerId>('emma');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [newTxIds, setNewTxIds] = useState<Set<string>>(new Set());
  const [balances, setBalances] = useState({ current: 0, savings: 0 });
  const [consent, setConsent] = useState<ConsentSettings | null>(null);
  const [monthIndex, setMonthIndex] = useState(0);
  const [detection, setDetection] = useState<Detection | null>(null);
  const [pipelineStep, setPipelineStep] = useState<PipelineStep>(-1);
  const [pipelineOutcome, setPipelineOutcome] = useState<PipelineOutcome>(null);
  const [simulating, setSimulating] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [response, setResponse] = useState<MomentResponse | null>(null);
  const [screen, setScreen] = useState<PhoneScreen>('home');
  const [reloadKey, setReloadKey] = useState(0);

  // Guards against a customer switch while an animation is still running.
  const runId = useRef(0);

  useEffect(() => {
    listCustomers().then(setCustomers);
    getConsentCategories().then(setConsentCategories);
  }, []);

  useEffect(() => {
    const id = ++runId.current;
    Promise.all([getCustomer(customerId), getConsent(customerId)]).then(([c, cs]) => {
      if (id !== runId.current) return;
      setCustomer(c);
      setConsent(cs);
      setTransactions(c.history.flatMap((m) => m.transactions).sort(byDateDesc));
      setBalances(c.balances);
      setNewTxIds(new Set());
      setMonthIndex(0);
      setDetection(null);
      setPipelineStep(-1);
      setPipelineOutcome(null);
      setSimulating(false);
      setNotificationVisible(false);
      setResponse(null);
      setScreen('home');
    });
  }, [customerId, reloadKey]);

  const deliver = useCallback(async (id: number) => {
    setPipelineStep(3);
    await wait(STEP_MS * 0.6);
    if (id !== runId.current) return;
    setPipelineOutcome('delivered');
    setNotificationVisible(true);
  }, []);

  const simulate = useCallback(async () => {
    if (!customer || !consent || simulating || monthIndex >= customer.upcoming.length) return;
    const id = runId.current;
    setSimulating(true);
    setPipelineOutcome('running');
    setPipelineStep(0);
    setNotificationVisible(false);

    const result = await simulateNextMonth(customer.id, monthIndex, consent);
    if (id !== runId.current) return;

    const monthTx = result.month.transactions;
    setTransactions((prev) => [...monthTx, ...prev].sort(byDateDesc));
    setNewTxIds(new Set(monthTx.map((t) => t.id)));
    setBalances((b) => ({
      current:
        b.current +
        monthTx.filter((t) => t.category !== 'meal-vouchers').reduce((sum, t) => sum + t.amount, 0),
      savings: b.savings + (result.month.savingsDelta ?? 0),
    }));
    setMonthIndex((i) => i + 1);

    await wait(STEP_MS);
    if (id !== runId.current) return;
    setDetection(result.detection);
    setPipelineStep(1);

    await wait(STEP_MS * 1.3);
    if (id !== runId.current) return;
    setPipelineStep(2);

    await wait(STEP_MS);
    if (id !== runId.current) return;
    const { status } = result.detection;
    if (status === 'detected') {
      await deliver(id);
    } else {
      setPipelineOutcome(status === 'blocked' ? 'blocked' : 'monitoring');
    }
    setSimulating(false);
  }, [customer, consent, simulating, monthIndex, deliver]);

  const toggleConsent = useCallback(
    async (category: ConsentCategoryId, enabled: boolean) => {
      if (!customer) return;
      setConsent((c) => (c ? { ...c, [category]: enabled } : c));
      await updateConsent(customer.id, category, enabled);

      // Opting in after a blocked detection releases the moment.
      if (enabled && detection?.status === 'blocked' && detection.moment.type === category) {
        const id = runId.current;
        setDetection({ ...detection, status: 'detected' });
        setPipelineOutcome('running');
        setPipelineStep(2);
        await wait(STEP_MS);
        if (id !== runId.current) return;
        await deliver(id);
      }
    },
    [customer, detection, deliver],
  );

  const respond = useCallback(
    async (r: MomentResponse) => {
      if (!customer || !detection) return;
      setResponse(r);
      await submitMomentResponse(customer.id, detection.moment.id, r);
    },
    [customer, detection],
  );

  const openMoment = useCallback(() => {
    setNotificationVisible(false);
    setScreen('moment');
  }, []);

  const reset = useCallback(() => setReloadKey((k) => k + 1), []);
  const dismissNotification = useCallback(() => setNotificationVisible(false), []);

  const activeMoment = detection?.status === 'detected' ? detection.moment : null;

  return {
    customers,
    consentCategories,
    customerId,
    setCustomerId,
    customer,
    transactions,
    newTxIds,
    balances,
    consent,
    monthIndex,
    detection,
    activeMoment,
    pipelineStep,
    pipelineOutcome,
    simulating,
    notificationVisible,
    dismissNotification,
    response,
    screen,
    setScreen,
    simulate,
    toggleConsent,
    respond,
    openMoment,
    reset,
  };
}

export type DemoState = ReturnType<typeof useDemo>;
