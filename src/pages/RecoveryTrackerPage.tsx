import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Lock,
  MapPin,
  MessageSquare,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  XCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { CaseChatMessage, CaseChatMessageKind, RecoveryStage } from '../types';
import { detectSensitiveDocumentPatterns } from '../utils/sanitization';

const STAGES: { id: RecoveryStage; en: string; ar: string }[] = [
  { id: 'report_published', en: 'Report Published', ar: 'تم نشر البلاغ' },
  { id: 'possible_match_found', en: 'Possible Match', ar: 'تطابق محتمل' },
  { id: 'contact_initiated', en: 'Chat Started', ar: 'بدء المحادثة' },
  { id: 'ownership_verification', en: 'Verification', ar: 'التحقق من الملكية' },
  { id: 'handover_arranged', en: 'Handover Set', ar: 'ترتيب التسليم' },
  { id: 'item_returned', en: 'Item Returned', ar: 'تم التسليم' },
  { id: 'case_closed', en: 'Case Closed', ar: 'مغلقة' },
];

const SAFE_HANDOVER_PRESETS = [
  {
    en: 'Cairo Metro Line 3 Lost & Found Desk (Attaba / Adly Mansour)',
    ar: 'مكتب مفقودات مترو الخط الثالث (العتبة / عدلي منصور)',
  },
  {
    en: 'Sadat Metro Station Security & Lost Property Office',
    ar: 'مكتب الأمن والمفقودات بمحطة مترو السادات',
  },
  {
    en: 'Cairo University Main Gate Lost & Found Office',
    ar: 'مكتب المفقودات بالبوابة الرئيسية لجامعة القاهرة',
  },
  {
    en: 'Citystars / Mall of Egypt Guest Relations Desk',
    ar: 'مكتب علاقات الزوار (سيتي ستارز / مول مصر)',
  },
];

export const RecoveryTrackerPage: React.FC = () => {
  const {
    lang,
    user,
    reports,
    currentPath,
    recoveryCases,
    advanceRecoveryCase,
    subscribeCaseMessages,
    sendCaseMessage,
    submitReview,
    navigate,
    signInWithGoogle,
  } = useApp();
  const isAr = lang === 'ar';

  const urlCaseId = useMemo(() => {
    const search = currentPath.split('?')[1] || '';
    return new URLSearchParams(search).get('case');
  }, [currentPath]);

  const [selectedId, setSelectedId] = useState<string | null>(urlCaseId);
  const [mobileShowThread, setMobileShowThread] = useState(Boolean(urlCaseId));
  const [caseFilter, setCaseFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [inboxQuery, setInboxQuery] = useState('');
  const [workspaceTab, setWorkspaceTab] = useState<'chat' | 'stages'>('chat');

  useEffect(() => {
    if (urlCaseId) {
      setSelectedId(urlCaseId);
      setMobileShowThread(true);
    }
  }, [urlCaseId]);

  const filteredCases = useMemo(() => {
    const q = inboxQuery.trim().toLowerCase();
    return recoveryCases.filter((c) => {
      const isClosed = c.stage === 'case_closed' || c.stage === 'cancelled';
      if (caseFilter === 'active' && isClosed) return false;
      if (caseFilter === 'closed' && !isClosed) return false;
      if (q) {
        const hay = `${c.reportTitle} ${c.ownerDisplayName || ''} ${c.counterpartyDisplayName || ''} ${c.lastMessageText || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [recoveryCases, caseFilter, inboxQuery]);

  const activeCase =
    recoveryCases.find((c) => c.id === selectedId) ||
    filteredCases[0] ||
    recoveryCases[0] ||
    null;

  // Live Two-Party Messages State
  const [messages, setMessages] = useState<CaseChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [draftText, setDraftText] = useState('');
  const [draftKind, setDraftKind] = useState<CaseChatMessageKind>('text');
  const [sending, setSending] = useState(false);
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Stage & Review Form State
  const [nextStage, setNextStage] = useState<RecoveryStage>('ownership_verification');
  const [note, setNote] = useState('');
  const [handoverLocation, setHandoverLocation] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!activeCase || !user) {
      setMessages([]);
      return;
    }
    setMessagesLoading(true);
    setChatError(null);
    const unsub = subscribeCaseMessages(
      activeCase.id,
      (msgs) => {
        setMessages(msgs);
        setMessagesLoading(false);
      },
      (err) => {
        setMessagesLoading(false);
        setChatError(err instanceof Error ? err.message : 'Unable to sync messages.');
      }
    );
    return () => unsub();
  }, [activeCase?.id, user, subscribeCaseMessages]);

  useEffect(() => {
    if (workspaceTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, workspaceTab, activeCase?.id]);

  useEffect(() => {
    if (activeCase) {
      setNote(activeCase.verificationNote || '');
      setHandoverLocation(activeCase.handoverLocation || '');
      const idx = STAGES.findIndex((s) => s.id === activeCase.stage);
      if (idx >= 0 && idx < STAGES.length - 1) {
        setNextStage(STAGES[idx + 1].id);
      } else {
        setNextStage(activeCase.stage);
      }
    }
  }, [activeCase]);

  const sensitiveTip = useMemo(() => detectSensitiveDocumentPatterns(draftText), [draftText]);

  if (!user) {
    return (
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-blue-600/25">
          <MessageSquare className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {isAr ? 'المحادثات ومتابعة الاستعادة' : 'Two-Party Recovery Chat & Tracker'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {isAr
              ? 'سجّل الدخول للتواصل المباشر مع الطرف الآخر، التحقق من ملكية الغرض، وتوثيق نقطة التسليم الآمنة.'
              : 'Sign in with a verified account to message the other party directly, confirm ownership marks, and track all 7 recovery stages.'}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => signInWithGoogle()}
            className="la-btn-primary !px-6 !font-bold"
          >
            {isAr ? 'تسجيل الدخول بجوجل' : 'Sign in with Google'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="la-btn-secondary !px-5"
          >
            {isAr ? 'خيارات الدخول' : 'Sign In Options'}
          </button>
        </div>
      </div>
    );
  }

  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeCase || !draftText.trim() || sending) return;
    setSending(true);
    setChatError(null);
    try {
      await sendCaseMessage(activeCase.id, draftText, draftKind);
      if (draftKind === 'handover_proposal' && activeCase.stage === 'contact_initiated') {
        await advanceRecoveryCase(activeCase.id, 'handover_arranged', undefined, draftText.slice(0, 140));
      } else if (draftKind === 'verification_prompt' && activeCase.stage === 'contact_initiated') {
        await advanceRecoveryCase(activeCase.id, 'ownership_verification');
      }
      setDraftText('');
      setDraftKind('text');
      setShowPresetMenu(false);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase) return;
    try {
      await advanceRecoveryCase(activeCase.id, nextStage, note, handoverLocation);
      setFeedback(isAr ? 'تم تحديث مرحلة الاستعادة بنجاح.' : 'Recovery stage updated.');
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Unable to update stage.');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase) return;
    const targetUid =
      activeCase.counterpartyId && activeCase.counterpartyId !== user.uid
        ? activeCase.counterpartyId
        : activeCase.ownerId !== user.uid
          ? activeCase.ownerId
          : null;
    if (!targetUid) return;
    try {
      await submitReview({
        caseId: activeCase.id,
        targetUid,
        rating,
        comment: reviewComment,
      });
      setReviewComment('');
      setFeedback(isAr ? 'شكراً لك! تم حفظ تقييم الاستعادة.' : 'Thank you! Your recovery review has been recorded.');
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Unable to submit review.');
    }
  };

  const activeStageIndex = activeCase ? STAGES.findIndex((s) => s.id === activeCase.stage) : -1;
  const isTerminal = activeCase ? activeCase.stage === 'case_closed' || activeCase.stage === 'cancelled' : false;

  const getCounterpartyLabel = (c: typeof activeCase) => {
    if (!c) return '';
    if (c.ownerId === user.uid) {
      return c.counterpartyDisplayName || (isAr ? 'صاحب البلاغ / الطرف الآخر' : 'Report Counterparty');
    }
    return c.ownerDisplayName || (isAr ? 'الطرف المتواصل' : 'Initiating Member');
  };

  const linkedReport = activeCase ? reports.find((r) => r.id === activeCase.reportId) : undefined;

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Page Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {isAr ? 'المحادثات ومتابعة الاستعادة' : 'Recovery Inbox & Live Chat'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {isAr
              ? 'تواصل مباشر ومؤمّن بين الطرفين للتحقق من الملكية وترتيب التسليم العام.'
              : 'Real-time verified two-party messaging and 7-stage handover coordination.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/search')}
          className="la-btn-secondary !py-2 !text-xs"
        >
          {isAr ? 'تصفح البلاغات' : 'Browse Reports'}
        </button>
      </div>

      {feedback && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-800/70 bg-blue-50 dark:bg-blue-950/40 px-4 py-3 text-sm text-blue-900 dark:text-blue-200 flex items-center justify-between gap-3 shadow-md">
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold underline"
          >
            {isAr ? 'إخفاء' : 'Dismiss'}
          </button>
        </div>
      )}

      {recoveryCases.length === 0 ? (
        <div className="la-card !rounded-3xl p-10 sm:p-12 text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-sm">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isAr ? 'لا توجد محادثات استعادة حالياً' : 'No Recovery Conversations Yet'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isAr
                ? 'افتح أي بلاغ واضغط «بدء التحقق والمحادثة المباشرة» للتواصل مع الطرف الآخر.'
                : 'Open any lost or found report and select "Start Verification & Live Chat" to message the other party directly.'}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => navigate('/search')}
              className="la-btn-primary !font-bold"
            >
              {isAr ? 'استكشاف البلاغات' : 'Explore Reports'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/report-lost')}
              className="la-btn-secondary !px-5"
            >
              {isAr ? 'أبلغ عن مفقود' : 'Report Lost Item'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Thread Inbox */}
          <aside
            className={`lg:col-span-4 la-card flex flex-col overflow-hidden h-[660px] ${
              mobileShowThread ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <div className="p-3.5 border-b border-slate-100 dark:border-white/[0.08] space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3" />
                <input
                  type="text"
                  value={inboxQuery}
                  onChange={(e) => setInboxQuery(e.target.value)}
                  placeholder={isAr ? 'ابحث في المحادثات...' : 'Search conversations...'}
                  className="la-input !ps-9 !py-2 !text-xs"
                />
              </div>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-white/[0.05] rounded-xl p-1">
                {(['all', 'active', 'closed'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setCaseFilter(f)}
                    className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
                      caseFilter === f
                        ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {f === 'all' ? (isAr ? 'الكل' : 'All') : f === 'active' ? (isAr ? 'النشطة' : 'Active') : isAr ? 'المغلقة' : 'Closed'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto la-scroll divide-y divide-slate-100 dark:divide-white/[0.06]">
              {filteredCases.map((c) => {
                const selected = activeCase?.id === c.id;
                const stageObj = STAGES.find((s) => s.id === c.stage);
                const partyLabel = getCounterpartyLabel(c);
                const rep = reports.find((r) => r.id === c.reportId);
                const thumb = rep?.photoUrls?.[0];
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(c.id);
                      setMobileShowThread(true);
                    }}
                    className={`w-full text-start p-3.5 transition-all duration-200 flex items-start gap-3 ${
                      selected
                        ? 'bg-blue-50/90 dark:bg-blue-950/40'
                        : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/[0.06] overflow-hidden shrink-0 flex items-center justify-center border border-slate-200/80 dark:border-white/10">
                      {thumb ? (
                        <img src={thumb} alt={c.reportTitle} className="w-full h-full object-cover" />
                      ) : (
                        <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {c.reportTitle}
                        </span>
                        <span className="text-[10px] text-slate-400 tabular-nums shrink-0">
                          {new Date(c.lastMessageAtMs || c.updatedAtMs).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 truncate">
                        {isAr ? `مع: ${partyLabel}` : `With: ${partyLabel}`}
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {c.lastMessageText || (stageObj ? (isAr ? stageObj.ar : stageObj.en) : c.stage)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Active Two-Party Chat & Recovery Workspace */}
          {activeCase && (
            <section
              className={`lg:col-span-8 la-card flex flex-col overflow-hidden min-h-[660px] lg:h-[660px] ${
                mobileShowThread ? 'flex' : 'hidden lg:flex'
              }`}
            >
              {/* Conversation Top Bar */}
              <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-[#0A1124]">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileShowThread(false)}
                    className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200"
                    aria-label={isAr ? 'العودة للمحادثات' : 'Back to inbox'}
                  >
                    <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-extrabold text-base text-slate-900 dark:text-white truncate">
                        {activeCase.reportTitle}
                      </h2>
                      {activeCase.stage === 'disputed' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold shrink-0">
                          <AlertCircle className="w-3 h-3" />
                          {isAr ? 'نزاع' : 'Disputed'}
                        </span>
                      )}
                      {activeCase.stage === 'cancelled' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold shrink-0">
                          <XCircle className="w-3 h-3" />
                          {isAr ? 'ملغاة' : 'Cancelled'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        {isAr ? 'الطرف الآخر:' : 'Party:'}{' '}
                        <strong className="text-slate-700 dark:text-slate-200">
                          {getCounterpartyLabel(activeCase)}
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate(`/report/${activeCase.reportId}`)}
                        className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <span>{isAr ? 'عرض البلاغ' : 'View Report'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Chat vs Stages Switcher */}
                <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-white/[0.06] rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setWorkspaceTab('chat')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      workspaceTab === 'chat'
                        ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{isAr ? 'المحادثة المباشرة' : 'Live Chat'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkspaceTab('stages')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      workspaceTab === 'stages'
                        ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isAr ? 'المراحل والتسليم' : 'Stages & Handover'}</span>
                  </button>
                </div>
              </div>

              {/* Compact 7-Stage Progress Bar Strip */}
              <div className="px-4 sm:px-5 py-2 border-b border-slate-100 dark:border-white/[0.06] bg-white dark:bg-[#0D1529] flex items-center gap-1.5 overflow-x-auto la-scroll">
                {STAGES.map((st, idx) => {
                  const done = activeStageIndex >= idx;
                  const current = activeCase.stage === st.id;
                  return (
                    <div
                      key={st.id}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap shrink-0 ${
                        current
                          ? 'bg-blue-600 text-white font-bold'
                          : done
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                            : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      <span className="tabular-nums">0{idx + 1}</span>
                      <span>{isAr ? st.ar : st.en}</span>
                    </div>
                  );
                })}
              </div>

              {workspaceTab === 'chat' ? (
                <>
                  {/* Safety Notice Bar */}
                  <div className="px-4 sm:px-5 py-2 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/50 flex items-center justify-between gap-2 text-[11px] text-blue-900 dark:text-blue-200">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                      <span>
                        {isAr
                          ? 'محادثة محمية بين الطرفين — لا تشارك الرقم القومي أو البطاقات البنكية، وفضّل التسليم في أماكن عامة نهاراً.'
                          : 'Private two-party chat — National IDs & cards are auto-redacted. Arrange handovers in public daylight desks.'}
                      </span>
                    </div>
                  </div>

                  {/* Live Messages Feed */}
                  <div className="flex-1 overflow-y-auto la-scroll p-4 sm:p-5 space-y-3 bg-[#F8FAFD] dark:bg-[#070D1D]">
                    {!activeCase.counterpartyId && linkedReport?.ownerId === user.uid && (
                      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0D1529] p-3.5 text-xs text-slate-600 dark:text-slate-300">
                        {isAr
                          ? 'هذه الحالة بانتظار تواصل طرف آخر على بلاغك. فور قيام أي مستخدم ببدء التحقق من صفحة البلاغ، ستظهر رسائله هنا مباشرة.'
                          : 'Waiting for another verified member to initiate recovery on your report. As soon as someone responds to your listing, their messages will appear here live.'}
                      </div>
                    )}

                    {messagesLoading ? (
                      <div className="py-12 text-center text-xs text-slate-500">
                        {isAr ? 'جاري تحميل المحادثة...' : 'Syncing encrypted thread...'}
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="py-10 text-center space-y-2 max-w-sm mx-auto">
                        <Sparkles className="w-6 h-6 text-blue-500 mx-auto" />
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {isAr ? 'ابدأ المحادثة الآن' : 'Start the Conversation'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {isAr
                            ? 'اسأل عن علامة مميزة تؤكد الملكية أو اقترح نقطة تسليم عامة آمنة في مصر.'
                            : 'Ask a verification question to confirm ownership or propose a safe Egyptian Metro / University / Mall handover desk.'}
                        </p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const mine = msg.senderId === user.uid;
                        const timeLabel = new Date(msg.createdAtMs).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}
                          >
                            <div
                              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm space-y-1 ${
                                msg.kind === 'handover_proposal'
                                  ? 'bg-emerald-600 text-white rounded-te-sm'
                                  : msg.kind === 'verification_prompt'
                                    ? mine
                                      ? 'bg-indigo-600 text-white rounded-te-sm'
                                      : 'bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white rounded-ts-sm'
                                    : mine
                                      ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-te-sm'
                                      : 'bg-white dark:bg-[#111B36] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-slate-100 rounded-ts-sm'
                              }`}
                            >
                              {!mine && (
                                <div className="text-[11px] font-bold opacity-75">{msg.senderName}</div>
                              )}
                              {msg.kind === 'handover_proposal' && (
                                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide opacity-90">
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>{isAr ? 'اقتراح نقطة تسليم آمنة' : 'Safe Handover Proposal'}</span>
                                </div>
                              )}
                              {msg.kind === 'verification_prompt' && (
                                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide opacity-90">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>{isAr ? 'تحقق من الملكية' : 'Ownership Verification'}</span>
                                </div>
                              )}
                              <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 px-1 tabular-nums">
                              {timeLabel}
                            </span>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Quick Actions & Composer */}
                  <div className="p-3 sm:p-4 border-t border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1529] space-y-2.5">
                    {chatError && (
                      <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
                        {chatError}
                      </div>
                    )}

                    {sensitiveTip.hasSensitiveData && (
                      <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-1.5 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {isAr
                            ? 'تنبيه الخصوصية: يتم إخفاء الأرقام القومية والبطاقات البنكية تلقائياً لحمايتك.'
                            : 'Privacy guard: National IDs, IBANs, and bank card numbers are automatically redacted.'}
                        </span>
                      </div>
                    )}

                    {!isTerminal && (
                      <div className="relative flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowPresetMenu((v) => !v)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 transition-colors"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{isAr ? 'اقتراح نقطة تسليم آمنة' : 'Propose Safe Handover Desk'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDraftKind('verification_prompt');
                            setDraftText(
                              isAr
                                ? 'للتأكد من الملكية: ما العلامة المميزة أو المحتوى الداخلي الذي لا يظهر في الصور؟'
                                : 'Verification check: Could you describe a unique hidden mark or inner pocket item not shown in photos?'
                            );
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/70 text-[11px] font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/70 transition-colors"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{isAr ? 'سؤال تحقق' : 'Ask Verification Clue'}</span>
                        </button>

                        {showPresetMenu && (
                          <div className="absolute bottom-full mb-2 start-0 z-20 w-80 max-w-full rounded-2xl bg-white dark:bg-[#111B36] border border-slate-200 dark:border-white/15 shadow-2xl p-2 space-y-1">
                            <div className="px-2 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                              {isAr ? 'اختر نقطة تسليم عامة آمنة:' : 'Choose a safe public handover hub:'}
                            </div>
                            {SAFE_HANDOVER_PRESETS.map((preset, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => {
                                  const label = isAr ? preset.ar : preset.en;
                                  setDraftKind('handover_proposal');
                                  setDraftText(
                                    isAr
                                      ? `أقترح إتمام التسليم في: ${label} (خلال ساعات العمل النهارية).`
                                      : `Let's meet safely for handover at: ${label} (daylight hours).`
                                  );
                                  setShowPresetMenu(false);
                                }}
                                className="w-full text-start px-2.5 py-2 rounded-xl text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                              >
                                {isAr ? preset.ar : preset.en}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {isTerminal ? (
                      <div className="text-center py-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                        {isAr
                          ? 'تم إغلاق هذه الحالة. انتقل إلى تبويب «المراحل والتسليم» لإضافة تقييم الثقة.'
                          : 'This recovery case is closed. Switch to "Stages & Handover" to leave a trust review.'}
                      </div>
                    ) : (
                      <form onSubmit={handleSendChat} className="flex items-end gap-2.5">
                        <textarea
                          rows={2}
                          value={draftText}
                          onChange={(e) => setDraftText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendChat();
                            }
                          }}
                          maxLength={1500}
                          placeholder={
                            isAr
                              ? 'اكتب رسالتك هنا للتنسيق مع الطرف الآخر...'
                              : 'Write a message to coordinate verification or handover...'
                          }
                          className="la-input flex-1 resize-none"
                        />
                        <button
                          type="submit"
                          disabled={sending || draftText.trim().length === 0}
                          className="la-btn-primary !py-3 !font-bold"
                        >
                          <Send className="w-4 h-4 rtl:rotate-180" />
                          <span className="hidden sm:inline">{isAr ? 'إرسال' : 'Send'}</span>
                        </button>
                      </form>
                    )}
                  </div>
                </>
              ) : (
                /* Stages, Handover & Trust Review Tab */
                <div className="flex-1 overflow-y-auto la-scroll p-5 space-y-6">
                  <ol className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {STAGES.map((st, idx) => {
                      const completed = activeStageIndex >= idx;
                      const current = activeCase.stage === st.id;
                      return (
                        <li
                          key={st.id}
                          className={`p-3 rounded-xl border text-xs ${
                            current
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-bold'
                              : completed
                                ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                                : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 tabular-nums">
                            <CheckCircle2 className={`w-3.5 h-3.5 ${completed ? 'opacity-100' : 'opacity-30'}`} />
                            <span>0{idx + 1}</span>
                          </div>
                          <div>{isAr ? st.ar : st.en}</div>
                        </li>
                      );
                    })}
                  </ol>

                  <form
                    onSubmit={handleUpdateStage}
                    className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/[0.08]"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          {isAr ? 'تحديث المرحلة إلى' : 'Update Stage'}
                        </label>
                        <select
                          value={nextStage}
                          onChange={(e) => setNextStage(e.target.value as RecoveryStage)}
                          className="la-input"
                        >
                          {STAGES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {isAr ? s.ar : s.en}
                            </option>
                          ))}
                          <option value="disputed">{isAr ? 'فتح نزاع / مراجعة' : 'Flag Disputed'}</option>
                          <option value="cancelled">{isAr ? 'إلغاء الحالة' : 'Cancel Case'}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          {isAr ? 'نقطة التسليم العامة المتفق عليها' : 'Agreed Safe Handover Location'}
                        </label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
                          <input
                            type="text"
                            value={handoverLocation}
                            onChange={(e) => setHandoverLocation(e.target.value)}
                            placeholder={
                              isAr ? 'مثال: مكتب مفقودات مترو العتبة' : 'e.g., Attaba Metro Lost & Found Desk'
                            }
                            className="la-input !ps-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        {isAr ? 'ملخص التحقق من الملكية' : 'Ownership Verification Summary'}
                      </label>
                      <textarea
                        rows={3}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={
                          isAr
                            ? 'وثّق العلامات المميزة التي تم التحقق منها قبل التسليم...'
                            : 'Document distinguishing marks confirmed before handover...'
                        }
                        className="la-input"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isTerminal}
                        className="la-btn-primary !font-bold"
                      >
                        {isAr ? 'حفظ تحديث المرحلة' : 'Save Stage Update'}
                      </button>
                    </div>
                  </form>

                  {/* Post-Recovery Trust Review */}
                  {(activeCase.stage === 'item_returned' || activeCase.stage === 'case_closed') &&
                    (() => {
                      const targetUid =
                        activeCase.counterpartyId && activeCase.counterpartyId !== user.uid
                          ? activeCase.counterpartyId
                          : activeCase.ownerId !== user.uid
                            ? activeCase.ownerId
                            : null;
                      if (!targetUid) {
                        return (
                          <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4 text-xs text-slate-500 dark:text-slate-400">
                            {isAr
                              ? 'تتوفر تقييمات الثقة بعد إتمام الاستعادة مع طرف ثانٍ موثق.'
                              : 'Trust reviews become available once a verified counterparty is paired on the case.'}
                          </div>
                        );
                      }
                      return (
                        <form
                          onSubmit={handleReviewSubmit}
                          className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-[#080F24] p-5 space-y-3 shadow-sm"
                        >
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {isAr ? 'تقييم تجربة الاستعادة' : 'Post-Recovery Trust Review'}
                          </h3>
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => setRating(num)}
                                aria-label={`${num} stars`}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  rating >= num
                                    ? 'text-amber-500 border-amber-300 bg-amber-50 dark:bg-amber-950/40'
                                    : 'text-slate-400 border-slate-200 dark:border-white/10'
                                }`}
                              >
                                <Star className="w-4 h-4 fill-current" />
                              </button>
                            ))}
                          </div>
                          <textarea
                            rows={2}
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder={isAr ? 'شارك تجربتك الآمنة...' : 'Share feedback on verification and handover...'}
                            className="la-input"
                          />
                          <button
                            type="submit"
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all duration-200"
                          >
                            {isAr ? 'إرسال التقييم' : 'Submit Review'}
                          </button>
                        </form>
                      );
                    })()}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
};
