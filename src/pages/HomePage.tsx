import React, { useState } from 'react';
import {
  ArrowRight,
  Building2,
  Camera,
  CheckCircle2,
  FilePlus2,
  Lock,
  MapPin,
  MessageSquare,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { t } from '../lib/i18n';
import { AdSlot } from '../components/AdSlot';
import { ReportCard } from '../components/ReportCard';
import { findGovernorate } from '../utils/egyptLocations';
import heroCairoTwilight from '../assets/images/hero_cairo_twilight_1794776683973.jpg';

export const HomePage: React.FC = () => {
  const { lang, navigate, reports, organizations, recoveryCases } = useApp();
  const copy = t(lang);
  const isAr = lang === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'all' | 'lost' | 'found'>('all');

  const activeCount = reports.filter((r) => r.status === 'open' || r.status === 'matched').length;
  const recoveredCount =
    reports.filter((r) => r.status === 'recovered').length +
    recoveryCases.filter((c) => c.stage === 'item_returned' || c.stage === 'case_closed').length;
  const verifiedOrgsCount = organizations.filter((o) => o.verificationStatus === 'verified').length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    const base = searchScope === 'lost' ? '/lost' : searchScope === 'found' ? '/found' : '/search';
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : base);
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Architectural Cairo Twilight Hero */}
      <section className="relative overflow-hidden bg-[#060B18] text-white">
        <img
          src={heroCairoTwilight}
          alt={isAr ? 'القاهرة والنيل والأهرامات عند الغسق' : 'Cairo Nile and Pyramids at twilight'}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-50 scale-[1.02]"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#060B18]/85 via-[#0B132B]/70 to-[#060B18]"
          aria-hidden="true"
        />
        <div className="la-egypt-lattice absolute inset-0 opacity-60 pointer-events-none" aria-hidden="true" />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(59,130,246,0.22),transparent_55%)]"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-24 md:pt-20 md:pb-28 space-y-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-xs font-semibold tracking-wide text-amber-300/95">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {isAr
                  ? '٢٧ محافظة مصرية · تحقق ثنائي ومحادثات محمية'
                  : '27 Egyptian Governorates · Verified Recovery & Live Chat'}
              </span>
            </div>

            <h1 className="text-[clamp(2rem,4.6vw,3.5rem)] font-extrabold tracking-tight text-white leading-[1.12]">
              {copy.hero.headline}
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              {copy.hero.subhead}
            </p>
          </div>

          {/* Spotlight Command Search Bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 p-2 rounded-2xl bg-white dark:bg-[#0E1730] shadow-2xl shadow-black/60 border border-white/15 transition-shadow duration-200 focus-within:ring-2 focus-within:ring-amber-400/45">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.06] rounded-xl p-1 shrink-0">
                {(['all', 'lost', 'found'] as const).map((scope) => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => setSearchScope(scope)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap shrink-0 ${
                      searchScope === scope
                        ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {scope === 'all'
                      ? isAr
                        ? 'الكل'
                        : 'All'
                      : scope === 'lost'
                        ? copy.common.lost
                        : copy.common.found}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 flex items-center">
                <Search className="w-4 h-4 text-slate-400 ms-3 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={copy.hero.searchPlaceholder}
                  aria-label={copy.hero.searchPlaceholder}
                  className="w-full px-3 py-2.5 text-sm sm:text-base text-slate-900 dark:text-white placeholder:text-slate-400 bg-transparent focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="la-btn-primary !px-6 !py-2.5"
              >
                {copy.hero.searchBtn}
              </button>
            </div>
          </form>

          {/* 4 Refined Frosted Action Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 max-w-5xl mx-auto">
            {[
              {
                path: '/report-lost',
                title: copy.hero.tileLost,
                sub: copy.hero.tileLostSub,
                icon: FilePlus2,
                iconBg: 'bg-rose-500/20 text-rose-300 border-rose-400/25',
              },
              {
                path: '/report-found',
                title: copy.hero.tileFound,
                sub: copy.hero.tileFoundSub,
                icon: CheckCircle2,
                iconBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/25',
              },
              {
                path: '/map',
                title: copy.hero.tileMap,
                sub: copy.hero.tileMapSub,
                icon: MapPin,
                iconBg: 'bg-blue-500/20 text-blue-300 border-blue-400/25',
              },
              {
                path: '/track',
                title: copy.hero.tileTrack,
                sub: copy.hero.tileTrackSub,
                icon: MessageSquare,
                iconBg: 'bg-amber-500/20 text-amber-300 border-amber-400/25',
              },
            ].map((tile) => {
              const Icon = tile.icon;
              return (
                <button
                  key={tile.path}
                  type="button"
                  onClick={() => navigate(tile.path)}
                  className="group rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] backdrop-blur-md border border-white/[0.12] hover:border-amber-400/40 p-3 sm:p-4 text-start transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 shadow-lg shadow-black/25 hover:shadow-xl flex items-start gap-2.5 sm:gap-3"
                >
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center shrink-0 ${tile.iconBg}`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-[13px] sm:text-sm text-white leading-snug flex items-center justify-between gap-1">
                      <span className="truncate">{tile.title}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-all duration-200 rtl:rotate-180 shrink-0" />
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-300/85 leading-snug mt-0.5">{tile.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="relative z-10 h-[1px] w-full la-gold-hairline" aria-hidden="true" />
      </section>

      {/* Architectural Hairline-Divided Metrics Strip */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 bg-white dark:bg-[#0D1529] rounded-2xl border border-slate-200/85 dark:border-white/[0.08] shadow-xl shadow-slate-900/[0.08] dark:shadow-black/50 divide-y sm:divide-y-0 sm:divide-x rtl:divide-x-reverse divide-slate-200/80 dark:divide-white/[0.08]">
          {[
            { label: copy.stats.governorates, sub: copy.stats.governoratesSub, val: '27', accent: 'text-blue-600 dark:text-blue-400' },
            { label: copy.stats.activeReports, sub: isAr ? 'محدّثة لحظياً' : 'Live synced', val: String(activeCount), accent: 'text-slate-900 dark:text-white' },
            { label: copy.stats.recoveredItems, sub: isAr ? 'موثقة بالتحقق' : 'Verified handovers', val: String(recoveredCount), accent: 'text-emerald-600 dark:text-emerald-400' },
            { label: copy.stats.partnerOrgs, sub: isAr ? 'مترو وجامعات ومطارات' : 'Metro, universities & hubs', val: String(verifiedOrgsCount), accent: 'text-amber-600 dark:text-amber-400' },
          ].map((stat, idx) => (
            <div key={idx} className="p-5 sm:px-6 flex items-baseline justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{stat.label}</div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{stat.sub}</div>
              </div>
              <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${stat.accent}`}>
                {stat.val}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <AdSlot placement="home" />
      </div>

      {/* Latest Lost & Found Listings Gallery */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {isAr ? 'أحدث البلاغات في مصر' : 'Recent Reports Across Egypt'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isAr
                ? 'بلاغات محمية الخصوصية للمفقودات والمعثورات — افتح أي بلاغ لبدء التحقق والمحادثة المباشرة.'
                : 'Privacy-screened lost and found reports — open any listing to verify ownership and chat directly.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="la-btn-secondary"
          >
            <span>{isAr ? 'تصفح كل البلاغات' : 'Browse All Reports'}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {reports.slice(0, 4).map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
        </div>
      </section>

      {/* Asymmetric 12-Column Bento Capabilities Showcase */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Primary 7-Col Featured Dark Surface: Direct Two-Party Recovery Chat & Verification */}
          <div className="lg:col-span-7 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#080F24] via-[#0F1B3D] to-[#1B1347] text-white p-7 sm:p-8 flex flex-col justify-between gap-6 border border-white/10 shadow-xl shadow-slate-900/20">
            <div className="la-egypt-lattice absolute inset-0 opacity-55 pointer-events-none" aria-hidden="true" />
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-300">
                <Lock className="w-4 h-4" />
                <span>{isAr ? 'تواصل مباشر وموثق بين الطرفين' : 'Direct Verified Two-Party Chat'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                {isAr
                  ? 'تواصل مع الطرف الآخر بأمان دون كشف بياناتك الحساسة'
                  : 'Coordinate Ownership & Safe Handover in Real-Time Chat'}
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                {isAr
                  ? 'يتيح لك لقيته فتح محادثة فورية مشفّرة الصلاحيات بين صاحب المفقود والعاثر لتأكيد العلامات المميزة والاتفاق على نقطة تسليم عامة آمنة كمحطات المترو أو الجامعات.'
                  : 'Once a potential match is found, owner and finder communicate directly inside a private case chat — verifying distinguishing marks, proposing public Egyptian handover desks, and tracking all 7 stages.'}
              </p>
            </div>

            {/* Clean Mini Visual Preview of Two-Party Chat */}
            <div className="relative z-10 rounded-2xl bg-white/[0.06] border border-white/10 p-4 space-y-2.5 text-xs backdrop-blur-sm">
              <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/10">
                <span className="font-semibold text-slate-200">
                  {isAr ? 'محادثة استعادة نشطة · مترو العتبة' : 'Live Recovery Thread · Dokki Metro'}
                </span>
                <span className="text-emerald-400 font-semibold">
                  {isAr ? 'التحقق من الملكية' : 'Stage 04 · Verification'}
                </span>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[82%] rounded-2xl rounded-ts-sm bg-white/10 px-3.5 py-2 text-slate-100">
                  {isAr
                    ? 'مرحباً، وجدت الحقيبة. هل يمكنك وصف العلامة الموجودة داخل الجيب الأمامي؟'
                    : 'Hi, I have the item safe. Can you confirm the sticker inside the front pocket?'}
                </div>
              </div>
              <div className="flex justify-end">
                <div className="max-w-[82%] rounded-2xl rounded-te-sm bg-blue-600 px-3.5 py-2 text-white shadow-md">
                  {isAr
                    ? 'نعم، يوجد ملصق جامعة القاهرة الأزرق. نتقابل في مكتب مفقودات مترو الدقي؟'
                    : 'Yes! Blue Cairo University lanyard. Can we meet at the Dokki Metro Lost & Found desk?'}
                </div>
              </div>
            </div>

            <div className="relative z-10 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/track')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#080F24] hover:bg-blue-50 text-sm font-bold shadow-lg transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap shrink-0"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{isAr ? 'فتح المحادثات ومتابعة الاستعادة' : 'Open Recovery Chats'}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/ai-assistant')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition-all duration-200 whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{isAr ? 'المساعد الذكي' : 'AI Assistant'}</span>
              </button>
            </div>
          </div>

          {/* Right 5-Col Stacked Interactive Bento Cards */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="flex-1 la-card-interactive p-6 sm:p-7 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isAr ? 'البحث البصري بالذكاء الاصطناعي' : 'AI Visual Item Matching'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isAr
                    ? 'ارفع صورة الغرض لمقارنة اللون والماركة والفئة مع البلاغات النشطة دون أي تعرف على الوجوه.'
                    : 'Upload a photo to rank matching reports by category, color, and brand — with zero facial recognition.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/search?visual=1')}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 dark:text-blue-400 hover:gap-2.5 transition-all duration-200 text-start"
              >
                <span>{isAr ? 'جرّب البحث بالصورة' : 'Try Visual Search'}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>

            <div className="flex-1 la-card-interactive p-6 sm:p-7 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isAr ? 'ملصقات QR الذكية المحمية' : 'Smart Protected QR Tags'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isAr
                    ? 'أنشئ رمز QR عشوائي لأغراضك الشخصية ليتمكن العاثر من مراسلتك دون معرفة رقم هاتفك.'
                    : 'Generate randomized QR tags for bags, laptops, or keys so finders message you safely via relay.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/qr-tags')}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-violet-600 dark:text-violet-400 hover:gap-2.5 transition-all duration-200 text-start"
              >
                <span>{isAr ? 'إدارة رموز QR' : 'Manage QR Tags'}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Verified Egyptian Institutional Network */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {isAr ? 'شبكة المؤسسات المصرية المعتمدة' : 'Verified Institutional Partners'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/organizations')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
          >
            <span>{isAr ? 'عرض الشبكة' : 'View Network'}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {organizations
            .filter((o) => o.verificationStatus === 'verified')
            .slice(0, 4)
            .map((org) => {
              const gov = findGovernorate(org.governorateId);
              return (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => navigate('/organizations')}
                  className="text-start la-card-interactive p-5 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isAr ? 'مكتب موثق' : 'Verified Desk'}
                    </span>
                    <span className="text-[11px] uppercase text-slate-400">{org.orgType}</span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                    {isAr ? org.nameAr : org.nameEn}
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {gov ? (isAr ? gov.nameAr : gov.nameEn) : org.governorateId} · {org.contactDesk || org.orgType}
                  </div>
                </button>
              );
            })}
        </div>
      </section>
    </div>
  );
};
