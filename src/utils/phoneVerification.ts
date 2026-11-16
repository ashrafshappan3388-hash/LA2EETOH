export interface NormalizedPhoneResult {
  valid: boolean;
  e164: string;
  waDigits: string;
  display: string;
  error?: string;
}

const ARABIC_INDIC_MAP: Record<string, string> = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
};

export function toAsciiDigits(input: string): string {
  return (input ?? '').replace(/[٠-٩۰-۹]/g, (ch) => ARABIC_INDIC_MAP[ch] ?? ch);
}

/**
 * Normalizes Egyptian and international phone numbers to strict E.164 format.
 * Examples:
 * - "01012345678" -> "+201012345678"
 * - "201123456789" -> "+201123456789"
 * - "+20 12 3456 7890" -> "+201234567890"
 */
export function normalizeEgyptPhone(raw: string): NormalizedPhoneResult {
  const ascii = toAsciiDigits(raw).trim();
  if (!ascii) {
    return { valid: false, e164: '', waDigits: '', display: '', error: 'Phone number is required.' };
  }

  const hasLeadingPlus = ascii.startsWith('+');
  let digits = ascii.replace(/\D/g, '');

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  // Egyptian mobile format starting with 010, 011, 012, 015 (11 digits total)
  if (!hasLeadingPlus && /^01[0125][0-9]{8}$/.test(digits)) {
    const e164 = `+20${digits.slice(1)}`;
    return {
      valid: true,
      e164,
      waDigits: e164.slice(1),
      display: `+20 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`,
    };
  }

  // Egyptian mobile starting with 2010/2011/2012/2015 (12 digits total)
  if (/^201[0125][0-9]{8}$/.test(digits)) {
    const e164 = `+${digits}`;
    return {
      valid: true,
      e164,
      waDigits: digits,
      display: `+20 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`,
    };
  }

  // Reject invalid Egyptian numbers that start with +20 or 01 but wrong length/prefix
  if (digits.startsWith('20') || (!hasLeadingPlus && digits.startsWith('01'))) {
    return {
      valid: false,
      e164: '',
      waDigits: '',
      display: '',
      error: 'Enter a valid Egyptian mobile number (e.g. 01012345678 or +201012345678).',
    };
  }

  // General E.164 international mobile (8 to 15 digits)
  if (/^[1-9][0-9]{7,14}$/.test(digits)) {
    const e164 = `+${digits}`;
    return {
      valid: true,
      e164,
      waDigits: digits,
      display: e164,
    };
  }

  return {
    valid: false,
    e164: '',
    waDigits: '',
    display: '',
    error: 'Invalid phone number format.',
  };
}

export function maskPhone(e164: string): string {
  const clean = (e164 ?? '').trim();
  if (clean.length < 7) return clean;
  const prefix = clean.slice(0, 5);
  const suffix = clean.slice(-2);
  return `${prefix}${'•'.repeat(Math.max(3, clean.length - 7))}${suffix}`;
}

export function normalizeSupervisorEmail(raw: string): string {
  return (raw ?? '').trim().toLowerCase();
}

export function isValidEmailAddress(email: string): boolean {
  const clean = normalizeSupervisorEmail(email);
  return clean.length >= 3 && clean.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean);
}

/**
 * Generates a deterministic Firestore-safe document ID (matching ^[a-zA-Z0-9_-]+$)
 * from any normalized email address so both admin creation and user claim lookup
 * resolve the exact same document without needing broad list permissions.
 */
export function makeInviteDocId(email: string): string {
  const clean = normalizeSupervisorEmail(email);
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < clean.length; i++) {
    const c = clean.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= c + i;
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
  }
  return `inv_${h1.toString(16).padStart(8, '0')}_${h2.toString(16).padStart(8, '0')}`;
}
