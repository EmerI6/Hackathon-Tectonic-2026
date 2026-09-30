import { customers } from '../data/mockData';
import type {
  ConsentSettings,
  CustomerId,
  Detection,
  MomentResponse,
  SimulationResult,
} from '../types';
import { mockResponse } from './client';

/**
 * Pushes the next month of transactions for a demo customer and runs the
 * (mocked) life moment detector on everything seen so far.
 *
 * The mock simply adds up the weights of the signals unlocked by each month;
 * the real detector scores transactions, income, savings and in-app events.
 */
export function simulateNextMonth(
  customerId: CustomerId,
  monthIndex: number,
  consent: ConsentSettings,
): Promise<SimulationResult> {
  // TODO(API): POST /demo/customers/:id/simulate-month  { monthIndex }
  //            -> the backend ingests the month and returns the detector output.
  const customer = customers.find((c) => c.id === customerId);
  const month = customer?.upcoming[monthIndex];
  if (!customer || !month) return Promise.reject(new Error('No month left to simulate'));

  const unlocked = new Set(customer.upcoming.slice(0, monthIndex + 1).flatMap((m) => m.unlocksSignals ?? []));
  const signals = customer.moment.signals.filter((s) => unlocked.has(s.id));
  const confidence = signals.reduce((sum, s) => sum + s.weight, 0);

  let status: Detection['status'] = signals.length ? 'monitoring' : 'idle';
  if (confidence >= customer.moment.threshold) {
    status = consent[customer.moment.type] ? 'detected' : 'blocked';
  }

  return mockResponse({ month, detection: { status, moment: customer.moment, signals, confidence } }, 400);
}

export function submitMomentResponse(
  customerId: CustomerId,
  momentId: string,
  response: MomentResponse,
): Promise<{ ok: true }> {
  // TODO(API): POST /customers/:id/moments/:momentId/response  { response }
  //            "dismissed" feeds back into the detector as a negative label.
  void customerId;
  void momentId;
  void response;
  return mockResponse({ ok: true as const }, 300);
}
