import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Google Maps Platform Tier-1 runtime quota & auth listener
(window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
};

window.addEventListener(
  'error',
  (event: Event) => {
    const target = event.target as HTMLScriptElement | null;
    if (target && target.tagName === 'SCRIPT' && target.src?.includes('maps.googleapis.com')) {
      window.dispatchEvent(new CustomEvent('gmp-load-error'));
      return;
    }
    const errEvent = event as ErrorEvent;
    if (errEvent.message === 'Script error.' && !errEvent.filename) {
      const mapsScriptPresent = Boolean(
        document.querySelector('script[src*="maps.googleapis.com"]')
      );
      if (mapsScriptPresent && !(window as unknown as { google?: { maps?: unknown } }).google?.maps) {
        window.dispatchEvent(new CustomEvent('gmp-load-error'));
      }
    }
  },
  true
);

const origError = console.error;
console.error = (...args: unknown[]) => {
  origError.apply(console, args);
  const msg = args.map((a) => String(a)).join(' ');
  if (msg.includes('OverQuotaMapError') || msg.includes('QuotaExceededError')) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
};

createRoot(document.getElementById('root')!).render(<App />);
