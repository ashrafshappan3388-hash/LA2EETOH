import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { t } from '../lib/i18n';

export type AdPlacement = 'home' | 'search' | 'sidebar' | 'info';

const SLOT_ENV_MAP: Record<AdPlacement, string | undefined> = {
  home: import.meta.env.VITE_ADSENSE_SLOT_HOME,
  search: import.meta.env.VITE_ADSENSE_SLOT_SEARCH,
  sidebar: import.meta.env.VITE_ADSENSE_SLOT_SIDEBAR,
  info: import.meta.env.VITE_ADSENSE_SLOT_INFO,
};

/**
 * Google AdSense / Ad Manager compliant non-intrusive ad unit.
 * - Never renders inside forms, login/verification, or over maps/buttons.
 * - Remains disabled until publisher ID (ca-pub-...) and admin placement toggle are enabled.
 * - Hides empty container if ad script is blocked or returns unfilled.
 */
export const AdSlot: React.FC<{ placement: AdPlacement; className?: string }> = ({
  placement,
  className = '',
}) => {
  const { lang, platformSettings, isAdmin } = useApp();
  const copy = t(lang);
  const insRef = useRef<HTMLModElement | null>(null);

  const clientId = (import.meta.env.VITE_ADSENSE_CLIENT_ID || '').trim();
  const slotId = (SLOT_ENV_MAP[placement] || '').trim();
  const isPublisherConfigured = clientId.startsWith('ca-pub-') && slotId.length > 0;

  const placementEnabled =
    platformSettings.adsEnabled &&
    ((placement === 'home' && platformSettings.adSlotsHome) ||
      (placement === 'search' && platformSettings.adSlotsSearch) ||
      (placement === 'sidebar' && platformSettings.adSlotsSidebar) ||
      (placement === 'info' && platformSettings.adSlotsInfo));

  useEffect(() => {
    if (!placementEnabled || !isPublisherConfigured) return;

    const scriptId = 'la2eetoh-adsense-script';
    if (!document.getElementById(scriptId)) {
      const s = document.createElement('script');
      s.id = scriptId;
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
      document.head.appendChild(s);
    }

    try {
      const win = window as unknown as { adsbygoogle?: unknown[] };
      win.adsbygoogle = win.adsbygoogle || [];
      win.adsbygoogle.push({});
    } catch {
      // Ad-blocker or script unavailable: degrade silently without affecting platform UX
    }
  }, [placementEnabled, isPublisherConfigured, clientId]);

  if (!placementEnabled) {
    return null;
  }

  // If admin enabled ads in settings but publisher ID/slot env vars aren't configured yet,
  // only show a quiet setup notice to admins; hide completely from public users!
  if (!isPublisherConfigured) {
    if (!isAdmin) return null;
    return (
      <aside
        aria-label={copy.ad.label}
        className={`rounded-2xl border border-dashed border-slate-300 dark:border-white/[0.15] bg-slate-100/70 dark:bg-[#0D1529]/70 px-4 py-3 text-xs text-slate-600 dark:text-slate-400 shadow-sm ${className}`}
      >
        <span className="font-semibold uppercase tracking-wide me-2">{copy.ad.label}</span>
        <span>{copy.ad.disabledNote}</span>
      </aside>
    );
  }

  return (
    <aside
      aria-label={copy.ad.label}
      className={`la-card p-3.5 ${className}`}
    >
      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
        {copy.ad.label}
      </div>
      <ins
        ref={insRef}
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
};
