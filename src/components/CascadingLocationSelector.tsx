import React from 'react';
import { LocateFixed } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  EGYPT_GOVERNORATES,
  findCity,
  findDistrict,
  findGovernorate,
} from '../utils/egyptLocations';

interface CascadingLocationProps {
  governorateId: string;
  cityId: string;
  districtId: string;
  onChange: (next: {
    governorateId: string;
    cityId: string;
    districtId: string;
    lat?: number;
    lng?: number;
  }) => void;
  allowAllOption?: boolean;
  showGpsButton?: boolean;
  layout?: 'row' | 'stack';
  onGpsDetected?: (coords: { lat: number; lng: number; accuracyMeters: number }) => void;
}

export const CascadingLocationSelector: React.FC<CascadingLocationProps> = ({
  governorateId,
  cityId,
  districtId,
  onChange,
  allowAllOption = false,
  showGpsButton = false,
  layout = 'row',
  onGpsDetected,
}) => {
  const { lang, setUserCoords } = useApp();
  const isAr = lang === 'ar';

  const selectedGov = findGovernorate(governorateId);
  const cities = selectedGov?.cities ?? [];
  const selectedCity = selectedGov ? findCity(governorateId, cityId) : undefined;
  const districts = selectedCity?.districts ?? [];

  const handleGovChange = (nextGovId: string) => {
    const gov = findGovernorate(nextGovId);
    onChange({
      governorateId: nextGovId,
      cityId: '',
      districtId: '',
      lat: gov?.lat,
      lng: gov?.lng,
    });
  };

  const handleCityChange = (nextCityId: string) => {
    const city = findCity(governorateId, nextCityId);
    onChange({
      governorateId,
      cityId: nextCityId,
      districtId: '',
      lat: city?.lat ?? selectedGov?.lat,
      lng: city?.lng ?? selectedGov?.lng,
    });
  };

  const handleDistrictChange = (nextDistId: string) => {
    const dist = findDistrict(governorateId, cityId, nextDistId);
    onChange({
      governorateId,
      cityId,
      districtId: nextDistId,
      lat: dist?.lat ?? selectedCity?.lat ?? selectedGov?.lat,
      lng: dist?.lng ?? selectedCity?.lng ?? selectedGov?.lng,
    });
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyMeters: Math.round(pos.coords.accuracy),
        };
        setUserCoords({ lat: coords.lat, lng: coords.lng });
        onGpsDetected?.(coords);
      },
      () => {
        // User denied or unavailable; keep manual selector working
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-3">
      <div className={layout === 'stack' ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-1 md:grid-cols-3 gap-3.5'}>
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {isAr ? 'المحافظة' : 'Governorate'}
          </label>
          <select
            aria-label={isAr ? 'المحافظة' : 'Governorate'}
            value={governorateId}
            onChange={(e) => handleGovChange(e.target.value)}
            className="la-input"
          >
            <option value="">{allowAllOption ? (isAr ? 'كل المحافظات' : 'All Governorates') : (isAr ? 'اختر المحافظة' : 'Select Governorate')}</option>
            {EGYPT_GOVERNORATES.map((g) => (
              <option key={g.id} value={g.id}>
                {isAr ? g.nameAr : g.nameEn}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {isAr ? 'المدينة / المركز' : 'City / Administrative Center'}
          </label>
          <select
            aria-label={isAr ? 'المدينة أو المركز' : 'City or Center'}
            value={cityId}
            disabled={!governorateId}
            onChange={(e) => handleCityChange(e.target.value)}
            className="la-input disabled:opacity-50"
          >
            <option value="">{allowAllOption ? (isAr ? 'كل المدن والمراكز' : 'All Cities / Centers') : (isAr ? 'اختر المدينة أو المركز' : 'Select City / Center')}</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {isAr ? c.nameAr : c.nameEn}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {isAr ? 'الحي / المنطقة' : 'District / Neighborhood'}
          </label>
          <select
            aria-label={isAr ? 'الحي أو المنطقة' : 'District or Neighborhood'}
            value={districtId}
            disabled={!cityId}
            onChange={(e) => handleDistrictChange(e.target.value)}
            className="la-input disabled:opacity-50"
          >
            <option value="">{allowAllOption ? (isAr ? 'كل الأحياء' : 'All Districts') : (isAr ? 'اختر الحي (اختياري)' : 'Select District (Optional)')}</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {isAr ? d.nameAr : d.nameEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showGpsButton && (
        <button
          type="button"
          onClick={handleUseGps}
          className="la-btn-secondary !px-3.5 !py-2 !text-xs"
        >
          <LocateFixed className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>{isAr ? 'تحديد موقعي الحالي عبر GPS (بإذنك)' : 'Use Device GPS (with permission)'}</span>
        </button>
      )}
    </div>
  );
};
