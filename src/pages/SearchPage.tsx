import React, { useMemo, useState } from 'react';
import { Camera, Filter, Loader2, Search, ShieldAlert, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { t } from '../lib/i18n';
import { CascadingLocationSelector } from '../components/CascadingLocationSelector';
import { ReportCard } from '../components/ReportCard';
import { AdSlot } from '../components/AdSlot';
import {
  ITEM_CATEGORIES,
  ITEM_COLORS,
  calculateDistanceKm,
  findCity,
  findDistrict,
  findGovernorate,
} from '../utils/egyptLocations';
import { scoreReportMatch } from '../utils/sanitization';
import type { ReportType } from '../types';

const PAGE_SIZE = 9;

async function compressImageFile(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 900;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
      };
      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export const SearchPage: React.FC<{ defaultType?: ReportType | 'all' }> = ({ defaultType = 'all' }) => {
  const { lang, currentPath, reports, reportsLoading, userCoords } = useApp();
  const copy = t(lang);
  const isAr = lang === 'ar';

  const urlParams = useMemo(() => new URLSearchParams(currentPath.split('?')[1] || ''), [currentPath]);
  const initialQuery = urlParams.get('q') || '';
  const initialVisual = urlParams.get('visual') === '1';

  const [queryText, setQueryText] = useState(initialQuery);
  const [showLost, setShowLost] = useState(defaultType === 'all' || defaultType === 'lost');
  const [showFound, setShowFound] = useState(defaultType === 'all' || defaultType === 'found');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [governorateId, setGovernorateId] = useState('');
  const [cityId, setCityId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [maxDistanceKm, setMaxDistanceKm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'distance'>('newest');
  const [page, setPage] = useState(1);

  // AI Visual Search State
  const [showVisualPanel, setShowVisualPanel] = useState(initialVisual);
  const [visualLoading, setVisualLoading] = useState(false);
  const [visualError, setVisualError] = useState<string | null>(null);
  const [visualResult, setVisualResult] = useState<{
    itemSummary: string;
    category: string;
    color: string;
    brand?: string;
    keywords: string[];
    containsSensitiveDocumentWarning: boolean;
  } | null>(null);

  const handleVisualUpload = async (file: File) => {
    setVisualLoading(true);
    setVisualError(null);
    try {
      const { base64, mimeType } = await compressImageFile(file);
      const res = await fetch('/api/ai/visual-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType, lang }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVisualError(data.message || 'Visual search unavailable.');
      } else {
        setVisualResult(data);
        setPage(1);
      }
    } catch (err) {
      setVisualError(err instanceof Error ? err.message : 'Visual search failed.');
    } finally {
      setVisualLoading(false);
    }
  };

  const resetFilters = () => {
    setQueryText('');
    setShowLost(defaultType === 'all' || defaultType === 'lost');
    setShowFound(defaultType === 'all' || defaultType === 'found');
    setCategory('');
    setColor('');
    setBrand('');
    setGovernorateId('');
    setCityId('');
    setDistrictId('');
    setDateFilter('');
    setMaxDistanceKm('');
    setVisualResult(null);
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    const list = reports
      .filter((r) => {
        if (!showLost && r.type === 'lost') return false;
        if (!showFound && r.type === 'found') return false;
        if (category && r.category !== category) return false;
        if (color && r.color !== color) return false;
        if (brand && !(r.brand || '').toLowerCase().includes(brand.toLowerCase())) return false;
        if (governorateId && r.governorateId !== governorateId) return false;
        if (cityId && r.cityId !== cityId) return false;
        if (districtId && r.districtId !== districtId) return false;
        if (dateFilter && r.dateOccurred < dateFilter) return false;
        if (maxDistanceKm && userCoords) {
          const dist = calculateDistanceKm(userCoords.lat, userCoords.lng, r.publicLat, r.publicLng);
          if (dist > Number(maxDistanceKm)) return false;
        }
        if (q) {
          const gov = findGovernorate(r.governorateId);
          const city = findCity(r.governorateId, r.cityId);
          const dist = r.districtId ? findDistrict(r.governorateId, r.cityId, r.districtId) : undefined;
          const haystack = `${r.title} ${r.description} ${r.brand || ''} ${r.areaNote || ''} ${gov?.nameAr || ''} ${gov?.nameEn || ''} ${city?.nameAr || ''} ${city?.nameEn || ''} ${dist?.nameAr || ''} ${dist?.nameEn || ''}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .map((r) => {
        const visualScore = visualResult
          ? scoreReportMatch(
              {
                keywords: visualResult.keywords || [],
                category: visualResult.category,
                color: visualResult.color,
                brand: visualResult.brand,
              },
              r
            )
          : 0;
        const dist = userCoords
          ? calculateDistanceKm(userCoords.lat, userCoords.lng, r.publicLat, r.publicLng)
          : Infinity;
        return { report: r, visualScore, dist };
      });

    if (visualResult) {
      list.sort((a, b) => b.visualScore - a.visualScore);
    } else if (sortBy === 'distance' && userCoords) {
      list.sort((a, b) => a.dist - b.dist);
    } else {
      list.sort((a, b) => b.report.createdAtMs - a.report.createdAtMs);
    }
    return list;
  }, [
    reports,
    showLost,
    showFound,
    category,
    color,
    brand,
    governorateId,
    cityId,
    districtId,
    dateFilter,
    maxDistanceKm,
    userCoords,
    queryText,
    visualResult,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-7">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {defaultType === 'lost'
              ? isAr
                ? 'بلاغات المفقودات'
                : 'Lost Item Reports'
              : defaultType === 'found'
                ? isAr
                  ? 'بلاغات المعثورات'
                  : 'Found Item Reports'
                : isAr
                  ? 'نتائج البحث'
                  : 'Search Results'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {isAr ? 'ابحث عن المفقودات والمعثورات في جميع أنحاء مصر' : 'Find lost or found items across Egypt'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowVisualPanel((v) => !v)}
            className="la-btn-primary"
          >
            <Camera className="w-4 h-4" />
            <span>{isAr ? 'بحث بالصورة (AI)' : 'AI Visual Search'}</span>
          </button>
        </div>
      </div>

      {/* AI Visual Search Uploader */}
      {showVisualPanel && (
        <section className="la-card !border-violet-300/70 dark:!border-violet-500/35 p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                {isAr ? 'البحث البصري بالذكاء الاصطناعي' : 'AI Visual Item Matching'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {copy.common.aiDisclaimer}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowVisualPanel(false)}
              aria-label={copy.common.close}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <label className="cursor-pointer la-btn-secondary">
              {visualLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4 text-violet-600 dark:text-violet-400" />}
              <span>{visualLoading ? (isAr ? 'جاري التحليل...' : 'Analyzing...') : isAr ? 'اختر صورة الغرض' : 'Upload Item Photo'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleVisualUpload(file);
                }}
              />
            </label>

            {visualResult && (
              <div className="flex-1 text-xs bg-slate-50 dark:bg-slate-800/70 rounded-xl p-3 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="font-semibold text-slate-900 dark:text-white">{visualResult.itemSummary}</div>
                <div className="text-slate-600 dark:text-slate-400">
                  {visualResult.category} · {visualResult.color}
                  {visualResult.brand ? ` · ${visualResult.brand}` : ''}
                </div>
                {visualResult.containsSensitiveDocumentWarning && (
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold pt-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>
                      {isAr
                        ? 'تنبيه: لا ترفع مستندات رسمية كاملة علناً.'
                        : 'Warning: Do not upload complete identity or bank documents publicly.'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {visualError && (
            <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
              {visualError}
            </div>
          )}
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Filter Sidebar */}
        <aside className="lg:col-span-3 la-card p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{isAr ? 'تصفية النتائج' : 'Filters'}</span>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline transition-colors"
            >
              {copy.common.resetAll}
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isAr ? 'كلمات البحث' : 'Keyword'}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
              <input
                type="text"
                value={queryText}
                onChange={(e) => {
                  setQueryText(e.target.value);
                  setPage(1);
                }}
                placeholder={isAr ? 'اسم الغرض أو الوصف...' : 'Item name, brand...'}
                className="la-input !ps-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isAr ? 'النوع' : 'Type'}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLost}
                  onChange={(e) => {
                    setShowLost(e.target.checked);
                    setPage(1);
                  }}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span>{copy.common.lost}</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFound}
                  onChange={(e) => {
                    setShowFound(e.target.checked);
                    setPage(1);
                  }}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span>{copy.common.found}</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAr ? 'الفئة' : 'Category'}
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="la-input"
            >
              <option value="">{copy.common.allCategories}</option>
              {ITEM_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {isAr ? c.nameAr : c.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isAr ? 'الموقع الإداري' : 'Administrative Area'}
            </div>
            <CascadingLocationSelector
              governorateId={governorateId}
              cityId={cityId}
              districtId={districtId}
              allowAllOption
              layout="stack"
              onChange={(next) => {
                setGovernorateId(next.governorateId);
                setCityId(next.cityId);
                setDistrictId(next.districtId);
                setPage(1);
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAr ? 'من تاريخ' : 'From Date'}
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="la-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAr ? 'الماركة' : 'Brand'}
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => {
                setBrand(e.target.value);
                setPage(1);
              }}
              placeholder={isAr ? 'مثل: Apple, Samsonite' : 'e.g. Apple, Samsonite'}
              className="la-input"
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isAr ? 'اللون' : 'Color'}
            </div>
            <div className="flex flex-wrap gap-2">
              {ITEM_COLORS.map((c) => {
                const selected = color === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    title={isAr ? c.nameAr : c.nameEn}
                    aria-label={isAr ? c.nameAr : c.nameEn}
                    onClick={() => {
                      setColor(selected ? '' : c.id);
                      setPage(1);
                    }}
                    style={{ backgroundColor: c.hex }}
                    className={`w-6 h-6 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                      selected
                        ? 'border-blue-500 scale-110 ring-2 ring-blue-400/50 shadow-sm'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {userCoords && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'أقصى مسافة (كم)' : 'Max Distance (km)'}
              </label>
              <select
                value={maxDistanceKm}
                onChange={(e) => setMaxDistanceKm(e.target.value)}
                className="la-input"
              >
                <option value="">{isAr ? 'أي مسافة' : 'Any distance'}</option>
                <option value="5">5 km</option>
                <option value="15">15 km</option>
                <option value="50">50 km</option>
                <option value="200">200 km</option>
              </select>
            </div>
          )}

          <AdSlot placement="sidebar" />
        </aside>

        {/* Results Column */}
        <div className="lg:col-span-9 space-y-5">
          <div className="la-card flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
            <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
              {filtered.length} {isAr ? 'نتيجة مطابقة' : 'Results Found'}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <label htmlFor="sortSelect" className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'ترتيب:' : 'Sort:'}
              </label>
              <select
                id="sortSelect"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'distance')}
                className="la-input !w-auto !py-1.5 !text-xs font-medium"
              >
                <option value="newest">{isAr ? 'الأحدث أولاً' : 'Newest First'}</option>
                {userCoords && <option value="distance">{isAr ? 'الأقرب لموقعي' : 'Nearest First'}</option>}
              </select>
            </div>
          </div>

          {reportsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-72 rounded-2xl bg-slate-200 dark:bg-[#0D1529] animate-pulse shadow-lg"
                />
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="la-card p-10 text-center space-y-4">
              <p className="text-slate-600 dark:text-slate-400 font-medium">{copy.common.empty}</p>
              <button
                type="button"
                onClick={resetFilters}
                className="la-btn-primary"
              >
                {copy.common.resetAll}
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginated.map(({ report, visualScore }) => (
                  <div key={report.id} className="space-y-1.5">
                    {visualResult && visualScore > 0 && (
                      <div className="text-xs font-semibold text-violet-700 dark:text-violet-300 tabular-nums">
                        {isAr ? `تطابق بصري محتمل: ${visualScore}%` : `AI Visual Similarity: ${visualScore}%`}
                      </div>
                    )}
                    <ReportCard report={report} />
                  </div>
                ))}
              </div>

              {/* Clearly separated Ad placement after organic results */}
              <AdSlot placement="search" />

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="la-btn-secondary !px-3.5 !py-1.5 !text-xs"
                  >
                    {copy.common.back}
                  </button>
                  <span className="text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-400">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="la-btn-secondary !px-3.5 !py-1.5 !text-xs"
                  >
                    {copy.common.next}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
