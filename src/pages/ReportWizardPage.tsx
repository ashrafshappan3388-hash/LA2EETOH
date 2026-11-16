import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ImagePlus,
  Loader2,
  Lock,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { t } from '../lib/i18n';
import { CascadingLocationSelector } from '../components/CascadingLocationSelector';
import { EgyptGoogleMap } from '../components/EgyptGoogleMap';
import {
  ITEM_CATEGORIES,
  ITEM_COLORS,
  findGovernorate,
} from '../utils/egyptLocations';
import {
  computeDuplicateSimilarity,
  detectSensitiveDocumentPatterns,
} from '../utils/sanitization';
import { validateReportPayload } from '../utils/validation';
import type { ReportType } from '../types';

async function compressUploadPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 960;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas unsupported'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = () => reject(new Error('Invalid image'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsDataURL(file);
  });
}

export const ReportWizardPage: React.FC<{ reportType: ReportType }> = ({ reportType }) => {
  const {
    lang,
    user,
    reports,
    createReport,
    navigate,
    signInWithGoogle,
    aiDraft,
    setAiDraft,
  } = useApp();
  const copy = t(lang);
  const isAr = lang === 'ar';

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('wallets-bags');
  const [color, setColor] = useState('black');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [dateOccurred, setDateOccurred] = useState(() => new Date().toISOString().slice(0, 10));
  const [timeApprox, setTimeApprox] = useState('12:00');
  const [documentKind, setDocumentKind] = useState('');
  const [verificationQuestion, setVerificationQuestion] = useState('');

  const [governorateId, setGovernorateId] = useState('cairo');
  const [cityId, setCityId] = useState('nasr-city');
  const [districtId, setDistrictId] = useState('');
  const [areaNote, setAreaNote] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 30.0511, lng: 31.3656 });
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [locationPrivacy, setLocationPrivacy] = useState<'exact' | 'approximate'>('approximate');

  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (aiDraft) {
      if (aiDraft.title) setTitle(aiDraft.title);
      if (aiDraft.category) setCategory(aiDraft.category);
      if (aiDraft.color) setColor(aiDraft.color);
      if (aiDraft.brand) setBrand(aiDraft.brand);
      if (aiDraft.description) setDescription(aiDraft.description);
      if (aiDraft.governorateId) {
        const g = findGovernorate(aiDraft.governorateId);
        if (g) {
          setGovernorateId(g.id);
          setCityId(g.cities[0]?.id || '');
          setCoords({ lat: g.lat, lng: g.lng });
        }
      }
      setAiDraft(null);
    }
  }, [aiDraft, setAiDraft]);

  const isDocumentCategory = category === 'documents';
  const sensitiveScan = useMemo(
    () => detectSensitiveDocumentPatterns(`${title} ${description} ${areaNote}`),
    [title, description, areaNote]
  );

  // Duplicate report detection against existing reports
  const potentialDuplicates = useMemo(() => {
    if (title.trim().length < 3) return [];
    return reports
      .filter((r) => r.status === 'open')
      .map((r) => ({
        report: r,
        score: computeDuplicateSimilarity(
          {
            type: reportType,
            title,
            description,
            category,
            color,
            brand,
            governorateId,
            cityId,
            dateOccurred,
          },
          r
        ),
      }))
      .filter((x) => x.score >= 0.65)
      .slice(0, 3);
  }, [reports, reportType, title, description, category, color, brand, governorateId, cityId, dateOccurred]);

  const handlePhotoSelect = async (files: FileList | null) => {
    if (!files) return;
    const remaining = Math.max(0, 5 - photos.length);
    const slice = Array.from(files).slice(0, remaining);
    try {
      const compressed = await Promise.all(slice.map(compressUploadPhoto));
      setPhotos((prev) => [...prev, ...compressed].slice(0, 5));
    } catch {
      setErrorMsg(isAr ? 'تعذر معالجة إحدى الصور.' : 'Could not process one of the selected images.');
    }
  };

  const handlePublish = async () => {
    setErrorMsg(null);
    const check = validateReportPayload({
      type: reportType,
      title,
      category,
      color,
      brand,
      description,
      governorateId,
      cityId,
      districtId,
      dateOccurred,
      lat: coords.lat,
      lng: coords.lng,
    });
    if (!check.valid) {
      setErrorMsg(check.errors.join(' '));
      return;
    }

    setSubmitting(true);
    try {
      const id = await createReport({
        type: reportType,
        title,
        description,
        category,
        color,
        brand,
        governorateId,
        cityId,
        districtId,
        areaNote,
        lat: coords.lat,
        lng: coords.lng,
        locationPrivacy,
        dateOccurred,
        timeApprox,
        isSensitiveDocument: isDocumentCategory || sensitiveScan.hasSensitiveData,
        documentKind,
        verificationQuestion,
        photoUrls: photos,
      });
      navigate(`/report/${id}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to publish report.');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { num: 1 as const, label: isAr ? 'تفاصيل الغرض' : 'Item Details' },
    { num: 2 as const, label: isAr ? 'الموقع والخصوصية' : 'Location' },
    { num: 3 as const, label: isAr ? 'الصور' : 'Photos' },
    { num: 4 as const, label: isAr ? 'المراجعة والنشر' : 'Review' },
  ];

  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-7">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {reportType === 'lost'
            ? isAr
              ? 'الإبلاغ عن غرض مفقود'
              : 'Report a Lost Item'
            : isAr
              ? 'الإبلاغ عن غرض معثور عليه'
              : 'Report a Found Item'}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {isAr
            ? 'أدخل تفاصيل دقيقة دون نشر بيانات شخصية أو أرقام مستندات حساسة.'
            : 'Provide accurate identifying details while keeping personal contacts and full document IDs private.'}
        </p>
      </div>

      {/* 4-Step Progress Bar */}
      <div className="la-card grid grid-cols-4 gap-2 p-2.5">
        {steps.map((s) => {
          const active = step === s.num;
          const done = step > s.num;
          return (
            <button
              key={s.num}
              type="button"
              onClick={() => setStep(s.num)}
              className={`flex items-center justify-center gap-2 py-2.5 px-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-600/20'
                  : done
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-black/15 flex items-center justify-center text-xs tabular-nums">
                {done ? <Check className="w-3.5 h-3.5" /> : s.num}
              </span>
              <span className="hidden sm:inline truncate">{s.label}</span>
            </button>
          );
        })}
      </div>

      {!user && (
        <div className="rounded-2xl border border-blue-200/80 dark:border-blue-500/25 bg-blue-50 dark:bg-blue-950/35 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="text-sm text-blue-900 dark:text-blue-200">{copy.common.signInRequired}</div>
          <button
            type="button"
            onClick={() => signInWithGoogle()}
            className="la-btn-primary !px-4 !py-2 !text-xs"
          >
            {isAr ? 'تسجيل الدخول عبر Google' : 'Sign in with Google'}
          </button>
        </div>
      )}

      {/* Main Form Card (Zero ads inside forms) */}
      <div className="la-card p-6 sm:p-7 space-y-6">
        {step === 1 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? 'اسم الغرض *' : 'Item Name *'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  placeholder={isAr ? 'مثال: حقيبة ظهر سوداء' : 'e.g. Black Commuter Backpack'}
                  className="la-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? 'الفئة *' : 'Category *'}
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
            </div>

            {(isDocumentCategory || sensitiveScan.hasSensitiveData) && (
              <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>
                    {isAr
                      ? 'وضع المستندات الطارئ — حماية البيانات الحساسة'
                      : 'Emergency Document Mode — Sensitive Data Protection'}
                  </span>
                </div>
                <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                  {isAr
                    ? 'لا تكتب الرقم القومي (١٤ رقم) أو رقم البطاقة البنكية أو الباركود أو تاريخ الميلاد الكامل أو عنوان السكن. يقوم لقيته تلقائياً بحجب الأرقام الحساسة في البلاغ العام.'
                    : 'Never publish full 14-digit National ID numbers, bank card numbers, barcodes, full birthdates, or home addresses. LA2EETOH automatically redacts sensitive numbers from public listings.'}
                </p>
                {isDocumentCategory && (
                  <div>
                    <label className="block text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">
                      {isAr ? 'نوع الوثيقة' : 'Document Type'}
                    </label>
                    <select
                      value={documentKind}
                      onChange={(e) => setDocumentKind(e.target.value)}
                      className="rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm"
                    >
                      <option value="">{isAr ? 'اختر نوع الوثيقة' : 'Select document kind'}</option>
                      <option value="national_id">{isAr ? 'بطاقة رقم قومي' : 'National ID Card'}</option>
                      <option value="passport">{isAr ? 'جواز سفر' : 'Passport'}</option>
                      <option value="driving_license">{isAr ? 'رخصة قيادة' : 'Driving License'}</option>
                      <option value="bank_card">{isAr ? 'بطاقة بنكية' : 'Bank / Debit Card'}</option>
                      <option value="certificate">{isAr ? 'شهادة رسمية' : 'Official Certificate'}</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? 'الماركة (اختياري)' : 'Brand (Optional)'}
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  maxLength={80}
                  placeholder={isAr ? 'مثال: Samsung / Zara' : 'e.g. Samsung / Zara'}
                  className="la-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? 'التاريخ *' : 'Date *'}
                </label>
                <input
                  type="date"
                  value={dateOccurred}
                  onChange={(e) => setDateOccurred(e.target.value)}
                  className="la-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? 'الوقت التقريبي' : 'Approximate Time'}
                </label>
                <input
                  type="time"
                  value={timeApprox}
                  onChange={(e) => setTimeApprox(e.target.value)}
                  className="la-input"
                />
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {isAr ? 'اللون الأساسي *' : 'Primary Color *'}
              </div>
              <div className="flex flex-wrap gap-2">
                {ITEM_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                      color === c.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-sm'
                        : 'border-slate-200 dark:border-white/[0.10] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-white/20"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{isAr ? c.nameAr : c.nameEn}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'الوصف وعلامات التمييز *' : 'Description & Identifying Marks *'}
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                placeholder={
                  isAr
                    ? 'اذكر مواصفات عامة مميزة تساعد على التعرف على الغرض دون نشر أرقام سرية...'
                    : 'Describe distinguishing features, stickers, or pouch contents without exposing private numbers...'
                }
                className="la-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr
                  ? 'سؤال التحقق الخاص (لا يظهر علناً)'
                  : 'Private Ownership Verification Clue (Hidden from public)'}
              </label>
              <input
                type="text"
                value={verificationQuestion}
                onChange={(e) => setVerificationQuestion(e.target.value)}
                maxLength={200}
                placeholder={
                  isAr
                    ? 'مثال: ما نوع البطاقة الموجودة داخل الجيب الداخلي؟'
                    : 'e.g. What card or engraving is inside the inner pocket?'
                }
                className="la-input"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <CascadingLocationSelector
              governorateId={governorateId}
              cityId={cityId}
              districtId={districtId}
              showGpsButton
              onChange={(next) => {
                setGovernorateId(next.governorateId);
                setCityId(next.cityId);
                setDistrictId(next.districtId);
                if (next.lat && next.lng) {
                  setCoords({ lat: next.lat, lng: next.lng });
                  setGpsAccuracy(null);
                }
              }}
              onGpsDetected={(gps) => {
                setCoords({ lat: gps.lat, lng: gps.lng });
                setGpsAccuracy(gps.accuracyMeters);
              }}
            />

            {gpsAccuracy !== null && (
              <div className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                {isAr
                  ? `دقة GPS المقدرة: ±${gpsAccuracy} متر. يرجى تأكيد الدبوس على الخريطة.`
                  : `Estimated GPS accuracy: ±${gpsAccuracy}m. Confirm the pin below before proceeding.`}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'علامة مميزة أو اسم الشارع / المحطة' : 'Landmark or Nearby Street / Station'}
              </label>
              <input
                type="text"
                value={areaNote}
                onChange={(e) => setAreaNote(e.target.value)}
                maxLength={160}
                placeholder={isAr ? 'مثال: بجوار محطة مترو الدقي' : 'e.g. Near Dokki Metro Exit'}
                className="la-input"
              />
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/80 dark:bg-[#080F24] p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{isAr ? 'خصوصية الموقع العام' : 'Location Display Privacy'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLocationPrivacy('approximate')}
                  className={`p-3.5 rounded-xl border text-start text-xs transition-all duration-200 ${
                    locationPrivacy === 'approximate'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 shadow-sm'
                      : 'border-slate-200 dark:border-white/[0.10] hover:bg-white dark:hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="font-bold">{copy.common.approximateArea}</div>
                  <div className="opacity-80 mt-0.5">
                    {isAr
                      ? 'موصى به: يخفي الموقع الدقيق ويعرض نطاق ~١.٥ كم فقط.'
                      : 'Recommended: Hides exact spot and displays a ~1.5 km public radius.'}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setLocationPrivacy('exact')}
                  className={`p-3.5 rounded-xl border text-start text-xs transition-all duration-200 ${
                    locationPrivacy === 'exact'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 shadow-sm'
                      : 'border-slate-200 dark:border-white/[0.10] hover:bg-white dark:hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="font-bold">{copy.common.exactArea}</div>
                  <div className="opacity-80 mt-0.5">
                    {isAr
                      ? 'مناسب للأماكن العامة كالمولات ومحطات القطار.'
                      : 'Best for public landmarks like malls, metro stations, or campuses.'}
                  </div>
                </button>
              </div>
            </div>

            <EgyptGoogleMap
              mode="picker"
              pickerCoords={coords}
              centerOverride={{ lat: coords.lat, lng: coords.lng, zoom: 13 }}
              onPickerChange={(next) => {
                setCoords({ lat: next.lat, lng: next.lng });
                if (next.resolvedAddress && !areaNote) {
                  setAreaNote(next.resolvedAddress.slice(0, 140));
                }
              }}
              heightClassName="h-[360px]"
            />

            <div className="text-xs text-slate-500 tabular-nums">
              {isAr ? 'الإحداثيات المختارة:' : 'Selected Coordinates:'} {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            {isDocumentCategory && (
              <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 text-xs text-amber-900 dark:text-amber-200">
                {isAr
                  ? 'تنبيه أمان المستندات: لا ترفع صورة واضحة لبطاقة الرقم القومي أو جواز السفر أو البطاقة البنكية. يمكنك نشر البلاغ بدون صور أو بصورة غلاف المحفظة فقط.'
                  : 'Document Safety Notice: Never upload unredacted photos of National IDs, passports, or bank cards. You may publish without photos or upload only the wallet/sleeve cover.'}
              </div>
            )}

            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 cursor-pointer hover:border-blue-500 transition-colors bg-slate-50 dark:bg-slate-950/50">
              <ImagePlus className="w-8 h-8 text-blue-600" />
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {isAr ? 'اسحب الصور هنا أو اضغط للاختيار (بحد أقصى ٥ صور)' : 'Upload up to 5 photos (JPEG, PNG, WebP)'}
              </div>
              <div className="text-xs text-slate-500">
                {isAr ? 'يتم ضغط الصور تلقائياً لسرعة التحميل' : 'Images are automatically compressed for fast loading'}
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={(e) => handlePhotoSelect(e.target.files)}
              />
            </label>

            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {photos.map((src, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-square">
                    <img src={src} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      aria-label={`Remove photo ${idx + 1}`}
                      onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1.5 end-1.5 p-1 rounded-lg bg-red-600 text-white"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            {potentialDuplicates.length > 0 && (
              <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4" />
                  <span>
                    {isAr ? 'تم رصد بلاغات مشابهة حالياً' : 'Similar Active Reports Detected'}
                  </span>
                </div>
                <ul className="space-y-1 text-xs">
                  {potentialDuplicates.map(({ report, score }) => (
                    <li key={report.id} className="flex items-center justify-between gap-2">
                      <span className="font-medium">{report.title}</span>
                      <button
                        type="button"
                        onClick={() => navigate(`/report/${report.id}`)}
                        className="text-blue-600 dark:text-blue-400 underline tabular-nums"
                      >
                        {Math.round(score * 100)}% · {copy.common.viewDetails}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-slate-50 dark:bg-slate-950/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-xs text-slate-500">{isAr ? 'النوع والعنوان' : 'Type & Title'}</div>
                <div className="font-bold text-slate-900 dark:text-white">
                  {reportType === 'lost' ? copy.common.lost : copy.common.found} · {title || '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">{isAr ? 'المحافظة والتاريخ' : 'Location & Date'}</div>
                <div className="font-semibold text-slate-900 dark:text-white">
                  {findGovernorate(governorateId)?.[isAr ? 'nameAr' : 'nameEn']} · {dateOccurred}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs text-slate-500">{isAr ? 'الوصف' : 'Description'}</div>
                <div className="text-slate-700 dark:text-slate-300 mt-0.5">{description || '—'}</div>
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {errorMsg}
              </div>
            )}
          </div>
        )}

        {/* Step Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200/85 dark:border-white/[0.08]">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : 1))}
            className="la-btn-secondary"
          >
            {copy.common.back}
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s < 4 ? ((s + 1) as 1 | 2 | 3 | 4) : 4))}
              className="la-btn-primary !px-6"
            >
              {copy.common.next}
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting || !user}
              onClick={handlePublish}
              className="la-btn-primary !px-6 !font-bold"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{copy.common.publish}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
