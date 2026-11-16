export interface SensitiveDetectionResult {
  hasSensitiveData: boolean;
  reasons: ('national_id' | 'bank_card' | 'iban' | 'phone')[];
}

const EGYPT_NATIONAL_ID_REGEX = /\b[23]\d{13}\b/g;
const CARD_NUMBER_REGEX = /\b(?:\d[ -]*?){13,19}\b/g;
const IBAN_REGEX = /\bEG\d{2}[A-Z0-9]{10,27}\b/gi;
const EGYPT_PHONE_REGEX = /\b(?:\+?20|0)1[0125]\d{8}\b/g;

/**
 * Detects Egyptian National IDs, payment card numbers, IBANs, and personal phone numbers
 * so they are never published openly on public reports or Emergency Document listings.
 */
export function detectSensitiveDocumentPatterns(input: string): SensitiveDetectionResult {
  const reasons: ('national_id' | 'bank_card' | 'iban' | 'phone')[] = [];
  if (!input) return { hasSensitiveData: false, reasons };

  if (EGYPT_NATIONAL_ID_REGEX.test(input)) reasons.push('national_id');
  EGYPT_NATIONAL_ID_REGEX.lastIndex = 0;

  if (IBAN_REGEX.test(input)) reasons.push('iban');
  IBAN_REGEX.lastIndex = 0;

  if (EGYPT_PHONE_REGEX.test(input)) reasons.push('phone');
  EGYPT_PHONE_REGEX.lastIndex = 0;

  const cardMatches = input.match(CARD_NUMBER_REGEX) ?? [];
  for (const match of cardMatches) {
    const digitsOnly = match.replace(/\D/g, '');
    if (digitsOnly.length >= 13 && digitsOnly.length <= 19 && !/^[23]\d{13}$/.test(digitsOnly)) {
      if (!reasons.includes('bank_card')) reasons.push('bank_card');
    }
  }

  return { hasSensitiveData: reasons.length > 0, reasons };
}

/**
 * Redacts sensitive numbers from public text while keeping safe identifying context.
 */
export function sanitizeDocumentText(input: string): string {
  if (!input) return '';
  let out = input.replace(EGYPT_NATIONAL_ID_REGEX, '[REDACTED-ID]');
  out = out.replace(IBAN_REGEX, '[REDACTED-IBAN]');
  out = out.replace(EGYPT_PHONE_REGEX, '[PROTECTED-CONTACT]');
  out = out.replace(CARD_NUMBER_REGEX, (m) => {
    const digits = m.replace(/\D/g, '');
    if (digits.length >= 13 && digits.length <= 19) {
      return `****-****-****-${digits.slice(-4)}`;
    }
    return m;
  });
  return out;
}

/**
 * Redacts National IDs, IBANs, and bank card numbers inside private verified two-party
 * recovery chats while allowing agreed public meeting spots or coordination details.
 */
export function sanitizePrivateChatText(input: string): string {
  if (!input) return '';
  let out = input.replace(EGYPT_NATIONAL_ID_REGEX, '[REDACTED-ID]');
  out = out.replace(IBAN_REGEX, '[REDACTED-IBAN]');
  out = out.replace(CARD_NUMBER_REGEX, (m) => {
    const digits = m.replace(/\D/g, '');
    if (digits.length >= 13 && digits.length <= 19) {
      return `****-****-****-${digits.slice(-4)}`;
    }
    return m;
  });
  return out.trim();
}

export interface ComparableReport {
  id: string;
  type: 'lost' | 'found';
  title: string;
  description: string;
  category: string;
  color: string;
  brand?: string;
  governorateId: string;
  cityId?: string;
  dateOccurred: string;
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 2)
  );
}

/**
 * Detects potential duplicate reports to prevent spam or double posting.
 * Returns similarity 0..1.
 */
export function computeDuplicateSimilarity(
  candidate: Omit<ComparableReport, 'id'>,
  existing: ComparableReport
): number {
  if (candidate.type !== existing.type) return 0;
  let score = 0;

  if (candidate.category === existing.category) score += 0.2;
  if (candidate.governorateId === existing.governorateId) score += 0.2;
  if (candidate.color && candidate.color === existing.color) score += 0.1;
  if (candidate.dateOccurred === existing.dateOccurred) score += 0.1;

  const t1 = tokenize(`${candidate.title} ${candidate.brand ?? ''}`);
  const t2 = tokenize(`${existing.title} ${existing.brand ?? ''}`);
  if (t1.size > 0 && t2.size > 0) {
    let overlap = 0;
    for (const token of t1) {
      if (t2.has(token)) overlap++;
    }
    const jaccard = overlap / (t1.size + t2.size - overlap);
    score += jaccard * 0.4;
  }

  return Math.min(1, Math.round(score * 100) / 100);
}

export interface MatchQuery {
  keywords: string[];
  category?: string;
  color?: string;
  brand?: string;
  governorateId?: string;
  targetType?: 'lost' | 'found';
}

/**
 * Scores a candidate report against search / watchlist / visual-search attributes (0..100).
 * Never constitutes proof of ownership.
 */
export function scoreReportMatch(query: MatchQuery, report: ComparableReport): number {
  if (query.targetType && report.type !== query.targetType) return 0;

  let score = 0;
  if (query.category && query.category === report.category) score += 28;
  if (query.color && query.color === report.color) score += 16;
  if (query.governorateId && query.governorateId === report.governorateId) score += 16;

  if (query.brand && report.brand) {
    const qb = query.brand.toLowerCase().trim();
    const rb = report.brand.toLowerCase().trim();
    if (qb && rb && (rb.includes(qb) || qb.includes(rb))) {
      score += 15;
    }
  }

  const reportText = `${report.title} ${report.description} ${report.brand ?? ''}`.toLowerCase();
  const cleanKeywords = query.keywords.map((k) => k.toLowerCase().trim()).filter((k) => k.length >= 2);
  if (cleanKeywords.length > 0) {
    let matched = 0;
    for (const kw of cleanKeywords) {
      if (reportText.includes(kw)) matched++;
    }
    score += Math.round((matched / cleanKeywords.length) * 25);
  }

  return Math.min(99, score);
}
