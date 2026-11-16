export type WhatsAppDeliveryChannel =
  | 'whatsapp_direct'
  | 'whatsapp_cloud_api'
  | 'whatsapp_webhook'
  | 'unconfigured';

export type DirectWhatsAppStatus =
  | 'disconnected'
  | 'connecting'
  | 'qr_ready'
  | 'connected';

export interface WhatsAppGatewayStatus {
  activeChannel: WhatsAppDeliveryChannel;
  direct: {
    status: DirectWhatsAppStatus;
    connectedPhone?: string;
    connectedName?: string;
    qrDataUrl?: string | null;
    pairingCode?: string | null;
    lastError?: string | null;
    hasSavedSession: boolean;
  };
  cloudApi: {
    configured: boolean;
    phoneNumberId?: string;
    templateName?: string;
    templateLang?: string;
    hasAccessToken: boolean;
  };
  webhook: {
    configured: boolean;
    url?: string;
    hasToken: boolean;
  };
}

export interface WhatsAppSendResult {
  ok: boolean;
  deliveryMode: WhatsAppDeliveryChannel;
  normalizedPhone: string;
  challengeToken: string;
  expiresAtMs: number;
  message: string;
}

export interface WhatsAppVerifyResult {
  verified: boolean;
  normalizedPhone: string;
  verifiedAtMs: number;
  message?: string;
}
