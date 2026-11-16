import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  FilePlus2,
  Home,
  MapPin,
  Menu,
  MessageSquare,
  Moon,
  Plus,
  Search,
  ShieldCheck,
  Sun,
  User,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { t } from '../lib/i18n';
import { UserAvatar } from './UserAvatar';

export const BrandLogo: React.FC<{ size?: number }> = ({ size = 32 }) => {
  const uid = React.useId().replace(/:/g, '');
  const shieldGrad = `laShield-${uid}`;
  const goldGrad = `laGold-${uid}`;
  const glowGrad = `laGlow-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0 drop-shadow-sm"
    >
      <defs>
        <linearGradient id={shieldGrad} x1="4" y1="3" x2="44" y2="45" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="48%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
        <linearGradient id={goldGrad} x1="12" y1="9" x2="36" y2="39" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#E2B857" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id={glowGrad} x1="24" y1="8" x2="24" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.03" />
        </linearGradient>
      </defs>

      {/* Architectural Rounded-Squircle Crest */}
      <rect x="2" y="2" width="44" height="44" rx="13" fill={`url(#${shieldGrad})`} />
      <rect
        x="2.75"
        y="2.75"
        width="42.5"
        height="42.5"
        rx="12.25"
        stroke="white"
        strokeOpacity="0.16"
        strokeWidth="1.5"
      />

      {/* Subtle Egyptian Octagram / Diamond Facet Frame */}
      <path
        d="M24 6.5L41.5 24L24 41.5L6.5 24L24 6.5Z"
        stroke={`url(#${goldGrad})`}
        strokeOpacity="0.28"
        strokeWidth="1"
      />

      {/* Precision Locator Pin Silhouette */}
      <path
        d="M24 10.5C18.201 10.5 13.5 15.201 13.5 21C13.5 28.45 24 38 24 38C24 38 34.5 28.45 34.5 21C34.5 15.201 29.799 10.5 24 10.5Z"
        fill={`url(#${glowGrad})`}
        stroke={`url(#${goldGrad})`}
        strokeWidth="2.1"
        strokeLinejoin="round"
      />

      {/* Verified Return Chevron / Checkmark Core */}
      <path
        d="M19.3 21.1L22.5 24.3L29.1 17.7"
        stroke="#FFFFFF"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Nile Gold Beacon Dot */}
      <circle cx="35.5" cy="12.5" r="2.2" fill={`url(#${goldGrad})`} />
    </svg>
  );
};

export const Header: React.FC = () => {
  const {
    lang,
    setLang,
    theme,
    setTheme,
    currentPath,
    navigate,
    user,
    userPublic,
    notifications,
    recoveryCases,
    isAdmin,
    platformSettings,
  } = useApp();
  const copy = t(lang);
  const isAr = lang === 'ar';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [reportMenuOpen, setReportMenuOpen] = useState(false);
  const reportMenuRef = useRef<HTMLDivElement>(null);

  const pathOnly = currentPath.split('?')[0];
  const unreadCount = notifications.filter((n) => !n.read).length;
  const activeCasesCount = recoveryCases.filter(
    (c) => c.stage !== 'case_closed' && c.stage !== 'cancelled'
  ).length;

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (reportMenuRef.current && !reportMenuRef.current.contains(e.target as Node)) {
        setReportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const primaryNav = [
    { path: '/', label: copy.nav.home },
    { path: '/search', label: copy.nav.search },
    { path: '/map', label: copy.nav.map },
    { path: '/track', label: copy.nav.track, badge: activeCasesCount },
    { path: '/ai-assistant', label: copy.nav.ai },
    { path: '/organizations', label: copy.nav.orgs },
    { path: '/support', label: copy.nav.help },
  ];

  const handleNav = (p: string) => {
    setMobileOpen(false);
    setReportMenuOpen(false);
    navigate(p);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#080F24]/95 backdrop-blur-xl text-white shadow-xl shadow-slate-950/20">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Zone 1: Clean Single-Line Brand Wordmark */}
          <button
            type="button"
            onClick={() => handleNav('/')}
            className="flex items-center gap-2 sm:gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 rounded-xl px-1 py-1 transition-transform duration-200 hover:scale-[1.01]"
          >
            <BrandLogo size={26} />
            <span className="text-base sm:text-[17px] font-extrabold tracking-tight text-white">
              {platformSettings.platformName || 'LA2EETOH'}
            </span>
          </button>

          {/* Zone 2: Clean Streamlined Desktop Navigation */}
          <nav
            aria-label="Main navigation"
            className="hidden xl:flex items-center gap-1 text-[13px] font-medium"
          >
            {primaryNav.map((item) => {
              const active = pathOnly === item.path;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => handleNav(item.path)}
                  className={`relative whitespace-nowrap shrink-0 px-3 py-2 rounded-xl transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                    active
                      ? 'bg-white/[0.12] text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* + Report Dropdown (Keeps Lost & Found cleanly grouped instead of cluttering the bar) */}
            <div ref={reportMenuRef} className="relative ms-1">
              <button
                type="button"
                onClick={() => setReportMenuOpen((v) => !v)}
                aria-expanded={reportMenuOpen}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                  pathOnly === '/report-lost' || pathOnly === '/report-found'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-blue-600/20 hover:bg-blue-600/35 text-blue-200 border border-blue-400/25'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'نشر بلاغ' : 'Report'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${reportMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {reportMenuOpen && (
                <div className="absolute top-full mt-2 end-0 w-64 rounded-2xl bg-[#0D1631] border border-white/15 shadow-2xl shadow-black/60 p-2 space-y-1 z-50">
                  <button
                    type="button"
                    onClick={() => handleNav('/report-lost')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-start hover:bg-white/10 transition-colors duration-150"
                  >
                    <span className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0">
                      <FilePlus2 className="w-4 h-4" />
                    </span>
                    <span>
                      <span className="block text-xs font-bold text-white">{copy.nav.reportLost}</span>
                      <span className="block text-[11px] text-slate-400">
                        {isAr ? 'إنشاء تنبيه فقدان موثق' : 'Create lost item alert'}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNav('/report-found')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-start hover:bg-white/10 transition-colors duration-150"
                  >
                    <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    <span>
                      <span className="block text-xs font-bold text-white">{copy.nav.reportFound}</span>
                      <span className="block text-[11px] text-slate-400">
                        {isAr ? 'ساهم في إعادة غرض' : 'Help return found item'}
                      </span>
                    </span>
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Zone 3: Compact Utility & Account Zone */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              aria-label={lang === 'en' ? 'Switch to Arabic' : 'Switch to English'}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-slate-100 whitespace-nowrap shrink-0 transition-all duration-200 border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <span className="sm:hidden">{lang === 'en' ? 'عربي' : 'EN'}</span>
              <span className="hidden sm:inline">{lang === 'en' ? 'عربي' : 'English'}</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-1.5 sm:p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-slate-100 transition-all duration-200 border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
            </button>

            {user && (
              <button
                type="button"
                onClick={() => handleNav('/profile')}
                aria-label={lang === 'ar' ? 'الإشعارات' : 'Notifications'}
                className="relative p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-slate-100 transition-all duration-200 hidden sm:inline-flex border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-violet-500 text-[10px] font-bold flex items-center justify-center tabular-nums shadow-md">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => handleNav('/admin')}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600/85 hover:bg-violet-600 text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-all duration-200 shadow-md"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {copy.nav.admin}
              </button>
            )}

            <button
              type="button"
              onClick={() => handleNav(user ? '/profile' : '/login')}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              {user ? (
                <UserAvatar
                  photoUrl={userPublic?.photoUrl || user.photoURL}
                  name={userPublic?.displayName || user.displayName}
                  size="sm"
                  className="!w-5 !h-5 !text-[10px] border-white/40"
                />
              ) : (
                <User className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{user ? copy.nav.profile : copy.nav.login}</span>
              <span className="sm:hidden">{user ? (lang === 'ar' ? 'حسابي' : 'Account') : (lang === 'ar' ? 'دخول' : 'Sign In')}</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              className="xl:hidden p-1.5 sm:p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white shrink-0 border border-white/10 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div className="h-[1px] w-full la-gold-hairline" aria-hidden="true" />

        {/* Tablet/Mobile Slide-down Drawer */}
        {mobileOpen && (
          <div className="xl:hidden bg-[#0A132B] border-t border-white/10 px-4 py-4 shadow-2xl">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { path: '/', label: copy.nav.home },
                { path: '/search', label: copy.nav.search },
                { path: '/report-lost', label: copy.nav.reportLost },
                { path: '/report-found', label: copy.nav.reportFound },
                { path: '/map', label: copy.nav.map },
                { path: '/track', label: copy.nav.track },
                { path: '/ai-assistant', label: copy.nav.ai },
                { path: '/organizations', label: copy.nav.orgs },
                { path: '/support', label: copy.nav.help },
                { path: '/qr-tags', label: copy.nav.qrTags },
                { path: '/watchlists', label: copy.nav.watchlists },
              ].map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => handleNav(item.path)}
                  className={`text-start px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    pathOnly === item.path ? 'bg-blue-600 text-white shadow-md' : 'bg-white/[0.06] text-slate-200 hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleNav('/admin')}
                  className="text-start px-3.5 py-2.5 rounded-xl text-sm font-medium bg-violet-600/80 text-white shadow-md"
                >
                  {copy.nav.admin}
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar (< md, compact <= 56px) */}
      <nav
        aria-label="Mobile quick navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 h-14 bg-white/95 dark:bg-[#080F24]/95 backdrop-blur-xl border-t border-slate-200/85 dark:border-white/10 shadow-xl grid grid-cols-5"
      >
        {[
          { path: '/', label: copy.nav.home, icon: Home },
          { path: '/search', label: copy.nav.search, icon: Search },
          { path: '/report-lost', label: lang === 'ar' ? 'إبلاغ' : 'Report', icon: FilePlus2 },
          { path: '/map', label: copy.nav.map, icon: MapPin },
          { path: '/track', label: lang === 'ar' ? 'المحادثات' : 'Chat', icon: MessageSquare, badge: activeCasesCount },
        ].map((item) => {
          const Icon = item.icon;
          const active = pathOnly === item.path;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => handleNav(item.path)}
              className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors duration-200 ${
                active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <span className="relative">
                <Icon className="w-4 h-4" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -end-2 min-w-[14px] h-[14px] px-0.5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                    {item.badge}
                  </span>
                )}
              </span>
              <span className="truncate max-w-[68px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
