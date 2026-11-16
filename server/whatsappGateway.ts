import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  type WASocket,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import QRCode from 'qrcode';
import { normalizeEgyptPhone } from '../src/utils/phoneVerification.ts';
import type {
  DirectWhatsAppStatus,
  WhatsAppDeliveryChannel,
  WhatsAppGatewayStatus,
} from '../src/types/whatsapp.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const AUTH_DIR = path.join(ROOT_DIR, '.whatsapp-auth');
const CONFIG_FILE = path.join(ROOT_DIR, '.whatsapp-gateway.json');

interface PersistedGatewayConfig {
  cloudApi?: {
    accessToken?: string;
    phoneNumberId?: string;
    templateName?: string;
    templateLang?: string;
  };
  webhook?: {
    url?: string;
    token?: string;
  };
}

let activeSocket: WASocket | null = null;
let directStatus: DirectWhatsAppStatus = 'disconnected';
let connectedPhone: string | undefined;
let connectedName: string | undefined;
let latestQrDataUrl: string | null = null;
let latestPairingCode: string | null = null;
let lastDirectError: string | null = null;
let isShuttingDownIntentionally = false;
let connectInFlight: Promise<void> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function readPersistedConfig(): PersistedGatewayConfig {
  if (!fs.existsSync(CONFIG_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) as PersistedGatewayConfig;
  } catch {
    return {};
  }
}

function writePersistedConfig(next: PersistedGatewayConfig) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(next, null, 2), { encoding: 'utf8', mode: 0o600 });
}

function getEffectiveCloudApiConfig() {
  const persisted = readPersistedConfig().cloudApi || {};
  const accessToken =
    persisted.accessToken?.trim() || process.env.WHATSAPP_ACCESS_TOKEN?.trim() || '';
  const phoneNumberId =
    persisted.phoneNumberId?.trim() || process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || '';
  const templateName =
    persisted.templateName?.trim() || process.env.WHATSAPP_TEMPLATE_NAME?.trim() || '';
  const templateLang =
    persisted.templateLang?.trim() || process.env.WHATSAPP_TEMPLATE_LANG?.trim() || 'ar';
  return {
    accessToken,
    phoneNumberId,
    templateName,
    templateLang,
    configured: Boolean(accessToken && phoneNumberId),
  };
}

function getEffectiveWebhookConfig() {
  const persisted = readPersistedConfig().webhook || {};
  const url = persisted.url?.trim() || process.env.WHATSAPP_WEBHOOK_URL?.trim() || '';
  const token = persisted.token?.trim() || process.env.WHATSAPP_WEBHOOK_TOKEN?.trim() || '';
  return {
    url,
    token,
    configured: Boolean(url),
  };
}

function hasSavedDirectSession(): boolean {
  return fs.existsSync(path.join(AUTH_DIR, 'creds.json'));
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function cleanupSocketOnly() {
  clearReconnectTimer();
  if (activeSocket) {
    try {
      activeSocket.ev.removeAllListeners('connection.update');
      activeSocket.ev.removeAllListeners('creds.update');
      activeSocket.end(undefined);
    } catch {
      // ignore teardown errors
    }
    activeSocket = null;
  }
}

export function getWhatsAppGatewayStatus(): WhatsAppGatewayStatus {
  const cloud = getEffectiveCloudApiConfig();
  const webhook = getEffectiveWebhookConfig();
  let activeChannel: WhatsAppDeliveryChannel = 'unconfigured';
  if (directStatus === 'connected') {
    activeChannel = 'whatsapp_direct';
  } else if (cloud.configured) {
    activeChannel = 'whatsapp_cloud_api';
  } else if (webhook.configured) {
    activeChannel = 'whatsapp_webhook';
  }

  return {
    activeChannel,
    direct: {
      status: directStatus,
      connectedPhone,
      connectedName,
      qrDataUrl: latestQrDataUrl,
      pairingCode: latestPairingCode,
      lastError: lastDirectError,
      hasSavedSession: hasSavedDirectSession(),
    },
    cloudApi: {
      configured: cloud.configured,
      phoneNumberId: cloud.phoneNumberId || undefined,
      templateName: cloud.templateName || undefined,
      templateLang: cloud.templateLang || undefined,
      hasAccessToken: Boolean(cloud.accessToken),
    },
    webhook: {
      configured: webhook.configured,
      url: webhook.url || undefined,
      hasToken: Boolean(webhook.token),
    },
  };
}

async function startDirectSocketInternal(pairingWaDigits?: string): Promise<void> {
  cleanupSocketOnly();
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  isShuttingDownIntentionally = false;
  directStatus = 'connecting';
  latestQrDataUrl = null;
  if (!pairingWaDigits) latestPairingCode = null;
  lastDirectError = null;

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  let version: [number, number, number] | undefined;
  try {
    const latest = await fetchLatestBaileysVersion();
    version = latest.version;
  } catch {
    version = undefined;
  }

  const sock = makeWASocket({
    auth: state,
    ...(version ? { version } : {}),
    logger: pino({ level: 'silent' }),
    browser: Browsers.ubuntu('LA2EETOH'),
    markOnlineOnConnect: false,
    syncFullHistory: false,
    printQRInTerminal: false,
  });

  activeSocket = sock;
  sock.ev.on('creds.update', saveCreds);

  let pairingRequested = false;

  sock.ev.on('connection.update', async (update) => {
    if (activeSocket !== sock) return;
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      if (pairingWaDigits && !pairingRequested && !state.creds.registered) {
        pairingRequested = true;
        try {
          const code = await sock.requestPairingCode(pairingWaDigits);
          latestPairingCode = code;
          directStatus = 'qr_ready';
        } catch (err) {
          lastDirectError =
            err instanceof Error ? err.message : 'Failed to request WhatsApp pairing code.';
        }
      } else {
        try {
          latestQrDataUrl = await QRCode.toDataURL(qr, { width: 280, margin: 2 });
          directStatus = 'qr_ready';
          lastDirectError = null;
        } catch (err) {
          lastDirectError =
            err instanceof Error ? err.message : 'Failed to generate QR code.';
        }
      }
    }

    if (connection === 'open') {
      directStatus = 'connected';
      latestQrDataUrl = null;
      latestPairingCode = null;
      lastDirectError = null;
      const rawId = sock.user?.id || '';
      const digits = rawId.split(':')[0]?.split('@')[0];
      connectedPhone = digits ? `+${digits}` : undefined;
      connectedName = sock.user?.name || undefined;
    }

    if (connection === 'close') {
      if (isShuttingDownIntentionally) {
        directStatus = 'disconnected';
        return;
      }

      const statusCode = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
      const isLoggedOut =
        statusCode === DisconnectReason.loggedOut ||
        statusCode === DisconnectReason.badSession ||
        statusCode === DisconnectReason.forbidden;

      if (isLoggedOut) {
        directStatus = 'disconnected';
        connectedPhone = undefined;
        connectedName = undefined;
        latestQrDataUrl = null;
        latestPairingCode = null;
        lastDirectError = 'WhatsApp session was logged out. Scan a new QR code to reconnect.';
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        return;
      }

      if (statusCode === DisconnectReason.restartRequired || statusCode === 515) {
        reconnectTimer = setTimeout(() => {
          void connectDirectWhatsApp();
        }, 700);
        return;
      }

      // Auto-retry once if session creds already exist; otherwise wait for user QR action
      if (hasSavedDirectSession()) {
        directStatus = 'connecting';
        reconnectTimer = setTimeout(() => {
          void connectDirectWhatsApp();
        }, 2500);
      } else {
        directStatus = 'disconnected';
        latestQrDataUrl = null;
        lastDirectError =
          lastDisconnect?.error instanceof Error
            ? lastDisconnect.error.message
            : 'WhatsApp connection closed before pairing completed.';
      }
    }
  });
}

export async function connectDirectWhatsApp(pairingPhoneInput?: string): Promise<WhatsAppGatewayStatus> {
  if (connectInFlight) {
    await connectInFlight.catch(() => {});
  }

  let pairingDigits: string | undefined;
  if (pairingPhoneInput && pairingPhoneInput.trim()) {
    const norm = normalizeEgyptPhone(pairingPhoneInput);
    if (!norm.valid) {
      throw new Error(norm.error || 'Invalid WhatsApp phone number for pairing code.');
    }
    pairingDigits = norm.waDigits;
    // Fresh pairing code requires clean un-registered auth folder
    isShuttingDownIntentionally = true;
    cleanupSocketOnly();
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
  }

  connectInFlight = startDirectSocketInternal(pairingDigits).finally(() => {
    connectInFlight = null;
  });
  await connectInFlight;

  // Give Baileys up to ~2.5s on fresh connect to receive first QR/pairing event
  if (!hasSavedDirectSession() || pairingDigits) {
    for (let i = 0; i < 12; i += 1) {
      if (latestQrDataUrl || latestPairingCode || directStatus === 'connected' || lastDirectError) {
        break;
      }
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  return getWhatsAppGatewayStatus();
}

export async function disconnectDirectWhatsApp(wipeAuth = true): Promise<WhatsAppGatewayStatus> {
  isShuttingDownIntentionally = true;
  if (activeSocket && directStatus === 'connected' && wipeAuth) {
    try {
      await activeSocket.logout();
    } catch {
      // fallback to socket teardown
    }
  }
  cleanupSocketOnly();
  directStatus = 'disconnected';
  connectedPhone = undefined;
  connectedName = undefined;
  latestQrDataUrl = null;
  latestPairingCode = null;
  lastDirectError = null;
  if (wipeAuth) {
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
  }
  return getWhatsAppGatewayStatus();
}

export function resumeSavedDirectWhatsAppOnStartup(): void {
  if (hasSavedDirectSession()) {
    void connectDirectWhatsApp().catch((err) => {
      lastDirectError = err instanceof Error ? err.message : 'Auto-reconnect failed.';
    });
  }
}

export function saveExternalWhatsAppConfig(input: {
  cloudApi?: {
    accessToken?: string;
    phoneNumberId?: string;
    templateName?: string;
    templateLang?: string;
    clearAccessToken?: boolean;
  };
  webhook?: {
    url?: string;
    token?: string;
    clearToken?: boolean;
  };
}): WhatsAppGatewayStatus {
  const current = readPersistedConfig();
  const next: PersistedGatewayConfig = {
    cloudApi: { ...(current.cloudApi || {}) },
    webhook: { ...(current.webhook || {}) },
  };

  if (input.cloudApi && next.cloudApi) {
    if (input.cloudApi.phoneNumberId !== undefined) {
      next.cloudApi.phoneNumberId = input.cloudApi.phoneNumberId.trim();
    }
    if (input.cloudApi.templateName !== undefined) {
      next.cloudApi.templateName = input.cloudApi.templateName.trim();
    }
    if (input.cloudApi.templateLang !== undefined) {
      next.cloudApi.templateLang = input.cloudApi.templateLang.trim() || 'ar';
    }
    if (input.cloudApi.clearAccessToken) {
      delete next.cloudApi.accessToken;
    } else if (input.cloudApi.accessToken && input.cloudApi.accessToken.trim()) {
      next.cloudApi.accessToken = input.cloudApi.accessToken.trim();
    }
  }

  if (input.webhook && next.webhook) {
    if (input.webhook.url !== undefined) {
      next.webhook.url = input.webhook.url.trim();
    }
    if (input.webhook.clearToken) {
      delete next.webhook.token;
    } else if (input.webhook.token && input.webhook.token.trim()) {
      next.webhook.token = input.webhook.token.trim();
    }
  }

  writePersistedConfig(next);
  return getWhatsAppGatewayStatus();
}

export type DispatchOtpOutcome =
  | {
      delivered: true;
      channel: 'whatsapp_direct' | 'whatsapp_cloud_api' | 'whatsapp_webhook';
    }
  | {
      delivered: false;
      channel: 'unconfigured' | 'whatsapp_direct' | 'whatsapp_cloud_api' | 'whatsapp_webhook';
      statusCode: number;
      errorCode: string;
      messageEn: string;
      messageAr: string;
      details?: unknown;
    };

export async function dispatchCustomerWhatsAppOtp(params: {
  e164: string;
  waDigits: string;
  code: string;
  lang: 'ar' | 'en';
}): Promise<DispatchOtpOutcome> {
  const { e164, waDigits, code, lang } = params;
  const waText =
    lang === 'ar'
      ? `رمز التحقق الخاص بك في منصة لقيته هو: ${code}\nصالح لمدة 5 دقائق. لا تشارك هذا الرمز مع أي شخص.`
      : `Your LA2EETOH verification code is: ${code}\nValid for 5 minutes. Never share this code with anyone.`;

  // 1. Direct Linked WhatsApp Device (QR / Pairing Code)
  if (activeSocket && directStatus === 'connected') {
    try {
      const lookup = await activeSocket.onWhatsApp(`${waDigits}@s.whatsapp.net`).catch(() => []);
      const record = Array.isArray(lookup) ? lookup[0] : undefined;
      if (record && record.exists === false) {
        return {
          delivered: false,
          channel: 'whatsapp_direct',
          statusCode: 400,
          errorCode: 'NUMBER_NOT_ON_WHATSAPP',
          messageEn: 'This mobile number is not registered on WhatsApp. Please check the number.',
          messageAr: 'هذا الرقم غير مسجل على واتساب. تأكد من رقم الموبايل وأعد المحاولة.',
        };
      }

      const targetJid = record?.jid || `${waDigits}@s.whatsapp.net`;
      await activeSocket.sendMessage(targetJid, { text: waText });
      return { delivered: true, channel: 'whatsapp_direct' };
    } catch (err) {
      return {
        delivered: false,
        channel: 'whatsapp_direct',
        statusCode: 502,
        errorCode: 'DIRECT_WHATSAPP_SEND_FAILED',
        messageEn: err instanceof Error ? err.message : 'Failed to send via linked WhatsApp device.',
        messageAr: 'تعذر إرسال الرسالة عبر جهاز الواتساب المربوط. تأكد من اتصال الجهاز من لوحة المشرف.',
      };
    }
  }

  // 2. Official Meta WhatsApp Business Cloud API
  const cloud = getEffectiveCloudApiConfig();
  if (cloud.configured) {
    try {
      const bodyPayload = cloud.templateName
        ? {
            messaging_product: 'whatsapp',
            to: waDigits,
            type: 'template',
            template: {
              name: cloud.templateName,
              language: { code: cloud.templateLang || 'ar' },
              ...(cloud.templateName === 'hello_world'
                ? {}
                : {
                    components: [
                      {
                        type: 'body',
                        parameters: [{ type: 'text', text: code }],
                      },
                    ],
                  }),
            },
          }
        : {
            messaging_product: 'whatsapp',
            to: waDigits,
            type: 'text',
            text: { body: waText },
          };

      const waRes = await fetch(
        `https://graph.facebook.com/v20.0/${encodeURIComponent(cloud.phoneNumberId)}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cloud.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyPayload),
        }
      );

      if (!waRes.ok) {
        const errPayload = await waRes.json().catch(() => ({}));
        return {
          delivered: false,
          channel: 'whatsapp_cloud_api',
          statusCode: 502,
          errorCode: 'WHATSAPP_CLOUD_API_FAILED',
          messageEn: 'Meta WhatsApp Cloud API rejected the OTP message.',
          messageAr: 'رفضت واجهة Meta WhatsApp API إرسال الكود. تأكد من صلاحية التوكن والقالب المعتمد.',
          details: errPayload,
        };
      }

      return { delivered: true, channel: 'whatsapp_cloud_api' };
    } catch (err) {
      return {
        delivered: false,
        channel: 'whatsapp_cloud_api',
        statusCode: 502,
        errorCode: 'WHATSAPP_CLOUD_NETWORK_ERROR',
        messageEn: err instanceof Error ? err.message : 'Network error calling Meta Cloud API.',
        messageAr: 'حدث خطأ شبكي أثناء الاتصال بـ WhatsApp Cloud API.',
      };
    }
  }

  // 3. Custom Webhook Gateway (Twilio / UltraMsg / Evolution API / Webhook)
  const webhook = getEffectiveWebhookConfig();
  if (webhook.configured) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (webhook.token) headers.Authorization = `Bearer ${webhook.token}`;
      const hookRes = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          to: e164,
          waDigits,
          code,
          message: waText,
          lang,
        }),
      });
      if (!hookRes.ok) {
        return {
          delivered: false,
          channel: 'whatsapp_webhook',
          statusCode: 502,
          errorCode: 'WHATSAPP_WEBHOOK_FAILED',
          messageEn: `WhatsApp webhook returned HTTP ${hookRes.status}.`,
          messageAr: `فشل إرسال الرسالة عبر بوابة Webhook (HTTP ${hookRes.status}).`,
        };
      }
      return { delivered: true, channel: 'whatsapp_webhook' };
    } catch (err) {
      return {
        delivered: false,
        channel: 'whatsapp_webhook',
        statusCode: 502,
        errorCode: 'WHATSAPP_WEBHOOK_ERROR',
        messageEn: err instanceof Error ? err.message : 'Failed to reach WhatsApp webhook.',
        messageAr: 'تعذر الوصول إلى رابط بوابة إرسال الواتساب.',
      };
    }
  }

  // 4. Unconfigured — do NOT fake sending
  return {
    delivered: false,
    channel: 'unconfigured',
    statusCode: 503,
    errorCode: 'GATEWAY_NOT_CONNECTED',
    messageEn:
      'WhatsApp sender gateway is not connected yet. A supervisor must link a WhatsApp account via QR code or configure Meta Cloud API in Admin -> WhatsApp Gateway.',
    messageAr:
      'بوابة إرسال الواتساب غير متصلة حالياً. يجب على المشرف ربط رقم واتساب بالـ QR Code أو إضافة Meta Cloud API من لوحة الإشراف -> بوابة الواتساب لتصل الأكواد إلى واتساب العملاء تلقائياً.',
  };
}
