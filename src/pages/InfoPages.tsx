import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AdSlot } from '../components/AdSlot';

export const InfoPage: React.FC<{ page: 'about' | 'privacy' | 'terms' | 'contact' }> = ({ page }) => {
  const { lang, user, createSupportTicket, navigate } = useApp();
  const isAr = lang === 'ar';

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <div className="max-w-[920px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {page === 'about' && (
        <article className="la-card relative overflow-hidden p-6 sm:p-8 space-y-4">
          <div className="la-gold-hairline absolute top-0 inset-x-0 h-[2px]" aria-hidden="true" />
          <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>{isAr ? 'عن منصة لقيته' : 'About LA2EETOH'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {isAr ? 'شبكة مصر الوطنية لاستعادة المفقودات بأمان' : "Egypt's Privacy-First Lost & Found Network"}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            {isAr
              ? 'تهدف منصة لقيته إلى ربط المواطنين، والجامعات، ومحطات المترو والسكك الحديدية، والمطارات في جميع محافظات مصر الـ ٢٧ عبر تجربة ثنائية اللغة (عربي / إنجليزي) تحمي الخصوصية وتدعم التحقق الآمن من الملكية.'
              : 'LA2EETOH connects citizens, universities, metro lines, railway stations, and airports across all 27 Egyptian governorates with a bilingual (Arabic/English), privacy-first recovery workflow.'}
          </p>
        </article>
      )}

      {page === 'privacy' && (
        <article className="la-card p-6 sm:p-8 space-y-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {isAr ? 'سياسة الخصوصية وحماية البيانات' : 'Privacy Policy & Data Protection'}
          </h1>
          <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300 list-disc ps-5 leading-relaxed">
            <li>
              {isAr
                ? 'لا يُنشر رقم هاتفك أو بريدك الإلكتروني أو عنوان منزلك علناً في البلاغات أو عند مسح رموز QR الذكية.'
                : 'Personal phone numbers, emails, and home addresses are never exposed on public reports or Smart QR scans.'}
            </li>
            <li>
              {isAr
                ? 'عند اختيار «الموقع العام التقريبي»، تُخزّن الإحداثيات الدقيقة بشكل خاص ويُعرض نطاق تقريبي (~١.٥ كم) على الخريطة العامة.'
                : 'When Approximate Public Location is chosen, exact coordinates stay private and public maps display a ~1.5 km grid area.'}
            </li>
            <li>
              {isAr
                ? 'تُنقّى أرقام الرقم القومي (١٤ رقماً) وأرقام البطاقات البنكية وIBAN تلقائياً قبل النشر.'
                : '14-digit Egyptian National IDs, payment card numbers, and IBANs are automatically redacted from public report fields.'}
            </li>
            <li>
              {isAr
                ? 'البحث البصري بالذكاء الاصطناعي يحلل مواصفات الأغراض فقط ولا يقوم بأي تعرف على الوجوه.'
                : 'AI Visual Search analyzes object attributes only and never performs facial recognition.'}
            </li>
          </ul>
        </article>
      )}

      {page === 'terms' && (
        <article className="la-card p-6 sm:p-8 space-y-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {isAr ? 'شروط الاستخدام' : 'Terms of Service'}
          </h1>
          <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300 list-disc ps-5 leading-relaxed">
            <li>
              {isAr
                ? 'يُحظر نشر بلاغات وهمية أو طلب مقابل مادي غير قانوني أو ابتزاز أصحاب المفقودات.'
                : 'Submitting fabricated reports, deceptive claims, or unlawful demands is strictly prohibited and subject to moderation removal.'}
            </li>
            <li>
              {isAr
                ? 'تُعد مؤشرات الذكاء الاصطناعي استرشادية فقط، وتقع مسؤولية التحقق من الملكية والتسليم في مكان عام آمن على الطرفين.'
                : 'AI matching suggestions are assistive only; users must verify non-public identifying details and meet at safe public desks.'}
            </li>
          </ul>
        </article>
      )}

      {page === 'contact' && (
        <div className="la-card p-6 sm:p-8 space-y-5">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {isAr ? 'تواصل مع فريق لقيته' : 'Contact LA2EETOH Support'}
          </h1>
          {sent ? (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 text-sm text-emerald-800 dark:text-emerald-200">
              {isAr ? 'تم استلام رسالتك في نظام التذاكر بنجاح.' : 'Your message has been logged in our support ticket system.'}
            </div>
          ) : !user ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {isAr
                  ? 'يرجى تسجيل الدخول لإرسال رسالة موثقة عبر مركز المساعدة.'
                  : 'Please sign in to send an authenticated inquiry through our support desk.'}
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="la-btn-primary"
              >
                {isAr ? 'تسجيل الدخول' : 'Sign In'}
              </button>
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!subject.trim() || !body.trim()) return;
                await createSupportTicket({
                  subject,
                  category: 'technical',
                  priority: 'medium',
                  initialMessage: body,
                });
                setSent(true);
              }}
              className="space-y-3.5"
            >
              <input
                type="text"
                required
                minLength={4}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={isAr ? 'موضوع الرسالة *' : 'Subject *'}
                className="la-input"
              />
              <textarea
                required
                minLength={10}
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={isAr ? 'اكتب رسالتك هنا...' : 'Write your inquiry...'}
                className="la-input"
              />
              <button
                type="submit"
                className="la-btn-primary"
              >
                {isAr ? 'إرسال الرسالة' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Compliant Bottom Ad Placement on Selected Informational Pages */}
      <AdSlot placement="info" />
    </div>
  );
};
