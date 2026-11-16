import React, { useMemo, useState } from 'react';
import { Building2, CheckCircle2, ClipboardList, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { InstitutionalRecord, Organization } from '../types';
import { EGYPT_GOVERNORATES, ITEM_CATEGORIES, findCity, findGovernorate } from '../utils/egyptLocations';
import { formatFriendlyFirestoreError } from '../utils/validation';

export const OrganizationsPage: React.FC<{ dashboardMode?: boolean }> = ({ dashboardMode = false }) => {
  const {
    lang,
    user,
    organizations,
    institutionalRecords,
    applyOrganization,
    addInstitutionalRecord,
    updateInstitutionalStatus,
    navigate,
    signInWithGoogle,
  } = useApp();
  const isAr = lang === 'ar';

  const [govFilter, setGovFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Partnership application form
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [orgType, setOrgType] = useState<Organization['orgType']>('university');
  const [appGovId, setAppGovId] = useState('cairo');
  const [appCityId, setAppCityId] = useState('nasr-city');
  const [contactDesk, setContactDesk] = useState('');

  // Custody Intake form
  const [selectedOrgId, setSelectedOrgId] = useState(organizations[0]?.id || 'org-cairo-metro-3');
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('wallets-bags');
  const [storageLocation, setStorageLocation] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const verifiedOrgs = useMemo(
    () =>
      organizations.filter((o) => {
        if (o.verificationStatus !== 'verified') return false;
        if (govFilter && o.governorateId !== govFilter) return false;
        if (typeFilter && o.orgType !== typeFilter) return false;
        return true;
      }),
    [organizations, govFilter, typeFilter]
  );

  const selectedGovObj = findGovernorate(appGovId);

  if (dashboardMode) {
    if (!user) {
      return (
        <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-16 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-md">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {isAr ? 'لوحة عهدة المؤسسات' : 'Institutional Custody Desk'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {isAr
              ? 'سجّل الدخول بحساب موثق لإدارة سجلات الاستلام والتسليم المؤسسية.'
              : 'Sign in with a verified staff account to log found items into institutional custody and manage handovers.'}
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

    return (
      <div className="la-page-shell">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {isAr ? 'لوحة إدارة مفقودات المؤسسات' : 'Institutional Custody Dashboard'}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isAr
                ? 'تسجيل استلام المعثورات وأماكن الحفظ وتوثيق مراجع التسليم.'
                : 'Log received items, storage locations, verification checks, and handover references.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/organizations')}
            className="la-btn-secondary !py-2 !text-xs"
          >
            {isAr ? 'دليل المؤسسات' : 'Organizations Directory'}
          </button>
        </div>

        {feedback && (
          <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 px-4 py-3 text-sm text-blue-900 dark:text-blue-200 shadow-md">
            {feedback}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!itemName.trim() || !storageLocation.trim()) return;
              try {
                await addInstitutionalRecord({
                  organizationId: selectedOrgId,
                  itemName,
                  category: itemCategory,
                  storageLocation,
                });
                setItemName('');
                setStorageLocation('');
                setFeedback(isAr ? 'تم تسجيل الغرض في عهدة المؤسسة.' : 'Item logged into institutional custody.');
              } catch (err) {
                setFeedback(formatFriendlyFirestoreError(err, isAr, 'Unable to save custody record.'));
              }
            }}
            className="lg:col-span-4 la-card p-6 space-y-4"
          >
            <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{isAr ? 'تسجيل معثور في العهدة' : 'Log Custody Intake'}</span>
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'المؤسسة' : 'Organization'}
              </label>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="la-input"
              >
                {organizations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {isAr ? o.nameAr : o.nameEn}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'وصف الغرض *' : 'Item Description *'}
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={120}
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="la-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'الفئة' : 'Category'}
              </label>
              <select
                value={itemCategory}
                onChange={(e) => setItemCategory(e.target.value)}
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
                {isAr ? 'مكان الحفظ الداخلي *' : 'Storage Locker / Desk *'}
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={120}
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                placeholder={isAr ? 'مثال: خزانة أمانات رقم ٣' : 'e.g., Vault Shelf B-12'}
                className="la-input"
              />
            </div>
            <button
              type="submit"
              className="la-btn-primary w-full"
            >
              {isAr ? 'حفظ السجل' : 'Record Intake'}
            </button>
          </form>

          <div className="lg:col-span-8 la-card overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-slate-50 dark:bg-white/[0.04] text-xs text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-start">{isAr ? 'الغرض' : 'Item'}</th>
                  <th className="px-4 py-3 text-start">{isAr ? 'مكان الحفظ' : 'Storage'}</th>
                  <th className="px-4 py-3 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {institutionalRecords.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                      {isAr ? 'لا توجد سجلات عهدة مسجلة بعد.' : 'No custody records logged yet.'}
                    </td>
                  </tr>
                ) : (
                  institutionalRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{rec.itemName}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{rec.storageLocation}</td>
                      <td className="px-4 py-3">
                        <select
                          value={rec.status}
                          onChange={(e) =>
                            updateInstitutionalStatus(rec.id, e.target.value as InstitutionalRecord['status'])
                          }
                          className="la-input !w-auto !py-1 !px-2.5 !text-xs"
                        >
                          <option value="in_custody">{isAr ? 'في العهدة' : 'In Custody'}</option>
                          <option value="verification_pending">{isAr ? 'قيد التحقق' : 'Verification Pending'}</option>
                          <option value="handed_over">{isAr ? 'تم التسليم' : 'Handed Over'}</option>
                          <option value="disposed">{isAr ? 'أغلق / تصرف نظامي' : 'Closed / Disposed'}</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Public Verified Organizations Directory + Partnership Application
  return (
    <div className="la-page-shell">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {isAr ? 'المؤسسات والهيئات المعتمدة في مصر' : 'Verified Partner Organizations Across Egypt'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {isAr
              ? 'الجامعات، محطات المترو والسكك الحديدية، المطارات، والمراكز التجارية المشاركة في استعادة المفقودات.'
              : 'Universities, metro lines, railway hubs, airports, and public desks collaborating on verified lost-and-found recovery.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/org-dashboard')}
          className="la-btn-primary"
        >
          {isAr ? 'لوحة عهدة المؤسسات' : 'Open Custody Dashboard'}
        </button>
      </div>

      {feedback && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 px-4 py-3 text-sm text-blue-900 dark:text-blue-200 shadow-md">
          {feedback}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={govFilter}
          onChange={(e) => setGovFilter(e.target.value)}
          className="la-input !w-auto min-w-[180px]"
        >
          <option value="">{isAr ? 'كل المحافظات' : 'All Governorates'}</option>
          {EGYPT_GOVERNORATES.map((g) => (
            <option key={g.id} value={g.id}>
              {isAr ? g.nameAr : g.nameEn}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="la-input !w-auto min-w-[180px]"
        >
          <option value="">{isAr ? 'كل أنواع المؤسسات' : 'All Organization Types'}</option>
          <option value="metro">{isAr ? 'مترو الأنفاق' : 'Metro'}</option>
          <option value="train">{isAr ? 'سكك حديد مصر' : 'Railway'}</option>
          <option value="airport">{isAr ? 'مطار' : 'Airport'}</option>
          <option value="university">{isAr ? 'جامعة' : 'University'}</option>
          <option value="mall">{isAr ? 'مركز تجاري' : 'Mall'}</option>
          <option value="institution">{isAr ? 'مؤسسة عامة' : 'Public Institution'}</option>
        </select>
      </div>

      {/* Verified Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {verifiedOrgs.map((org) => {
          const gov = findGovernorate(org.governorateId);
          const city = findCity(org.governorateId, org.cityId);
          return (
            <div
              key={org.id}
              className="la-card-interactive p-5 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isAr ? 'موثقة' : 'Verified Partner'}
                </span>
                <span className="text-xs uppercase font-semibold text-slate-500">{org.orgType}</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? org.nameAr : org.nameEn}
              </h2>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {gov ? (isAr ? gov.nameAr : gov.nameEn) : org.governorateId}
                {city ? ` — ${isAr ? city.nameAr : city.nameEn}` : ''}
              </div>
              {org.contactDesk && (
                <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-white/[0.08]">
                  {org.contactDesk}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Partnership Application Form */}
      <div className="la-card p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-2.5">
          <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            {isAr ? 'طلب اعتماد مؤسسة جديدة' : 'Apply for Institutional Partnership'}
          </h2>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {isAr
            ? 'تخضع طلبات الجامعات والمولات ومحطات النقل للمراجعة اليدوية من إدارة لقيته قبل التفعيل.'
            : 'Applications for universities, transit stations, and malls undergo manual verification by LA2EETOH administrators.'}
        </p>

        {!user ? (
          <button
            type="button"
            onClick={() => signInWithGoogle()}
            className="la-btn-primary !text-xs"
          >
            {isAr ? 'سجّل الدخول لتقديم الطلب' : 'Sign in to Submit Partnership Request'}
          </button>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await applyOrganization({
                  nameEn,
                  nameAr,
                  orgType,
                  governorateId: appGovId,
                  cityId: appCityId,
                  contactDesk,
                });
                setNameEn('');
                setNameAr('');
                setContactDesk('');
                setFeedback(
                  isAr
                    ? 'تم إرسال طلب المؤسسة للمراجعة الإدارية بنجاح.'
                    : 'Partnership application submitted for admin verification.'
                );
              } catch (err) {
                setFeedback(formatFriendlyFirestoreError(err, isAr, 'Application failed.'));
              }
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <input
              type="text"
              required
              minLength={2}
              maxLength={120}
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder={isAr ? 'اسم المؤسسة بالإنجليزية *' : 'Organization Name (English) *'}
              className="la-input"
            />
            <input
              type="text"
              required
              minLength={2}
              maxLength={120}
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder={isAr ? 'اسم المؤسسة بالعربية *' : 'Organization Name (Arabic) *'}
              className="la-input"
            />
            <select
              value={orgType}
              onChange={(e) => setOrgType(e.target.value as Organization['orgType'])}
              className="la-input"
            >
              <option value="university">{isAr ? 'جامعة' : 'University'}</option>
              <option value="school">{isAr ? 'مدرسة' : 'School'}</option>
              <option value="mall">{isAr ? 'مركز تجاري' : 'Shopping Mall'}</option>
              <option value="metro">{isAr ? 'محطة مترو' : 'Metro Station'}</option>
              <option value="train">{isAr ? 'محطة قطار' : 'Train Station'}</option>
              <option value="airport">{isAr ? 'مطار' : 'Airport'}</option>
              <option value="transport">{isAr ? 'نقل عام' : 'Transport Hub'}</option>
              <option value="institution">{isAr ? 'مؤسسة عامة' : 'Public Institution'}</option>
            </select>

            <select
              value={appGovId}
              onChange={(e) => {
                const g = findGovernorate(e.target.value);
                setAppGovId(e.target.value);
                setAppCityId(g?.cities[0]?.id || '');
              }}
              className="la-input"
            >
              {EGYPT_GOVERNORATES.map((g) => (
                <option key={g.id} value={g.id}>
                  {isAr ? g.nameAr : g.nameEn}
                </option>
              ))}
            </select>

            <select
              value={appCityId}
              onChange={(e) => setAppCityId(e.target.value)}
              className="la-input"
            >
              {(selectedGovObj?.cities ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {isAr ? c.nameAr : c.nameEn}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={contactDesk}
              onChange={(e) => setContactDesk(e.target.value)}
              placeholder={isAr ? 'موقع مكتب المفقودات' : 'Lost & Found Desk Location'}
              className="la-input"
            />

            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                className="la-btn-primary"
              >
                {isAr ? 'إرسال طلب الاعتماد' : 'Submit Partnership Application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
