import React, { useState } from 'react';
import { Bell, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  EGYPT_GOVERNORATES,
  ITEM_CATEGORIES,
  ITEM_COLORS,
  findGovernorate,
} from '../utils/egyptLocations';
import { scoreReportMatch } from '../utils/sanitization';
import { formatFriendlyFirestoreError, validateWatchlistPayload } from '../utils/validation';

export const WatchlistsPage: React.FC = () => {
  const {
    lang,
    user,
    watchlists,
    reports,
    createWatchlist,
    toggleWatchlist,
    deleteWatchlist,
    navigate,
    signInWithGoogle,
  } = useApp();
  const isAr = lang === 'ar';

  const [title, setTitle] = useState('');
  const [keywords, setKeywords] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [governorateId, setGovernorateId] = useState('');
  const [maxDistanceKm, setMaxDistanceKm] = useState('25');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-16 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto shadow-md">
          <Bell className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {isAr ? 'قوائم المراقبة والتنبيهات الذكية' : 'Smart Watchlists & Alerts'}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          {isAr
            ? 'سجّل الدخول لإنشاء قواعد تنبيه مخصصة حسب الكلمات والفئة واللون والمحافظة.'
            : 'Sign in to create saved search rules and receive alerts when matching items are reported across Egypt.'}
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const distNum = maxDistanceKm ? Number(maxDistanceKm) : undefined;
    const check = validateWatchlistPayload(title, distNum);
    if (!check.valid) {
      setFeedback(check.errors.join(' '));
      return;
    }
    try {
      await createWatchlist({
        title: title.trim(),
        keywords: keywords.trim() || undefined,
        category: category || undefined,
        color: color || undefined,
        brand: brand.trim() || undefined,
        governorateId: governorateId || undefined,
        maxDistanceKm: distNum,
      });
      setTitle('');
      setKeywords('');
      setBrand('');
      setFeedback(isAr ? 'تم إنشاء قاعدة المراقبة بنجاح.' : 'Watchlist rule created.');
    } catch (err) {
      setFeedback(formatFriendlyFirestoreError(err, isAr, 'Unable to create watchlist.'));
    }
  };

  return (
    <div className="la-page-shell">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {isAr ? 'قوائم المراقبة والتنبيهات' : 'Watchlists & Smart Alerts'}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {isAr
            ? 'احفظ مواصفات الغرض الذي تبحث عنه لمتابعة البلاغات المطابقة تلقائياً.'
            : 'Save item criteria to automatically monitor matching lost and found reports.'}
        </p>
      </div>

      {feedback && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 px-4 py-3 text-sm text-blue-900 dark:text-blue-200 shadow-md">
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleCreate}
          className="lg:col-span-5 la-card p-6 space-y-4"
        >
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{isAr ? 'إضافة قاعدة مراقبة جديدة' : 'Create Watchlist Rule'}</span>
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAr ? 'اسم القائمة *' : 'Watchlist Title *'}
            </label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isAr ? 'مثال: حقيبة لابتوب سوداء' : 'e.g., Black Laptop Backpack'}
              className="la-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAr ? 'كلمات مفتاحية' : 'Keywords'}
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder={isAr ? 'مثال: مترو، شاحن، سامسونيت' : 'e.g., metro, charger, Samsonite'}
              className="la-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'الفئة' : 'Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="la-input"
              >
                <option value="">{isAr ? 'الكل' : 'Any'}</option>
                {ITEM_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {isAr ? c.nameAr : c.nameEn}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'اللون' : 'Color'}
              </label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="la-input"
              >
                <option value="">{isAr ? 'الكل' : 'Any'}</option>
                {ITEM_COLORS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {isAr ? c.nameAr : c.nameEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'المحافظة' : 'Governorate'}
              </label>
              <select
                value={governorateId}
                onChange={(e) => setGovernorateId(e.target.value)}
                className="la-input"
              >
                <option value="">{isAr ? 'كل المحافظات' : 'All Egypt'}</option>
                {EGYPT_GOVERNORATES.map((g) => (
                  <option key={g.id} value={g.id}>
                    {isAr ? g.nameAr : g.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'أقصى مسافة (كم)' : 'Max Radius (km)'}
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={maxDistanceKm}
                onChange={(e) => setMaxDistanceKm(e.target.value)}
                className="la-input tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAr ? 'الماركة (اختياري)' : 'Brand (Optional)'}
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="la-input"
            />
          </div>

          <button
            type="submit"
            className="la-btn-primary w-full"
          >
            {isAr ? 'حفظ قاعدة المراقبة' : 'Save Watchlist Rule'}
          </button>
        </form>

        {/* Active Watchlists & Live Matched Reports */}
        <div className="lg:col-span-7 space-y-4">
          {watchlists.length === 0 ? (
            <div className="la-card p-10 text-center text-sm text-slate-500">
              {isAr ? 'لا توجد قوائم مراقبة محفوظة بعد.' : 'No watchlists saved yet.'}
            </div>
          ) : (
            watchlists.map((w) => {
              const matches = reports
                .map((r) => ({
                  report: r,
                  score: scoreReportMatch(
                    {
                      keywords: (w.keywords || w.title).split(/\s+/),
                      category: w.category,
                      color: w.color,
                      brand: w.brand,
                      governorateId: w.governorateId,
                    },
                    r
                  ),
                }))
                .filter((m) => m.score >= 35)
                .sort((a, b) => b.score - a.score)
                .slice(0, 3);

              const gov = w.governorateId ? findGovernorate(w.governorateId) : undefined;

              return (
                <div
                  key={w.id}
                  className="la-card-interactive p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">{w.title}</h3>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {gov ? (isAr ? gov.nameAr : gov.nameEn) : isAr ? 'كل المحافظات' : 'All Egypt'}
                        {w.keywords ? ` · ${w.keywords}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleWatchlist(w.id, !w.active)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          w.active
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {w.active ? (isAr ? 'نشط' : 'Active') : isAr ? 'متوقف' : 'Paused'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteWatchlist(w.id)}
                        aria-label={isAr ? 'حذف القائمة' : 'Delete watchlist'}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {matches.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {isAr ? 'تطابقات محتملة حالية (استرشادية):' : 'Current Assistive Matches:'}
                      </div>
                      {matches.map(({ report, score }) => (
                        <button
                          key={report.id}
                          type="button"
                          onClick={() => navigate(`/report/${report.id}`)}
                          className="w-full text-start p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="font-semibold text-slate-900 dark:text-white truncate">
                            {report.title}
                          </span>
                          <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums shrink-0">
                            {score}%
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
