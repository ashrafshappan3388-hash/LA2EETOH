import React, { useState } from 'react';
import { ArrowRight, Calendar, MapPin, Package, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ItemReport } from '../types';
import { ITEM_CATEGORIES, calculateDistanceKm, findCity, findGovernorate } from '../utils/egyptLocations';

export const ReportCard: React.FC<{ report: ItemReport }> = ({ report }) => {
  const { lang, navigate, userCoords } = useApp();
  const isAr = lang === 'ar';
  const [imgFailed, setImgFailed] = useState(false);

  const gov = findGovernorate(report.governorateId);
  const city = findCity(report.governorateId, report.cityId);
  const cat = ITEM_CATEGORIES.find((c) => c.id === report.category);

  const distanceKm = userCoords
    ? calculateDistanceKm(userCoords.lat, userCoords.lng, report.publicLat, report.publicLng)
    : null;

  const isLost = report.type === 'lost';
  const photo = report.photoUrls?.[0];

  return (
    <article
      onClick={() => navigate(`/report/${report.id}`)}
      className="group cursor-pointer la-card-interactive overflow-hidden flex flex-col justify-between"
    >
      <div>
        <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-900 overflow-hidden">
          {photo && !imgFailed ? (
            <img
              src={photo}
              alt={report.title}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-400">
              {report.isSensitiveDocument ? <ShieldAlert className="w-8 h-8" /> : <Package className="w-8 h-8" />}
              <span className="text-xs font-medium px-4 text-center line-clamp-1">{report.title}</span>
            </div>
          )}

          {/* Subtle gradient scrim for crisp contrast */}
          <div
            className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/55 to-transparent pointer-events-none"
            aria-hidden="true"
          />

          <div className="absolute top-3 start-3 end-3 flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-white/95 drop-shadow-sm truncate">
              {cat ? (isAr ? cat.nameAr : cat.nameEn) : report.category}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold text-white shadow-sm ${
                isLost ? 'bg-rose-600/95' : 'bg-emerald-600/95'
              }`}
            >
              {isLost ? (isAr ? 'مفقود' : 'Lost') : isAr ? 'معثور عليه' : 'Found'}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <h3 className="text-[15px] font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
            {report.title}
          </h3>

          <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                {gov ? (isAr ? gov.nameAr : gov.nameEn) : report.governorateId}
                {city ? ` · ${isAr ? city.nameAr : city.nameEn}` : ''}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 tabular-nums">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {report.dateOccurred}
                  {report.timeApprox ? ` · ${report.timeApprox}` : ''}
                </span>
              </span>
              {distanceKm !== null && (
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  ~{distanceKm} {isAr ? 'كم' : 'km'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-3.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
          {report.ownerDisplayName}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/report/${report.id}`);
          }}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:gap-1.5 transition-all duration-200 whitespace-nowrap shrink-0"
        >
          <span>{isAr ? 'التفاصيل والتواصل' : 'View & Contact'}</span>
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </button>
      </div>
    </article>
  );
};
