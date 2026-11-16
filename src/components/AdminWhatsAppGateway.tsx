import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  KeyRound,
  Link2,
  Loader2,
  MessageCircle,
  PowerOff,
  QrCode,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  Webhook,
} from 'lucide-react';
import { auth } from '../lib/firebase';
import type { WhatsAppGatewayStatus } from '../types/whatsapp';

interface Props {
  isAr: boolean;
  onStatusUpdated?: (status: WhatsAppGatewayStatus) => void;
}

export const AdminWhatsAppGateway: React.FC<Props> = ({ isAr, onStatusUpdated }) => {
  const [status, setStatus] = useState<WhatsAppGatewayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const [pairingPhone, setPairingPhone] = useState('');
  const [testPhone, setTestPhone] = useState('');

  // External Meta Cloud API & Webhook inputs
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateLang, setTemplateLang] = useState('ar');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookToken, setWebhookToken] = useState('');

  const getAuthHeaders = useCallback(async () => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error(isAr ? 'جلسة المشرف غير صالحة.' : 'Supervisor auth session expired.');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, [isAr]);

  const applyStatus = useCallback(
    (data: WhatsAppGatewayStatus, hydrateFields = false) => {
      setStatus(data);
      onStatusUpdated?.(data);
      if (hydrateFields) {
        if (data.cloudApi.phoneNumberId) setPhoneNumberId(data.cloudApi.phoneNumberId);
        if (data.cloudApi.templateName) setTemplateName(data.cloudApi.templateName);
        if (data.cloudApi.templateLang) setTemplateLang(data.cloudApi.templateLang);
        if (data.webhook.url) setWebhookUrl(data.webhook.url);
      }
    },
    [onStatusUpdated]
  );

  const fetchStatus = useCallback(
    async (hydrateFields = false) => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch('/api/admin/whatsapp/status', { headers });
        if (!res.ok) return;
        const data = (await res.json()) as WhatsAppGatewayStatus;
        applyStatus(data, hydrateFields);
      } catch {
        // handled silently on poll
      } finally {
        setLoading(false);
      }
    },
    [applyStatus, getAuthHeaders]
  );

  useEffect(() => {
    void fetchStatus(true);
  }, [fetchStatus]);

  // Poll automatically while waiting for QR scan or handshake completion
  useEffect(() => {
    if (!status) return;
    const isPending =
      status.direct.status === 'connecting' || status.direct.status === 'qr_ready';
    if (!isPending) return;
    const id = setInterval(() => {
      void fetchStatus(false);
    }, 2500);
    return () => clearInterval(id);
  }, [status, fetchStatus]);

  const handleConnectQr = async (withPairingPhone = false) => {
    setBusyAction(withPairingPhone ? 'pair' : 'qr');
    setFeedback(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/whatsapp/connect', {
        method: 'POST',
        headers,
        body: JSON.stringify(
          withPairingPhone ? { pairingPhone: pairingPhone.trim() } : {}
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ ok: false, text: data.message || 'Unable to initiate WhatsApp link.' });
        return;
      }
      applyStatus(data as WhatsAppGatewayStatus);
      setFeedback({
        ok: true,
        text: withPairingPhone
          ? isAr
            ? 'تم إصدار كود الربط المكون من 8 خانات. أدخله في تطبيق واتساب على هاتف الإدارة.'
            : '8-digit pairing code generated. Enter it inside WhatsApp > Linked Devices.'
          : isAr
            ? 'تم تجهيز رمز QR — امسحه من واتساب على هاتفك (الأجهزة المرتبطة > ربط جهاز).'
            : 'QR code ready — scan it from WhatsApp > Linked Devices.',
      });
    } catch (err) {
      setFeedback({ ok: false, text: err instanceof Error ? err.message : 'Connection failed.' });
    } finally {
      setBusyAction(null);
    }
  };

  const handleDisconnect = async () => {
    setBusyAction('disconnect');
    setFeedback(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/whatsapp/disconnect', { method: 'POST', headers });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ ok: false, text: data.message || 'Unable to disconnect.' });
        return;
      }
      applyStatus(data as WhatsAppGatewayStatus);
      setFeedback({
        ok: true,
        text: isAr ? 'تم فصل جهاز الواتساب بنجاح.' : 'Linked WhatsApp device disconnected.',
      });
    } catch (err) {
      setFeedback({ ok: false, text: err instanceof Error ? err.message : 'Disconnect failed.' });
    } finally {
      setBusyAction(null);
    }
  };

  const handleSaveExternalConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyAction('config');
    setFeedback(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/whatsapp/config', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          cloudApi: {
            phoneNumberId,
            ...(accessToken.trim() ? { accessToken: accessToken.trim() } : {}),
            templateName,
            templateLang,
          },
          webhook: {
            url: webhookUrl,
            ...(webhookToken.trim() ? { token: webhookToken.trim() } : {}),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ ok: false, text: data.message || 'Failed to save settings.' });
        return;
      }
      applyStatus(data as WhatsAppGatewayStatus);
      setAccessToken('');
      setWebhookToken('');
      setFeedback({
        ok: true,
        text: isAr
          ? 'تم حفظ إعدادات بوابة الواتساب الخارجية بنجاح.'
          : 'WhatsApp external gateway configuration saved.',
      });
    } catch (err) {
      setFeedback({ ok: false, text: err instanceof Error ? err.message : 'Failed to save config.' });
    } finally {
      setBusyAction(null);
    }
  };

  const handleTestSend = async () => {
    if (!testPhone.trim()) return;
    setBusyAction('test');
    setFeedback(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/whatsapp/test', {
        method: 'POST',
        headers,
        body: JSON.stringify({ phone: testPhone.trim(), lang: isAr ? 'ar' : 'en' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ ok: false, text: data.message || 'Test dispatch failed.' });
        return;
      }
      setFeedback({ ok: true, text: data.message });
    } catch (err) {
      setFeedback({ ok: false, text: err instanceof Error ? err.message : 'Test request failed.' });
    } finally {
      setBusyAction(null);
    }
  };

  const activeChannelLabel =
    status?.activeChannel === 'whatsapp_direct'
      ? isAr
        ? 'متصل — واتساب مباشر (جهاز مربوط)'
        : 'Active — Direct Linked WhatsApp'
      : status?.activeChannel === 'whatsapp_cloud_api'
        ? isAr
          ? 'متصل — Meta WhatsApp Cloud API'
          : 'Active — Meta WhatsApp Cloud API'
        : status?.activeChannel === 'whatsapp_webhook'
          ? isAr
            ? 'متصل — بوابة Webhook'
            : 'Active — Custom Webhook'
          : isAr
            ? 'غير متصل — يرجى الربط لتفعيل إرسال الأكواد للعملاء'
            : 'Not Connected — Link below to send real WhatsApp OTPs';

  return (
    <div className="space-y-6">
      {/* Top Status Banner */}
      <div
        className={`la-card p-5 flex flex-wrap items-center justify-between gap-4 border ${
          status && status.activeChannel !== 'unconfigured'
            ? 'border-emerald-300/70 bg-emerald-50/70 dark:bg-emerald-950/25 dark:border-emerald-700/50'
            : 'border-amber-300/70 bg-amber-50/70 dark:bg-amber-950/25 dark:border-amber-700/50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-sm ${
              status && status.activeChannel !== 'unconfigured' ? 'bg-emerald-600' : 'bg-amber-600'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
              {isAr ? 'حالة بوابة إرسال أكواد واتساب للعملاء' : 'Customer WhatsApp OTP Delivery Gateway'}
            </div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
              {loading ? (isAr ? 'جاري فحص حالة البوابة...' : 'Checking gateway status...') : activeChannelLabel}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void fetchStatus(false)}
          className="la-btn-secondary !px-3.5 !py-2 !text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{isAr ? 'تحديث الحالة' : 'Refresh'}</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`rounded-2xl border px-4 py-3 text-xs sm:text-sm font-medium ${
            feedback.ok
              ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
              : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Channel 1: Direct Linked WhatsApp Device (QR Scan / Pairing Code) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 la-card p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {isAr
                    ? '1. ربط رقم واتساب مباشرة عبر QR Code (الأسرع)'
                    : '1. Direct WhatsApp Device Link (No Meta Keys Needed)'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {isAr
                  ? 'اربط رقم واتساب الإدارة مرة واحدة بمسح الكود — بعدها أي عميل يكتب رقمه سيصل الكود إلى واتساب العميل فوراً وبشكل حقيقي.'
                  : 'Link your operations WhatsApp phone once by scanning the QR code — every customer OTP is then delivered straight to the customer WhatsApp inbox.'}
              </p>
            </div>
            <span
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                status?.direct.status === 'connected'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {status?.direct.status || 'disconnected'}
            </span>
          </div>

          {status?.direct.status === 'connected' ? (
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {isAr ? 'جهاز الواتساب متصل وجاهز للإرسال' : 'WhatsApp Sender Connected & Ready'}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 tabular-nums mt-0.5">
                    {status.direct.connectedName ? `${status.direct.connectedName} · ` : ''}
                    {status.direct.connectedPhone || 'Linked WhatsApp Session'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                disabled={busyAction === 'disconnect'}
                onClick={handleDisconnect}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
              >
                <PowerOff className="w-3.5 h-3.5" />
                <span>{isAr ? 'فصل الرقم' : 'Disconnect'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {status?.direct.qrDataUrl && (
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#080F24] flex flex-col items-center text-center space-y-3">
                  <img
                    src={status.direct.qrDataUrl}
                    alt="WhatsApp Link QR Code"
                    className="w-56 h-56 rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
                  />
                  <div className="text-xs text-slate-600 dark:text-slate-300 max-w-sm">
                    {isAr
                      ? 'افتح تطبيق واتساب على هاتفك ← الإعدادات ← الأجهزة المرتبطة ← ربط جهاز ← وجّه الكاميرا لهذا الرمز.'
                      : 'Open WhatsApp on your phone -> Settings -> Linked Devices -> Link a Device -> Scan this QR code.'}
                  </div>
                </div>
              )}

              {status?.direct.pairingCode && (
                <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-center space-y-2">
                  <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    {isAr
                      ? 'أدخل هذا الكود في واتساب (الربط برقم الهاتف بدلاً من الكاميرا):'
                      : 'Enter this 8-character code in WhatsApp (Link with phone number):'}
                  </div>
                  <div className="font-mono text-2xl font-extrabold tracking-[0.25em] text-slate-900 dark:text-white select-all">
                    {status.direct.pairingCode}
                  </div>
                </div>
              )}

              {status?.direct.lastError && (
                <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-3.5 py-2.5">
                  {status.direct.lastError}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() => handleConnectQr(false)}
                  className="la-btn-primary"
                >
                  {busyAction === 'qr' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <QrCode className="w-4 h-4" />
                  )}
                  <span>
                    {status?.direct.qrDataUrl
                      ? isAr
                        ? 'تحديث رمز QR'
                        : 'Regenerate QR Code'
                      : isAr
                        ? 'بدء الربط بمسح QR Code'
                        : 'Generate WhatsApp QR Code'}
                  </span>
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] space-y-2.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isAr
                    ? 'أو الربط بكود 8 أرقام بدون كاميرا (أدخل رقم واتساب الإدارة):'
                    : 'Or link without camera using 8-digit pairing code (enter admin WhatsApp number):'}
                </label>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="tel"
                    dir="ltr"
                    value={pairingPhone}
                    onChange={(e) => setPairingPhone(e.target.value)}
                    placeholder="01012345678 / +201012345678"
                    className="la-input flex-1 min-w-[200px] tabular-nums"
                  />
                  <button
                    type="button"
                    disabled={busyAction !== null || !pairingPhone.trim()}
                    onClick={() => handleConnectQr(true)}
                    className="la-btn-secondary !px-4 !text-xs"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إصدار كود ربط' : 'Get Pairing Code'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Live Test Dispatch Box */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/[0.08] space-y-2.5">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              {isAr ? 'اختبار إرسال كود حقيقي على واتساب عميل:' : 'Test Live Customer WhatsApp Delivery:'}
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                type="tel"
                dir="ltr"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="01012345678"
                className="la-input flex-1 min-w-[200px] tabular-nums"
              />
              <button
                type="button"
                disabled={busyAction !== null || !testPhone.trim()}
                onClick={handleTestSend}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isAr ? 'إرسال رسالة اختبار' : 'Send Test OTP'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Channel 2 & 3: Meta WhatsApp Cloud API & Custom Webhook */}
        <form onSubmit={handleSaveExternalConfig} className="lg:col-span-5 la-card p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>
                {isAr
                  ? '2. أو ربط Meta Cloud API / Webhook'
                  : '2. Meta Cloud API / Webhook (Optional)'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? 'إذا كان لديك حساب WhatsApp Business API رسمي أو مزود خدمة خارجي (UltraMsg / Twilio / Evolution)، أدخل البيانات هنا.'
                : 'Alternatively configure official Meta WhatsApp Business Cloud API credentials or an HTTP gateway webhook.'}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Meta Phone Number ID
              </label>
              <input
                type="text"
                dir="ltr"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                placeholder="123456789012345"
                className="la-input tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Meta Access Token {status?.cloudApi.hasAccessToken ? '(Saved — leave blank to keep)' : ''}
              </label>
              <input
                type="password"
                dir="ltr"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="EAAG..."
                className="la-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'اسم القالب (اختياري)' : 'Template Name'}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="otp_verify"
                  className="la-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'لغة القالب' : 'Template Lang'}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={templateLang}
                  onChange={(e) => setTemplateLang(e.target.value)}
                  placeholder="ar"
                  className="la-input"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                <Webhook className="w-3.5 h-3.5 text-violet-500" />
                <span>{isAr ? 'بوابة HTTP / Webhook مخصصة' : 'Custom HTTP / Webhook Gateway'}</span>
              </div>
              <input
                type="url"
                dir="ltr"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://api.example.com/whatsapp/send"
                className="la-input"
              />
              <input
                type="password"
                dir="ltr"
                value={webhookToken}
                onChange={(e) => setWebhookToken(e.target.value)}
                placeholder={
                  status?.webhook.hasToken
                    ? 'Bearer token saved (leave blank to keep)'
                    : 'Optional Bearer Token'
                }
                className="la-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busyAction === 'config'}
            className="la-btn-primary w-full"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {busyAction === 'config'
                ? isAr
                  ? 'جاري الحفظ...'
                  : 'Saving...'
                : isAr
                  ? 'حفظ إعدادات API / Webhook'
                  : 'Save API / Webhook Settings'}
            </span>
          </button>

          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 shrink-0" />
            <span>
              {isAr
                ? 'أولوية الإرسال: 1) الجهاز المربوط بـ QR ← 2) Meta Cloud API ← 3) Webhook.'
                : 'Priority: 1) QR Linked WhatsApp -> 2) Meta Cloud API -> 3) Webhook.'}
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
