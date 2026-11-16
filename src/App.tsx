import React from 'react';
import { AlertTriangle, WifiOff, Wrench } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { t } from './lib/i18n';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { ReportWizardPage } from './pages/ReportWizardPage';
import { ReportDetailsPage } from './pages/ReportDetailsPage';
import { MapPage } from './pages/MapPage';
import { RecoveryTrackerPage } from './pages/RecoveryTrackerPage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { WatchlistsPage } from './pages/WatchlistsPage';
import { QrTagsPage } from './pages/QrTagsPage';
import { OrganizationsPage } from './pages/OrganizationsPage';
import { SupportPage } from './pages/SupportPage';
import { ProfilePage } from './pages/ProfilePage';
import { AuthPage } from './pages/AuthPage';
import { AdminPage } from './pages/AdminPage';
import { InfoPage } from './pages/InfoPages';
import { GoogleMapsRootProvider } from './components/EgyptGoogleMap';
import { ErrorBoundary } from './components/ErrorBoundary';

const AppShell: React.FC = () => {
  const {
    lang,
    currentPath,
    navigate,
    isOnline,
    mapsQuotaExceeded,
    platformSettings,
    isAdmin,
  } = useApp();
  const copy = t(lang);
  const isAr = lang === 'ar';

  const [pathname, searchString = ''] = currentPath.split('?');

  const renderPage = () => {
    if (
      platformSettings.maintenanceMode &&
      !isAdmin &&
      pathname !== '/admin-login' &&
      pathname !== '/admin'
    ) {
      return (
        <div className="max-w-[640px] mx-auto px-4 py-16 sm:py-24 text-center">
          <div className="la-card relative overflow-hidden p-8 sm:p-10 space-y-5 shadow-2xl">
            <div className="la-gold-hairline absolute top-0 inset-x-0 h-[2px]" aria-hidden="true" />
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center mx-auto">
              <Wrench className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'الموقع تحت الصيانة الآن' : 'Platform Under Maintenance'}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
              {isAr
                ? 'تقوم إدارة لقيته بأعمال صيانة وتحديث حالياً. يعود الموقع للعمل فور إعادة فتحه من لوحة الإشراف.'
                : 'LA2EETOH is temporarily paused for maintenance. Access will resume once a supervisor reopens the platform.'}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/admin-login')}
                className="la-btn-secondary !text-xs"
              >
                {isAr ? 'دخول المشرفين لفتح الموقع' : 'Supervisor & Admin Sign-In'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (pathname === '/' || pathname === '') return <HomePage />;
    if (pathname === '/search') return <SearchPage key={`search-${searchString}`} />;
    if (pathname === '/lost') return <SearchPage key="lost-feed" defaultType="lost" />;
    if (pathname === '/found') return <SearchPage key="found-feed" defaultType="found" />;
    if (pathname === '/report-lost') return <ReportWizardPage key="wiz-lost" reportType="lost" />;
    if (pathname === '/report-found') return <ReportWizardPage key="wiz-found" reportType="found" />;

    if (pathname.startsWith('/report/')) {
      const id = decodeURIComponent(pathname.slice('/report/'.length));
      return <ReportDetailsPage reportId={id} />;
    }

    if (pathname === '/map') return <MapPage />;
    if (pathname === '/track') return <RecoveryTrackerPage />;
    if (pathname === '/ai-assistant') return <AiAssistantPage />;
    if (pathname === '/watchlists') return <WatchlistsPage />;
    if (pathname === '/qr-tags') return <QrTagsPage />;
    if (pathname.startsWith('/tag/')) {
      const token = decodeURIComponent(pathname.slice('/tag/'.length));
      return <QrTagsPage publicToken={token} />;
    }

    if (pathname === '/organizations') return <OrganizationsPage />;
    if (pathname === '/org-dashboard') return <OrganizationsPage dashboardMode />;

    if (pathname === '/support') return <SupportPage />;
    if (pathname.startsWith('/support/')) {
      const id = decodeURIComponent(pathname.slice('/support/'.length));
      return <SupportPage ticketId={id} />;
    }

    if (pathname === '/profile') return <ProfilePage initialTab="profile" />;
    if (pathname === '/settings') return <ProfilePage initialTab="settings" />;

    if (pathname === '/login') return <AuthPage mode="login" />;
    if (pathname === '/register') return <AuthPage mode="register" />;
    if (pathname === '/admin-login') return <AuthPage mode="admin-login" />;
    if (pathname === '/admin') return <AdminPage />;

    if (pathname === '/about') return <InfoPage page="about" />;
    if (pathname === '/privacy') return <InfoPage page="privacy" />;
    if (pathname === '/terms') return <InfoPage page="terms" />;
    if (pathname === '/contact') return <InfoPage page="contact" />;

    return <HomePage />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FC] dark:bg-[#060B18] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Mandatory Case A Google Maps Demo Key Quota Banner */}
      {mapsQuotaExceeded && (
        <div
          role="status"
          className="sticky top-0 z-50 bg-amber-100 border-b border-amber-300 text-amber-950 px-4 py-2.5 text-xs sm:text-sm flex items-center justify-center gap-2 text-center"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700" />
          <span>
            Google Maps Demo quota has been reached for this project.{' '}
            <a
              href="https://console.cloud.google.com/billing"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline"
            >
              Enable Google Cloud Billing
            </a>{' '}
            or replace VITE_GOOGLE_MAPS_API_KEY to restore unlimited map quota.
          </span>
        </div>
      )}

      {/* Offline State Banner */}
      {!isOnline && (
        <div
          role="status"
          className="bg-slate-800 text-white px-4 py-2 text-xs flex items-center justify-center gap-2"
        >
          <WifiOff className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{copy.common.offline}</span>
        </div>
      )}

      <Header />

      <main className="flex-1">
        <ErrorBoundary key={currentPath} isAr={isAr}>
          {renderPage()}
        </ErrorBoundary>
      </main>

      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <GoogleMapsRootProvider>
        <AppShell />
      </GoogleMapsRootProvider>
    </AppProvider>
  );
}
