export const STRENGTH_CATEGORIES = [
  { value: 'responsiveness', label: 'Responsiveness' },
  { value: 'knowledge', label: 'Knowledge & Expertise' },
  { value: 'trustworthiness', label: 'Trustworthiness' },
  { value: 'communication', label: 'Communication' },
  { value: 'professionalism', label: 'Professionalism' },
  { value: 'claims_support', label: 'Claims Support' },
  { value: 'value', label: 'Value for Money' },
  { value: 'availability', label: 'Availability' },
] as const;

export type StrengthCategory = (typeof STRENGTH_CATEGORIES)[number]['value'];

export const INSURANCE_PRODUCTS = [
  { value: 'auto', label: 'Auto Insurance' },
  { value: 'home', label: 'Home Insurance' },
  { value: 'life', label: 'Life Insurance' },
  { value: 'health', label: 'Health & Dental' },
  { value: 'commercial', label: 'Commercial Insurance' },
  { value: 'travel', label: 'Travel Insurance' },
  { value: 'tenant', label: 'Tenant Insurance' },
  { value: 'condo', label: 'Condo Insurance' },
  { value: 'umbrella', label: 'Umbrella/Liability' },
  { value: 'disability', label: 'Disability Insurance' },
  { value: 'critical_illness', label: 'Critical Illness' },
] as const;

export const ACCENT_COLOR_PRESETS = [
  { value: '#0f172a', label: 'Navy' },
  { value: '#1e40af', label: 'Blue' },
  { value: '#0d9488', label: 'Teal' },
  { value: '#059669', label: 'Emerald' },
  { value: '#7c3aed', label: 'Purple' },
  { value: '#dc2626', label: 'Red' },
  { value: '#ea580c', label: 'Orange' },
  { value: '#000000', label: 'Black' },
] as const;

export const MAX_FEATURED_TESTIMONIALS = 2;

export const COVER_PHOTO_MAX_SIZE = 5 * 1024 * 1024; // 5MB
export const COVER_PHOTO_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];
export const BADGE_ASSETS_BUCKET = 'badge-assets';
