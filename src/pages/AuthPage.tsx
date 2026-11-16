import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BrandLogo } from '../components/Header';

export const AuthPage: React.FC<{ mode: 'login' | 'register' | 'admin-login' }> = ({ mode }) => {
  const {
    lang,
    user,
    isAdmin,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    resetPassword,
    navigate,
  } = useApp();
  const isAr = lang === 'ar';

  const [tab, setTab] = useState<'login' | 'register' | 'reset'>(
    mode === 'register' ? 'register' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (mode === 'admin-login' && user && isAdmin) {
    return (
      <div className="max-w-[520px] mx-auto px-4 py-16 text-center space-y-4">
        <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto" />
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          {isAr ? 'تم التحقق من صلاحية المشرف' : 'Super Admin Verified'}
        </h1>
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold"
        >
          {isAr ? 'دخول لوحة تحكم الإدارة' : 'Open Admin Command Center'}
        </button>
      </div>
    );
  }

  const handleGoogle = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
      navigate(mode === 'admin-login' ? '/admin' : '/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google Sign-In failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (tab === 'login') {
        await signInWithEmail(email.trim(), password);
        navigate(mode === 'admin-login' ? '/admin' : '/profile');
      } else if (tab === 'register') {
        await registerWithEmail(email.trim(), password, displayName);
        setMessage(
          isAr
            ? 'تم إنشاء الحساب وإرسال رابط تأكيد البريد الإلكتروني. يرجى تأكيد بريدك قبل النشر.'
            : 'Account created and verification email sent. Please verify your email before publishing reports.'
        );
      } else {
        await resetPassword(email.trim());
        setMessage(
          isAr
            ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.'
            : 'Password reset link sent to your email address.'
        );
      }
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setError(
          isAr
            ? 'تسجيل الدخول بالبريد وكلمة المرور غير مفعّل حالياً في إعدادات Firebase Authentication. استخدم تسجيل الدخول بجوجل.'
            : 'Email/Password sign-in is currently disabled in Firebase Authentication settings. Please sign in with Google.'
        );
      } else {
        setError(err instanceof Error ? err.message : 'Authentication failed.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-[460px] mx-auto px-4 sm:px-6 py-12 sm:py-14">
      <div className="la-card relative overflow-hidden !rounded-3xl p-6 sm:p-8 !shadow-2xl space-y-6">
        <div className="la-gold-hairline absolute top-0 inset-x-0 h-[2px]" aria-hidden="true" />
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <BrandLogo size={40} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {mode === 'admin-login'
              ? isAr
                ? 'بوابة تسجيل دخول المشرفين'
                : 'Admin Portal Sign-In'
              : tab === 'register'
                ? isAr
                  ? 'إنشاء حساب في لقيته'
                  : 'Create LA2EETOH Account'
                : tab === 'reset'
                  ? isAr
                    ? 'إعادة تعيين كلمة المرور'
                    : 'Reset Password'
                  : isAr
                    ? 'تسجيل الدخول إلى لقيته'
                    : 'Sign In to LA2EETOH'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isAr
              ? 'تسجيل دخول آمن — لا تُعرض أي إعلانات أثناء المصادقة.'
              : 'Zero ads are shown during sign-in or account verification.'}
          </p>
        </div>

        {mode === 'admin-login' && user && !isAdmin && (
          <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-900 dark:text-amber-200">
            {isAr
              ? `الحساب الحالي (${user.email}) لا يملك صلاحية المشرف العام.`
              : `Signed in as ${user.email}, which does not hold Super Admin privileges.`}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-800 dark:text-emerald-200">
            {message}
          </div>
        )}

        {/* Primary Google Sign-In */}
        <button
          type="button"
          disabled={busy}
          onClick={handleGoogle}
          className="la-btn-primary w-full !py-3 !font-bold"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{isAr ? 'المتابعة باستخدام جوجل' : 'Continue with Google'}</span>
        </button>

        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-slate-200 dark:border-white/[0.08]" />
          <span className="shrink mx-3 text-xs text-slate-400">
            {isAr ? 'أو بالبريد الإلكتروني' : 'or with email'}
          </span>
          <div className="flex-grow border-t border-slate-200 dark:border-white/[0.08]" />
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'الاسم الكامل' : 'Full Name'}
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="la-input"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAr ? 'البريد الإلكتروني' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="la-input !ps-10"
              />
            </div>
          </div>

          {tab !== 'reset' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="la-input !ps-10"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="la-btn-secondary w-full !py-2.5"
          >
            {tab === 'login'
              ? isAr
                ? 'تسجيل الدخول'
                : 'Sign In'
              : tab === 'register'
                ? isAr
                  ? 'إنشاء الحساب'
                  : 'Create Account'
                : isAr
                  ? 'إرسال رابط الاستعادة'
                  : 'Send Reset Link'}
          </button>
        </form>

        {mode !== 'admin-login' && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-white/[0.08]">
            {tab !== 'login' ? (
              <button type="button" onClick={() => setTab('login')} className="text-blue-600 dark:text-blue-400 hover:underline transition-colors">
                {isAr ? 'لدي حساب بالفعل' : 'Already have an account? Sign In'}
              </button>
            ) : (
              <button type="button" onClick={() => setTab('register')} className="text-blue-600 dark:text-blue-400 hover:underline transition-colors">
                {isAr ? 'إنشاء حساب جديد' : 'Create new account'}
              </button>
            )}
            {tab !== 'reset' && (
              <button type="button" onClick={() => setTab('reset')} className="hover:underline transition-colors">
                {isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
