import React, { useMemo, useState } from 'react';
import { Flame, LocateFixed, MapPin, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { t } from '../lib/i18n';
import { CascadingLocationSelector } from '../components/CascadingLocationSelector';
import { EgyptGoogleMap } from '../components/EgyptGoogleMap';
import {
  ITEM_CATEGORIES,
  calculateDistanceKm,
  findGovernorate,
} from '../utils/egyptLocations';
import type { ItemReport } from '../types';

export const MapPage: React.FC = () => {
  const { lang, reports, navigate, userCoords, setUserCoords } = useApp();
  const copy = t(lang);
  const isAr = lang === 'ar';

  const [typeFilter, setTypeFilter] = useState<'all' | 'lost' | 'found'>('all');
  const [category, setCategory] = useState('');
  const [governorateId, setGovernorateId] = useState('');
  const [cityId, setCityId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [centerOverride, setCenterOverride] = useState<{ lat: number; lng: number; zoom?: number } | undefined>(
    undefined
  );

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (r.visibility !== 'public') return false;
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      if (category && r.category !== category) return false;
      if (governorateId && r.governorateId !== governorateId) return false;
      if (cityId && r.cityId !== cityId) return false;
      if (districtId && r.districtId !== districtId) return false;
      if (dateFrom && r.dateOccurred < dateFrom) return false;
      return true;
    });
  }, [reports, typeFilter, category, governorateId, cityId, districtId, dateFrom]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setCenterOverride({ ...coords, zoom: 12 });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSelectReport = (report: ItemReport) => {
    setSelectedReportId(report.id);
    setCenterOverride({ lat: report.publicLat, lng: report.publicLng, zoom: 13 });
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {isAr ? 'خريطة المفقودات والمعثورات في مصر' : 'Interactive Egypt Lost & Found Map'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {isAr
              ? 'استكشف البلاغات عبر ٢٧ محافظة أو فعّل وضع الخريطة الحرارية للمناطق عالية التكرار.'
              : 'Explore privacy-protected item pins across all 27 Egyptian governorates or toggle aggregate Heatmap mode.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleDetectLocation}
            className="la-btn-secondary !px-3.5 !py-2 !text-xs"
          >
            <LocateFixed className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{isAr ? 'تحديد موقعي لحساب المسافة' : 'Near My Location'}</span>
          </button>

          <button
            type="button"
            onClick={() => setHeatmapMode((v) => !v)}
            aria-pressed={heatmapMode}
            className={heatmapMode ? 'la-btn-primary !px-3.5 !py-2 !text-xs' : 'la-btn-secondary !px-3.5 !py-2 !text-xs'}
          >
            <Flame className="w-4 h-4" />
            <span>{isAr ? 'وضع الخريطة الحرارية' : 'Heatmap Mode'}</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="la-card p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 items-end">
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAr ? 'نوع البلاغ' : 'Report Type'}
            </span>
            <div className="grid grid-cols-3 rounded-xl border border-slate-200/90 dark:border-white/[0.11] overflow-hidden bg-slate-50 dark:bg-[#080F24]">
              {(['all', 'lost', 'found'] as const).map((tVal) => (
                <button
                  key={tVal}
                  type="button"
                  onClick={() => setTypeFilter(tVal)}
                  className={`py-2.5 text-xs font-semibold transition-all duration-200 ${
                    typeFilter === tVal
                      ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  {tVal === 'all' ? (isAr ? 'الكل' : 'All') : tVal === 'lost' ? copy.common.lost : copy.common.found}
                </button>
              ))}
            </div>
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
              <option value="">{copy.common.allCategories}</option>
              {ITEM_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {isAr ? c.nameAr : c.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAr ? 'من تاريخ' : 'From Date'}
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="la-input"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setTypeFilter('all');
                setCategory('');
                setGovernorateId('');
                setCityId('');
                setDistrictId('');
                setDateFrom('');
                setCenterOverride({ lat: 30.0444, lng: 31.2357, zoom: 6 });
              }}
              className="la-btn-secondary w-full md:w-auto !py-2.5 !text-xs"
            >
              {copy.common.resetAll}
            </button>
          </div>
        </div>

        <CascadingLocationSelector
          governorateId={governorateId}
          cityId={cityId}
          districtId={districtId}
          allowAllOption
          onChange={(next) => {
            setGovernorateId(next.governorateId);
            setCityId(next.cityId);
            setDistrictId(next.districtId);
            if (next.lat && next.lng) {
              setCenterOverride({ lat: next.lat, lng: next.lng, zoom: next.districtId ? 13 : next.cityId ? 12 : 10 });
            }
          }}
        />
      </div>

      {/* Synchronized Split View: List + Interactive Google Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Synchronized List */}
        <aside className="lg:col-span-4 la-card overflow-hidden flex flex-col max-h-[580px]">
          <div className="px-4 py-3.5 border-b border-slate-200/85 dark:border-white/[0.08] flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
              {filteredReports.length} {isAr ? 'نتيجة على الخريطة' : 'Map Results'}
            </span>
            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                {copy.common.lost}
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                {copy.common.found}
              </span>
            </div>
          </div>

          <div className="overflow-y-auto la-scroll divide-y divide-slate-100 dark:divide-white/[0.06] flex-1">
            {filteredReports.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">{copy.common.empty}</div>
            ) : (
              filteredReports.map((r) => {
                const gov = findGovernorate(r.governorateId);
                const selected = r.id === selectedReportId;
                const distKm = userCoords
                  ? calculateDistanceKm(userCoords.lat, userCoords.lng, r.publicLat, r.publicLng)
                  : null;
                return (
                  <div
                    key={r.id}
                    className={`p-3.5 transition-all duration-200 ${
                      selected ? 'bg-blue-50/80 dark:bg-blue-950/40' : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectReport(r)}
                      className="w-full text-start space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            r.type === 'lost'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                          }`}
                        >
                          {r.type === 'lost' ? copy.common.lost : copy.common.found}
                        </span>
                        <span className="text-[11px] text-slate-500 tabular-nums">{r.dateOccurred}</span>
                      </div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{r.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          {gov ? (isAr ? gov.nameAr : gov.nameEn) : r.governorateId}
                          {r.areaNote ? ` · ${r.areaNote}` : ''}
                        </span>
                      </div>
                      {distKm !== null && (
                        <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                          ~{distKm} {copy.common.kmAway}
                        </div>
                      )}
                    </button>
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => navigate(`/report/${r.id}`)}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {copy.common.viewDetails}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Map Canvas */}
        <div className="lg:col-span-8 space-y-3">
          <EgyptGoogleMap
            mode="explore"
            reports={filteredReports}
            selectedReportId={selectedReportId}
            onSelectReport={handleSelectReport}
            onNavigateReport={(id) => navigate(`/report/${id}`)}
            heatmapMode={heatmapMode}
            centerOverride={centerOverride}
            heightClassName="h-[520px]"
          />

          <div className="la-card px-4 py-3.5 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <span>
              {isAr
                ? 'لحماية الخصوصية، البلاغات التي اختار أصحابها «الموقع العام التقريبي» تظهر في نطاق جغرافي تقريبي (~١.٥ كم) دون كشف عنوان المنزل أو موقع الأغراض الثمينة بدقة.'
                : 'To protect safety and privacy, reports set to Approximate Public Location snap pins to a ~1.5 km area cell and never expose exact residential addresses or high-value found spots.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
