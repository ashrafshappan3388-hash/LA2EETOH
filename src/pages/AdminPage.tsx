import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Building2,
  CheckCircle2,
  ExternalLink,
  FileText,
  FileWarning,
  MailPlus,
  MapPin,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Power,
  QrCode,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  Wrench,
} from 'lucide-react';
import { AdminWhatsAppGateway } from '../components/AdminWhatsAppGateway';
import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
} from 'firebase/firestore';
import { useApp } from '../context/AppContext';
import { BOOTSTRAPPED_ADMIN_EMAIL, db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { ItemReport, RecoveryCase } from '../types';
import {
  computeAdminMetrics,
  isChatStartedCase,
  type AdminUserRecord,
} from '../utils/adminAnalytics';
import { findGovernorate, ITEM_CATEGORIES } from '../utils/egyptLocations';
import { isValidEmailAddress, normalizeSupervisorEmail } from '../utils/phoneVerification';

interface HealthPayload {
  status: string;
  uptimeSeconds: number;
  timestamp: string;
  services: {
    geminiAi: string;
    googleMaps: string;
    whatsappOtp?: string;
    adSense: string;
    firebaseConfigPresent: boolean;
  };
}

interface TelemetryState {
  loading: boolean;
  lastSyncedMs: number | null;
  users: AdminUserRecord[];
  allReports: ItemReport[];
  allCases: RecoveryCase[];
  totalUsersCount: number;
  totalChatsCount: number;
  smartTagsCount: number;
  tagScansCount: number;
  watchlistsCount: number;
}

const toMs = (val: unknown): number => {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && val !== null && 'toMillis' in val) {
    return (val as { toMillis: () => number }).toMillis();
  }
  return 0;
};

export const AdminPage: React.FC = () => {
  const {
    lang,
    user,
    isAdmin,
    reports,
    organizations,
    recoveryCases,
    institutionalRecords,
    moderationCases,
    supportTickets,
    auditLogs,
    adminsList,
    supervisorInvites,
    platformSettings,
    resolveModerationCase,
    verifyOrganization,
    updatePlatformSettings,
    appointSupervisorByEmail,
    revokeSupervisor,
    navigate,
  } = useApp();
  const isAr = lang === 'ar';

  const [tab, setTab] = useState<
    'overview' | 'supervisors' | 'whatsapp' | 'moderation' | 'orgs' | 'support' | 'settings' | 'audit'
  >('overview');
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [maintenanceBusy, setMaintenanceBusy] = useState(false);
  const [supervisorEmail, setSupervisorEmail] = useState('');
  const [supervisorRole, setSupervisorRole] = useState<'moderator' | 'admin'>('moderator');
  const [supervisorBusy, setSupervisorBusy] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryState>({
    loading: false,
    lastSyncedMs: null,
    users: [],
    allReports: [],
    allCases: [],
    totalUsersCount: 0,
    totalChatsCount: 0,
    smartTagsCount: 0,
    tagScansCount: 0,
    watchlistsCount: 0,
  });

  const loadLiveTelemetry = useCallback(async () => {
    if (!isAdmin) return;
    setTelemetry((prev) => ({ ...prev, loading: true }));
    try {
      const [
        usersCountSnap,
        usersDocsSnap,
        reportsDocsSnap,
        casesCountSnap,
        casesDocsSnap,
        tagsCountSnap,
        scansCountSnap,
        watchCountSnap,
      ] = await Promise.all([
        getCountFromServer(collection(db, 'users')).catch((err) => {
          handleFirestoreError(err, OperationType.LIST, 'users');
        }),
        getDocs(query(collection(db, 'users'), orderBy('updatedAt', 'desc'), limit(200))).catch((err) => {
          handleFirestoreError(err, OperationType.LIST, 'users');
        }),
        getDocs(query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(200))).catch((err) => {
          handleFirestoreError(err, OperationType.LIST, 'reports');
        }),
        getCountFromServer(collection(db, 'recoveryCases')).catch((err) => {
          handleFirestoreError(err, OperationType.LIST, 'recoveryCases');
        }),
        getDocs(query(collection(db, 'recoveryCases'), orderBy('updatedAt', 'desc'), limit(200))).catch((err) => {
          handleFirestoreError(err, OperationType.LIST, 'recoveryCases');
        }),
        getCountFromServer(collection(db, 'smartTags')).catch((err) => {
          handleFirestoreError(err, OperationType.LIST, 'smartTags');
        }),
        getCountFromServer(collection(db, 'tagScans')).catch((err) => {
          handleFirestoreError(err, OperationType.LIST, 'tagScans');
        }),
        getCountFromServer(collection(db, 'watchlists')).catch((err) => {
          handleFirestoreError(err, OperationType.LIST, 'watchlists');
        }),
      ]);

      const parsedUsers: AdminUserRecord[] = usersDocsSnap.docs.map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          email: typeof data.email === 'string' ? data.email : undefined,
          preferredLang: data.preferredLang === 'ar' ? 'ar' : 'en',
          role: typeof data.role === 'string' ? data.role : 'user',
          createdAtMs: toMs(data.createdAt),
          updatedAtMs: toMs(data.updatedAt),
        };
      });

      const parsedReports: ItemReport[] = reportsDocsSnap.docs.map((d) => {
        const data = d.data();
        return {
          ...(data as Omit<ItemReport, 'createdAtMs' | 'updatedAtMs'>),
          id: d.id,
          createdAtMs: toMs(data.createdAt),
          updatedAtMs: toMs(data.updatedAt),
        };
      });

      const parsedCases: RecoveryCase[] = casesDocsSnap.docs.map((d) => {
        const data = d.data();
        return {
          ...(data as Omit<RecoveryCase, 'createdAtMs' | 'updatedAtMs' | 'lastMessageAtMs'>),
          id: d.id,
          createdAtMs: toMs(data.createdAt),
          updatedAtMs: toMs(data.updatedAt),
          lastMessageAtMs: data.lastMessageAt ? toMs(data.lastMessageAt) : undefined,
        };
      });

      setTelemetry({
        loading: false,
        lastSyncedMs: Date.now(),
        users: parsedUsers,
        allReports: parsedReports,
        allCases: parsedCases,
        totalUsersCount: usersCountSnap.data().count,
        totalChatsCount: parsedCases.filter(isChatStartedCase).length,
        smartTagsCount: tagsCountSnap.data().count,
        tagScansCount: scansCountSnap.data().count,
        watchlistsCount: watchCountSnap.data().count,
      });
      void casesCountSnap;
    } catch {
      setTelemetry((prev) => ({ ...prev, loading: false }));
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    fetch('/api/health')
      .then((r) => r.json())
      .then((data: HealthPayload) => setHealth(data))
      .catch(() => {});
    void loadLiveTelemetry();
  }, [isAdmin, loadLiveTelemetry]);

  const mergedReports = useMemo(() => {
    const map = new Map<string, ItemReport>();
    for (const r of reports) map.set(r.id, r);
    for (const r of telemetry.allReports) map.set(r.id, r);
    return Array.from(map.values());
  }, [reports, telemetry.allReports]);

  const mergedCases = useMemo(() => {
    const map = new Map<string, RecoveryCase>();
    for (const c of recoveryCases) map.set(c.id, c);
    for (const c of telemetry.allCases) map.set(c.id, c);
    return Array.from(map.values()).sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  }, [recoveryCases, telemetry.allCases]);

  const metrics = useMemo(
    () =>
      computeAdminMetrics({
        users: telemetry.users,
        reports: mergedReports,
        recoveryCases: mergedCases,
        organizations,
        institutionalRecords,
        supportTickets,
        moderationCases,
        totalUsersCount: telemetry.totalUsersCount,
        totalChatsCount: telemetry.totalChatsCount,
        smartTagsCount: telemetry.smartTagsCount,
        tagScansCount: telemetry.tagScansCount,
        watchlistsCount: telemetry.watchlistsCount,
      }),
    [
      telemetry,
      mergedReports,
      mergedCases,
      organizations,
      institutionalRecords,
      supportTickets,
      moderationCases,
    ]
  );

  if (!user || !isAdmin) {
    return (
      <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
        <ShieldCheck className="w-12 h-12 text-violet-600 dark:text-violet-400 mx-auto" />
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {isAr ? 'وصول مقيّد للمشرف العام' : 'Restricted Super Admin Command Center'}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {isAr
            ? 'تتطلب هذه الصفحة تسجيل الدخول بحساب مشرف موثق ومعتمد في قواعد الأمان.'
            : 'This area requires authentication with a verified Super Admin account.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/admin-login')}
          className="la-btn-primary"
        >
          {isAr ? 'بوابة دخول المشرف' : 'Go to Admin Login'}
        </button>
      </div>
    );
  }

  const handleToggleMaintenance = async () => {
    setMaintenanceBusy(true);
    setFeedback(null);
    const nextState = !platformSettings.maintenanceMode;
    try {
      await updatePlatformSettings({ maintenanceMode: nextState });
      setFeedback(
        nextState
          ? isAr
            ? 'تم تحويل الموقع إلى وضع الصيانة. المشرفون فقط يمكنهم التصفح وإعادة فتحه.'
            : 'Maintenance mode activated. Only verified supervisors/admins can browse and reopen the platform.'
          : isAr
            ? 'تم إيقاف وضع الصيانة وإعادة فتح الموقع لجميع المستخدمين.'
            : 'Maintenance mode disabled — the platform is now live for everyone.'
      );
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Unable to toggle maintenance mode.');
    } finally {
      setMaintenanceBusy(false);
    }
  };

  const handleAppointSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normalizeSupervisorEmail(supervisorEmail);
    if (!isValidEmailAddress(clean)) {
      setFeedback(isAr ? 'يرجى إدخال بريد إلكتروني صحيح للمشرف.' : 'Please enter a valid email address.');
      return;
    }
    setSupervisorBusy(true);
    setFeedback(null);
    try {
      const res = await appointSupervisorByEmail(supervisorEmail.trim(), supervisorRole);
      setSupervisorEmail('');
      setFeedback(
        res.mode === 'activated_immediately'
          ? isAr
            ? `تم تعيين ${clean} وتفعيل صلاحيات الإشراف فوراً!`
            : `${clean} has been granted ${supervisorRole} privileges immediately.`
          : isAr
            ? `تمت إضافة دعوة إشراف إلى ${clean} — ستُفعّل تلقائياً فور تسجيل دخوله ببريده المؤكد.`
            : `Supervisor invitation saved for ${clean}. Access activates automatically upon verified sign-in.`
      );
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Failed to appoint supervisor.');
    } finally {
      setSupervisorBusy(false);
    }
  };

  const activeAdminEmails = useMemo(
    () => new Set(adminsList.map((a) => normalizeSupervisorEmail(a.email))),
    [adminsList]
  );

  const pendingInvites = useMemo(
    () =>
      supervisorInvites.filter(
        (inv) => inv.active && !activeAdminEmails.has(normalizeSupervisorEmail(inv.emailLower || inv.email))
      ),
    [supervisorInvites, activeAdminEmails]
  );

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {isAr ? 'مركز القيادة والإشراف — لقيته' : 'LA2EETOH Supervision & Admin Center'}
          </h1>
          <p className="text-xs text-slate-500">
            {isAr ? `مسجل الدخول كمشرف: ${user.email}` : `Signed in as verified supervisor: ${user.email}`}
            {telemetry.lastSyncedMs && (
              <span className="ms-2 tabular-nums">
                · {isAr ? 'آخر تحديث:' : 'Synced:'} {new Date(telemetry.lastSyncedMs).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void loadLiveTelemetry()}
            disabled={telemetry.loading}
            className="la-btn-secondary !px-3 !py-2 !text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${telemetry.loading ? 'animate-spin' : ''}`} />
            <span>{isAr ? 'تحديث الإحصائيات' : 'Refresh Stats'}</span>
          </button>

          {[
            { id: 'overview', label: isAr ? 'الإحصائيات والصحة' : 'Analytics & Health', icon: Activity },
            { id: 'supervisors', label: isAr ? 'المشرفون والصلاحيات' : 'Supervisors', icon: UserCheck },
            { id: 'whatsapp', label: isAr ? 'بوابة الواتساب' : 'WhatsApp Gateway', icon: MessageCircle },
            {
              id: 'moderation',
              label: isAr ? `الإشراف (${metrics.pendingModeration})` : `Moderation (${metrics.pendingModeration})`,
              icon: FileWarning,
            },
            { id: 'orgs', label: isAr ? 'المؤسسات' : 'Organizations', icon: Building2 },
            { id: 'support', label: isAr ? 'الدعم' : 'Support', icon: MessageSquare },
            { id: 'settings', label: isAr ? 'الإعدادات' : 'Settings & Ads', icon: Megaphone },
            { id: 'audit', label: isAr ? 'التدقيق' : 'Audit Logs', icon: ScrollText },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id as typeof tab)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                  tab === item.id
                    ? 'bg-gradient-to-r from-blue-600 to-violet-600 border-transparent text-white shadow-md shadow-blue-600/20'
                    : 'bg-white dark:bg-[#0D1529] border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:shadow-sm'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Prominent One-Click Maintenance Mode Command Bar */}
      <div
        className={`la-card p-5 flex flex-wrap items-center justify-between gap-4 border-2 transition-all duration-200 ${
          platformSettings.maintenanceMode
            ? 'border-amber-400/70 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-500/50'
            : 'border-emerald-300/60 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-700/40'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3.5">
          <span
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              platformSettings.maintenanceMode
                ? 'bg-amber-500 text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {platformSettings.maintenanceMode ? <Wrench className="w-5 h-5" /> : <Power className="w-5 h-5" />}
          </span>
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                {platformSettings.maintenanceMode
                  ? isAr
                    ? 'وضع الصيانة مفعّل حالياً'
                    : 'Maintenance Mode is ACTIVE'
                  : isAr
                    ? 'الموقع مفتوح ويعمل للجميع'
                    : 'Website is Live for All Visitors'}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  platformSettings.maintenanceMode
                    ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                    : 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    platformSettings.maintenanceMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                  }`}
                />
                {platformSettings.maintenanceMode
                  ? isAr
                    ? 'محجوب عن الزوار'
                    : 'Locked for Visitors'
                  : isAr
                    ? 'مفتوح'
                    : 'Online'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {platformSettings.maintenanceMode
                ? isAr
                  ? 'الزوار يرون شاشة الصيانة الآن، والمشرفون وحدهم يستطيعون تصفح الموقع وإعادة فتحه.'
                  : 'Visitors currently see the Maintenance screen. Only supervisors can browse and reopen the website.'
                : isAr
                  ? 'يمكنك وضع الموقع تحت الصيانة بضغطة واحدة، ولن يستطيع فتحه إلا المشرفون المعتمدون.'
                  : 'Switch the entire website into maintenance mode in one click; only verified supervisors can reopen it.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={maintenanceBusy}
          onClick={handleToggleMaintenance}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-lg transition-all duration-200 shrink-0 disabled:opacity-60 ${
            platformSettings.maintenanceMode
              ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
              : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/25'
          }`}
        >
          {platformSettings.maintenanceMode ? <Power className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
          <span>
            {maintenanceBusy
              ? isAr
                ? 'جاري التنفيذ...'
                : 'Updating...'
              : platformSettings.maintenanceMode
                ? isAr
                  ? 'إيقاف الصيانة وفتح الموقع'
                  : 'Reopen Website Now'
                : isAr
                  ? 'وضع الموقع تحت الصيانة'
                  : 'Enable Maintenance Mode'}
          </span>
        </button>
      </div>

      {feedback && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 px-4 py-3 text-sm text-blue-900 dark:text-blue-200 shadow-md">
          {feedback}
        </div>
      )}

      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Primary Executive KPI Row: Users Entered, Active Chats, Items Recovered, Reports */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="la-card-interactive p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {isAr ? 'المستخدمون المسجلون (كام واحد دخل)' : 'Registered & Active Users'}
                </span>
                <span className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                {metrics.totalUsers}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-2 gap-y-1 tabular-nums">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  {metrics.activeUsers24h} {isAr ? 'دخلوا اليوم' : 'active 24h'}
                </span>
                <span>·</span>
                <span>
                  {metrics.activeUsers7d} {isAr ? 'خلال ٧ أيام' : '7d active'}
                </span>
                <span>·</span>
                <span>
                  +{metrics.newUsers7d} {isAr ? 'جدد' : 'new'}
                </span>
              </div>
            </div>

            <div className="la-card-interactive p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {isAr ? 'المحادثات والدردشات (كام واحد عامل شات)' : 'Two-Party Recovery Chats'}
                </span>
                <span className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-extrabold text-violet-600 dark:text-violet-400 tabular-nums">
                {metrics.chatsStarted}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-2 gap-y-1 tabular-nums">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {metrics.chatParticipants} {isAr ? 'مستخدم مشارك' : 'participants'}
                </span>
                <span>·</span>
                <span>
                  {metrics.activeChats} {isAr ? 'دردشة جارية' : 'active threads'}
                </span>
              </div>
            </div>

            <div className="la-card-interactive p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {isAr ? 'استعادات ناجحة (كام واحد لقي حاجته)' : 'Recovered & Returned Items'}
                </span>
                <span className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {metrics.recoveredItems}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-2 gap-y-1 tabular-nums">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {metrics.recoveryRatePct}% {isAr ? 'نسبة الاستعادة' : 'recovery rate'}
                </span>
                <span>·</span>
                <span>
                  {metrics.stageCounts.handoverArranged} {isAr ? 'بانتظار التسليم' : 'handovers pending'}
                </span>
              </div>
            </div>

            <div className="la-card-interactive p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {isAr ? 'إجمالي البلاغات المنشورة' : 'Lost & Found Reports'}
                </span>
                <span className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                {metrics.totalReports}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-2 gap-y-1 tabular-nums">
                <span>
                  {metrics.lostReports} {isAr ? 'مفقود' : 'lost'}
                </span>
                <span>·</span>
                <span>
                  {metrics.foundReports} {isAr ? 'معثور عليه' : 'found'}
                </span>
                <span>·</span>
                <span>
                  {metrics.liveReports} {isAr ? 'فعلي' : 'live'}
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Engagement & Operations Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="la-card p-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-500">
                  {isAr ? 'رموز QR الذكية' : 'Smart QR Tags'}
                </div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums mt-0.5">
                  {metrics.smartTagsCount}
                </div>
                <div className="text-[11px] text-slate-500 tabular-nums">
                  {metrics.tagScansCount} {isAr ? 'عملية مسح وبلاغ' : 'finder scans'}
                </div>
              </div>
              <QrCode className="w-5 h-5 text-blue-500 shrink-0" />
            </div>

            <div className="la-card p-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-500">
                  {isAr ? 'تنبيهات المراقبة' : 'Watchlist Rules'}
                </div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums mt-0.5">
                  {metrics.watchlistsCount}
                </div>
                <div className="text-[11px] text-slate-500 tabular-nums">
                  {metrics.matchedReports} {isAr ? 'بلاغ مطابق' : 'matched listings'}
                </div>
              </div>
              <TrendingUp className="w-5 h-5 text-violet-500 shrink-0" />
            </div>

            <div className="la-card p-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-500">
                  {isAr ? 'المؤسسات المعتمدة' : 'Verified Orgs & Custody'}
                </div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums mt-0.5">
                  {metrics.verifiedOrgs}
                </div>
                <div className="text-[11px] text-slate-500 tabular-nums">
                  {metrics.pendingOrgs} {isAr ? 'معلق' : 'pending'} · {metrics.custodyItems} {isAr ? 'عهدة' : 'custody'}
                </div>
              </div>
              <Building2 className="w-5 h-5 text-emerald-500 shrink-0" />
            </div>

            <div className="la-card p-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-500">
                  {isAr ? 'الإشراف وتذاكر الدعم' : 'Moderation & Support'}
                </div>
                <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums mt-0.5">
                  {metrics.pendingModeration + metrics.openSupportTickets}
                </div>
                <div className="text-[11px] text-slate-500 tabular-nums">
                  {metrics.pendingModeration} {isAr ? 'إشراف' : 'mod'} · {metrics.openSupportTickets} {isAr ? 'تذكرة' : 'tickets'}
                </div>
              </div>
              <FileWarning className="w-5 h-5 text-amber-500 shrink-0" />
            </div>
          </div>

          {/* Visual Analytics Row: Recovery Funnel, Top Governorates, Top Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recovery & Chat Lifecycle Funnel */}
            <div className="la-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'مراحل المحادثات والاستعادة' : 'Chat & Recovery Pipeline'}
                </h2>
                <span className="text-xs text-slate-500 tabular-nums">
                  {metrics.totalCases} {isAr ? 'حالة' : 'cases'}
                </span>
              </div>
              <div className="space-y-3">
                {[
                  {
                    label: isAr ? 'تم فتح محادثة' : 'Chat Initiated',
                    val: metrics.stageCounts.contactInitiated,
                    color: 'bg-blue-500',
                  },
                  {
                    label: isAr ? 'التحقق من الملكية' : 'Ownership Verification',
                    val: metrics.stageCounts.verification,
                    color: 'bg-violet-500',
                  },
                  {
                    label: isAr ? 'ترتيب التسليم' : 'Handover Arranged',
                    val: metrics.stageCounts.handoverArranged,
                    color: 'bg-amber-500',
                  },
                  {
                    label: isAr ? 'تم استرجاع الغرض' : 'Returned & Closed',
                    val: metrics.stageCounts.returnedOrClosed,
                    color: 'bg-emerald-500',
                  },
                  {
                    label: isAr ? 'حالات متنازع عليها' : 'Disputed Cases',
                    val: metrics.stageCounts.disputed,
                    color: 'bg-rose-500',
                  },
                ].map((stage) => {
                  const pct = metrics.totalCases > 0 ? Math.round((stage.val / metrics.totalCases) * 100) : 0;
                  return (
                    <div key={stage.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{stage.label}</span>
                        <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                          {stage.val} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${stage.color}`}
                          style={{ width: `${Math.max(pct, stage.val > 0 ? 6 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Egyptian Governorates */}
            <div className="la-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span>{isAr ? 'أكثر المحافظات نشاطاً' : 'Top Active Governorates'}</span>
                </h2>
                <span className="text-xs text-slate-500 tabular-nums">
                  {metrics.totalReports} {isAr ? 'بلاغ' : 'reports'}
                </span>
              </div>
              {metrics.topGovernorates.length === 0 ? (
                <p className="text-xs text-slate-500">{isAr ? 'لا توجد بيانات بعد.' : 'No report distribution yet.'}</p>
              ) : (
                <div className="space-y-3">
                  {metrics.topGovernorates.map((g) => {
                    const gov = findGovernorate(g.key);
                    const name = gov ? (isAr ? gov.nameAr : gov.nameEn) : g.key;
                    return (
                      <div key={g.key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{name}</span>
                          <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                            {g.count} ({g.pct}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600 transition-all duration-300"
                            style={{ width: `${Math.max(g.pct, 6)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top Item Categories */}
            <div className="la-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'توزيع فئات المفقودات' : 'Top Item Categories'}
                </h2>
                <span className="text-xs text-slate-500 tabular-nums">
                  {metrics.openReports} {isAr ? 'مفتوح' : 'open'}
                </span>
              </div>
              {metrics.topCategories.length === 0 ? (
                <p className="text-xs text-slate-500">{isAr ? 'لا توجد بيانات بعد.' : 'No category data yet.'}</p>
              ) : (
                <div className="space-y-3">
                  {metrics.topCategories.map((c) => {
                    const cat = ITEM_CATEGORIES.find((item) => item.id === c.key);
                    const catLabel = cat ? (isAr ? cat.nameAr : cat.nameEn) : c.key;
                    return (
                      <div key={c.key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {catLabel}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                            {c.count} ({c.pct}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-500 transition-all duration-300"
                            style={{ width: `${Math.max(c.pct, 6)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent User Sign-Ins & Active Recovery Chats Feeds */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="la-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'أحدث المستخدمين المسجلين / النشطين' : 'Recent User Sign-Ins'}
                </h2>
                <span className="text-xs text-slate-500 tabular-nums">
                  {telemetry.users.length} / {metrics.totalUsers}
                </span>
              </div>
              {telemetry.users.length === 0 ? (
                <p className="text-xs text-slate-500">
                  {telemetry.loading
                    ? isAr
                      ? 'جاري تحميل بيانات المستخدمين...'
                      : 'Loading user activity...'
                    : isAr
                      ? 'لا توجد حسابات مسجلة بعد.'
                      : 'No signed-in user records found yet.'}
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/[0.06] text-xs">
                  {telemetry.users.slice(0, 6).map((u) => (
                    <div key={u.uid} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                          {u.email || u.uid}
                        </div>
                        <div className="text-slate-500">
                          {u.role || 'user'} · {u.preferredLang === 'ar' ? 'العربية' : 'English'}
                        </div>
                      </div>
                      <div className="text-end text-slate-500 tabular-nums shrink-0">
                        {u.updatedAtMs > 0 ? new Date(u.updatedAtMs).toLocaleDateString() : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="la-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'أحدث الدردشات وحالات الاستعادة' : 'Recent Recovery Chats'}
                </h2>
                <span className="text-xs text-slate-500 tabular-nums">
                  {metrics.chatsStarted} {isAr ? 'دردشة' : 'chats'}
                </span>
              </div>
              {mergedCases.length === 0 ? (
                <p className="text-xs text-slate-500">
                  {isAr ? 'لا توجد محادثات استعادة نشطة بعد.' : 'No recovery chats started yet.'}
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/[0.06] text-xs">
                  {mergedCases.slice(0, 6).map((c) => (
                    <div key={c.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                          {c.reportTitle}
                        </div>
                        <div className="text-slate-500 truncate">
                          {c.ownerDisplayName || c.ownerId.slice(0, 8)}
                          {c.counterpartyDisplayName ? ` ↔ ${c.counterpartyDisplayName}` : ''}
                          {c.lastMessageText ? ` · "${c.lastMessageText}"` : ''}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 font-medium shrink-0">
                        {c.stage.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="la-card p-6 space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isAr ? 'صحة التكاملات والخادم (/api/health)' : 'Live System & Integration Health'}
            </h2>
            {health ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                  <div className="text-slate-500">Gemini AI</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">{health.services.geminiAi}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                  <div className="text-slate-500">Google Maps Platform</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">{health.services.googleMaps}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                  <div className="text-slate-500">WhatsApp OTP</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5 flex items-center justify-between gap-2">
                    <span>{health.services.whatsappOtp || 'unconfigured'}</span>
                    <button
                      type="button"
                      onClick={() => setTab('whatsapp')}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      {isAr ? 'إدارة' : 'Setup'}
                    </button>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                  <div className="text-slate-500">Google AdSense</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">{health.services.adSense}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                  <div className="text-slate-500">Server Uptime</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                    {health.uptimeSeconds}s
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Loading health telemetry...</p>
            )}
          </div>
        </div>
      )}

      {tab === 'supervisors' && (
        <div className="space-y-6">
          {/* Appoint Supervisor By Email Card */}
          <form onSubmit={handleAppointSupervisor} className="la-card p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <MailPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>{isAr ? 'تعيين مشرفين جدد بالبريد الإلكتروني' : 'Appoint Supervisors & Admins by Email'}</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr
                    ? 'أدخل البريد الإلكتروني وحدد الصلاحية. إذا كان المستخدم مسجلاً من قبل تُفعّل صلاحيته فوراً، وإذا لم يسجل بعد تُفعّل تلقائياً فور تسجيل دخوله ببريد مؤكد.'
                    : 'Enter an email address and choose a role. Existing verified members activate immediately; new emails activate automatically on their first verified sign-in.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? 'البريد الإلكتروني للمشرف' : 'Supervisor Email Address'}
                </label>
                <input
                  type="email"
                  required
                  value={supervisorEmail}
                  onChange={(e) => setSupervisorEmail(e.target.value)}
                  placeholder="supervisor@example.com"
                  className="la-input"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? 'مستوى الصلاحية' : 'Supervision Role'}
                </label>
                <select
                  value={supervisorRole}
                  onChange={(e) => setSupervisorRole(e.target.value as 'moderator' | 'admin')}
                  className="la-input"
                >
                  <option value="moderator">
                    {isAr ? 'مراقب إشراف (Moderator)' : 'Moderator (Supervision)'}
                  </option>
                  <option value="admin">
                    {isAr ? 'مشرف عام (Full Admin)' : 'Full Admin (Command Center)'}
                  </option>
                </select>
              </div>
              <div className="md:col-span-3">
                <button
                  type="submit"
                  disabled={supervisorBusy}
                  className="la-btn-primary w-full !py-2.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>
                    {supervisorBusy
                      ? isAr
                        ? 'جاري التعيين...'
                        : 'Appointing...'
                      : isAr
                        ? 'تعيين كمشرف'
                        : 'Appoint Supervisor'}
                  </span>
                </button>
              </div>
            </div>
          </form>

          {/* Active Supervisors & Pending Invitations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="la-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  {isAr ? 'المشرفون المفعّلون حالياً' : 'Active Supervisors & Admins'}
                </h3>
                <span className="text-xs font-semibold text-slate-500 tabular-nums">
                  {adminsList.length + 1}
                </span>
              </div>

              <div className="space-y-2.5">
                {/* Primary Bootstrapped Super Admin */}
                <div className="p-3.5 rounded-xl border border-amber-300/60 dark:border-amber-600/30 bg-amber-50/60 dark:bg-amber-950/20 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {BOOTSTRAPPED_ADMIN_EMAIL}
                    </div>
                    <div className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold">
                      {isAr ? 'المشرف الرئيسي المؤسس (محمي)' : 'Primary Super Admin (Protected)'}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] font-bold shrink-0">
                    SUPER ADMIN
                  </span>
                </div>

                {adminsList
                  .filter((a) => normalizeSupervisorEmail(a.email) !== BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase())
                  .map((sup) => (
                    <div
                      key={sup.uid}
                      className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {sup.email || sup.uid}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {sup.role === 'moderator'
                            ? isAr
                              ? 'مراقب إشراف'
                              : 'Moderator'
                            : isAr
                              ? 'مشرف عام'
                              : 'Admin'}
                          {sup.appointedByEmail ? ` · ${isAr ? 'بواسطة' : 'by'} ${sup.appointedByEmail}` : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          void revokeSupervisor({ uid: sup.uid, email: sup.email }).then(() =>
                            setFeedback(
                              isAr ? `تم سحب صلاحيات الإشراف من ${sup.email}.` : `Revoked access for ${sup.email}.`
                            )
                          )
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shrink-0 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isAr ? 'إلغاء' : 'Revoke'}</span>
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="la-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  {isAr ? 'دعوات الإشراف المعلقة (بانتظار الدخول)' : 'Pending Email Invitations'}
                </h3>
                <span className="text-xs font-semibold text-slate-500 tabular-nums">
                  {pendingInvites.length}
                </span>
              </div>

              {pendingInvites.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">
                  {isAr
                    ? 'لا توجد دعوات إشراف معلقة حالياً. أي بريد غير مسجل تضيفه أعلاه سيظهر هنا حتى أول تسجيل دخول.'
                    : 'No pending email invites. Any newly invited email that has not signed in yet appears here.'}
                </p>
              ) : (
                <div className="space-y-2.5">
                  {pendingInvites.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {inv.email}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {inv.role === 'moderator' ? (isAr ? 'مراقب' : 'Moderator') : isAr ? 'مشرف عام' : 'Admin'} ·{' '}
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">
                            {isAr ? 'بانتظار تسجيل الدخول ببريد مؤكد' : 'Awaiting verified login'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          void revokeSupervisor({ inviteId: inv.id, email: inv.email }).then(() =>
                            setFeedback(
                              isAr ? `تم إلغاء دعوة ${inv.email}.` : `Cancelled invite for ${inv.email}.`
                            )
                          )
                        }
                        className="la-btn-secondary !px-3 !py-1.5 !text-xs text-rose-600 dark:text-rose-400 shrink-0"
                      >
                        {isAr ? 'سحب الدعوة' : 'Cancel'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'whatsapp' && (
        <AdminWhatsAppGateway
          isAr={isAr}
          onStatusUpdated={(st) =>
            setHealth((prev) =>
              prev
                ? { ...prev, services: { ...prev.services, whatsappOtp: st.activeChannel } }
                : prev
            )
          }
        />
      )}

      {tab === 'moderation' && (
        <div className="la-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                {isAr ? 'قائمة الإشراف ومراجعة البلاغات' : 'Moderation & Content Review Queue'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr
                  ? 'مراجعة الإعلانات المبلّغ عنها وإخفاؤها فوراً أو رفض البلاغ.'
                  : 'Inspect flagged reports, open listings directly, or hide violating posts.'}
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 tabular-nums">
              {metrics.pendingModeration} {isAr ? 'معلق' : 'pending'}
            </span>
          </div>

          {moderationCases.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {isAr ? 'لا توجد بلاغات مخالفة في قائمة الانتظار حالياً.' : 'No flagged items in the moderation queue.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {moderationCases.map((m) => {
                const linkedReport = mergedReports.find((r) => r.id === m.reportId);
                return (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-3 hover:border-blue-500/40 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {linkedReport ? linkedReport.title : m.reportId}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase ${
                            m.status === 'pending'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : m.status === 'action_taken'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {isAr ? 'سبب البلاغ:' : 'Reason:'} {m.reason}
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/report/${m.reportId}`)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <span>{isAr ? 'عرض البلاغ الأصلي' : 'Inspect Report'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => resolveModerationCase(m.id, m.reportId, 'dismissed')}
                        className="la-btn-secondary !px-3 !py-1.5 !text-xs"
                      >
                        {isAr ? 'رفض البلاغ' : 'Dismiss'}
                      </button>
                      <button
                        type="button"
                        onClick={() => resolveModerationCase(m.id, m.reportId, 'action_taken')}
                        className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
                      >
                        {isAr ? 'إخفاء الإعلان' : 'Hide Listing'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'orgs' && (
        <div className="la-card p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {isAr ? 'التحقق من المؤسسات الشريكة' : 'Organization Verification Workflow'}
          </h2>
          <div className="space-y-3">
            {organizations.map((org) => (
              <div
                key={org.id}
                className="p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {isAr ? org.nameAr : org.nameEn}
                  </div>
                  <div className="text-xs text-slate-500">
                    {org.orgType} · Status: <strong>{org.verificationStatus}</strong>
                  </div>
                </div>
                {!org.isSeed && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => verifyOrganization(org.id, 'verified')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                    >
                      {isAr ? 'اعتماد' : 'Verify'}
                    </button>
                    <button
                      type="button"
                      onClick={() => verifyOrganization(org.id, 'suspended')}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors"
                    >
                      {isAr ? 'تعليق' : 'Suspend'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'support' && (
        <div className="la-card p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {isAr ? 'قائمة تذاكر الدعم' : 'Support Agent Queue'}
          </h2>
          {supportTickets.length === 0 ? (
            <p className="text-sm text-slate-500">No support tickets found.</p>
          ) : (
            <div className="space-y-2.5">
              {supportTickets.map((tkt) => (
                <button
                  key={tkt.id}
                  type="button"
                  onClick={() => navigate(`/support/${tkt.id}`)}
                  className="w-full text-start p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08] hover:border-blue-500/50 transition-all duration-200 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">{tkt.subject}</div>
                    <div className="text-xs text-slate-500">
                      {tkt.category} · {tkt.priority}
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800">
                    {tkt.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'settings' && (
        <div className="la-card p-6 space-y-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {isAr ? 'إعدادات المنصة والإعلانات غير المزعجة' : 'Platform & Non-Intrusive Advertising Controls'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {[
              { key: 'maintenanceMode', labelEn: 'Maintenance Mode (Admins bypass)', labelAr: 'وضع الصيانة' },
              { key: 'autoModerationStrict', labelEn: 'Strict Sensitive Document Auto-Redaction', labelAr: 'تنقية المستندات الحساسة الصارمة' },
              { key: 'adsEnabled', labelEn: 'Enable Google AdSense Placements', labelAr: 'تفعيل مساحات إعلانات جوجل' },
              { key: 'adSlotsHome', labelEn: 'Homepage Sponsored Slot (Below Search)', labelAr: 'مساحة إعلانية في الرئيسية' },
              { key: 'adSlotsSearch', labelEn: 'Search Results Ad Slot (After Organic Items)', labelAr: 'مساحة إعلانية في نتائج البحث' },
              { key: 'adSlotsSidebar', labelEn: 'Desktop Sidebar Ad Slot', labelAr: 'مساحة إعلانية جانبية على سطح المكتب' },
              { key: 'adSlotsInfo', labelEn: 'Informational Pages Bottom Ad Slot', labelAr: 'مساحة إعلانية أسفل الصفحات المعلوماتية' },
            ].map((toggle) => {
              const checked = Boolean(platformSettings[toggle.key as keyof typeof platformSettings]);
              return (
                <label
                  key={toggle.key}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {isAr ? toggle.labelAr : toggle.labelEn}
                  </span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={async (e) => {
                      await updatePlatformSettings({ [toggle.key]: e.target.checked });
                      setFeedback(isAr ? 'تم تحديث الإعدادات.' : 'Platform settings updated.');
                    }}
                  />
                </label>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="la-card p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {isAr ? 'سجل تدقيق الإدارة' : 'Admin Audit Logs'}
          </h2>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-slate-500">No audit entries recorded yet.</p>
          ) : (
            <div className="space-y-2 text-xs">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 flex flex-wrap justify-between gap-2"
                >
                  <div>
                    <strong className="text-slate-900 dark:text-white">{log.action}</strong> — {log.summary}
                  </div>
                  <div className="text-slate-500 tabular-nums">
                    {new Date(log.createdAtMs).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
