import { consentCategories, defaultConsent } from '../data/mockData';
import type { ConsentCategory, ConsentCategoryId, ConsentSettings, CustomerId } from '../types';
import { mockResponse } from './client';

export function getConsentCategories(): Promise<ConsentCategory[]> {
  // TODO(API): GET /consent/categories
  return mockResponse(consentCategories, 0);
}

export function getConsent(_customerId: CustomerId): Promise<ConsentSettings> {
  // TODO(API): GET /customers/:id/consent
  return mockResponse(defaultConsent, 0);
}

export function updateConsent(
  _customerId: CustomerId,
  category: ConsentCategoryId,
  enabled: boolean,
): Promise<{ category: ConsentCategoryId; enabled: boolean }> {
  // TODO(API): PUT /customers/:id/consent/:category  { enabled }
  return mockResponse({ category, enabled }, 100);
}
