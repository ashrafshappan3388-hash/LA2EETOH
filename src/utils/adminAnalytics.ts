import type {
  InstitutionalRecord,
  ItemReport,
  ModerationCase,
  Organization,
  RecoveryCase,
  SupportTicket,
} from '../types';

export interface AdminUserRecord {
  uid: string;
  email?: string;
  preferredLang?: 'en' | 'ar';
  role?: string;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface RankedBucket {
  key: string;
  count: number;
  pct: number;
}

export interface AdminAnalyticsInput {
  users: AdminUserRecord[];
  reports: ItemReport[];
  recoveryCases: RecoveryCase[];
  organizations: Organization[];
  institutionalRecords: InstitutionalRecord[];
  supportTickets: SupportTicket[];
  moderationCases: ModerationCase[];
  totalUsersCount?: number;
  totalChatsCount?: number;
  smartTagsCount?: number;
  tagScansCount?: number;
  watchlistsCount?: number;
  nowMs?: number;
}

export interface AdminAnalyticsSummary {
  totalUsers: number;
  activeUsers24h: number;
  activeUsers7d: number;
  newUsers7d: number;
  totalCases: number;
  chatsStarted: number;
  activeChats: number;
  chatParticipants: number;
  recoveredItems: number;
  recoveryRatePct: number;
  totalReports: number;
  liveReports: number;
  lostReports: number;
  foundReports: number;
  openReports: number;
  matchedReports: number;
  flaggedReports: number;
  verifiedOrgs: number;
  pendingOrgs: number;
  custodyItems: number;
  handedOverCustodyItems: number;
  openSupportTickets: number;
  pendingModeration: number;
  smartTagsCount: number;
  tagScansCount: number;
  watchlistsCount: number;
  stageCounts: {
    contactInitiated: number;
    verification: number;
    handoverArranged: number;
    returnedOrClosed: number;
    disputed: number;
  };
  topGovernorates: RankedBucket[];
  topCategories: RankedBucket[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function isChatStartedCase(c: RecoveryCase): boolean {
  return Boolean(
    c.lastMessageAtMs ||
      (c.lastMessageText && c.lastMessageText.trim().length > 0) ||
      c.counterpartyId ||
      c.stage === 'contact_initiated' ||
      c.stage === 'ownership_verification' ||
      c.stage === 'handover_arranged' ||
      c.stage === 'item_returned' ||
      c.stage === 'case_closed'
  );
}

export function computeAdminMetrics(input: AdminAnalyticsInput): AdminAnalyticsSummary {
  const now = input.nowMs ?? Date.now();
  const cutoff24h = now - DAY_MS;
  const cutoff7d = now - 7 * DAY_MS;

  const totalUsers = Math.max(input.totalUsersCount ?? 0, input.users.length);
  const activeUsers24h = input.users.filter((u) => u.updatedAtMs >= cutoff24h).length;
  const activeUsers7d = input.users.filter((u) => u.updatedAtMs >= cutoff7d).length;
  const newUsers7d = input.users.filter((u) => u.createdAtMs >= cutoff7d).length;

  const chatCases = input.recoveryCases.filter(isChatStartedCase);
  const chatsStarted = Math.max(input.totalChatsCount ?? 0, chatCases.length);
  const activeChats = chatCases.filter(
    (c) => c.stage !== 'case_closed' && c.stage !== 'cancelled' && c.stage !== 'item_returned'
  ).length;

  const participantSet = new Set<string>();
  for (const c of chatCases) {
    if (c.ownerId) participantSet.add(c.ownerId);
    if (c.counterpartyId) participantSet.add(c.counterpartyId);
  }

  // Deduplicate recovered items by reportId across reports and returned recovery cases
  const recoveredReportIds = new Set<string>();
  let extraReturnedWithoutReport = 0;
  for (const r of input.reports) {
    if (r.status === 'recovered') {
      recoveredReportIds.add(r.id);
    }
  }
  for (const c of input.recoveryCases) {
    if (c.stage === 'item_returned' || c.stage === 'case_closed') {
      if (c.reportId) {
        recoveredReportIds.add(c.reportId);
      } else {
        extraReturnedWithoutReport += 1;
      }
    }
  }
  const recoveredItems = recoveredReportIds.size + extraReturnedWithoutReport;

  const totalReports = input.reports.length;
  const liveReports = input.reports.filter((r) => !r.isSeed).length;
  const lostReports = input.reports.filter((r) => r.type === 'lost').length;
  const foundReports = input.reports.filter((r) => r.type === 'found').length;
  const openReports = input.reports.filter((r) => r.status === 'open').length;
  const matchedReports = input.reports.filter((r) => r.status === 'matched').length;
  const flaggedReports = input.reports.filter((r) => r.status === 'flagged').length;

  const denominator = Math.max(totalReports, recoveredItems, 1);
  const recoveryRatePct = totalReports === 0 && recoveredItems === 0
    ? 0
    : Math.min(100, Math.round((recoveredItems / denominator) * 100));

  const stageCounts = {
    contactInitiated: input.recoveryCases.filter((c) => c.stage === 'contact_initiated').length,
    verification: input.recoveryCases.filter((c) => c.stage === 'ownership_verification').length,
    handoverArranged: input.recoveryCases.filter((c) => c.stage === 'handover_arranged').length,
    returnedOrClosed: input.recoveryCases.filter(
      (c) => c.stage === 'item_returned' || c.stage === 'case_closed'
    ).length,
    disputed: input.recoveryCases.filter((c) => c.stage === 'disputed').length,
  };

  const govMap = new Map<string, number>();
  const catMap = new Map<string, number>();
  for (const r of input.reports) {
    govMap.set(r.governorateId, (govMap.get(r.governorateId) ?? 0) + 1);
    catMap.set(r.category, (catMap.get(r.category) ?? 0) + 1);
  }

  const toRanked = (m: Map<string, number>): RankedBucket[] =>
    Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, count]) => ({
        key,
        count,
        pct: totalReports > 0 ? Math.round((count / totalReports) * 100) : 0,
      }));

  return {
    totalUsers,
    activeUsers24h,
    activeUsers7d,
    newUsers7d,
    totalCases: input.recoveryCases.length,
    chatsStarted,
    activeChats,
    chatParticipants: participantSet.size,
    recoveredItems,
    recoveryRatePct,
    totalReports,
    liveReports,
    lostReports,
    foundReports,
    openReports,
    matchedReports,
    flaggedReports,
    verifiedOrgs: input.organizations.filter((o) => o.verificationStatus === 'verified').length,
    pendingOrgs: input.organizations.filter((o) => o.verificationStatus === 'pending').length,
    custodyItems: input.institutionalRecords.length,
    handedOverCustodyItems: input.institutionalRecords.filter((i) => i.status === 'handed_over').length,
    openSupportTickets: input.supportTickets.filter(
      (tkt) => tkt.status === 'open' || tkt.status === 'in_progress'
    ).length,
    pendingModeration: input.moderationCases.filter((m) => m.status === 'pending').length,
    smartTagsCount: input.smartTagsCount ?? 0,
    tagScansCount: input.tagScansCount ?? 0,
    watchlistsCount: input.watchlistsCount ?? 0,
    stageCounts,
    topGovernorates: toRanked(govMap),
    topCategories: toRanked(catMap),
  };
}
