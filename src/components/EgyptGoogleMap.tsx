import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { AlertTriangle, MapPin, Navigation, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ItemReport } from '../types';
import { EGYPT_GOVERNORATES, calculateDistanceKm, findGovernorate } from '../utils/egyptLocations';
import { ErrorBoundary } from './ErrorBoundary';

const MAPS_LIBRARIES: string[] = ['places', 'marker'];

export const GoogleMapsRootProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { lang, mapsApiKey, setMapsLoadError, setMapsQuotaExceeded } = useApp();
  const initialLangRef = useRef(lang);

  if (!mapsApiKey) {
    return <>{children}</>;
  }

  return (
    <APIProvider
      apiKey={mapsApiKey}
      language={initialLangRef.current}
      region="EG"
      libraries={MAPS_LIBRARIES}
      onError={(err) => {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('OverQuota') || msg.includes('429') || msg.includes('Quota')) {
          setMapsQuotaExceeded(true);
        } else {
          setMapsLoadError(true);
        }
      }}
    >
      {children}
    </APIProvider>
  );
};

interface EgyptGoogleMapProps {
  mode: 'explore' | 'picker';
  reports?: ItemReport[];
  selectedReportId?: string | null;
  onSelectReport?: (report: ItemReport) => void;
  onNavigateReport?: (reportId: string) => void;
  pickerCoords?: { lat: number; lng: number };
  onPickerChange?: (coords: { lat: number; lng: number; resolvedAddress?: string }) => void;
  heatmapMode?: boolean;
  centerOverride?: { lat: number; lng: number; zoom?: number };
  heightClassName?: string;
}

const PlacesSearchBox: React.FC<{
  onPlacePicked: (coords: { lat: number; lng: number; label: string }) => void;
}> = ({ onPlacePicked }) => {
  const { lang, setMapsQuotaExceeded } = useApp();
  const isAr = lang === 'ar';
  const placesLib = useMapsLibrary('places');
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const [queryText, setQueryText] = useState('');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (
      !placesLib ||
      typeof placesLib.AutocompleteSuggestion?.fetchAutocompleteSuggestions !== 'function' ||
      queryText.trim().length < 2
    ) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        if (!sessionTokenRef.current && typeof placesLib.AutocompleteSessionToken === 'function') {
          sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
        }
        setSearching(true);
        const res = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: queryText.trim(),
          includedRegionCodes: ['eg'],
          language: lang,
          ...(sessionTokenRef.current ? { sessionToken: sessionTokenRef.current } : {}),
        });
        if (!cancelled) {
          setSuggestions(Array.isArray(res?.suggestions) ? res.suggestions : []);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('OVER_QUERY_LIMIT') || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
          setMapsQuotaExceeded(true);
        }
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 260);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [placesLib, queryText, lang, setMapsQuotaExceeded]);

  const runGeocodeQuery = async (addressText: string) => {
    const clean = addressText.trim();
    if (!clean) return;
    try {
      const res = await fetch(`/api/maps/geocode?address=${encodeURIComponent(clean)}&lang=${lang}`);
      if (res.status === 429) {
        setMapsQuotaExceeded(true);
        return;
      }
      if (!res.ok) return;
      const data = (await res.json()) as {
        results?: { location?: { latitude: number; longitude: number }; formattedAddress?: string }[];
      };
      const first = data.results?.[0];
      if (first?.location) {
        setSuggestions([]);
        onPlacePicked({
          lat: first.location.latitude,
          lng: first.location.longitude,
          label: first.formattedAddress || clean,
        });
      }
    } catch {
      // ignore transient network errors
    }
  };

  const handleSelectSuggestion = async (s: google.maps.places.AutocompleteSuggestion) => {
    const prediction = s.placePrediction;
    if (!prediction) return;
    const fallbackLabel = prediction.text?.text || queryText;

    try {
      if (typeof prediction.toPlace === 'function') {
        const place = prediction.toPlace();
        await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] });
        sessionTokenRef.current = null;
        setSuggestions([]);
        const loc = place.location;
        if (loc && typeof loc.lat === 'function' && typeof loc.lng === 'function') {
          const label = place.formattedAddress || (typeof place.displayName === 'string' ? place.displayName : fallbackLabel);
          setQueryText(label);
          onPlacePicked({ lat: loc.lat(), lng: loc.lng(), label });
          return;
        }
      }
      await runGeocodeQuery(fallbackLabel);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
        setMapsQuotaExceeded(true);
        return;
      }
      await runGeocodeQuery(fallbackLabel);
    }
  };

  const handleGeocodeFallback = async (e: React.FormEvent) => {
    e.preventDefault();
    await runGeocodeQuery(queryText);
  };

  return (
    <div className="relative z-20">
      <form onSubmit={handleGeocodeFallback} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder={
              isAr
                ? 'ابحث عن شارع، محطة مترو، مول، أو معلم في مصر...'
                : 'Search street, metro station, mall, or landmark in Egypt...'
            }
            className="la-input !ps-10"
          />
        </div>
        <button
          type="submit"
          className="la-btn-primary !px-4 !py-2 !text-xs"
        >
          {searching ? '...' : isAr ? 'تحديد' : 'Locate'}
        </button>
      </form>

      {suggestions.length > 0 && (
        <ul className="absolute mt-1.5 inset-x-0 bg-white dark:bg-[#0D1529] border border-slate-200/90 dark:border-white/[0.10] rounded-2xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06]">
          {suggestions.map((s, idx) => {
            const label = s.placePrediction?.text?.text;
            if (!label) return null;
            return (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => handleSelectSuggestion(s)}
                  className="w-full text-start px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.05] flex items-center gap-2 transition-colors duration-150"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

const ExploreReportMarker: React.FC<{
  report: ItemReport;
  isActive: boolean;
  isAr: boolean;
  userCoords: { lat: number; lng: number } | null;
  onSelect: (report: ItemReport) => void;
  onClose: () => void;
  onNavigateReport?: (id: string) => void;
}> = ({ report, isActive, isAr, userCoords, onSelect, onClose, onNavigateReport }) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const isLost = report.type === 'lost';

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: report.publicLat, lng: report.publicLng }}
        onClick={() => onSelect(report)}
      >
        <Pin
          background={isLost ? '#DC2626' : '#16A34A'}
          borderColor={isLost ? '#991B1B' : '#14532D'}
          glyphColor="#FFFFFF"
        />
      </AdvancedMarker>

      {isActive && marker && (
        <InfoWindow anchor={marker} onCloseClick={onClose}>
          <div className="min-w-[200px] max-w-[240px] p-1 text-slate-900">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                  isLost ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {isLost ? (isAr ? 'مفقود' : 'Lost') : isAr ? 'معثور عليه' : 'Found'}
              </span>
              {userCoords && (
                <span className="text-[11px] text-slate-500 tabular-nums">
                  ~{calculateDistanceKm(userCoords.lat, userCoords.lng, report.publicLat, report.publicLng)} km
                </span>
              )}
            </div>
            <h4 className="font-bold text-sm text-slate-900 mb-0.5 line-clamp-1">{report.title}</h4>
            <p className="text-xs text-slate-600 mb-2">
              {findGovernorate(report.governorateId)?.[isAr ? 'nameAr' : 'nameEn']}
              {report.areaNote ? ` · ${report.areaNote}` : ''}
            </p>
            <button
              type="button"
              onClick={() => onNavigateReport?.(report.id)}
              className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
            >
              {isAr ? 'عرض التفاصيل' : 'View Details'}
            </button>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

const GovernorateFallbackView: React.FC<{
  mode: 'explore' | 'picker';
  reports: ItemReport[];
  isAr: boolean;
  heightClassName: string;
  loadError: boolean;
  onPickerChange?: (coords: { lat: number; lng: number; resolvedAddress?: string }) => void;
  onSelectReport?: (report: ItemReport) => void;
}> = ({ mode, reports, isAr, heightClassName, loadError, onPickerChange, onSelectReport }) => (
  <div
    className={`rounded-2xl border border-amber-300/80 dark:border-amber-700/60 bg-amber-50/80 dark:bg-amber-950/30 p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-lg ${heightClassName}`}
  >
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-sm">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>
          {loadError
            ? isAr
              ? 'تعذر تحميل خريطة Google التفاعلية — الوضع البديل للمحافظات مفعّل'
              : 'Google Interactive Map Unavailable — Governorate Explorer Active'
            : isAr
              ? 'مطلوب تفعيل مفتاح Google Maps Platform للخريطة التفاعلية الكاملة'
              : 'Google Maps Platform API Key Required for Live Interactive Map'}
        </span>
      </div>
      <p className="text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
        {loadError
          ? isAr
            ? 'لا يزال بإمكانك اختيار أي من محافظات مصر الـ ٢٧ وتحديد الإحداثيات الإدارية بدقة.'
            : 'All 27 Egyptian governorates, cascading district selectors, and coordinate selections remain fully active below.'
          : isAr
            ? 'قم بتعيين VITE_GOOGLE_MAPS_API_KEY في متغيرات البيئة (Settings > Secrets). لا تزال المحددات الإدارية الهرمية لـ ٢٧ محافظة وإحداثيات الموقع تعمل بالكامل.'
            : 'Configure VITE_GOOGLE_MAPS_API_KEY in environment secrets (restricted to Maps JavaScript API, Places API New, and Geocoding API). All 27 Egyptian governorates and coordinate selections remain active below.'}
      </p>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 overflow-y-auto la-scroll max-h-64 pe-1">
      {EGYPT_GOVERNORATES.map((g) => {
        const count = reports.filter((r) => r.governorateId === g.id).length;
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => {
              if (mode === 'picker') {
                onPickerChange?.({ lat: g.lat, lng: g.lng, resolvedAddress: isAr ? g.nameAr : g.nameEn });
              } else if (count > 0) {
                const first = reports.find((r) => r.governorateId === g.id);
                if (first) onSelectReport?.(first);
              }
            }}
            className="text-start p-2.5 rounded-xl border border-slate-200/90 dark:border-white/[0.10] bg-white dark:bg-[#0D1529] hover:border-blue-500/50 hover:shadow-md text-xs transition-all duration-200"
          >
            <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
              {isAr ? g.nameAr : g.nameEn}
            </div>
            <div className="text-[11px] text-slate-500 tabular-nums">
              {mode === 'picker' ? `${g.lat.toFixed(2)}, ${g.lng.toFixed(2)}` : `${count} ${isAr ? 'بلاغ' : 'items'}`}
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

export const EgyptGoogleMap: React.FC<EgyptGoogleMapProps> = ({
  mode,
  reports = [],
  selectedReportId,
  onSelectReport,
  onNavigateReport,
  pickerCoords,
  onPickerChange,
  heatmapMode = false,
  centerOverride,
  heightClassName = 'h-[480px]',
}) => {
  const { lang, mapsApiKey, mapsLoadError, userCoords, setMapsQuotaExceeded, setMapsLoadError } = useApp();
  const isAr = lang === 'ar';

  const initialLat = centerOverride?.lat ?? pickerCoords?.lat ?? 30.0444;
  const initialLng = centerOverride?.lng ?? pickerCoords?.lng ?? 31.2357;
  const initialZoom = centerOverride?.zoom ?? (mode === 'picker' ? 13 : 11);

  const [camera, setCamera] = useState<{ center: { lat: number; lng: number }; zoom: number }>({
    center: { lat: initialLat, lng: initialLng },
    zoom: initialZoom,
  });
  const [activeMarkerReportId, setActiveMarkerReportId] = useState<string | null>(null);

  const overrideLat = centerOverride?.lat;
  const overrideLng = centerOverride?.lng;
  const overrideZoom = centerOverride?.zoom;

  useEffect(() => {
    if (overrideLat !== undefined && overrideLng !== undefined) {
      setCamera({
        center: { lat: overrideLat, lng: overrideLng },
        zoom: overrideZoom ?? 12,
      });
    }
  }, [overrideLat, overrideLng, overrideZoom]);

  useEffect(() => {
    if (heatmapMode) {
      setActiveMarkerReportId(null);
      return;
    }
    if (selectedReportId) {
      const found = reports.find((r) => r.id === selectedReportId);
      if (found) {
        setActiveMarkerReportId(found.id);
        setCamera({ center: { lat: found.publicLat, lng: found.publicLng }, zoom: 13 });
      } else {
        setActiveMarkerReportId(null);
      }
    }
  }, [selectedReportId, reports, heatmapMode]);

  useEffect(() => {
    if (activeMarkerReportId && !reports.some((r) => r.id === activeMarkerReportId)) {
      setActiveMarkerReportId(null);
    }
  }, [activeMarkerReportId, reports]);

  const reverseGeocodeAddress = useCallback(
    async (lat: number, lng: number) => {
      try {
        const res = await fetch(`/api/maps/reverse-geocode?lat=${lat}&lng=${lng}&lang=${lang}`);
        if (res.status === 429) {
          setMapsQuotaExceeded(true);
          return undefined;
        }
        if (!res.ok) return undefined;
        const data = (await res.json()) as { results?: { formattedAddress?: string }[] };
        return data.results?.[0]?.formattedAddress;
      } catch {
        return undefined;
      }
    },
    [lang, setMapsQuotaExceeded]
  );

  // Privacy-safe governorate aggregates for Heatmap Mode
  const heatmapClusters = useMemo(() => {
    if (!heatmapMode) return [];
    const counts: Record<string, { govId: string; count: number; lost: number; found: number }> = {};
    for (const r of reports) {
      if (!counts[r.governorateId]) {
        counts[r.governorateId] = { govId: r.governorateId, count: 0, lost: 0, found: 0 };
      }
      counts[r.governorateId].count += 1;
      if (r.type === 'lost') counts[r.governorateId].lost += 1;
      else counts[r.governorateId].found += 1;
    }
    return Object.values(counts)
      .filter((c) => c.count >= 1)
      .map((c) => {
        const gov = findGovernorate(c.govId);
        return gov ? { ...c, gov } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [heatmapMode, reports]);

  const fallbackElement = (
    <GovernorateFallbackView
      mode={mode}
      reports={reports}
      isAr={isAr}
      heightClassName={heightClassName}
      loadError={mapsLoadError}
      onPickerChange={onPickerChange}
      onSelectReport={onSelectReport}
    />
  );

  if (!mapsApiKey || mapsLoadError) {
    return fallbackElement;
  }

  return (
    <ErrorBoundary isAr={isAr} fallback={fallbackElement} onError={() => setMapsLoadError(true)}>
      <div className="space-y-3">
        <PlacesSearchBox
          onPlacePicked={({ lat, lng, label }) => {
            setCamera({ center: { lat, lng }, zoom: 14 });
            if (mode === 'picker') {
              onPickerChange?.({ lat, lng, resolvedAddress: label });
            }
          }}
        />

        <div
          className={`w-full rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/[0.08] shadow-lg relative ${heightClassName}`}
        >
          <GoogleMap
            mapId="DEMO_MAP_ID"
            center={camera.center}
            zoom={camera.zoom}
            gestureHandling="greedy"
            onCameraChanged={(ev) => setCamera({ center: ev.detail.center, zoom: ev.detail.zoom })}
            onClick={async (ev) => {
              if (mode === 'picker' && ev.detail.latLng) {
                const { lat, lng } = ev.detail.latLng;
                const addr = await reverseGeocodeAddress(lat, lng);
                onPickerChange?.({ lat, lng, resolvedAddress: addr });
              } else {
                setActiveMarkerReportId(null);
              }
            }}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            {mode === 'picker' && pickerCoords && (
              <AdvancedMarker
                position={pickerCoords}
                draggable
                onDragEnd={async (ev) => {
                  if (ev.latLng) {
                    const lat = ev.latLng.lat();
                    const lng = ev.latLng.lng();
                    const addr = await reverseGeocodeAddress(lat, lng);
                    onPickerChange?.({ lat, lng, resolvedAddress: addr });
                  }
                }}
              >
                <Pin background="#2563EB" borderColor="#1E3A8A" glyphColor="#FFFFFF" />
              </AdvancedMarker>
            )}

            {mode === 'explore' &&
              !heatmapMode &&
              reports.map((report) => (
                <ExploreReportMarker
                  key={report.id}
                  report={report}
                  isActive={activeMarkerReportId === report.id}
                  isAr={isAr}
                  userCoords={userCoords}
                  onSelect={(rep) => {
                    setActiveMarkerReportId(rep.id);
                    onSelectReport?.(rep);
                  }}
                  onClose={() => setActiveMarkerReportId(null)}
                  onNavigateReport={onNavigateReport}
                />
              ))}

            {mode === 'explore' &&
              heatmapMode &&
              heatmapClusters.map((cluster) => {
                const size = Math.min(72, 34 + cluster.count * 6);
                return (
                  <AdvancedMarker
                    key={`heat-${cluster.govId}`}
                    position={{ lat: cluster.gov.lat, lng: cluster.gov.lng }}
                    onClick={() => setCamera({ center: { lat: cluster.gov.lat, lng: cluster.gov.lng }, zoom: 10 })}
                  >
                    <div
                      style={{ width: size, height: size }}
                      className="rounded-full bg-violet-600/80 border-2 border-white text-white flex flex-col items-center justify-center shadow-md cursor-pointer"
                    >
                      <span className="text-xs font-bold tabular-nums leading-none">{cluster.count}</span>
                      <span className="text-[9px] truncate max-w-[54px]">
                        {isAr ? cluster.gov.nameAr : cluster.gov.nameEn}
                      </span>
                    </div>
                  </AdvancedMarker>
                );
              })}
          </GoogleMap>

          {mode === 'picker' && (
            <div className="absolute bottom-3 start-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-sm">
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {isAr
                  ? 'انقر أو اسحب الدبوس لتأكيد الموقع الدقيق'
                  : 'Click map or drag pin to confirm exact location'}
              </span>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};
