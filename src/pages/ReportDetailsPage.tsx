import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Flag,
  Lock,
  MapPin,
  Package,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { t } from '../lib/i18n';
import { EgyptGoogleMap } from '../components/EgyptGoogleMap';
import { findCity, findDistrict, findGovernorate, ITEM_CATEGORIES } from '../utils/egyptLocations';
import { formatFriendlyFirestoreError, validateModerationReason } from '../utils/validation';

export const ReportDetailsPage: React.FC<{ reportId: string }> = ({ reportId }) => {
  const {
    lang,
    reports,
    user,
    recoveryCases,
    navigate,
    updateReportStatus,
    createRecoveryCase,
    flagReport,
    signInWithGoogle,
  } = useApp();
  const copy = t(lang);
  const isAr = lang === 'ar';

  const report = reports.find((r) => r.id === reportId);
  const [claimNote, setClaimNote] = useState('');
  const [flagReason, setFlagReason] = useState('');
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const singleReportList = useMemo(() => (report ? [report] : []), [report]);
  const mapCenterOverride = useMemo(
    () => (report ? { lat: report.publicLat, lng: report.publicLng, zoom: 13 } : undefined),
    [report]
  );

  if (!report) {
    return (
      <div className="max-w-[900px] mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {isAr ? 'البلاغ غير موجود أو تم إخفاؤه' : 'Report Not Found or Removed'}
        </h1>
        <button
          type="button"
          onClick={() => navigate('/search')}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold"
        >
          {isAr ? 'العودة للبحث' : 'Back to Search'}
        </button>
      </div>
    );
  }

  const gov = findGovernorate(report.governorateId);
  const city = findCity(report.governorateId, report.cityId);
  const dist = report.districtId ? findDistrict(report.governorateId, report.cityId, report.districtId) : undefined;
  const cat = ITEM_CATEGORIES.find((c) => c.id === report.category);
  const isOwner = Boolean(user && user.uid === report.ownerId);

  const existingCase = user
    ? recoveryCases.find(
        (c) =>
          c.reportId === report.id &&
          (c.ownerId === user.uid || c.counterpartyId === user.uid) &&
          c.stage !== 'cancelled'
      )
    : undefined;

  const handleStartRecovery = async () => {
    if (!user) {
      await signInWithGoogle();
      return;
    }
    try {
      const caseId = await createRecoveryCase(report, claimNote);
      setFeedback(isAr ? 'تم فتح المحادثة ومتابعة الاستعادة.' : 'Recovery chat opened.');
      navigate(`/track?case=${encodeURIComponent(caseId)}`);
    } catch (err) {
      setFeedback(formatFriendlyFirestoreError(err, isAr, 'Unable to start recovery case.'));
    }
  };

  const handleSubmitFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateModerationReason(flagReason);
    if (!check.valid) {
      setFeedback(isAr ? 'يرجى كتابة سبب لا يقل عن ٤ أحرف.' : check.errors.join(' '));
      return;
    }
    try {
      await flagReport(report.id, flagReason);
      setShowFlagModal(false);
      setFlagReason('');
      setFeedback(isAr ? 'تم إرسال البلاغ للمراجعة الإدارية.' : 'Listing flagged for moderation review.');
    } catch (err) {
      setFeedback(formatFriendlyFirestoreError(err, isAr, 'Flag failed.'));
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-7">
      <button
        type="button"
        onClick={() => navigate('/search')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-200"
      >
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
        <span>{isAr ? 'العودة إلى نتائج البحث' : 'Back to Search'}</span>
      </button>

      {feedback && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 px-4 py-3 text-sm text-blue-900 dark:text-blue-200 shadow-md">
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* Photos */}
          <div className="la-card overflow-hidden">
            {report.photoUrls?.length ? (
              <div className="grid grid-cols-1 gap-2">
                <img
                  src={report.photoUrls[0]}
                  alt={report.title}
                  referrerPolicy="no-referrer"
                  className="w-full max-h-[420px] object-cover"
                />
                {report.photoUrls.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 p-2">
                    {report.photoUrls.slice(1).map((u, idx) => (
                      <img
                        key={idx}
                        src={u}
                        alt={`${report.title} ${idx + 2}`}
                        className="h-20 w-full object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-400">
                <Package className="w-10 h-10" />
                <span className="text-xs">{isAr ? 'لا توجد صور مرفقة حفاظاً على الخصوصية' : 'No photos attached'}</span>
              </div>
            )}
          </div>

          {/* Emergency Document Guidance */}
          {report.isSensitiveDocument && (
            <div className="rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-5 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300 text-sm">
                <ShieldAlert className="w-4 h-4" />
                <span>{isAr ? 'إرشادات الطوارئ للمستندات الرسمية' : 'Emergency Document Recovery Guidance'}</span>
              </div>
              <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                {isAr
                  ? 'إذا فقدت بطاقة رقم قومي أو جواز سفر، حرر محضر فقدان في أقرب قسم شرطة. إذا كانت بطاقة بنكية، اتصل فوراً بخدمة عملاء البنك لإيقافها (مثل ١٩٦٦٦ للبنك الأهلي أو ١٩٨٨٨ لبنك مصر).'
                  : 'If you lost a National ID or Passport, file an official loss report at your nearest police station. For bank cards, call your bank hotline immediately to freeze the card.'}
              </p>
            </div>
          )}

          {/* Location Map */}
          <div className="la-card p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                {isAr ? 'الموقع على الخريطة' : 'Reported Area on Map'}
              </h2>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Lock className="w-3.5 h-3.5" />
                {report.locationPrivacy === 'approximate'
                  ? copy.common.approximateArea
                  : copy.common.exactArea}
              </span>
            </div>

            <EgyptGoogleMap
              mode="explore"
              reports={singleReportList}
              centerOverride={mapCenterOverride}
              heightClassName="h-[300px]"
            />
          </div>
        </div>

        {/* Details & Two-Party Chat Entry Column */}
        <div className="lg:col-span-5 space-y-5">
          <div className="la-card p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`px-3 py-1 rounded-md text-xs font-bold text-white ${
                  report.type === 'lost' ? 'bg-rose-600' : 'bg-emerald-600'
                }`}
              >
                {report.type === 'lost' ? copy.common.lost : copy.common.found}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {isAr ? 'الحالة:' : 'Status:'} {report.status}
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{report.title}</h1>

            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  {gov ? (isAr ? gov.nameAr : gov.nameEn) : report.governorateId}
                  {city ? ` · ${isAr ? city.nameAr : city.nameEn}` : ''}
                  {dist ? ` · ${isAr ? dist.nameAr : dist.nameEn}` : ''}
                </span>
              </div>
              {report.areaNote && <div className="text-xs text-slate-500 ps-6">{report.areaNote}</div>}
              <div className="flex items-center gap-2 tabular-nums">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  {report.dateOccurred}
                  {report.timeApprox ? ` · ${report.timeApprox}` : ''}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-white/[0.08] pt-4 space-y-2">
              <div className="text-xs font-semibold text-slate-500">
                {cat ? (isAr ? cat.nameAr : cat.nameEn) : report.category}
                {report.brand ? ` · ${report.brand}` : ''} · {report.color}
              </div>
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{report.description}</p>
            </div>

            <div className="text-xs text-slate-500 pt-1">
              {isAr ? 'نُشر بواسطة:' : 'Reported by:'}{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{report.ownerDisplayName}</span>
            </div>

            {/* Owner Management Controls */}
            {isOwner && report.status !== 'closed' && report.status !== 'recovered' && (
              <div className="border-t border-slate-100 dark:border-white/[0.08] pt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await updateReportStatus(report.id, 'recovered');
                      setFeedback(isAr ? 'تم تحديث حالة البلاغ إلى مسترد.' : 'Report marked as recovered.');
                    } catch (err) {
                      setFeedback(err instanceof Error ? err.message : 'Unable to update report status.');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تمت الاستعادة / التسليم' : 'Mark as Recovered'}</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await updateReportStatus(report.id, 'closed');
                      setFeedback(isAr ? 'تم إغلاق البلاغ.' : 'Report closed.');
                    } catch (err) {
                      setFeedback(err instanceof Error ? err.message : 'Unable to close report.');
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-white/15 text-xs font-semibold"
                >
                  {isAr ? 'إغلاق البلاغ' : 'Close Report'}
                </button>
              </div>
            )}

            {/* Open Existing Conversation OR Start Direct Two-Party Chat */}
            {existingCase ? (
              <div className="border-t border-slate-100 dark:border-white/[0.08] pt-4 space-y-2.5">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {isAr
                    ? 'يوجد لديك محادثة استعادة مفتوحة لهذا البلاغ:'
                    : 'You have an active two-party recovery thread for this report:'}
                </p>
                <button
                  type="button"
                  onClick={() => navigate(`/track?case=${encodeURIComponent(existingCase.id)}`)}
                  className="la-btn-primary w-full !font-bold"
                >
                  {isAr ? 'فتح المحادثة المباشرة الآن' : 'Open Live Two-Party Chat'}
                </button>
              </div>
            ) : (
              !isOwner &&
              report.status === 'open' && (
                <div className="border-t border-slate-100 dark:border-white/[0.08] pt-4 space-y-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isAr
                      ? 'اكتب رسالة أولى أو علامة تمييز للتواصل المباشر مع الطرف الآخر:'
                      : 'Send an opening message or identifying clue to start live chat:'}
                  </label>
                  <textarea
                    rows={2}
                    value={claimNote}
                    onChange={(e) => setClaimNote(e.target.value)}
                    placeholder={
                      isAr
                        ? 'مثال: توجد علامة مميزة بالداخل — هل يمكننا التنسيق للتسليم؟'
                        : 'e.g. Unique sticker or inner contents — can we arrange verification?'
                    }
                    className="la-input"
                  />
                  <button
                    type="button"
                    onClick={handleStartRecovery}
                    className="la-btn-primary w-full !font-bold"
                  >
                    {isAr ? 'بدء التحقق والمحادثة المباشرة' : 'Start Verification & Live Chat'}
                  </button>
                </div>
              )
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFlagModal(true)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 transition-colors"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{isAr ? 'إبلاغ عن محتوى مشبوه' : 'Report Suspicious Listing'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showFlagModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitFlag}
            className="la-card !shadow-2xl max-w-md w-full p-6 space-y-4"
          >
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              {isAr ? 'الإبلاغ عن مخالفة' : 'Report Suspicious Listing'}
            </h3>
            <textarea
              required
              minLength={4}
              maxLength={400}
              rows={3}
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder={isAr ? 'اذكر سبب الإبلاغ...' : 'Explain why this report is suspicious or unsafe...'}
              className="la-input"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowFlagModal(false)}
                className="la-btn-secondary !py-2"
              >
                {copy.common.cancel}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold shadow-lg shadow-red-600/20 transition-all duration-200"
              >
                {copy.common.submit}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
