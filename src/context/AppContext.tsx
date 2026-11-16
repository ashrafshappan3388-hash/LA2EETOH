import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  testFirestoreConnection,
} from '../lib/firebase';
import { SEED_ORGANIZATIONS, SEED_REPORTS } from '../data/seedData';
import type {
  AdminAuditLog,
  AdminRosterEntry,
  CaseChatMessage,
  CaseChatMessageKind,
  InstitutionalRecord,
  ItemReport,
  Language,
  ModerationCase,
  NotificationItem,
  Organization,
  PlatformSettings,
  RecoveryCase,
  RecoveryStage,
  ReportStatus,
  ReportType,
  SmartTag,
  SupervisorInvite,
  SupportMessage,
  SupportTicket,
  ThemeMode,
  UserPrivate,
  UserPublic,
  WatchlistRule,
} from '../types';
import { applyLocationPrivacy } from '../utils/egyptLocations';
import { sanitizeDocumentText, sanitizePrivateChatText, scoreReportMatch } from '../utils/sanitization';
import {
  isValidEmailAddress,
  makeInviteDocId,
  normalizeSupervisorEmail,
} from '../utils/phoneVerification';
import {
  generateSecureQrToken,
  validateCaseChatMessage,
  validateModerationReason,
  validateSmartTagPayload,
  validateTagRelayPayload,
  validateWatchlistPayload,
} from '../utils/validation';

export interface ReportDraftPrefill {
  type?: ReportType;
  title?: string;
  category?: string;
  color?: string;
  brand?: string;
  governorateId?: string;
  description?: string;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  platformName: 'LA2EETOH',
  maintenanceMode: false,
  adsEnabled: false,
  adSlotsHome: true,
  adSlotsSearch: true,
  adSlotsSidebar: true,
  adSlotsInfo: true,
  maxReportsPerDay: 10,
  autoModerationStrict: true,
};

interface AppContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  currentPath: string;
  navigate: (path: string) => void;
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  userPrivate: UserPrivate | null;
  userPublic: UserPublic | null;
  reports: ItemReport[];
  reportsLoading: boolean;
  organizations: Organization[];
  institutionalRecords: InstitutionalRecord[];
  smartTags: SmartTag[];
  watchlists: WatchlistRule[];
  recoveryCases: RecoveryCase[];
  supportTickets: SupportTicket[];
  moderationCases: ModerationCase[];
  notifications: NotificationItem[];
  auditLogs: AdminAuditLog[];
  adminsList: AdminRosterEntry[];
  supervisorInvites: SupervisorInvite[];
  platformSettings: PlatformSettings;
  mapsApiKey: string | null;
  mapsLoadError: boolean;
  setMapsLoadError: (val: boolean) => void;
  mapsQuotaExceeded: boolean;
  setMapsQuotaExceeded: (val: boolean) => void;
  isOnline: boolean;
  userCoords: { lat: number; lng: number } | null;
  setUserCoords: (coords: { lat: number; lng: number } | null) => void;
  aiDraft: ReportDraftPrefill | null;
  setAiDraft: (draft: ReportDraftPrefill | null) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  updatePreferences: (
    prefs: Partial<
      Pick<
        UserPrivate,
        'preferredLang' | 'preferredTheme' | 'phone' | 'phoneVerified' | 'address' | 'notifyInApp' | 'notifyEmail' | 'notifyPush'
      >
    > & { displayName?: string; photoUrl?: string; markPhoneVerifiedNow?: boolean }
  ) => Promise<void>;
  appointSupervisorByEmail: (email: string, role: 'admin' | 'moderator') => Promise<{ mode: 'activated_immediately' | 'invited_pending_login' }>;
  revokeSupervisor: (input: { uid?: string; inviteId?: string; email?: string }) => Promise<void>;
  createReport: (input: {
    type: ReportType;
    title: string;
    description: string;
    category: string;
    color: string;
    brand?: string;
    governorateId: string;
    cityId: string;
    districtId?: string;
    areaNote?: string;
    lat: number;
    lng: number;
    locationPrivacy: 'exact' | 'approximate';
    dateOccurred: string;
    timeApprox?: string;
    isSensitiveDocument: boolean;
    documentKind?: string;
    verificationQuestion?: string;
    photoUrls: string[];
  }) => Promise<string>;
  updateReportStatus: (reportId: string, status: ReportStatus) => Promise<void>;
  flagReport: (reportId: string, reason: string) => Promise<void>;
  createSmartTag: (input: { itemLabel: string; category: string; safeNote?: string }) => Promise<string>;
  updateSmartTagStatus: (token: string, status: SmartTag['status']) => Promise<void>;
  submitTagRelay: (input: { tagToken: string; ownerId: string; finderMessage: string; finderSafeContact?: string; governorateId?: string }) => Promise<void>;
  createWatchlist: (input: Omit<WatchlistRule, 'id' | 'ownerId' | 'createdAtMs' | 'active'>) => Promise<void>;
  toggleWatchlist: (id: string, active: boolean) => Promise<void>;
  deleteWatchlist: (id: string) => Promise<void>;
  createRecoveryCase: (report: ItemReport, note?: string) => Promise<string>;
  advanceRecoveryCase: (caseId: string, stage: RecoveryStage, note?: string, handoverLocation?: string) => Promise<void>;
  subscribeCaseMessages: (
    caseId: string,
    onMessages: (messages: CaseChatMessage[]) => void,
    onError?: (err: unknown) => void
  ) => () => void;
  sendCaseMessage: (caseId: string, body: string, kind?: CaseChatMessageKind) => Promise<void>;
  submitReview: (input: { caseId: string; targetUid: string; rating: number; comment?: string }) => Promise<void>;
  applyOrganization: (input: { nameEn: string; nameAr: string; orgType: Organization['orgType']; governorateId: string; cityId: string; contactDesk?: string }) => Promise<void>;
  verifyOrganization: (orgId: string, status: Organization['verificationStatus']) => Promise<void>;
  addInstitutionalRecord: (input: { organizationId: string; itemName: string; category: string; storageLocation: string }) => Promise<void>;
  updateInstitutionalStatus: (recordId: string, status: InstitutionalRecord['status'], handoverRef?: string) => Promise<void>;
  createSupportTicket: (input: { subject: string; category: SupportTicket['category']; priority: SupportTicket['priority']; initialMessage: string }) => Promise<string>;
  sendSupportReply: (ticketId: string, body: string) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: SupportTicket['status']) => Promise<void>;
  addInternalNote: (ticketId: string, note: string) => Promise<void>;
  loadTicketThread: (ticketId: string) => Promise<{ messages: SupportMessage[]; notes: { id: string; staffUid: string; note: string; createdAtMs: number }[] }>;
  markNotificationRead: (id: string) => Promise<void>;
  resolveModerationCase: (caseId: string, reportId: string, action: 'dismissed' | 'action_taken') => Promise<void>;
  updatePlatformSettings: (next: Partial<PlatformSettings>) => Promise<void>;
  exportMyData: () => Record<string, unknown>;
  deleteMyAccount: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function makeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${rand}`;
}

function toMs(val: unknown): number {
  if (val && typeof val === 'object' && 'toMillis' in val && typeof (val as { toMillis: () => number }).toMillis === 'function') {
    return (val as { toMillis: () => number }).toMillis();
  }
  return Date.now();
}

function safeGetStorage(key: string): string | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function safeSetStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Ignore storage restriction inside sandboxed iframes
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = safeGetStorage('la2eetoh_lang');
    return saved === 'ar' ? 'ar' : 'en';
  });
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = safeGetStorage('la2eetoh_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });
  const [currentPath, setCurrentPath] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/'
  );

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [userPrivate, setUserPrivate] = useState<UserPrivate | null>(null);
  const [userPublic, setUserPublic] = useState<UserPublic | null>(null);
  const [isAdminDoc, setIsAdminDoc] = useState(false);

  const [firestoreReports, setFirestoreReports] = useState<ItemReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [firestoreOrgs, setFirestoreOrgs] = useState<Organization[]>([]);
  const [institutionalRecords, setInstitutionalRecords] = useState<InstitutionalRecord[]>([]);
  const [smartTags, setSmartTags] = useState<SmartTag[]>([]);
  const [watchlists, setWatchlists] = useState<WatchlistRule[]>([]);
  const [recoveryCases, setRecoveryCases] = useState<RecoveryCase[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [moderationCases, setModerationCases] = useState<ModerationCase[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [adminsList, setAdminsList] = useState<AdminRosterEntry[]>([]);
  const [supervisorInvites, setSupervisorInvites] = useState<SupervisorInvite[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);

  const [mapsApiKey, setMapsApiKey] = useState<string | null>(() => {
    const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    return typeof envKey === 'string' && envKey.trim().length > 0 ? envKey.trim() : null;
  });
  const [mapsLoadError, setMapsLoadError] = useState(false);
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [aiDraft, setAiDraft] = useState<ReportDraftPrefill | null>(null);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    safeSetStorage('la2eetoh_lang', next);
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    safeSetStorage('la2eetoh_theme', next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const onPop = () => setCurrentPath(window.location.pathname + window.location.search);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    const onQuota = () => setMapsQuotaExceeded(true);
    const onMapsLoadErr = () => setMapsLoadError(true);

    window.addEventListener('popstate', onPop);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('gmp-quota-exceeded', onQuota);
    window.addEventListener('gmp-load-error', onMapsLoadErr);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('gmp-quota-exceeded', onQuota);
      window.removeEventListener('gmp-load-error', onMapsLoadErr);
    };
  }, []);

  const navigate = useCallback((path: string) => {
    if (window.location.pathname + window.location.search !== path) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Fetch server Maps config fallback if not bundled in Vite env
  useEffect(() => {
    if (!mapsApiKey) {
      fetch('/api/maps/config')
        .then((r) => r.json())
        .then((data: { configured?: boolean; apiKey?: string | null }) => {
          if (data.configured && data.apiKey) setMapsApiKey(data.apiKey);
        })
        .catch(() => {});
    }
  }, [mapsApiKey]);

  // Mandatory initial Firestore connection test
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  const isAdmin = useMemo(() => {
    if (!user || !user.emailVerified) return false;
    return (
      (user.email || '').toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase() ||
      isAdminDoc ||
      userPrivate?.role === 'admin'
    );
  }, [user, isAdminDoc, userPrivate]);

  // Auth listener + user profile bootstrap
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthReady(true);
      if (!u) {
        setUserPrivate(null);
        setUserPublic(null);
        setIsAdminDoc(false);
        return;
      }

      try {
        const privRef = doc(db, 'users', u.uid);
        const pubRef = doc(db, 'usersPublic', u.uid);
        const adminRef = doc(db, 'admins', u.uid);

        const [privSnap, pubSnap, adminSnap] = await Promise.all([
          getDoc(privRef).catch(() => null),
          getDoc(pubRef).catch(() => null),
          getDoc(adminRef).catch(() => null),
        ]);

        let hasAdmin = Boolean(adminSnap?.exists());

        // Auto-claim supervisor invite if verified user email was appointed by an admin
        if (!hasAdmin && u.emailVerified && u.email) {
          const inviteId = makeInviteDocId(u.email);
          const inviteSnap = await getDoc(doc(db, 'supervisorInvites', inviteId)).catch(() => null);
          if (inviteSnap && inviteSnap.exists()) {
            const inviteData = inviteSnap.data() as {
              emailLower?: string;
              role?: 'admin' | 'moderator';
              active?: boolean;
              appointedByEmail?: string;
            };
            if (
              inviteData.active === true &&
              inviteData.emailLower === normalizeSupervisorEmail(u.email)
            ) {
              const invitedRole: 'admin' | 'moderator' =
                inviteData.role === 'moderator' ? 'moderator' : 'admin';
              await setDoc(adminRef, {
                uid: u.uid,
                email: u.email,
                role: invitedRole,
                ...(inviteData.appointedByEmail ? { appointedByEmail: inviteData.appointedByEmail } : {}),
                inviteId,
                createdAt: serverTimestamp(),
              }).catch(() => {});
              hasAdmin = true;
              if (privSnap && privSnap.exists()) {
                await updateDoc(privRef, {
                  role: invitedRole,
                  updatedAt: serverTimestamp(),
                }).catch(() => {});
              }
            }
          }
        }

        setIsAdminDoc(hasAdmin);

        if (privSnap && privSnap.exists()) {
          const raw = privSnap.data() as Record<string, unknown>;
          const hydrated: UserPrivate = {
            uid: String(raw.uid || u.uid),
            email: String(raw.email || u.email || ''),
            phone: typeof raw.phone === 'string' ? raw.phone : undefined,
            phoneVerified: raw.phoneVerified === true,
            phoneVerifiedAtMs: raw.phoneVerifiedAt ? toMs(raw.phoneVerifiedAt) : undefined,
            address: typeof raw.address === 'string' ? raw.address : undefined,
            preferredLang: raw.preferredLang === 'ar' ? 'ar' : 'en',
            preferredTheme: raw.preferredTheme === 'dark' ? 'dark' : 'light',
            notifyInApp: raw.notifyInApp !== false,
            notifyEmail: raw.notifyEmail === true,
            notifyPush: raw.notifyPush === true,
            role: (raw.role as UserPrivate['role']) || 'user',
          };
          setUserPrivate(hydrated);
          if (u.emailVerified) {
            try {
              const seenKey = `la_seen_${u.uid}`;
              if (!sessionStorage.getItem(seenKey)) {
                sessionStorage.setItem(seenKey, '1');
                void updateDoc(privRef, { updatedAt: serverTimestamp() }).catch(() => {});
              }
            } catch {
              // Ignore sessionStorage restrictions
            }
          }
        } else if (u.emailVerified) {
          const initialPriv: UserPrivate = {
            uid: u.uid,
            email: u.email || 'user@la2eetoh.eg',
            preferredLang: lang,
            preferredTheme: theme,
            notifyInApp: true,
            notifyEmail: false,
            notifyPush: false,
            role: 'user',
          };
          await setDoc(privRef, {
            ...initialPriv,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }).catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${u.uid}`));
          setUserPrivate(initialPriv);
        }

        if (pubSnap && pubSnap.exists()) {
          setUserPublic(pubSnap.data() as UserPublic);
        } else if (u.emailVerified) {
          const initialPub: UserPublic = {
            uid: u.uid,
            displayName: u.displayName || (u.email ? u.email.split('@')[0] : 'LA2EETOH Member'),
            photoUrl: u.photoURL || 'avatar:falcon',
            reputationScore: 5,
            successfulReturns: 0,
            validReports: 0,
          };
          await setDoc(pubRef, {
            ...initialPub,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }).catch((err) => handleFirestoreError(err, OperationType.WRITE, `usersPublic/${u.uid}`));
          setUserPublic(initialPub);
        }
      } catch (e) {
        console.error('Profile bootstrap warning:', e);
      }
    });
    return () => unsub();
  }, [lang, theme]);

  // Public Firestore Listeners: Public Reports, Verified Orgs, Platform Settings
  useEffect(() => {
    const qReports = query(
      collection(db, 'reports'),
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc'),
      limit(60)
    );
    const unsubReports = onSnapshot(
      qReports,
      (snap) => {
        const list: ItemReport[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            ...(data as Omit<ItemReport, 'createdAtMs' | 'updatedAtMs'>),
            id: d.id,
            createdAtMs: toMs(data.createdAt),
            updatedAtMs: toMs(data.updatedAt),
          };
        });
        setFirestoreReports(list);
        setReportsLoading(false);
      },
      () => {
        setReportsLoading(false);
      }
    );

    const qOrgs = query(
      collection(db, 'organizations'),
      where('verificationStatus', '==', 'verified'),
      limit(40)
    );
    const unsubOrgs = onSnapshot(
      qOrgs,
      (snap) => {
        setFirestoreOrgs(snap.docs.map((d) => ({ ...(d.data() as Organization), id: d.id })));
      },
      () => {}
    );

    const unsubSettings = onSnapshot(
      doc(db, 'platformSettings', 'public'),
      (snap) => {
        if (snap.exists()) {
          setPlatformSettings({ ...DEFAULT_SETTINGS, ...(snap.data() as Partial<PlatformSettings>) });
        }
      },
      () => {}
    );

    return () => {
      unsubReports();
      unsubOrgs();
      unsubSettings();
    };
  }, []);

  // Authenticated User-Scoped Listeners
  useEffect(() => {
    if (!authReady || !user) {
      setSmartTags([]);
      setWatchlists([]);
      setRecoveryCases([]);
      setSupportTickets([]);
      setNotifications([]);
      setInstitutionalRecords([]);
      setModerationCases([]);
      setAuditLogs([]);
      return;
    }

    const qTags = query(collection(db, 'smartTags'), where('ownerId', '==', user.uid), limit(30));
    const unsubTags = onSnapshot(
      qTags,
      (snap) => {
        setSmartTags(
          snap.docs.map((d) => {
            const data = d.data();
            return { ...(data as Omit<SmartTag, 'createdAtMs'>), token: d.id, createdAtMs: toMs(data.createdAt) };
          })
        );
      },
      () => {}
    );

    const qWatch = query(collection(db, 'watchlists'), where('ownerId', '==', user.uid), limit(30));
    const unsubWatch = onSnapshot(
      qWatch,
      (snap) => {
        setWatchlists(
          snap.docs.map((d) => {
            const data = d.data();
            return { ...(data as Omit<WatchlistRule, 'createdAtMs'>), id: d.id, createdAtMs: toMs(data.createdAt) };
          })
        );
      },
      () => {}
    );

    let unsubCases = () => {};
    if (isAdmin) {
      unsubCases = onSnapshot(
        query(collection(db, 'recoveryCases'), orderBy('updatedAt', 'desc'), limit(50)),
        (snap) => {
          setRecoveryCases(
            snap.docs.map((d) => {
              const data = d.data();
              return {
                ...(data as Omit<RecoveryCase, 'createdAtMs' | 'updatedAtMs' | 'lastMessageAtMs'>),
                id: d.id,
                createdAtMs: toMs(data.createdAt),
                updatedAtMs: toMs(data.updatedAt),
                lastMessageAtMs: data.lastMessageAt ? toMs(data.lastMessageAt) : undefined,
              };
            })
          );
        },
        () => {}
      );
    } else {
      const ownerMap = new Map<string, RecoveryCase>();
      const counterpartyMap = new Map<string, RecoveryCase>();
      const emitMergedCases = () => {
        const combined = new Map<string, RecoveryCase>();
        for (const [k, v] of ownerMap) combined.set(k, v);
        for (const [k, v] of counterpartyMap) combined.set(k, v);
        const sorted = Array.from(combined.values()).sort(
          (a, b) => Math.max(b.updatedAtMs, b.lastMessageAtMs || 0) - Math.max(a.updatedAtMs, a.lastMessageAtMs || 0)
        );
        setRecoveryCases(sorted);
      };
      const mapCaseDoc = (d: { id: string; data: () => Record<string, unknown> }): RecoveryCase => {
        const data = d.data();
        return {
          ...(data as Omit<RecoveryCase, 'createdAtMs' | 'updatedAtMs' | 'lastMessageAtMs'>),
          id: d.id,
          createdAtMs: toMs(data.createdAt),
          updatedAtMs: toMs(data.updatedAt),
          lastMessageAtMs: data.lastMessageAt ? toMs(data.lastMessageAt) : undefined,
        };
      };

      const unsubOwnerCases = onSnapshot(
        query(collection(db, 'recoveryCases'), where('ownerId', '==', user.uid), limit(40)),
        (snap) => {
          ownerMap.clear();
          snap.docs.forEach((d) => ownerMap.set(d.id, mapCaseDoc(d)));
          emitMergedCases();
        },
        () => {}
      );
      const unsubCounterCases = onSnapshot(
        query(collection(db, 'recoveryCases'), where('counterpartyId', '==', user.uid), limit(40)),
        (snap) => {
          counterpartyMap.clear();
          snap.docs.forEach((d) => counterpartyMap.set(d.id, mapCaseDoc(d)));
          emitMergedCases();
        },
        () => {}
      );
      unsubCases = () => {
        unsubOwnerCases();
        unsubCounterCases();
      };
    }

    const qTickets = isAdmin
      ? query(collection(db, 'supportTickets'), orderBy('updatedAt', 'desc'), limit(50))
      : query(collection(db, 'supportTickets'), where('ownerId', '==', user.uid), limit(30));
    const unsubTickets = onSnapshot(
      qTickets,
      (snap) => {
        setSupportTickets(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              ...(data as Omit<SupportTicket, 'createdAtMs' | 'updatedAtMs'>),
              id: d.id,
              createdAtMs: toMs(data.createdAt),
              updatedAtMs: toMs(data.updatedAt),
            };
          })
        );
      },
      () => {}
    );

    const qNotifs = query(collection(db, 'notifications'), where('userId', '==', user.uid), limit(40));
    const unsubNotifs = onSnapshot(
      qNotifs,
      (snap) => {
        setNotifications(
          snap.docs
            .map((d) => {
              const data = d.data();
              return {
                ...(data as Omit<NotificationItem, 'createdAtMs'>),
                id: d.id,
                createdAtMs: toMs(data.createdAt),
              };
            })
            .sort((a, b) => b.createdAtMs - a.createdAtMs)
        );
      },
      () => {}
    );

    const qInst = isAdmin
      ? query(collection(db, 'institutionalRecords'), limit(50))
      : query(collection(db, 'institutionalRecords'), where('staffUid', '==', user.uid), limit(30));
    const unsubInst = onSnapshot(
      qInst,
      (snap) => {
        setInstitutionalRecords(
          snap.docs.map((d) => {
            const data = d.data();
            return { ...(data as Omit<InstitutionalRecord, 'createdAtMs'>), id: d.id, createdAtMs: toMs(data.createdAt) };
          })
        );
      },
      () => {}
    );

    let unsubMod = () => {};
    let unsubAudit = () => {};
    let unsubAllOrgs = () => {};
    let unsubAdmins = () => {};
    let unsubInvites = () => {};
    if (isAdmin) {
      unsubMod = onSnapshot(
        query(collection(db, 'moderationCases'), limit(50)),
        (snap) => {
          setModerationCases(
            snap.docs.map((d) => {
              const data = d.data();
              return { ...(data as Omit<ModerationCase, 'createdAtMs'>), id: d.id, createdAtMs: toMs(data.createdAt) };
            })
          );
        },
        () => {}
      );
      unsubAudit = onSnapshot(
        query(collection(db, 'adminAuditLogs'), orderBy('createdAt', 'desc'), limit(50)),
        (snap) => {
          setAuditLogs(
            snap.docs.map((d) => {
              const data = d.data();
              return { ...(data as Omit<AdminAuditLog, 'createdAtMs'>), id: d.id, createdAtMs: toMs(data.createdAt) };
            })
          );
        },
        () => {}
      );
      unsubAllOrgs = onSnapshot(
        query(collection(db, 'organizations'), limit(50)),
        (snap) => {
          setFirestoreOrgs(snap.docs.map((d) => ({ ...(d.data() as Organization), id: d.id })));
        },
        () => {}
      );
      unsubAdmins = onSnapshot(
        query(collection(db, 'admins'), limit(100)),
        (snap) => {
          setAdminsList(
            snap.docs.map((d) => {
              const data = d.data();
              return {
                uid: d.id,
                email: String(data.email || ''),
                role: data.role === 'moderator' ? 'moderator' : 'admin',
                appointedByEmail: typeof data.appointedByEmail === 'string' ? data.appointedByEmail : undefined,
                createdAtMs: toMs(data.createdAt),
              };
            })
          );
        },
        () => {}
      );
      unsubInvites = onSnapshot(
        query(collection(db, 'supervisorInvites'), limit(100)),
        (snap) => {
          setSupervisorInvites(
            snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                email: String(data.email || ''),
                emailLower: String(data.emailLower || ''),
                role: data.role === 'moderator' ? 'moderator' : 'admin',
                active: data.active !== false,
                appointedByUid: String(data.appointedByUid || ''),
                appointedByEmail: String(data.appointedByEmail || ''),
                createdAtMs: toMs(data.createdAt),
                updatedAtMs: toMs(data.updatedAt),
              };
            })
          );
        },
        () => {}
      );
    } else {
      setAdminsList([]);
      setSupervisorInvites([]);
    }

    return () => {
      unsubTags();
      unsubWatch();
      unsubCases();
      unsubTickets();
      unsubNotifs();
      unsubInst();
      unsubMod();
      unsubAudit();
      unsubAllOrgs();
      unsubAdmins();
      unsubInvites();
    };
  }, [authReady, user, isAdmin]);

  const reports = useMemo(() => {
    const merged = new Map<string, ItemReport>();
    for (const r of SEED_REPORTS) merged.set(r.id, r);
    for (const r of firestoreReports) merged.set(r.id, r);
    return Array.from(merged.values()).sort((a, b) => b.createdAtMs - a.createdAtMs);
  }, [firestoreReports]);

  const organizations = useMemo(() => {
    const merged = new Map<string, Organization>();
    for (const o of SEED_ORGANIZATIONS) merged.set(o.id, o);
    for (const o of firestoreOrgs) merged.set(o.id, o);
    return Array.from(merged.values());
  }, [firestoreOrgs]);

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider);
  }, []);

  const signInWithEmail = useCallback(async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  }, []);

  const registerWithEmail = useCallback(async (email: string, pass: string, displayName: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (displayName.trim()) {
      await updateProfile(cred.user, { displayName: displayName.trim() });
    }
    await sendEmailVerification(cred.user);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
  }, []);

  const writeAuditLog = useCallback(
    async (action: string, targetPath: string, summary: string) => {
      if (!user || !isAdmin) return;
      const id = makeId('audit');
      try {
        await setDoc(doc(db, 'adminAuditLogs', id), {
          id,
          adminUid: user.uid,
          action: action.slice(0, 100),
          targetPath: targetPath.slice(0, 200),
          summary: summary.slice(0, 400),
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `adminAuditLogs/${id}`);
      }
    },
    [user, isAdmin]
  );

  const updatePreferences = useCallback<AppContextValue['updatePreferences']>(
    async (prefs) => {
      if (!user) return;
      if (prefs.preferredLang) setLang(prefs.preferredLang);
      if (prefs.preferredTheme) setTheme(prefs.preferredTheme);

      const privUpdate: Record<string, unknown> = { updatedAt: serverTimestamp() };
      if (prefs.preferredLang !== undefined) privUpdate.preferredLang = prefs.preferredLang;
      if (prefs.preferredTheme !== undefined) privUpdate.preferredTheme = prefs.preferredTheme;
      if (prefs.phone !== undefined) privUpdate.phone = prefs.phone.trim().slice(0, 32);
      if (prefs.phoneVerified !== undefined) privUpdate.phoneVerified = prefs.phoneVerified;
      if (prefs.markPhoneVerifiedNow) privUpdate.phoneVerifiedAt = serverTimestamp();
      if (prefs.address !== undefined) privUpdate.address = prefs.address.trim().slice(0, 240);
      if (prefs.notifyInApp !== undefined) privUpdate.notifyInApp = prefs.notifyInApp;
      if (prefs.notifyEmail !== undefined) privUpdate.notifyEmail = prefs.notifyEmail;
      if (prefs.notifyPush !== undefined) privUpdate.notifyPush = prefs.notifyPush;

      try {
        await updateDoc(doc(db, 'users', user.uid), privUpdate);
        setUserPrivate((prev) =>
          prev
            ? {
                ...prev,
                ...(prefs.preferredLang !== undefined ? { preferredLang: prefs.preferredLang } : {}),
                ...(prefs.preferredTheme !== undefined ? { preferredTheme: prefs.preferredTheme } : {}),
                ...(prefs.phone !== undefined ? { phone: prefs.phone.trim().slice(0, 32) } : {}),
                ...(prefs.phoneVerified !== undefined ? { phoneVerified: prefs.phoneVerified } : {}),
                ...(prefs.markPhoneVerifiedNow ? { phoneVerifiedAtMs: Date.now() } : {}),
                ...(prefs.address !== undefined ? { address: prefs.address.trim().slice(0, 240) } : {}),
                ...(prefs.notifyInApp !== undefined ? { notifyInApp: prefs.notifyInApp } : {}),
                ...(prefs.notifyEmail !== undefined ? { notifyEmail: prefs.notifyEmail } : {}),
                ...(prefs.notifyPush !== undefined ? { notifyPush: prefs.notifyPush } : {}),
              }
            : prev
        );

        const pubUpdate: Record<string, unknown> = {};
        if (prefs.displayName && prefs.displayName.trim().length > 0) {
          pubUpdate.displayName = prefs.displayName.trim().slice(0, 80);
        }
        if (prefs.photoUrl !== undefined) {
          pubUpdate.photoUrl = prefs.photoUrl.slice(0, 250_000);
        }
        if (Object.keys(pubUpdate).length > 0) {
          pubUpdate.updatedAt = serverTimestamp();
          await updateDoc(doc(db, 'usersPublic', user.uid), pubUpdate);
          setUserPublic((prev) =>
            prev
              ? {
                  ...prev,
                  ...(pubUpdate.displayName ? { displayName: String(pubUpdate.displayName) } : {}),
                  ...(pubUpdate.photoUrl !== undefined ? { photoUrl: String(pubUpdate.photoUrl) } : {}),
                }
              : prev
          );
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    },
    [user, setLang, setTheme]
  );

  const appointSupervisorByEmail = useCallback<AppContextValue['appointSupervisorByEmail']>(
    async (rawEmail, role) => {
      if (!user || !isAdmin) throw new Error('Verified admin access required.');
      const cleanEmail = normalizeSupervisorEmail(rawEmail);
      if (!isValidEmailAddress(cleanEmail)) {
        throw new Error('Please enter a valid supervisor email address.');
      }

      const inviteId = makeInviteDocId(cleanEmail);
      // 1. Check if a user record already exists with this email
      const existingUsersSnap = await getDocs(
        query(collection(db, 'users'), where('email', '==', rawEmail.trim()), limit(1))
      ).catch(() => null);
      const fallbackLowerSnap =
        existingUsersSnap && !existingUsersSnap.empty
          ? existingUsersSnap
          : await getDocs(
              query(collection(db, 'users'), where('email', '==', cleanEmail), limit(1))
            ).catch(() => null);

      const matchedUserDoc = fallbackLowerSnap && !fallbackLowerSnap.empty ? fallbackLowerSnap.docs[0] : null;

      try {
        await setDoc(doc(db, 'supervisorInvites', inviteId), {
          id: inviteId,
          email: rawEmail.trim().slice(0, 200),
          emailLower: cleanEmail,
          role,
          active: true,
          appointedByUid: user.uid,
          appointedByEmail: (user.email || BOOTSTRAPPED_ADMIN_EMAIL).slice(0, 200),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        if (matchedUserDoc) {
          const targetUid = matchedUserDoc.id;
          await setDoc(doc(db, 'admins', targetUid), {
            uid: targetUid,
            email: String(matchedUserDoc.data().email || cleanEmail),
            role,
            appointedByEmail: (user.email || BOOTSTRAPPED_ADMIN_EMAIL).slice(0, 200),
            inviteId,
            createdAt: serverTimestamp(),
          });
          await updateDoc(doc(db, 'users', targetUid), {
            role,
            updatedAt: serverTimestamp(),
          });
          await writeAuditLog(
            'appoint_supervisor',
            `admins/${targetUid}`,
            `Granted ${role} access to ${cleanEmail}`
          );
          return { mode: 'activated_immediately' };
        }

        await writeAuditLog(
          'invite_supervisor',
          `supervisorInvites/${inviteId}`,
          `Invited ${cleanEmail} as ${role} (activates on verified login)`
        );
        return { mode: 'invited_pending_login' };
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `supervisorInvites/${inviteId}`);
      }
    },
    [user, isAdmin, writeAuditLog]
  );

  const revokeSupervisor = useCallback<AppContextValue['revokeSupervisor']>(
    async ({ uid, inviteId, email }) => {
      if (!user || !isAdmin) throw new Error('Verified admin access required.');
      const cleanEmail = email ? normalizeSupervisorEmail(email) : '';
      if (cleanEmail === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()) {
        throw new Error('Cannot revoke the primary bootstrapped super admin account.');
      }

      try {
        if (uid) {
          await deleteDoc(doc(db, 'admins', uid));
          await updateDoc(doc(db, 'users', uid), {
            role: 'user',
            updatedAt: serverTimestamp(),
          }).catch(() => {});
        }
        const resolvedInviteId = inviteId || (cleanEmail ? makeInviteDocId(cleanEmail) : '');
        if (resolvedInviteId) {
          await deleteDoc(doc(db, 'supervisorInvites', resolvedInviteId)).catch(() => {});
        }
        await writeAuditLog(
          'revoke_supervisor',
          uid ? `admins/${uid}` : `supervisorInvites/${resolvedInviteId}`,
          `Revoked supervisor access for ${cleanEmail || uid}`
        );
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.DELETE,
          uid ? `admins/${uid}` : `supervisorInvites/${inviteId || ''}`
        );
      }
    },
    [user, isAdmin, writeAuditLog]
  );

  const createReport = useCallback<AppContextValue['createReport']>(
    async (input) => {
      if (!user || !user.emailVerified) {
        throw new Error('Verified account required to publish a report.');
      }
      const id = makeId('rep');
      const { lat: publicLat, lng: publicLng } = applyLocationPrivacy(input.lat, input.lng, input.locationPrivacy);
      const safeTitle = sanitizeDocumentText(input.title.trim()).slice(0, 120);
      const safeDescription = sanitizeDocumentText(input.description.trim()).slice(0, 2000);
      const safeAreaNote = input.areaNote ? sanitizeDocumentText(input.areaNote.trim()).slice(0, 160) : '';

      const payload: Record<string, unknown> = {
        id,
        ownerId: user.uid,
        ownerDisplayName: (userPublic?.displayName || user.displayName || 'LA2EETOH User').slice(0, 80),
        type: input.type,
        status: 'open',
        visibility: 'public',
        title: safeTitle,
        description: safeDescription,
        category: input.category,
        color: input.color,
        governorateId: input.governorateId,
        cityId: input.cityId,
        publicLat,
        publicLng,
        locationPrivacy: input.locationPrivacy,
        dateOccurred: input.dateOccurred,
        isSensitiveDocument: input.isSensitiveDocument,
        photoUrls: input.photoUrls.slice(0, 5),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (input.brand?.trim()) payload.brand = input.brand.trim().slice(0, 80);
      if (input.districtId?.trim()) payload.districtId = input.districtId.trim().slice(0, 64);
      if (safeAreaNote) payload.areaNote = safeAreaNote;
      if (input.timeApprox?.trim()) payload.timeApprox = input.timeApprox.trim().slice(0, 32);
      if (input.documentKind?.trim()) payload.documentKind = input.documentKind.trim().slice(0, 64);

      try {
        await setDoc(doc(db, 'reports', id), payload);
        await setDoc(doc(db, 'reports', id, 'private', 'details'), {
          reportId: id,
          ownerId: user.uid,
          exactLat: input.lat,
          exactLng: input.lng,
          ...(input.verificationQuestion?.trim()
            ? { verificationQuestion: input.verificationQuestion.trim().slice(0, 200) }
            : {}),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Create initial recovery tracker entry for the user
        const caseId = makeId('case');
        await setDoc(doc(db, 'recoveryCases', caseId), {
          id: caseId,
          reportId: id,
          reportTitle: safeTitle,
          ownerId: user.uid,
          ownerDisplayName: (userPublic?.displayName || user.displayName || 'LA2EETOH User').slice(0, 80),
          stage: 'report_published',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Check active user watchlists for smart alerts
        for (const w of watchlists.filter((rule) => rule.active)) {
          const score = scoreReportMatch(
            {
              keywords: (w.keywords || w.title).split(/\s+/),
              category: w.category,
              color: w.color,
              brand: w.brand,
              governorateId: w.governorateId,
            },
            {
              id,
              type: input.type,
              title: safeTitle,
              description: safeDescription,
              category: input.category,
              color: input.color,
              brand: input.brand,
              governorateId: input.governorateId,
              dateOccurred: input.dateOccurred,
            }
          );
          if (score >= 45) {
            const nid = makeId('notif');
            await setDoc(doc(db, 'notifications', nid), {
              id: nid,
              userId: user.uid,
              kind: 'watchlist',
              titleEn: `Watchlist alert: ${w.title}`,
              titleAr: `تنبيه قائمة المراقبة: ${w.title}`,
              bodyEn: `A new report "${safeTitle}" matched your watchlist criteria.`,
              bodyAr: `تطابق البلاغ الجديد "${safeTitle}" مع معايير قائمة المراقبة الخاصة بك.`,
              read: false,
              linkPath: `/report/${id}`,
              createdAt: serverTimestamp(),
            });
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `reports/${id}`);
      }
      return id;
    },
    [user, userPublic, watchlists]
  );

  const updateReportStatus = useCallback(async (reportId: string, status: ReportStatus) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reports/${reportId}`);
    }
  }, []);

  const flagReport = useCallback(
    async (reportId: string, reason: string) => {
      if (!user || !user.emailVerified) throw new Error('Verified account required to report suspicious listings.');
      const check = validateModerationReason(reason);
      if (!check.valid) throw new Error(check.errors.join(' '));
      const id = makeId('mod');
      try {
        await setDoc(doc(db, 'moderationCases', id), {
          id,
          reportId,
          reporterUid: user.uid,
          reason: reason.trim().slice(0, 400),
          status: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `moderationCases/${id}`);
      }
    },
    [user]
  );

  const createSmartTag = useCallback<AppContextValue['createSmartTag']>(
    async (input) => {
      if (!user || !user.emailVerified) throw new Error('Verified account required.');
      const check = validateSmartTagPayload(input.itemLabel, input.category, input.safeNote);
      if (!check.valid) throw new Error(check.errors.join(' '));
      const token = generateSecureQrToken();
      const cleanSafeNote = input.safeNote?.trim()
        ? sanitizeDocumentText(input.safeNote.trim()).slice(0, 300)
        : '';
      try {
        await setDoc(doc(db, 'smartTags', token), {
          token,
          ownerId: user.uid,
          itemLabel: input.itemLabel.trim().slice(0, 80),
          category: input.category,
          ...(cleanSafeNote ? { safeNote: cleanSafeNote } : {}),
          status: 'active',
          scanCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `smartTags/${token}`);
      }
      return token;
    },
    [user]
  );

  const updateSmartTagStatus = useCallback(async (token: string, status: SmartTag['status']) => {
    try {
      await updateDoc(doc(db, 'smartTags', token), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `smartTags/${token}`);
    }
  }, []);

  const submitTagRelay = useCallback<AppContextValue['submitTagRelay']>(
    async (input) => {
      if (!user || !user.emailVerified) throw new Error('Sign in required to send a relay message.');
      const cleanMsg = sanitizeDocumentText(input.finderMessage.trim()).slice(0, 500);
      const check = validateTagRelayPayload(cleanMsg, input.finderSafeContact);
      if (!check.valid) throw new Error(check.errors.join(' '));
      const id = makeId('scan');
      try {
        await setDoc(doc(db, 'tagScans', id), {
          id,
          tagToken: input.tagToken,
          ownerId: input.ownerId,
          finderMessage: cleanMsg,
          ...(input.finderSafeContact?.trim()
            ? { finderSafeContact: input.finderSafeContact.trim().slice(0, 120) }
            : {}),
          ...(input.governorateId ? { governorateId: input.governorateId } : {}),
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `tagScans/${id}`);
      }
    },
    [user]
  );

  const createWatchlist = useCallback<AppContextValue['createWatchlist']>(
    async (input) => {
      if (!user || !user.emailVerified) throw new Error('Verified account required.');
      const check = validateWatchlistPayload(input.title, input.maxDistanceKm);
      if (!check.valid) throw new Error(check.errors.join(' '));
      const id = makeId('wl');
      try {
        await setDoc(doc(db, 'watchlists', id), {
          id,
          ownerId: user.uid,
          title: input.title.trim().slice(0, 100),
          ...(input.keywords?.trim() ? { keywords: input.keywords.trim().slice(0, 200) } : {}),
          ...(input.category ? { category: input.category } : {}),
          ...(input.color ? { color: input.color } : {}),
          ...(input.brand?.trim() ? { brand: input.brand.trim().slice(0, 80) } : {}),
          ...(input.governorateId ? { governorateId: input.governorateId } : {}),
          ...(input.maxDistanceKm ? { maxDistanceKm: input.maxDistanceKm } : {}),
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `watchlists/${id}`);
      }
    },
    [user]
  );

  const toggleWatchlist = useCallback(async (id: string, active: boolean) => {
    try {
      await updateDoc(doc(db, 'watchlists', id), { active, updatedAt: serverTimestamp() });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `watchlists/${id}`);
    }
  }, []);

  const deleteWatchlist = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'watchlists', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `watchlists/${id}`);
    }
  }, []);

  const sendCaseMessage = useCallback<AppContextValue['sendCaseMessage']>(
    async (caseId, body, kind = 'text') => {
      if (!user || !user.emailVerified) {
        throw new Error('Verified account required to send messages.');
      }
      const cleanBody = sanitizePrivateChatText(body).slice(0, 1500);
      const check = validateCaseChatMessage(cleanBody);
      if (!check.valid) {
        throw new Error(check.errors.join(' '));
      }
      const msgId = makeId('cmsg');
      const senderName = (userPublic?.displayName || user.displayName || 'LA2EETOH Member').slice(0, 80);
      try {
        await setDoc(doc(db, 'recoveryCases', caseId, 'messages', msgId), {
          id: msgId,
          caseId,
          senderId: user.uid,
          senderName,
          body: cleanBody,
          kind,
          createdAt: serverTimestamp(),
        });
        await updateDoc(doc(db, 'recoveryCases', caseId), {
          lastMessageText: cleanBody.slice(0, 240),
          lastMessageAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `recoveryCases/${caseId}/messages/${msgId}`);
      }
    },
    [user, userPublic]
  );

  const subscribeCaseMessages = useCallback<AppContextValue['subscribeCaseMessages']>(
    (caseId, onMessages, onError) => {
      if (!user || !caseId) {
        onMessages([]);
        return () => {};
      }
      const qMsgs = query(
        collection(db, 'recoveryCases', caseId, 'messages'),
        orderBy('createdAt', 'asc'),
        limit(150)
      );
      return onSnapshot(
        qMsgs,
        (snap) => {
          const msgs: CaseChatMessage[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              caseId: String(data.caseId || caseId),
              senderId: String(data.senderId || ''),
              senderName: String(data.senderName || 'Member'),
              body: String(data.body || ''),
              kind: (data.kind as CaseChatMessageKind) || 'text',
              createdAtMs: toMs(data.createdAt),
            };
          });
          onMessages(msgs);
        },
        (err) => {
          if (onError) onError(err);
        }
      );
    },
    [user]
  );

  const createRecoveryCase = useCallback(
    async (report: ItemReport, note?: string) => {
      if (!user || !user.emailVerified) throw new Error('Verified account required.');
      const existing = recoveryCases.find(
        (c) =>
          c.reportId === report.id &&
          (c.ownerId === user.uid || c.counterpartyId === user.uid) &&
          c.stage !== 'cancelled'
      );
      if (existing) {
        if (note?.trim()) {
          await sendCaseMessage(existing.id, note.trim(), 'text');
        }
        return existing.id;
      }

      const id = makeId('case');
      const myName = (userPublic?.displayName || user.displayName || 'LA2EETOH Member').slice(0, 80);
      const hasRealCounterparty = Boolean(
        report.ownerId && report.ownerId !== 'system-seed' && report.ownerId !== user.uid
      );
      const cleanNote = note?.trim() ? sanitizePrivateChatText(note.trim()).slice(0, 500) : '';

      try {
        await setDoc(doc(db, 'recoveryCases', id), {
          id,
          reportId: report.id,
          reportTitle: report.title.slice(0, 120),
          ownerId: user.uid,
          ownerDisplayName: myName,
          ...(hasRealCounterparty
            ? {
                counterpartyId: report.ownerId,
                counterpartyDisplayName: (report.ownerDisplayName || 'Report Owner').slice(0, 80),
              }
            : {}),
          stage: 'contact_initiated',
          ...(cleanNote ? { verificationNote: cleanNote } : {}),
          ...(cleanNote ? { lastMessageText: cleanNote.slice(0, 240), lastMessageAt: serverTimestamp() } : {}),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        if (cleanNote) {
          const msgId = makeId('cmsg');
          await setDoc(doc(db, 'recoveryCases', id, 'messages', msgId), {
            id: msgId,
            caseId: id,
            senderId: user.uid,
            senderName: myName,
            body: cleanNote,
            kind: 'text',
            createdAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `recoveryCases/${id}`);
      }
      return id;
    },
    [user, userPublic, recoveryCases, sendCaseMessage]
  );

  const advanceRecoveryCase = useCallback(
    async (caseId: string, stage: RecoveryStage, note?: string, handoverLocation?: string) => {
      const updatePayload: Record<string, unknown> = {
        stage,
        updatedAt: serverTimestamp(),
      };
      if (note?.trim()) updatePayload.verificationNote = sanitizePrivateChatText(note.trim()).slice(0, 500);
      if (handoverLocation?.trim()) updatePayload.handoverLocation = handoverLocation.trim().slice(0, 160);
      try {
        await updateDoc(doc(db, 'recoveryCases', caseId), updatePayload);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `recoveryCases/${caseId}`);
      }
    },
    []
  );

  const submitReview = useCallback<AppContextValue['submitReview']>(
    async (input) => {
      if (!user || !user.emailVerified) throw new Error('Verified account required.');
      if (!input.targetUid || input.targetUid === user.uid) {
        throw new Error('A verified counterparty is required before submitting a trust review.');
      }
      const id = makeId('rev');
      try {
        await setDoc(doc(db, 'userReviews', id), {
          id,
          caseId: input.caseId,
          reviewerUid: user.uid,
          targetUid: input.targetUid,
          rating: Math.max(1, Math.min(5, Math.round(input.rating))),
          ...(input.comment?.trim() ? { comment: input.comment.trim().slice(0, 400) } : {}),
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `userReviews/${id}`);
      }
    },
    [user]
  );

  const applyOrganization = useCallback<AppContextValue['applyOrganization']>(
    async (input) => {
      if (!user || !user.emailVerified) throw new Error('Verified account required.');
      if (input.nameEn.trim().length < 2 || input.nameAr.trim().length < 2) {
        throw new Error('Organization English and Arabic names must each be at least 2 characters.');
      }
      const id = makeId('org');
      try {
        await setDoc(doc(db, 'organizations', id), {
          id,
          nameEn: input.nameEn.trim().slice(0, 120),
          nameAr: input.nameAr.trim().slice(0, 120),
          orgType: input.orgType,
          governorateId: input.governorateId,
          cityId: input.cityId,
          verificationStatus: 'pending',
          applicantUid: user.uid,
          ...(input.contactDesk?.trim() ? { contactDesk: input.contactDesk.trim().slice(0, 160) } : {}),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `organizations/${id}`);
      }
    },
    [user]
  );

  const verifyOrganization = useCallback(
    async (orgId: string, verificationStatus: Organization['verificationStatus']) => {
      try {
        await updateDoc(doc(db, 'organizations', orgId), {
          verificationStatus,
          updatedAt: serverTimestamp(),
        });
        await writeAuditLog('verify_organization', `organizations/${orgId}`, `Set organization status to ${verificationStatus}`);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `organizations/${orgId}`);
      }
    },
    [writeAuditLog]
  );

  const addInstitutionalRecord = useCallback<AppContextValue['addInstitutionalRecord']>(
    async (input) => {
      if (!user || !user.emailVerified) throw new Error('Verified account required.');
      if (input.itemName.trim().length < 2 || input.storageLocation.trim().length < 2) {
        throw new Error('Item description and storage location must each be at least 2 characters.');
      }
      const id = makeId('inst');
      try {
        await setDoc(doc(db, 'institutionalRecords', id), {
          id,
          organizationId: input.organizationId,
          staffUid: user.uid,
          itemName: input.itemName.trim().slice(0, 120),
          category: input.category,
          storageLocation: input.storageLocation.trim().slice(0, 120),
          status: 'in_custody',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `institutionalRecords/${id}`);
      }
    },
    [user]
  );

  const updateInstitutionalStatus = useCallback(
    async (recordId: string, status: InstitutionalRecord['status'], handoverRef?: string) => {
      const payload: Record<string, unknown> = { status, updatedAt: serverTimestamp() };
      if (handoverRef?.trim()) payload.handoverRef = handoverRef.trim().slice(0, 120);
      try {
        await updateDoc(doc(db, 'institutionalRecords', recordId), payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `institutionalRecords/${recordId}`);
      }
    },
    []
  );

  const createSupportTicket = useCallback<AppContextValue['createSupportTicket']>(
    async (input) => {
      if (!user || !user.emailVerified) throw new Error('Verified account required.');
      const id = makeId('tkt');
      try {
        await setDoc(doc(db, 'supportTickets', id), {
          id,
          ownerId: user.uid,
          subject: input.subject.trim().slice(0, 150),
          category: input.category,
          priority: input.priority,
          status: 'open',
          initialMessage: input.initialMessage.trim().slice(0, 2000),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `supportTickets/${id}`);
      }
      return id;
    },
    [user]
  );

  const sendSupportReply = useCallback(
    async (ticketId: string, body: string) => {
      if (!user || !user.emailVerified) throw new Error('Verified account required.');
      const id = makeId('msg');
      try {
        await setDoc(doc(db, 'supportTickets', ticketId, 'messages', id), {
          id,
          ticketId,
          authorId: user.uid,
          authorRole: isAdmin ? 'admin' : 'user',
          body: body.trim().slice(0, 2000),
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `supportTickets/${ticketId}/messages/${id}`);
      }
    },
    [user, isAdmin]
  );

  const updateTicketStatus = useCallback(
    async (ticketId: string, status: SupportTicket['status']) => {
      try {
        await updateDoc(doc(db, 'supportTickets', ticketId), { status, updatedAt: serverTimestamp() });
        if (isAdmin) await writeAuditLog('update_ticket_status', `supportTickets/${ticketId}`, `Changed ticket status to ${status}`);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `supportTickets/${ticketId}`);
      }
    },
    [isAdmin, writeAuditLog]
  );

  const addInternalNote = useCallback(
    async (ticketId: string, note: string) => {
      if (!user || !isAdmin) throw new Error('Admin permission required.');
      const id = makeId('note');
      try {
        await setDoc(doc(db, 'supportTickets', ticketId, 'internalNotes', id), {
          id,
          staffUid: user.uid,
          note: note.trim().slice(0, 2000),
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `supportTickets/${ticketId}/internalNotes/${id}`);
      }
    },
    [user, isAdmin]
  );

  const loadTicketThread = useCallback<AppContextValue['loadTicketThread']>(
    async (ticketId) => {
      const messagesSnap = await getDocs(
        query(collection(db, 'supportTickets', ticketId, 'messages'), orderBy('createdAt', 'asc'))
      );
      const messages: SupportMessage[] = messagesSnap.docs.map((d) => {
        const data = d.data();
        return { ...(data as Omit<SupportMessage, 'createdAtMs'>), id: d.id, createdAtMs: toMs(data.createdAt) };
      });
      let notes: { id: string; staffUid: string; note: string; createdAtMs: number }[] = [];
      if (isAdmin) {
        const notesSnap = await getDocs(
          query(collection(db, 'supportTickets', ticketId, 'internalNotes'), orderBy('createdAt', 'asc'))
        );
        notes = notesSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            staffUid: String(data.staffUid || ''),
            note: String(data.note || ''),
            createdAtMs: toMs(data.createdAt),
          };
        });
      }
      return { messages, notes };
    },
    [isAdmin]
  );

  const markNotificationRead = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `notifications/${id}`);
    }
  }, []);

  const resolveModerationCase = useCallback(
    async (caseId: string, reportId: string, action: 'dismissed' | 'action_taken') => {
      try {
        await updateDoc(doc(db, 'moderationCases', caseId), {
          status: action,
          updatedAt: serverTimestamp(),
        });
        if (action === 'action_taken') {
          await updateDoc(doc(db, 'reports', reportId), {
            visibility: 'hidden',
            status: 'flagged',
            updatedAt: serverTimestamp(),
          });
        }
        await writeAuditLog('moderation_resolution', `moderationCases/${caseId}`, `Resolved report ${reportId} as ${action}`);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `moderationCases/${caseId}`);
      }
    },
    [writeAuditLog]
  );

  const updatePlatformSettings = useCallback(
    async (next: Partial<PlatformSettings>) => {
      const merged = { ...platformSettings, ...next };
      try {
        await setDoc(doc(db, 'platformSettings', 'public'), {
          ...merged,
          updatedAt: serverTimestamp(),
        });
        setPlatformSettings(merged);
        await writeAuditLog('update_platform_settings', 'platformSettings/public', 'Updated platform/advertising/moderation settings');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'platformSettings/public');
      }
    },
    [platformSettings, writeAuditLog]
  );

  const exportMyData = useCallback(() => {
    return {
      exportedAt: new Date().toISOString(),
      account: userPrivate,
      publicProfile: userPublic,
      myReports: firestoreReports.filter((r) => r.ownerId === user?.uid),
      smartTags,
      watchlists,
      recoveryCases,
      supportTickets,
    };
  }, [user, userPrivate, userPublic, firestoreReports, smartTags, watchlists, recoveryCases, supportTickets]);

  const deleteMyAccount = useCallback(async () => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid)).catch(() => {});
    await deleteDoc(doc(db, 'usersPublic', user.uid)).catch(() => {});
    await deleteUser(user);
  }, [user]);

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        theme,
        setTheme,
        currentPath,
        navigate,
        user,
        authReady,
        isAdmin,
        userPrivate,
        userPublic,
        reports,
        reportsLoading,
        organizations,
        institutionalRecords,
        smartTags,
        watchlists,
        recoveryCases,
        supportTickets,
        moderationCases,
        notifications,
        auditLogs,
        adminsList,
        supervisorInvites,
        platformSettings,
        mapsApiKey,
        mapsLoadError,
        setMapsLoadError,
        mapsQuotaExceeded,
        setMapsQuotaExceeded,
        isOnline,
        userCoords,
        setUserCoords,
        aiDraft,
        setAiDraft,
        signInWithGoogle,
        signInWithEmail,
        registerWithEmail,
        resetPassword,
        signOutUser,
        updatePreferences,
        appointSupervisorByEmail,
        revokeSupervisor,
        createReport,
        updateReportStatus,
        flagReport,
        createSmartTag,
        updateSmartTagStatus,
        submitTagRelay,
        createWatchlist,
        toggleWatchlist,
        deleteWatchlist,
        createRecoveryCase,
        advanceRecoveryCase,
        subscribeCaseMessages,
        sendCaseMessage,
        submitReview,
        applyOrganization,
        verifyOrganization,
        addInstitutionalRecord,
        updateInstitutionalStatus,
        createSupportTicket,
        sendSupportReply,
        updateTicketStatus,
        addInternalNote,
        loadTicketThread,
        markNotificationRead,
        resolveModerationCase,
        updatePlatformSettings,
        exportMyData,
        deleteMyAccount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
