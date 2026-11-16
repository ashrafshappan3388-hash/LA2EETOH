export const FIELD_LIMITS = {
  ID_MAX: 128,
  ID_REGEX: /^[a-zA-Z0-9_-]+$/,
  TITLE_MIN: 3,
  TITLE_MAX: 120,
  DESCRIPTION_MIN: 10,
  DESCRIPTION_MAX: 2000,
  BRAND_MAX: 80,
  DATE_REGEX: /^\d{4}-\d{2}-\d{2}$/,
  TICKET_SUBJECT_MIN: 4,
  TICKET_SUBJECT_MAX: 150,
  TICKET_MESSAGE_MIN: 10,
  TICKET_MESSAGE_MAX: 2000,
  MAX_PHOTOS: 5,
  QR_LABEL_MIN: 2,
  QR_LABEL_MAX: 80,
  QR_SAFE_NOTE_MAX: 300,
  TAG_RELAY_MIN: 5,
  TAG_RELAY_MAX: 500,
  WATCHLIST_TITLE_MIN: 2,
  WATCHLIST_TITLE_MAX: 100,
  MODERATION_REASON_MIN: 4,
  MODERATION_REASON_MAX: 400,
} as const;

export interface ReportDraftInput {
  type: 'lost' | 'found';
  title: string;
  category: string;
  color: string;
  brand?: string;
  description: string;
  governorateId: string;
  cityId: string;
  districtId?: string;
  dateOccurred: string;
  lat: number;
  lng: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateId(id: string): boolean {
  return typeof id === 'string' && id.length > 0 && id.length <= FIELD_LIMITS.ID_MAX && FIELD_LIMITS.ID_REGEX.test(id);
}

export function validateReportPayload(input: ReportDraftInput): ValidationResult {
  const errors: string[] = [];

  if (input.type !== 'lost' && input.type !== 'found') {
    errors.push('Report type must be lost or found.');
  }
  const title = (input.title ?? '').trim();
  if (title.length < FIELD_LIMITS.TITLE_MIN || title.length > FIELD_LIMITS.TITLE_MAX) {
    errors.push(`Item title must be between ${FIELD_LIMITS.TITLE_MIN} and ${FIELD_LIMITS.TITLE_MAX} characters.`);
  }
  const desc = (input.description ?? '').trim();
  if (desc.length < FIELD_LIMITS.DESCRIPTION_MIN || desc.length > FIELD_LIMITS.DESCRIPTION_MAX) {
    errors.push(`Description must be between ${FIELD_LIMITS.DESCRIPTION_MIN} and ${FIELD_LIMITS.DESCRIPTION_MAX} characters.`);
  }
  if (!input.category) errors.push('Category is required.');
  if (!input.color) errors.push('Color is required.');
  if (!input.governorateId || !input.cityId) errors.push('Governorate and city are required.');
  if (!FIELD_LIMITS.DATE_REGEX.test(input.dateOccurred ?? '')) {
    errors.push('Date must be in YYYY-MM-DD format.');
  }
  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng) || input.lat < 21 || input.lat > 32.5 || input.lng < 24 || input.lng > 37.5) {
    errors.push('Selected coordinates must be within Egypt bounds.');
  }
  if (input.brand && input.brand.length > FIELD_LIMITS.BRAND_MAX) {
    errors.push(`Brand must be at most ${FIELD_LIMITS.BRAND_MAX} characters.`);
  }

  return { valid: errors.length === 0, errors };
}

export function validateSupportTicketPayload(subject: string, message: string): ValidationResult {
  const errors: string[] = [];
  const s = (subject ?? '').trim();
  const m = (message ?? '').trim();
  if (s.length < FIELD_LIMITS.TICKET_SUBJECT_MIN || s.length > FIELD_LIMITS.TICKET_SUBJECT_MAX) {
    errors.push(`Subject must be between ${FIELD_LIMITS.TICKET_SUBJECT_MIN} and ${FIELD_LIMITS.TICKET_SUBJECT_MAX} characters.`);
  }
  if (m.length < FIELD_LIMITS.TICKET_MESSAGE_MIN || m.length > FIELD_LIMITS.TICKET_MESSAGE_MAX) {
    errors.push(`Message must be between ${FIELD_LIMITS.TICKET_MESSAGE_MIN} and ${FIELD_LIMITS.TICKET_MESSAGE_MAX} characters.`);
  }
  return { valid: errors.length === 0, errors };
}

export function validateSmartTagPayload(itemLabel: string, category: string, safeNote?: string): ValidationResult {
  const errors: string[] = [];
  const label = (itemLabel ?? '').trim();
  if (label.length < FIELD_LIMITS.QR_LABEL_MIN || label.length > FIELD_LIMITS.QR_LABEL_MAX) {
    errors.push(`Item label must be between ${FIELD_LIMITS.QR_LABEL_MIN} and ${FIELD_LIMITS.QR_LABEL_MAX} characters.`);
  }
  const cat = (category ?? '').trim();
  if (cat.length < 2 || cat.length > 40) {
    errors.push('Category is required.');
  }
  if (safeNote && safeNote.trim().length > FIELD_LIMITS.QR_SAFE_NOTE_MAX) {
    errors.push(`Safe note must be at most ${FIELD_LIMITS.QR_SAFE_NOTE_MAX} characters.`);
  }
  return { valid: errors.length === 0, errors };
}

export function validateTagRelayPayload(finderMessage: string, finderSafeContact?: string): ValidationResult {
  const errors: string[] = [];
  const msg = (finderMessage ?? '').trim();
  if (msg.length < FIELD_LIMITS.TAG_RELAY_MIN || msg.length > FIELD_LIMITS.TAG_RELAY_MAX) {
    errors.push(`Relay message must be between ${FIELD_LIMITS.TAG_RELAY_MIN} and ${FIELD_LIMITS.TAG_RELAY_MAX} characters.`);
  }
  if (finderSafeContact && finderSafeContact.trim().length > 120) {
    errors.push('Suggested contact must be 120 characters or fewer.');
  }
  return { valid: errors.length === 0, errors };
}

export function validateWatchlistPayload(title: string, maxDistanceKm?: number): ValidationResult {
  const errors: string[] = [];
  const clean = (title ?? '').trim();
  if (clean.length < FIELD_LIMITS.WATCHLIST_TITLE_MIN || clean.length > FIELD_LIMITS.WATCHLIST_TITLE_MAX) {
    errors.push(`Watchlist title must be between ${FIELD_LIMITS.WATCHLIST_TITLE_MIN} and ${FIELD_LIMITS.WATCHLIST_TITLE_MAX} characters.`);
  }
  if (maxDistanceKm !== undefined && (!Number.isFinite(maxDistanceKm) || maxDistanceKm < 1 || maxDistanceKm > 1000)) {
    errors.push('Max radius must be between 1 and 1000 km.');
  }
  return { valid: errors.length === 0, errors };
}

export function validateModerationReason(reason: string): ValidationResult {
  const errors: string[] = [];
  const clean = (reason ?? '').trim();
  if (clean.length < FIELD_LIMITS.MODERATION_REASON_MIN || clean.length > FIELD_LIMITS.MODERATION_REASON_MAX) {
    errors.push(`Reason must be between ${FIELD_LIMITS.MODERATION_REASON_MIN} and ${FIELD_LIMITS.MODERATION_REASON_MAX} characters.`);
  }
  return { valid: errors.length === 0, errors };
}

export function formatFriendlyFirestoreError(err: unknown, isAr: boolean, fallbackEn = 'Operation failed. Please check your inputs and try again.'): string {
  if (!(err instanceof Error)) return fallbackEn;
  const msg = err.message || '';
  if (msg.startsWith('{')) {
    try {
      const parsed = JSON.parse(msg) as { error?: string };
      if (parsed.error?.toLowerCase().includes('permission')) {
        return isAr
          ? 'تعذر حفظ البيانات: تأكد من تفعيل حسابك واستيفاء شروط الحقول المطلوبة.'
          : 'Could not save data: please verify your account and make sure all fields meet the length requirements.';
      }
      if (parsed.error) return parsed.error;
    } catch {
      // fall through
    }
  }
  return msg || fallbackEn;
}

export function generateSecureQrToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let token = 'L2T-';
  const array = new Uint8Array(16);
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(array);
    for (let i = 0; i < array.length; i++) {
      token += chars[array[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 16; i++) {
      token += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return token;
}

export function validateCaseChatMessage(body: string): ValidationResult {
  const clean = (body ?? '').trim();
  if (clean.length < 1) {
    return { valid: false, errors: ['Message cannot be empty.'] };
  }
  if (clean.length > 1500) {
    return { valid: false, errors: ['Message must be 1500 characters or fewer.'] };
  }
  return { valid: true, errors: [] };
}

export function canAccessRecoveryCase(
  userUid: string | null | undefined,
  isAdmin: boolean,
  rec: { ownerId: string; counterpartyId?: string }
): boolean {
  if (!userUid) return false;
  if (isAdmin) return true;
  return rec.ownerId === userUid || (Boolean(rec.counterpartyId) && rec.counterpartyId === userUid);
}
