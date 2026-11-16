import React from 'react';
import { useApp } from '../context/AppContext';
import { BrandLogo } from './Header';

export const Footer: React.FC = () => {
  const { lang, navigate, platformSettings } = useApp();
  const isAr = lang === 'ar';

  return (
    <footer className="relative bg-[#080F24] text-slate-300 pb-20 md:pb-8 overflow-hidden">
      <div className="h-[1px] w-full la-gold-hairline" aria-hidden="true" />
      <div className="la-egypt-lattice absolute inset-0 opacity-45 pointer-events-none" aria-hidden="true" />
      <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <BrandLogo size={30} />
            <span className="text-lg font-extrabold tracking-tight text-white">
              {platformSettings.platformName || 'LA2EETOH'}
            </span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            {isAr
              ? 'منصة لقيته: شبكة مصرية آمنة للإبلاغ عن المفقودات والمعثورات واستعادتها عبر ٢٧ محافظة.'
              : 'LA2EETOH is a privacy-first Egyptian lost-and-found network connecting citizens and verified institutions across all 27 governorates.'}
          </p>
          <div className="text-xs font-medium text-amber-300/90">
            {isAr ? 'مصر · ٢٧ محافظة · تحقق وحماية خصوصية' : 'Egypt · 27 Governorates · Privacy-First Recovery'}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold tracking-wide text-slate-300 mb-4">
            {isAr ? 'الخدمات الرئيسية' : 'Core Features'}
          </h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <button type="button" onClick={() => navigate('/lost')} className="hover:text-white transition-colors duration-200">
                {isAr ? 'بلاغات المفقودات' : 'Lost Reports'}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate('/found')} className="hover:text-white transition-colors duration-200">
                {isAr ? 'بلاغات المعثورات' : 'Found Reports'}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate('/map')} className="hover:text-white transition-colors duration-200">
                {isAr ? 'الخريطة التفاعلية والخريطة الحرارية' : 'Interactive Map & Heatmap'}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate('/qr-tags')} className="hover:text-white transition-colors duration-200">
                {isAr ? 'رموز QR الذكية' : 'Smart QR Tags'}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate('/watchlists')} className="hover:text-white transition-colors duration-200">
                {isAr ? 'قوائم المراقبة والتنبيهات' : 'Watchlists & Alerts'}
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold tracking-wide text-slate-300 mb-4">
            {isAr ? 'الشبكة والدعم' : 'Network & Support'}
          </h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <button type="button" onClick={() => navigate('/organizations')} className="hover:text-white transition-colors duration-200">
                {isAr ? 'المؤسسات والهيئات' : 'Partner Organizations'}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate('/org-dashboard')} className="hover:text-white transition-colors duration-200">
                {isAr ? 'لوحة تحكم المؤسسات' : 'Institutional Custody Desk'}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate('/track')} className="hover:text-white transition-colors duration-200">
                {isAr ? 'المحادثات وتتبع الاستعادة' : 'Recovery Inbox & Chat'}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate('/support')} className="hover:text-white transition-colors duration-200">
                {isAr ? 'مركز المساعدة والتذاكر' : 'Help Center & Tickets'}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate('/admin-login')} className="hover:text-white transition-colors duration-200">
                {isAr ? 'بوابة المشرفين' : 'Admin Portal'}
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold tracking-wide text-slate-300 mb-4">
            {isAr ? 'الخصوصية والقانونية' : 'Legal & Privacy'}
          </h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <button type="button" onClick={() => navigate('/about')} className="hover:text-white transition-colors duration-200">
                {isAr ? 'عن لقيته' : 'About LA2EETOH'}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate('/privacy')} className="hover:text-white transition-colors duration-200">
                {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate('/terms')} className="hover:text-white transition-colors duration-200">
                {isAr ? 'شروط الاستخدام' : 'Terms of Service'}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate('/contact')} className="hover:text-white transition-colors duration-200">
                {isAr ? 'تواصل معنا' : 'Contact Us'}
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="relative z-10 border-t border-white/[0.08]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span>
            © {new Date().getFullYear()} LA2EETOH Egypt.{' '}
            {isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </span>
          <span>
            {isAr
              ? 'الخصوصية أولاً — لا يتم نشر أرقام الهواتف أو المستندات الكاملة علناً.'
              : 'Privacy-first — phone numbers and sensitive document IDs are never exposed publicly.'}
          </span>
        </div>
      </div>
    </footer>
  );
};
