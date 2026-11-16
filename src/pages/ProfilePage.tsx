import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BadgeCheck,
  Bell,
  Camera,
  CheckCircle2,
  Download,
  FileText,
  IdCard,
  LayoutDashboard,
  Lock,
  LogOut,
  MapPin,
  MessageCircle,
  Phone,
  QrCode,
  Send,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { t } from '../lib/i18n';
import { findGovernorate } from '../utils/egyptLocations';
import { AVATAR_PRESETS, compressAvatarFile } from '../utils/avatars';
import { maskPhone, normalizeEgyptPhone, toAsciiDigits } from '../utils/phoneVerification';
import { UserAvatar } from '../components/UserAvatar';
import type { WhatsAppSendResult, WhatsAppVerifyResult } from '../types/whatsapp';

export const ProfilePage: React.FC<{ initialTab?: 'dashboard' | 'profile' | 'settings' }> = ({
  initialTab = 'profile',
}) => {
  const {
    lang,
    setLang,
    theme,
    setTheme,
    user,
    isAdmin,
    authReady,
    userPrivate,
    userPublic,
    reports,
    watchlists,
    notifications,
    recoveryCases,
    updatePreferences,
    updateReportStatus,
    markNotificationRead,
    exportMyData,
    deleteMyAccount,
    signOutUser,
    navigate,
  } = useApp();
  const copy = t(lang);
  const isAr = lang === 'ar';

  const [tab, setTab] = useState<'profile' | 'dashboard' | 'reports' | 'notifications' | 'settings'>(
    initialTab
  );
  const [chartWindow, setChartWindow] = useState<7 | 30 | 90>(30);

  const [displayName, setDisplayName] = useState(userPublic?.displayName || user?.displayName || '');
  const [photoUrl, setPhotoUrl] = useState(userPublic?.photoUrl || user?.photoURL || 'avatar:falcon');
  const [address, setAddress] = useState(userPrivate?.address || '');
  const [phone, setPhone] = useState(userPrivate?.phone || '');
  const [notifyInApp, setNotifyInApp] = useState(userPrivate?.notifyInApp ?? true);
  const [notifyEmail, setNotifyEmail] = useState(userPrivate?.notifyEmail ?? false);
  const [notifyPush, setNotifyPush] = useState(userPrivate?.notifyPush ?? false);

  // Sync form state once Firestore user docs hydrate
  useEffect(() => {
    if (userPublic?.displayName) setDisplayName(userPublic.displayName);
    else if (user?.displayName) setDisplayName(user.displayName);

    if (userPublic?.photoUrl) setPhotoUrl(userPublic.photoUrl);
    else if (user?.photoURL) setPhotoUrl(user.photoURL);
  }, [userPublic, user]);

  useEffect(() => {
    if (!userPrivate) return;
    setPhone(userPrivate.phone || '');
    setAddress(userPrivate.address || '');
    setNotifyInApp(userPrivate.notifyInApp ?? true);
    setNotifyEmail(userPrivate.notifyEmail ?? false);
    setNotifyPush(userPrivate.notifyPush ?? false);
  }, [userPrivate]);

  // WhatsApp OTP challenge state
  const [otpChallenge, setOtpChallenge] = useState<WhatsAppSendResult | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const myReports = useMemo(
    () => (user ? reports.filter((r) => r.ownerId === user.uid) : []),
    [reports, user]
  );

  // Real activity series derived from user's actual reports & recovery cases
  const activityPoints = useMemo(() => {
    const buckets = 7;
    const now = Date.now();
    const spanMs = chartWindow * 24 * 60 * 60 * 1000;
    const stepMs = spanMs / buckets;
    const counts = new Array<number>(buckets).fill(0);

    for (const r of myReports) {
      const age = now - r.createdAtMs;
      if (age >= 0 && age <= spanMs) {
        const idx = Math.min(buckets - 1, Math.max(0, buckets - 1 - Math.floor(age / stepMs)));
        counts[idx] += 1;
      }
    }
    for (const c of recoveryCases) {
      const age = now - c.updatedAtMs;
      if (age >= 0 && age <= spanMs) {
        const idx = Math.min(buckets - 1, Math.max(0, buckets - 1 - Math.floor(age / stepMs)));
        counts[idx] += 1;
      }
    }
    return counts;
  }, [myReports, recoveryCases, chartWindow]);

  const currentPhoneNormalized = useMemo(() => normalizeEgyptPhone(phone), [phone]);
  const savedPhoneNormalized = useMemo(
    () => normalizeEgyptPhone(userPrivate?.phone || ''),
    [userPrivate?.phone]
  );
  const isCurrentPhoneVerified = Boolean(
    userPrivate?.phoneVerified &&
      currentPhoneNormalized.valid &&
      savedPhoneNormalized.valid &&
      currentPhoneNormalized.e164 === savedPhoneNormalized.e164
  );

  if (authReady && !user) {
    return (
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
          <UserIcon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {isAr ? 'صفحة العميل والملف الشخصي' : 'Your LA2EETOH Customer Profile'}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {isAr
            ? 'سجّل الدخول لإدارة اسمك، صورتك الشخصية، عنوانك، وتوثيق رقمك عبر رسالة واتساب.'
            : 'Sign in to customize your name, photo or default avatar, private address, and WhatsApp-verified phone number.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="la-btn-primary"
        >
          {copy.nav.login}
        </button>
      </div>
    );
  }

  const maxBucket = Math.max(1, ...activityPoints);
  const svgPoints = activityPoints
    .map((val, i) => {
      const x = 16 + (i / (activityPoints.length - 1)) * 288;
      const y = 96 - (val / maxBucket) * 72;
      return `${x},${y}`;
    })
    .join(' ');

  const successfulReturnsCount =
    recoveryCases.filter((c) => c.stage === 'item_returned' || c.stage === 'case_closed').length +
    (userPublic?.successfulReturns || 0);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressAvatarFile(file, 256, 150_000);
      setPhotoUrl(compressed);
      setFeedback(
        isAr
          ? 'تم تجهيز الصورة الجديدة! اضغط "حفظ ملف العميل" لاعتمادها.'
          : 'Photo prepared! Click "Save Customer Profile" to apply it.'
      );
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Unable to process image.');
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setFeedback(isAr ? 'يرجى كتابة الاسم الكامل.' : 'Please enter your display name.');
      return;
    }

    const trimmedPhone = phone.trim();
    if (trimmedPhone.length > 0 && !currentPhoneNormalized.valid) {
      setFeedback(
        isAr
          ? 'رقم الهاتف غير صالح. أدخل رقم موبايل مصري (مثال 01012345678) أو دولي يبدأ بـ +.'
          : 'Please enter a valid mobile number (e.g. 01012345678 or +201012345678).'
      );
      return;
    }

    setProfileSaving(true);
    setFeedback(null);
    try {
      const normalizedToSave = trimmedPhone ? currentPhoneNormalized.e164 : '';
      const keepsVerification = Boolean(
        userPrivate?.phoneVerified &&
          savedPhoneNormalized.valid &&
          normalizedToSave === savedPhoneNormalized.e164
      );
      await updatePreferences({
        displayName: displayName.trim(),
        photoUrl,
        address: address.trim(),
        phone: normalizedToSave,
        phoneVerified: keepsVerification,
      });
      setFeedback(isAr ? 'تم حفظ بيانات صفحتك الشخصية بنجاح.' : 'Customer profile saved successfully.');
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Unable to save customer profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSendWhatsAppOtp = async () => {
    setOtpError(null);
    setFeedback(null);
    if (!currentPhoneNormalized.valid) {
      setOtpError(
        isAr
          ? 'أدخل رقم موبايل مصري صحيح (مثل 01012345678) أو رقم دولي قبل إرسال الكود.'
          : 'Enter a valid Egyptian or international mobile number first.'
      );
      return;
    }

    setOtpSending(true);
    try {
      const res = await fetch('/api/auth/whatsapp/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: currentPhoneNormalized.e164, lang }),
      });
      const data = (await res.json()) as WhatsAppSendResult & { message?: string };
      if (!res.ok) {
        setOtpError(data.message || 'Failed to send WhatsApp verification code.');
        return;
      }
      setPhone(data.normalizedPhone);
      setOtpChallenge(data);
      setOtpCode('');
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Network error sending WhatsApp code.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyWhatsAppOtp = async () => {
    if (!otpChallenge) return;
    setOtpError(null);
    const cleanCode = toAsciiDigits(otpCode).replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setOtpError(isAr ? 'أدخل الكود المكون من 6 أرقام.' : 'Please enter the 6-digit verification code.');
      return;
    }

    setOtpVerifying(true);
    try {
      const res = await fetch('/api/auth/whatsapp/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: currentPhoneNormalized.e164,
          code: cleanCode,
          challengeToken: otpChallenge.challengeToken,
          lang,
        }),
      });
      const data = (await res.json()) as WhatsAppVerifyResult & { message?: string };
      if (!res.ok || !data.verified) {
        setOtpError(data.message || 'Invalid verification code.');
        return;
      }

      await updatePreferences({
        displayName: displayName.trim() || userPublic?.displayName || 'LA2EETOH Member',
        photoUrl,
        address: address.trim(),
        phone: data.normalizedPhone,
        phoneVerified: true,
        markPhoneVerifiedNow: true,
      });
      setPhone(data.normalizedPhone);
      setOtpChallenge(null);
      setOtpCode('');
      setFeedback(
        isAr
          ? 'تم التحقق من رقمك عبر واتساب وتوثيقه بنجاح!'
          : 'Your WhatsApp phone number has been verified and saved!'
      );
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Verification request failed.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleExportJson = () => {
    const data = exportMyData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `la2eetoh-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Navy Dashboard Sidebar */}
        <aside className="lg:col-span-3 bg-[#080F24] text-slate-200 rounded-2xl border border-white/[0.08] p-4 space-y-1.5 shadow-xl">
          <div className="px-3 py-3 mb-2 flex items-center gap-3">
            <UserAvatar
              photoUrl={photoUrl}
              name={displayName || userPublic?.displayName || user?.displayName}
              size="md"
            />
            <div className="min-w-0">
              <div className="font-bold text-sm text-white truncate flex items-center gap-1">
                <span className="truncate">{displayName || userPublic?.displayName || 'LA2EETOH Member'}</span>
                {isCurrentPhoneVerified && <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />}
              </div>
              <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
            </div>
          </div>
          <div className="la-gold-hairline h-[1px] w-full mb-2" aria-hidden="true" />

          {[
            { id: 'profile', label: isAr ? 'صفحتي الشخصية' : 'Customer Profile', icon: IdCard },
            { id: 'dashboard', label: isAr ? 'لوحة الحساب' : 'Dashboard', icon: LayoutDashboard },
            { id: 'reports', label: isAr ? 'بلاغاتي' : 'My Reports', icon: FileText },
            { id: 'notifications', label: isAr ? 'الإشعارات' : 'Notifications', icon: Bell },
            { id: 'settings', label: isAr ? 'الإعدادات والخصوصية' : 'Settings & Privacy', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id as typeof tab)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-300 hover:bg-white/[0.08]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => navigate('/watchlists')}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors duration-200"
          >
            <Bell className="w-4 h-4" />
            <span>{copy.nav.watchlists}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/qr-tags')}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors duration-200"
          >
            <QrCode className="w-4 h-4" />
            <span>{copy.nav.qrTags}</span>
          </button>

          <div className="pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={async () => {
                await signOutUser();
                navigate('/');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-300 hover:bg-rose-950/50 transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="lg:col-span-9 space-y-6">
          {feedback && (
            <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 px-4 py-3 text-sm text-blue-900 dark:text-blue-200 shadow-md">
              {feedback}
            </div>
          )}

          {tab === 'profile' && (
            <div className="space-y-6">
              {/* Customer Live Identity Card */}
              <div className="la-card relative overflow-hidden p-6 sm:p-7">
                <div className="la-gold-hairline absolute top-0 inset-x-0 h-[2px]" aria-hidden="true" />
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <UserAvatar
                      photoUrl={photoUrl}
                      name={displayName || userPublic?.displayName}
                      size="xl"
                    />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                          {displayName || userPublic?.displayName || (isAr ? 'عضو لقيته' : 'LA2EETOH Member')}
                        </h1>
                        {isCurrentPhoneVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                            <BadgeCheck className="w-3.5 h-3.5" />
                            <span>{isAr ? 'رقم واتساب موثّق' : 'WhatsApp Verified'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-bold">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>{isAr ? 'الرقم غير موثّق' : 'Phone Unverified'}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {address
                          ? address
                          : isAr
                            ? 'لم يتم إضافة العنوان الخاص بعد'
                            : 'No private address saved yet'}
                        {phone && (
                          <span className="ms-2 tabular-nums">
                            · {isCurrentPhoneVerified ? currentPhoneNormalized.display : maskPhone(currentPhoneNormalized.e164 || phone)}
                          </span>
                        )}
                      </p>
                      <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-0.5">
                        <span className="inline-flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          {isAr ? 'نقاط الثقة:' : 'Trust Score:'} {userPublic?.reputationScore ?? 5}.0
                        </span>
                        <span>·</span>
                        <span>
                          {myReports.length} {isAr ? 'بلاغ' : 'reports'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Name, Photo/Default Avatar, Address */}
              <form onSubmit={handleSaveProfile} className="la-card p-6 space-y-6">
                <div className="space-y-1">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                    {isAr ? 'بيانات صفحتك الشخصية' : 'Customer Profile Details'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isAr
                      ? 'يمكنك تعديل اسمك وعنوانك واختيار صورة شخصية أو صورة افتراضية.'
                      : 'Set your name, upload a photo or pick a default avatar, and store your private address.'}
                  </p>
                </div>

                {/* Photo / Default Avatar Picker */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? 'الصورة الشخصية أو اختيار صورة افتراضية' : 'Profile Photo or Default Avatar'}
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer transition-colors">
                      <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>{isAr ? 'رفع صورة من جهازك' : 'Upload Custom Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="sr-only"
                      />
                    </label>
                    {user?.photoURL && (
                      <button
                        type="button"
                        onClick={() => setPhotoUrl(user.photoURL!)}
                        className="la-btn-secondary !px-3.5 !py-2 !text-xs"
                      >
                        {isAr ? 'استخدام صورة حساب جوجل' : 'Use Google Photo'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 pt-1">
                    {AVATAR_PRESETS.map((preset) => {
                      const selected = photoUrl === preset.token;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setPhotoUrl(preset.token)}
                          className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 text-center transition-all duration-200 ${
                            selected
                              ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/30'
                              : 'border-slate-200/80 dark:border-white/[0.08] hover:border-blue-400/50'
                          }`}
                        >
                          <UserAvatar photoUrl={preset.token} name={preset.labelEn} size="md" />
                          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-full">
                            {isAr ? preset.labelAr : preset.labelEn}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isAr ? 'الاسم الكامل' : 'Full Display Name'}
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={80}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={isAr ? 'اكتب اسمك...' : 'Enter your name...'}
                      className="la-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      <span>{isAr ? 'العنوان التفصيلي (خاص ومشفّر)' : 'Private Address (Never Public)'}</span>
                    </label>
                    <input
                      type="text"
                      maxLength={240}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={isAr ? 'المحافظة، المدينة، اسم الشارع...' : 'Governorate, City, Street / Area...'}
                      className="la-input"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Lock className="w-3.5 h-3.5 text-emerald-500" />
                    {isAr
                      ? 'عنوانك ورقم هاتفك محفوظان في ملفك الخاص ولا يظهران للعامة أبداً.'
                      : 'Your address and phone number are stored strictly in your private record.'}
                  </span>
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="la-btn-primary"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {profileSaving
                        ? isAr
                          ? 'جاري الحفظ...'
                          : 'Saving...'
                        : isAr
                          ? 'حفظ بيانات العميل'
                          : 'Save Customer Profile'}
                    </span>
                  </button>
                </div>
              </form>

              {/* WhatsApp Phone Verification Card */}
              <div className="la-card p-6 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span>
                        {isAr ? 'توثيق رقم الهاتف عبر واتساب' : 'WhatsApp Phone Number Verification'}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isAr
                        ? 'أدخل رقم الموبايل واضغط إرسال الكود — يصلك كود التحقق المكون من 6 أرقام لتأكيد حسابك عبر واتساب.'
                        : 'Enter your mobile number and request a 6-digit verification code via WhatsApp.'}
                    </p>
                  </div>

                  {isCurrentPhoneVerified ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isAr ? 'موثّق عبر واتساب' : 'Verified on WhatsApp'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-bold">
                      <Phone className="w-4 h-4" />
                      <span>{isAr ? 'بانتظار التوثيق' : 'Verification Pending'}</span>
                    </span>
                  )}
                </div>

                {otpError && (
                  <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-xs text-red-700 dark:text-red-300 flex flex-wrap items-center justify-between gap-2">
                    <span>{otpError}</span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => navigate('/admin')}
                        className="font-bold underline text-red-900 dark:text-red-200 shrink-0"
                      >
                        {isAr ? 'افتح لوحة الإشراف لربط واتساب' : 'Open Admin WhatsApp Gateway'}
                      </button>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-8">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isAr ? 'رقم الموبايل (واتساب)' : 'WhatsApp Mobile Number'}
                    </label>
                    <input
                      type="tel"
                      dir="ltr"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setOtpChallenge(null);
                        setOtpError(null);
                      }}
                      placeholder="01012345678 / +201012345678"
                      className="la-input tabular-nums"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <button
                      type="button"
                      disabled={otpSending}
                      onClick={handleSendWhatsAppOtp}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all duration-200 disabled:opacity-60"
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {otpSending
                          ? isAr
                            ? 'جاري الإرسال...'
                            : 'Sending...'
                          : isAr
                            ? 'إرسال كود على واتساب'
                            : 'Send WhatsApp Code'}
                      </span>
                    </button>
                  </div>
                </div>

                {otpChallenge && (
                  <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/25 p-5 space-y-4">
                    <div className="text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed flex items-start gap-2.5">
                      <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold">{otpChallenge.message}</p>
                        <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                          {isAr
                            ? 'الكود صالح لمدة 5 دقائق. افتح تطبيق واتساب على رقمك وأدخل الكود هنا.'
                            : 'The 6-digit code is valid for 5 minutes. Check your WhatsApp messages and enter it below.'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-7">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                          {isAr ? 'أدخل كود التحقق (6 أرقام)' : 'Enter 6-Digit WhatsApp Code'}
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          dir="ltr"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="123456"
                          className="la-input font-mono text-base tracking-[0.35em] text-center tabular-nums"
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <button
                          type="button"
                          disabled={otpVerifying}
                          onClick={handleVerifyWhatsAppOtp}
                          className="la-btn-primary w-full !py-2.5"
                        >
                          <BadgeCheck className="w-4 h-4" />
                          <span>
                            {otpVerifying
                              ? isAr
                                ? 'جاري التحقق...'
                                : 'Verifying...'
                              : isAr
                                ? 'تأكيد الكود وتوثيق الرقم'
                                : 'Verify Code'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'dashboard' && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {isAr
                      ? `مرحباً، ${displayName || userPublic?.displayName || 'عضو لقيته'}`
                      : `Welcome back, ${displayName || userPublic?.displayName || 'Member'}`}
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {isAr ? 'ملخص نشاطك الفعلي وحالة بلاغاتك' : "Here's your live account activity and recovery progress"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTab('profile')}
                    className="la-btn-secondary !px-3.5 !py-2 !text-xs"
                  >
                    <IdCard className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تعديل صفحتي وتوثيق الرقم' : 'Edit Profile & Verify Phone'}</span>
                  </button>
                  {!user?.emailVerified && (
                    <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 text-xs font-semibold">
                      {isAr ? 'يرجى تأكيد البريد الإلكتروني للنشر' : 'Verify email to publish reports'}
                    </span>
                  )}
                </div>
              </div>

              {/* 4 Real Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="la-card-interactive p-5 space-y-1">
                  <div className="text-xs font-semibold text-slate-500">{isAr ? 'بلاغاتي' : 'My Reports'}</div>
                  <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
                    {myReports.length}
                  </div>
                </div>
                <div className="la-card-interactive p-5 space-y-1">
                  <div className="text-xs font-semibold text-slate-500">
                    {isAr ? 'عمليات استعادة ناجحة' : 'Successful Returns'}
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {successfulReturnsCount}
                  </div>
                </div>
                <div className="la-card-interactive p-5 space-y-1">
                  <div className="text-xs font-semibold text-slate-500">
                    {isAr ? 'قوائم المراقبة' : 'Watchlist Rules'}
                  </div>
                  <div className="text-2xl font-extrabold text-violet-600 dark:text-violet-400 tabular-nums">
                    {watchlists.length}
                  </div>
                </div>
                <div className="la-card-interactive p-5 space-y-1">
                  <div className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isAr ? 'نقاط الثقة' : 'Reputation'}</span>
                  </div>
                  <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                    {userPublic?.reputationScore ?? 5}.0
                  </div>
                </div>
              </div>

              {/* Recent Activity + Real Activity Chart */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="la-card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-base text-slate-900 dark:text-white">
                      {isAr ? 'أحدث الإشعارات والنشاط' : 'Recent Activity'}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setTab('notifications')}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {isAr ? 'عرض الكل' : 'View All'}
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4">
                      {isAr ? 'لا توجد إشعارات جديدة حالياً.' : 'No recent notifications yet.'}
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {notifications.slice(0, 3).map((n) => (
                        <div
                          key={n.id}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 text-xs space-y-0.5"
                        >
                          <div className="font-bold text-slate-900 dark:text-white">
                            {isAr ? n.titleAr : n.titleEn}
                          </div>
                          <div className="text-slate-600 dark:text-slate-400">
                            {isAr ? n.bodyAr : n.bodyEn}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="la-card p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-bold text-base text-slate-900 dark:text-white">
                      {isAr ? 'نشاطك' : 'Your Activity'}
                    </h2>
                    <div className="flex gap-1">
                      {([7, 30, 90] as const).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setChartWindow(d)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold tabular-nums transition-colors ${
                            chartWindow === d
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>
                  <svg viewBox="0 0 320 112" className="w-full h-32">
                    <line x1="16" y1="96" x2="304" y2="96" stroke="#CBD5E1" strokeWidth="1" />
                    <polyline
                      fill="none"
                      stroke="#4F46E5"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={svgPoints}
                    />
                    {activityPoints.map((val, i) => {
                      const x = 16 + (i / (activityPoints.length - 1)) * 288;
                      const y = 96 - (val / maxBucket) * 72;
                      return <circle key={i} cx={x} cy={y} r="3.5" fill="#2563EB" />;
                    })}
                  </svg>
                </div>
              </div>
            </>
          )}

          {tab === 'reports' && (
            <div className="la-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {isAr ? 'بلاغاتي المنشورة' : 'My Published Reports'}
                </h2>
                <button
                  type="button"
                  onClick={() => navigate('/report-lost')}
                  className="la-btn-primary !px-3.5 !py-2 !text-xs"
                >
                  {isAr ? '+ بلاغ جديد' : '+ New Report'}
                </button>
              </div>
              {myReports.length === 0 ? (
                <p className="text-sm text-slate-500">{isAr ? 'لم تنشر أي بلاغات بعد.' : 'No published reports yet.'}</p>
              ) : (
                <div className="space-y-3">
                  {myReports.map((r) => {
                    const gov = findGovernorate(r.governorateId);
                    return (
                      <div
                        key={r.id}
                        className="p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-3 hover:border-blue-500/40 transition-colors"
                      >
                        <div>
                          <button
                            type="button"
                            onClick={() => navigate(`/report/${r.id}`)}
                            className="font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {r.title}
                          </button>
                          <div className="text-xs text-slate-500">
                            {gov ? (isAr ? gov.nameAr : gov.nameEn) : r.governorateId} · {r.dateOccurred} ·{' '}
                            <strong className="uppercase">{r.status}</strong>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {r.status !== 'recovered' && (
                            <button
                              type="button"
                              onClick={() => updateReportStatus(r.id, 'recovered')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{isAr ? 'تمت الاستعادة' : 'Mark Recovered'}</span>
                            </button>
                          )}
                          {r.status !== 'closed' && (
                            <button
                              type="button"
                              onClick={() => updateReportStatus(r.id, 'closed')}
                              className="la-btn-secondary !px-3 !py-1.5 !text-xs"
                            >
                              {isAr ? 'إغلاق' : 'Close'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'notifications' && (
            <div className="la-card p-6 space-y-4">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {isAr ? 'مركز الإشعارات' : 'Notifications Center'}
              </h2>
              {notifications.length === 0 ? (
                <p className="text-sm text-slate-500">{isAr ? 'لا توجد إشعارات.' : 'No notifications yet.'}</p>
              ) : (
                <div className="space-y-2.5">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-4 rounded-xl border flex items-start justify-between gap-3 transition-colors ${
                        n.read
                          ? 'border-slate-200 dark:border-white/[0.08] opacity-75'
                          : 'border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          {isAr ? n.titleAr : n.titleEn}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {isAr ? n.bodyAr : n.bodyEn}
                        </p>
                        {n.linkPath && (
                          <button
                            type="button"
                            onClick={() => navigate(n.linkPath!)}
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {isAr ? 'فتح التفاصيل ←' : 'Open Link →'}
                          </button>
                        )}
                      </div>
                      {!n.read && (
                        <button
                          type="button"
                          onClick={() => markNotificationRead(n.id)}
                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 shrink-0"
                        >
                          {isAr ? 'تمت القراءة' : 'Mark Read'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'settings' && (
            <div className="space-y-5">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await updatePreferences({
                      preferredLang: lang,
                      preferredTheme: theme,
                      notifyInApp,
                      notifyEmail,
                      notifyPush,
                    });
                    setFeedback(isAr ? 'تم حفظ تفضيلات الحساب.' : 'Account preferences saved.');
                  } catch (err) {
                    setFeedback(err instanceof Error ? err.message : 'Unable to save settings.');
                  }
                }}
                className="la-card p-6 space-y-4"
              >
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {isAr ? 'تفضيلات اللغة والمظهر والإشعارات' : 'Language, Theme & Notification Settings'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isAr ? 'اللغة المفضلة' : 'Preferred Language'}
                    </label>
                    <select
                      value={lang}
                      onChange={(e) => setLang(e.target.value as 'en' | 'ar')}
                      className="la-input"
                    >
                      <option value="en">English (LTR)</option>
                      <option value="ar">العربية (RTL)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isAr ? 'المظهر' : 'Theme Mode'}
                    </label>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                      className="la-input"
                    >
                      <option value="light">{isAr ? 'الوضع النهاري' : 'Light Mode'}</option>
                      <option value="dark">{isAr ? 'الوضع الليلي' : 'Dark Mode'}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? 'تفضيلات الإشعارات' : 'Notification Preferences'}
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input type="checkbox" checked={notifyInApp} onChange={(e) => setNotifyInApp(e.target.checked)} />
                    <span>{isAr ? 'تنبيهات داخل المنصة' : 'In-App Alerts'}</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} />
                    <span>{isAr ? 'إشعارات البريد الإلكتروني للتطابقات' : 'Email Match Notifications'}</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input type="checkbox" checked={notifyPush} onChange={(e) => setNotifyPush(e.target.checked)} />
                    <span>{isAr ? 'إشعارات المتصفح الفورية' : 'Browser Push Alerts'}</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="la-btn-primary"
                >
                  {copy.common.save}
                </button>
              </form>

              {/* Data Export & Account Deletion */}
              <div className="la-card p-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {isAr ? 'تصدير بياناتي أو حذف الحساب' : 'Data Export & Account Deletion'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isAr
                      ? 'يمكنك تحميل نسخة JSON من بياناتك أو حذف حسابك نهائياً.'
                      : 'Download a JSON export of your account data or permanently delete your account.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="la-btn-secondary !py-2 !text-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تصدير JSON' : 'Export JSON'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md shadow-red-600/20 transition-all duration-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isAr ? 'حذف الحساب' : 'Delete Account'}</span>
                  </button>
                </div>
              </div>

              {confirmDelete && (
                <div className="rounded-2xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-5 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-red-800 dark:text-red-200">
                    <ShieldAlert className="w-4 h-4" />
                    <span>
                      {isAr ? 'تأكيد الحذف النهائي للحساب' : 'Confirm Permanent Account Deletion'}
                    </span>
                  </div>
                  <p className="text-xs text-red-700 dark:text-red-300">
                    {isAr
                      ? 'سيؤدي هذا الإجراء إلى حذف ملفك الشخصي من لقيته. قد يتطلب Firebase إعادة تسجيل الدخول مؤخراً قبل الحذف.'
                      : 'This removes your LA2EETOH profile permanently. Firebase may require a recent sign-in for security.'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await deleteMyAccount();
                          navigate('/');
                        } catch (err) {
                          setConfirmDelete(false);
                          setFeedback(err instanceof Error ? err.message : 'Please re-authenticate before deleting.');
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold"
                    >
                      {isAr ? 'نعم، احذف حسابي' : 'Yes, Delete My Account'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                    >
                      {copy.common.cancel}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
