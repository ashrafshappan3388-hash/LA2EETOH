import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Request } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const BOOTSTRAPPED_ADMIN_EMAIL = 'ashraf.shappan3388@gmail.com';

interface FirebaseAppletConfig {
  projectId: string;
  apiKey: string;
  firestoreDatabaseId?: string;
}

let cachedConfig: FirebaseAppletConfig | null = null;

function getFirebaseConfig(): FirebaseAppletConfig | null {
  if (cachedConfig) return cachedConfig;
  const configPath = path.join(ROOT_DIR, 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf8')) as FirebaseAppletConfig;
    if (raw.projectId && raw.apiKey) {
      cachedConfig = raw;
      return raw;
    }
  } catch {
    return null;
  }
  return null;
}

export interface VerifiedAdminIdentity {
  uid: string;
  email: string;
  role: 'admin' | 'moderator';
}

export async function verifyFirebaseAdminRequest(
  req: Request
): Promise<VerifiedAdminIdentity> {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) {
    throw Object.assign(new Error('Missing Firebase Bearer token.'), { statusCode: 401 });
  }
  const idToken = match[1].trim();
  const cfg = getFirebaseConfig();
  if (!cfg) {
    throw Object.assign(new Error('Firebase configuration missing on server.'), { statusCode: 500 });
  }

  // 1. Verify Firebase ID Token via Identity Toolkit API
  const lookupRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(cfg.apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );
  if (!lookupRes.ok) {
    throw Object.assign(new Error('Invalid or expired authentication token.'), { statusCode: 401 });
  }
  const lookupData = (await lookupRes.json()) as {
    users?: Array<{ localId?: string; email?: string; emailVerified?: boolean }>;
  };
  const userInfo = lookupData.users?.[0];
  if (!userInfo?.localId || !userInfo.email) {
    throw Object.assign(new Error('Unable to resolve authenticated user.'), { statusCode: 401 });
  }
  if (!userInfo.emailVerified) {
    throw Object.assign(new Error('Verified email is required for admin gateway access.'), { statusCode: 403 });
  }

  const uid = userInfo.localId;
  const email = userInfo.email.toLowerCase();

  if (email === BOOTSTRAPPED_ADMIN_EMAIL) {
    return { uid, email, role: 'admin' };
  }

  // 2. Verify active membership in Firestore admins/{uid} using the caller's verified token
  const dbId = cfg.firestoreDatabaseId || '(default)';
  const docUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    cfg.projectId
  )}/databases/${encodeURIComponent(dbId)}/documents/admins/${encodeURIComponent(uid)}`;

  const adminRes = await fetch(docUrl, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!adminRes.ok) {
    throw Object.assign(new Error('Forbidden: Supervisor privileges required.'), { statusCode: 403 });
  }

  const docJson = (await adminRes.json()) as {
    fields?: { role?: { stringValue?: string } };
  };
  const roleValue = docJson.fields?.role?.stringValue === 'moderator' ? 'moderator' : 'admin';

  return { uid, email, role: roleValue };
}
