import { generateURI, verifySync } from "otplib";
import { createHmac, randomBytes } from "crypto";
import {
  CSRF_COOKIE,
  DEFAULT_TENANT,
  SESSION_ABSOLUTE_SEC,
  SESSION_COOKIE,
  getAppPasswordHash,
  getAppSecret,
  getTotpSecret,
  isAuthConfigured,
} from "./security/config";
import { verifyPassword as verifyPasswordHash } from "./password";
import { serializePayload } from "./security/session";

export {
  CSRF_COOKIE,
  SESSION_COOKIE,
  getAppPasswordHash,
  getAppSecret,
  isAuthConfigured,
};

export function createSessionToken(
  secret: string,
  tenantId = DEFAULT_TENANT,
): string {
  const now = Date.now();
  const payload = serializePayload({
    tenantId,
    role: "owner",
    createdAt: now,
    expiresAt: now + SESSION_ABSOLUTE_SEC * 1000,
    lastActivity: now,
    nonce: randomBytes(16).toString("hex"),
  });
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function createCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

export async function verifyPassword(input: string): Promise<boolean> {
  const hash = getAppPasswordHash();
  if (!hash) return false;
  return verifyPasswordHash(input, hash);
}

export function isTotpRequired(): boolean {
  return !!getTotpSecret();
}

export function verifyTotp(code: string | undefined): boolean {
  const secret = getTotpSecret();
  if (!secret) return true;
  if (!code || !/^\d{6}$/.test(code)) return false;
  return verifySync({ token: code, secret }).valid;
}

export function getTotpUri(): string | null {
  const secret = getTotpSecret();
  if (!secret) return null;
  return generateURI({ issuer: "QuizNote", label: "owner", secret });
}
