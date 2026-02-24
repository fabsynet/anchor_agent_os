/**
 * Cross-sell bundle definitions for coverage gap analysis.
 * Based on Canadian insurance industry standard product pairings.
 */
export const CROSS_SELL_BUNDLES = [
  { name: 'Auto + Home', types: ['auto', 'home'] },
  { name: 'Life + Health', types: ['life', 'health'] },
  { name: 'Home + Umbrella', types: ['home', 'umbrella'] },
] as const;

/** Minimum number of active policy types before flagging as under-insured */
export const MIN_POLICY_TYPES_FOR_CROSSSELL = 2;

/** Time range options for analytics date filtering */
export const TIME_RANGES = [
  { value: '3mo' as const, label: '3 Months' },
  { value: '6mo' as const, label: '6 Months' },
  { value: 'ytd' as const, label: 'YTD' },
  { value: '12mo' as const, label: '12 Months' },
  { value: 'all' as const, label: 'All Time' },
] as const;

/**
 * Lenient mapping from common policy type variations to canonical types.
 * Used by the import service to normalize user-supplied policy types.
 */
export const IMPORT_POLICY_TYPE_MAP: Record<string, string> = {
  // Auto
  automobile: 'auto',
  car: 'auto',
  vehicle: 'auto',
  motor: 'auto',
  automotive: 'auto',
  'auto insurance': 'auto',
  // Home
  house: 'home',
  homeowners: 'home',
  homeowner: 'home',
  'home insurance': 'home',
  property: 'home',
  dwelling: 'home',
  condo: 'home',
  tenant: 'home',
  renters: 'home',
  renter: 'home',
  // Life
  'life insurance': 'life',
  'term life': 'life',
  'whole life': 'life',
  'universal life': 'life',
  // Health
  'health insurance': 'health',
  medical: 'health',
  dental: 'health',
  disability: 'health',
  benefits: 'health',
  // Commercial
  business: 'commercial',
  'commercial insurance': 'commercial',
  liability: 'commercial',
  'general liability': 'commercial',
  'professional liability': 'commercial',
  // Travel
  'travel insurance': 'travel',
  trip: 'travel',
  // Umbrella
  'umbrella insurance': 'umbrella',
  'excess liability': 'umbrella',
  // Other
  'other insurance': 'other',
};

/** Expected fields for CSV import with labels and required flags */
export const IMPORT_EXPECTED_FIELDS = [
  { key: 'firstName', label: 'First Name', required: true },
  { key: 'lastName', label: 'Last Name', required: true },
  { key: 'email', label: 'Email', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'address', label: 'Address', required: false },
  { key: 'city', label: 'City', required: false },
  { key: 'province', label: 'Province', required: false },
  { key: 'postalCode', label: 'Postal Code', required: false },
  { key: 'policyType', label: 'Policy Type', required: true },
  { key: 'carrier', label: 'Carrier', required: false },
  { key: 'policyNumber', label: 'Policy Number', required: false },
  { key: 'premium', label: 'Premium', required: false },
  { key: 'startDate', label: 'Start Date', required: false },
  { key: 'endDate', label: 'End Date', required: false },
  { key: 'status', label: 'Status', required: false },
] as const;
