import { customers } from '../data/mockData';
import type { Customer, CustomerId } from '../types';
import { mockResponse } from './client';

export interface CustomerSummary {
  id: CustomerId;
  firstName: string;
  displayName: string;
  age: number;
  persona: string;
  avatarColor: string;
}

export function listCustomers(): Promise<CustomerSummary[]> {
  // TODO(API): GET /demo/customers
  return mockResponse(
    customers.map(({ id, firstName, displayName, age, persona, avatarColor }) => ({
      id,
      firstName,
      displayName,
      age,
      persona,
      avatarColor,
    })),
  );
}

export function getCustomer(id: CustomerId): Promise<Customer> {
  // TODO(API): GET /customers/:id (profile, balances, transaction history)
  const customer = customers.find((c) => c.id === id);
  if (!customer) return Promise.reject(new Error(`Unknown customer ${id}`));
  return mockResponse(customer);
}
