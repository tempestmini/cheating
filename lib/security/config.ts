export type Role = "owner";

export type SessionClaims = {
  version: 2;
  tenantId: string;
  role: Role;
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
  nonce: string;
};

export const SESSION_COOKIE = "quiz_session";
export const CSRF_COOKIE = "quiz_csrf";
export const SESSION_ABSOLUTE_SEC = 60 * 60 * 24 * 30;
export const SESSION_IDLE_SEC = 60 * 60 * 24 * 7;
export const DEFAULT_TENANT = "default";

export function getAppSecret(): string | null {
  return process.env.APP_SECRET?.trim() || null;
}

export function getAppPasswordHash(): string | null {
  return process.env.APP_PASSWORD_HASH?.trim() || null;
}

export function getTotpSecret(): string | null {
  return process.env.TOTP_SECRET?.trim() || null;
}

export function isAuthConfigured(): boolean {
  return !!(getAppSecret() && getAppPasswordHash());
}

export function getAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS?.trim();
  if (!raw) return [];
  return raw.split(",").map((o) => o.trim()).filter(Boolean);
}
