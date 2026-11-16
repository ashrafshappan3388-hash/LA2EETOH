export type Language = 'en' | 'ar';
export type ThemeMode = 'light' | 'dark';

export type ReportType = 'lost' | 'found';
export type ReportStatus = 'open' | 'matched' | 'recovered' | 'closed' | 'flagged';
export type LocationPrivacy = 'exact' | 'approximate';

export type RecoveryStage =
  | 'report_published'
  | 'possible_match_found'
  | 'contact_initiated'
  | 'ownership_verification'
  | 'handover_arranged'
  | 'item_returned'
  | 'case_closed'
  | 'disputed'
  | 'cancelled';

export interface ItemReport {
  id: string;
  ownerId: string;
  ownerDisplayName: string;
  type: ReportType;
  status: ReportStatus;
  visibility: 'public' | 'restricted' | 'hidden';
  title: string;
  description: string;
  category: string;
  color: string;
  brand?: string;
  governorateId: string;
  cityId: string;
  districtId?: string;
  areaNote?: string;
  publicLat: number;
  publicLng: number;
  locationPrivacy: LocationPrivacy;
  dateOccurred: string;
  timeApprox?: string;
  isSensitiveDocument: boolean;
  documentKind?: string;
  organizationId?: string;
  photoUrls: string[];
  createdAtMs: number;
  updatedAtMs: number;
  isSeed?: boolean;
}

export interface UserPrivate {
  uid: string;
  email: string;
  phone?: string;
  phoneVerified?: boolean;
  phoneVerifiedAtMs?: number;
  address?: string;
  preferredLang: Language;
  preferredTheme: ThemeMode;
  notifyInApp: boolean;
  notifyEmail: boolean;
  notifyPush: boolean;
  role: 'user' | 'moderator' | 'org_staff' | 'admin';
}

export interface AdminRosterEntry {
  uid: string;
  email: string;
  role: 'admin' | 'moderator';
  appointedByEmail?: string;
  createdAtMs: number;
}

export interface SupervisorInvite {
  id: string;
  email: string;
  emailLower: string;
  role: 'admin' | 'moderator';
  active: boolean;
  appointedByUid: string;
  appointedByEmail: string;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface UserPublic {
  uid: string;
  displayName: string;
  photoUrl?: string;
  reputationScore: number;
  successfulReturns: number;
  validReports: number;
}

export interface SmartTag {
  token: string;
  ownerId: string;
  itemLabel: string;
  category: string;
  safeNote?: string;
  status: 'active' | 'lost' | 'found' | 'returned' | 'deactivated';
  scanCount: number;
  createdAtMs: number;
}

export interface TagScanRelay {
  id: string;
  tagToken: string;
  ownerId: string;
  finderMessage: string;
  finderSafeContact?: string;
  governorateId?: string;
  createdAtMs: number;
}

export interface WatchlistRule {
  id: string;
  ownerId: string;
  title: string;
  keywords?: string;
  category?: string;
  color?: string;
  brand?: string;
  governorateId?: string;
  maxDistanceKm?: number;
  active: boolean;
  createdAtMs: number;
}

export type CaseChatMessageKind = 'text' | 'handover_proposal' | 'verification_prompt';

export interface CaseChatMessage {
  id: string;
  caseId: string;
  senderId: string;
  senderName: string;
  body: string;
  kind: CaseChatMessageKind;
  createdAtMs: number;
}

export interface RecoveryCase {
  id: string;
  reportId: string;
  reportTitle: string;
  ownerId: string;
  ownerDisplayName?: string;
  counterpartyId?: string;
  counterpartyDisplayName?: string;
  stage: RecoveryStage;
  verificationNote?: string;
  handoverLocation?: string;
  lastMessageText?: string;
  lastMessageAtMs?: number;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface Organization {
  id: string;
  nameEn: string;
  nameAr: string;
  orgType: 'university' | 'school' | 'mall' | 'metro' | 'train' | 'airport' | 'transport' | 'institution';
  governorateId: string;
  cityId: string;
  verificationStatus: 'pending' | 'verified' | 'suspended';
  applicantUid: string;
  contactDesk?: string;
  isSeed?: boolean;
}

export interface InstitutionalRecord {
  id: string;
  organizationId: string;
  staffUid: string;
  itemName: string;
  category: string;
  storageLocation: string;
  status: 'in_custody' | 'verification_pending' | 'handed_over' | 'disposed';
  handoverRef?: string;
  createdAtMs: number;
}

export interface SupportTicket {
  id: string;
  ownerId: string;
  subject: string;
  category: 'account' | 'recovery' | 'abuse_report' | 'organization' | 'technical' | 'privacy';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  initialMessage: string;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  authorId: string;
  authorRole: 'user' | 'support_agent' | 'admin';
  body: string;
  createdAtMs: number;
}

export interface SupportInternalNote {
  id: string;
  staffUid: string;
  note: string;
  createdAtMs: number;
}

export interface ModerationCase {
  id: string;
  reportId: string;
  reporterUid: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken';
  createdAtMs: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  kind: 'match' | 'watchlist' | 'recovery' | 'support' | 'qr_scan' | 'org';
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  read: boolean;
  linkPath?: string;
  createdAtMs: number;
}

export interface PlatformSettings {
  platformName: string;
  maintenanceMode: boolean;
  adsEnabled: boolean;
  adSlotsHome: boolean;
  adSlotsSearch: boolean;
  adSlotsSidebar: boolean;
  adSlotsInfo: boolean;
  maxReportsPerDay: number;
  autoModerationStrict: boolean;
}

export interface AdminAuditLog {
  id: string;
  adminUid: string;
  action: string;
  targetPath: string;
  summary: string;
  createdAtMs: number;
}
