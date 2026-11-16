import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { doc, getDoc } from 'firebase/firestore';
import { Copy, Download, QrCode, Send, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../lib/firebase';
import type { SmartTag } from '../types';
import { EGYPT_GOVERNORATES, ITEM_CATEGORIES } from '../utils/egyptLocations';
import { detectSensitiveDocumentPatterns } from '../utils/sanitization';
import {
  formatFriendlyFirestoreError,
  validateSmartTagPayload,
  validateTagRelayPayload,
} from '../utils/validation';

export const QrTagsPage: React.FC<{ publicToken?: string }> = ({ publicToken }) => {
  const {
    lang,
    user,
    smartTags,
    createSmartTag,
    updateSmartTagStatus,
    submitTagRelay,
    signInWithGoogle,
  } = useApp();
  const isAr = lang === 'ar';

  // Owner Management State
  const [itemLabel, setItemLabel] = useState('');
  const [category, setCategory] = useState('wallets-bags');
  const [safeNote, setSafeNote] = useState('');
  const [qrUrls, setQrUrls] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Public Tag Scan State
  const [scannedTag, setScannedTag] = useState<SmartTag | null>(null);
  const [scanLoading, setScanLoading] = useState(Boolean(publicToken));
  const [finderMessage, setFinderMessage] = useState('');
  const [finderSafeContact, setFinderSafeContact] = useState('');
  const [governorateId, setGovernorateId] = useState('cairo');
  const [relaySent, setRelaySent] = useState(false);
  const [relaySubmitting, setRelaySubmitting] = useState(false);
  const [relayError, setRelayError] = useState<string | null>(null);

  const sensitiveCheck = detectSensitiveDocumentPatterns(safeNote);

  useEffect(() => {
    let cancelled = false;
    async function generateAll() {
      const next: Record<string, string> = {};
      for (const tag of smartTags) {
        try {
          const url = `${window.location.origin}/tag/${tag.token}`;
          next[tag.token] = await QRCode.toDataURL(url, { width: 220, margin: 1 });
        } catch {
          // ignore QR canvas error
        }
      }
      if (!cancelled) setQrUrls(next);
    }
    if (!publicToken && smartTags.length > 0) {
      generateAll();
    }
    return () => {
      cancelled = true;
    };
  }, [smartTags, publicToken]);

  useEffect(() => {
    if (!publicToken) return;
    setScanLoading(true);
    getDoc(doc(db, 'smartTags', publicToken))
      .then((snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setScannedTag({ ...(d as Omit<SmartTag, 'createdAtMs'>), token: snap.id, createdAtMs: Date.now() });
        } else {
          setScannedTag(null);
        }
      })
      .catch(() => setScannedTag(null))
      .finally(() => setScanLoading(false));
  }, [publicToken]);

  // Public Tag Scan View (/tag/:token)
  if (publicToken) {
    return (
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-10 space-y-6">
        {scanLoading ? (
          <div className="la-card p-8 text-center text-sm text-slate-500">
            {isAr ? 'جاري التحقق من رمز QR...' : 'Verifying Smart QR Tag...'}
          </div>
        ) : !scannedTag || scannedTag.status === 'deactivated' ? (
          <div className="la-card p-8 text-center space-y-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {isAr ? 'رمز QR غير نشط أو غير موجود' : 'QR Tag Inactive or Not Found'}
            </h1>
            <p className="text-sm text-slate-500">
              {isAr
                ? 'تم تعطيل هذا الرمز من قِبل المالك أو لم يعد مسجلاً.'
                : 'This tag has been deactivated by its owner or does not exist.'}
            </p>
          </div>
        ) : (
          <div className="la-card p-6 sm:p-7 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {isAr ? 'رمز لقيته الذكي المحمي' : 'LA2EETOH Protected Smart Tag'}
                </div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{scannedTag.itemLabel}</h1>
              </div>
            </div>

            {scannedTag.safeNote && (
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 p-4 text-sm text-slate-700 dark:text-slate-300">
                <div className="text-xs font-semibold text-slate-500 mb-1">
                  {isAr ? 'ملاحظة المالك الآمنة:' : "Owner's Safe Note:"}
                </div>
                {scannedTag.safeNote}
              </div>
            )}

            <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/30 p-3 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {isAr
                  ? 'لا يتم كشف رقم هاتف المالك أو عنوانه. أرسل رسالة آمنة عبر الوسيط المحمي ليتم تنبيه المالك فوراً.'
                  : "Owner's phone number and address remain hidden. Send a protected relay message below."}
              </span>
            </div>

            {relaySent ? (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 p-4 text-sm text-emerald-800 dark:text-emerald-200">
                {isAr ? 'تم إرسال رسالتك إلى المالك بأمان. شكراً لأمانتك!' : 'Your protected relay message was delivered to the owner. Thank you!'}
              </div>
            ) : !user ? (
              <div className="text-center space-y-3 py-3">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {isAr
                    ? 'سجّل الدخول بسرعة لإرسال رسالة موثقة إلى مالك هذا الغرض.'
                    : 'Sign in quickly to send a verified relay message to the owner.'}
                </p>
                <button
                  type="button"
                  onClick={() => signInWithGoogle()}
                  className="la-btn-primary"
                >
                  {isAr ? 'تسجيل الدخول بجوجل' : 'Sign in with Google'}
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setRelayError(null);
                  const check = validateTagRelayPayload(finderMessage, finderSafeContact);
                  if (!check.valid) {
                    setRelayError(
                      isAr
                        ? 'يجب أن تكون الرسالة ٥ أحرف على الأقل وألا تتجاوز ٥٠٠ حرف.'
                        : check.errors.join(' ')
                    );
                    return;
                  }
                  setRelaySubmitting(true);
                  try {
                    await submitTagRelay({
                      tagToken: scannedTag.token,
                      ownerId: scannedTag.ownerId,
                      finderMessage,
                      finderSafeContact,
                      governorateId,
                    });
                    setRelaySent(true);
                  } catch (err) {
                    setRelayError(formatFriendlyFirestoreError(err, isAr));
                  } finally {
                    setRelaySubmitting(false);
                  }
                }}
                className="space-y-3"
              >
                {relayError && (
                  <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-xs text-rose-800 dark:text-rose-200">
                    {relayError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? 'رسالتك للمالك *' : 'Message for Owner *'}
                  </label>
                  <textarea
                    required
                    minLength={5}
                    maxLength={500}
                    rows={3}
                    value={finderMessage}
                    onChange={(e) => setFinderMessage(e.target.value)}
                    placeholder={
                      isAr
                        ? 'مثال: عثرت على الحقيبة في محطة مترو السادات وأودعتها مكتب المفقودات...'
                        : 'e.g., Found this item near Sadat Metro and handed it to the station security desk...'
                    }
                    className="la-input"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isAr ? 'المحافظة' : 'Governorate'}
                    </label>
                    <select
                      value={governorateId}
                      onChange={(e) => setGovernorateId(e.target.value)}
                      className="la-input"
                    >
                      {EGYPT_GOVERNORATES.map((g) => (
                        <option key={g.id} value={g.id}>
                          {isAr ? g.nameAr : g.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isAr ? 'نقطة تسليم مقترحة (اختياري)' : 'Suggested Desk / Safe Contact (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={finderSafeContact}
                      onChange={(e) => setFinderSafeContact(e.target.value)}
                      className="la-input"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={relaySubmitting}
                  className="la-btn-primary"
                >
                  <Send className="w-4 h-4" />
                  <span>{isAr ? 'إرسال عبر الوسيط الآمن' : 'Send Protected Relay'}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    );
  }

  // Owner Smart QR Tags Management View (/qr-tags)
  if (!user) {
    return (
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-16 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto shadow-md">
          <QrCode className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {isAr ? 'رموز QR الذكية لحماية ممتلكاتك' : 'Smart Protected QR Tags'}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          {isAr
            ? 'سجّل الدخول لإنشاء رموز QR عشوائية للطباعة على الحقائب والأجهزة والمفاتيح دون كشف رقم هاتفك.'
            : 'Sign in to generate randomized, printable QR tags for bags, laptops, and keys without exposing personal contact details.'}
        </p>
        <button
          type="button"
          onClick={() => signInWithGoogle()}
          className="la-btn-primary"
        >
          {isAr ? 'تسجيل الدخول بجوجل' : 'Sign in with Google'}
        </button>
      </div>
    );
  }

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    const check = validateSmartTagPayload(itemLabel, category, safeNote);
    if (!check.valid) {
      setFeedback({
        type: 'error',
        text: isAr
          ? 'يجب أن يكون اسم الغرض من ٢ إلى ٨٠ حرفاً (والملاحظة بحد أقصى ٣٠٠ حرف).'
          : check.errors.join(' '),
      });
      return;
    }
    setCreating(true);
    setFeedback(null);
    try {
      await createSmartTag({ itemLabel, category, safeNote });
      setItemLabel('');
      setSafeNote('');
      setFeedback({
        type: 'success',
        text: isAr ? 'تم إنشاء رمز QR الذكي بنجاح.' : 'Smart QR tag generated.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: formatFriendlyFirestoreError(err, isAr, 'Unable to create tag.'),
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="la-page-shell">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {isAr ? 'إدارة رموز QR الذكية' : 'Smart QR Tags Manager'}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {isAr
            ? 'أنشئ رمزاً عشوائياً غير قابل للتخمين لأغراضك الشخصية، وعطّله في أي لحظة.'
            : 'Generate non-guessable QR tags for personal belongings and deactivate or mark them lost anytime.'}
        </p>
      </div>

      {feedback && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm shadow-md ${
            feedback.type === 'error'
              ? 'border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200'
              : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleCreateTag}
          className="lg:col-span-4 la-card p-6 space-y-4"
        >
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {isAr ? 'إنشاء ملصق QR جديد' : 'Generate New QR Tag'}
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAr ? 'تسمية الغرض *' : 'Item Label *'}
            </label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={80}
              value={itemLabel}
              onChange={(e) => setItemLabel(e.target.value)}
              placeholder={isAr ? 'مثال: حقيبة السفر الزرقاء' : 'e.g., Work Laptop Sleeve'}
              className="la-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAr ? 'الفئة' : 'Category'}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="la-input"
            >
              {ITEM_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {isAr ? c.nameAr : c.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAr ? 'ملاحظة آمنة تظهر للعاثر' : 'Safe Public Note for Finder'}
            </label>
            <textarea
              rows={2}
              maxLength={300}
              value={safeNote}
              onChange={(e) => setSafeNote(e.target.value)}
              placeholder={
                isAr ? 'مثال: يُرجى التواصل عبر لقيته فقط (بدون رقم هاتف)' : 'e.g., Please message me via LA2EETOH relay'
              }
              className="la-input"
            />
            {sensitiveCheck.hasSensitiveData && (
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                {isAr
                  ? 'تنبيه: سيتم إخفاء أرقام الهواتف أو الأرقام القومية تلقائياً لحماية خصوصيتك.'
                  : 'Note: Phone numbers and national IDs are automatically redacted for privacy.'}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={creating}
            className="la-btn-primary w-full"
          >
            {creating
              ? isAr
                ? 'جاري الإنشاء...'
                : 'Generating...'
              : isAr
                ? 'توليد رمز QR محمي'
                : 'Create Smart QR Tag'}
          </button>
        </form>

        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {smartTags.length === 0 ? (
            <div className="sm:col-span-2 la-card p-10 text-center text-sm text-slate-500">
              {isAr ? 'لم تقم بإنشاء أي رموز QR بعد.' : 'You have not created any Smart QR tags yet.'}
            </div>
          ) : (
            smartTags.map((tag) => {
              const scanUrl = `${window.location.origin}/tag/${tag.token}`;
              const qrImg = qrUrls[tag.token];
              return (
                <div
                  key={tag.token}
                  className="la-card-interactive p-5 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    {qrImg ? (
                      <img
                        src={qrImg}
                        alt={`QR for ${tag.itemLabel}`}
                        className="w-24 h-24 rounded-xl border border-slate-200 bg-white p-1 shrink-0 shadow-sm"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <QrCode className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {tag.itemLabel}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 truncate">{tag.token}</div>
                      <select
                        value={tag.status}
                        onChange={async (e) => {
                          try {
                            await updateSmartTagStatus(tag.token, e.target.value as SmartTag['status']);
                          } catch (err) {
                            setFeedback({
                              type: 'error',
                              text: formatFriendlyFirestoreError(err, isAr, 'Unable to update tag status.'),
                            });
                          }
                        }}
                        className="la-input mt-1 !py-1 !px-2.5 !text-xs"
                      >
                        <option value="active">{isAr ? 'نشط' : 'Active'}</option>
                        <option value="lost">{isAr ? 'مفقود' : 'Marked Lost'}</option>
                        <option value="found">{isAr ? 'تم العثور عليه' : 'Marked Found'}</option>
                        <option value="returned">{isAr ? 'مستعاد' : 'Returned'}</option>
                        <option value="deactivated">{isAr ? 'معطّل' : 'Deactivated'}</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {qrImg && (
                      <a
                        href={qrImg}
                        download={`${tag.token}.png`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isAr ? 'تحميل PNG' : 'Download PNG'}</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          if (navigator.clipboard?.writeText) {
                            await navigator.clipboard.writeText(scanUrl);
                          }
                          setFeedback({ type: 'success', text: isAr ? 'تم نسخ رابط الفحص.' : 'Scan link copied.' });
                        } catch {
                          setFeedback({
                            type: 'success',
                            text: isAr ? `رابط الفحص: ${scanUrl}` : `Scan link: ${scanUrl}`,
                          });
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-xs font-semibold text-blue-700 dark:text-blue-300"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{isAr ? 'نسخ الرابط' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
