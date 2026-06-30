import {
  CSRF_COOKIE,
  getAppSecret,
  isAuthConfigured,
  SESSION_IDLE_SEC,
  type SessionClaims,
} from "./config";

export type { SessionClaims };

async function hmacHex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function serializePayload(claims: Omit<SessionClaims, "version">): string {
  return [
    "v2",
    claims.tenantId,
    claims.role,
    String(claims.createdAt),
    String(claims.expiresAt),
    String(claims.lastActivity),
    claims.nonce,
  ].join(".");
}

export function parsePayload(payload: string): SessionClaims | null {
  const parts = payload.split(".");
  if (parts.length !== 7 || parts[0] !== "v2") return null;
  const [, tenantId, role, createdAt, expiresAt, lastActivity, nonce] = parts;
  if (role !== "owner" || !tenantId || !nonce) return null;
  const created = Number(createdAt);
  const exp = Number(expiresAt);
  const activity = Number(lastActivity);
  if (!Number.isFinite(created) || !Number.isFinite(exp) || !Number.isFinite(activity)) {
    return null;
  }
  return {
    version: 2,
    tenantId,
    role: "owner",
    createdAt: created,
    expiresAt: exp,
    lastActivity: activity,
    nonce,
  };
}

export async function verifySignature(
  payload: string,
  sig: string,
  secret: string,
): Promise<boolean> {
  const expected = await hmacHex(secret, payload);
  if (sig.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) {
    diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export function isSessionActive(claims: SessionClaims, now = Date.now()): boolean {
  if (claims.expiresAt <= now) return false;
  if (claims.lastActivity + SESSION_IDLE_SEC * 1000 <= now) return false;
  return true;
}

export async function parseSessionToken(
  token: string,
  secret: string,
): Promise<SessionClaims | null> {
  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return null;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  if (!(await verifySignature(payload, sig, secret))) return null;
  const claims = parsePayload(payload);
  if (!claims || !isSessionActive(claims)) return null;
  return claims;
}

export async function getSessionClaims(
  cookieValue: string | undefined,
): Promise<SessionClaims | null> {
  const secret = getAppSecret();
  if (!secret || !cookieValue) return null;
  return parseSessionToken(cookieValue, secret);
}

export async function isAuthenticated(
  cookieValue: string | undefined,
): Promise<boolean> {
  if (!isAuthConfigured()) {
    return process.env.NODE_ENV !== "production";
  }
  const claims = await getSessionClaims(cookieValue);
  return claims !== null;
}

export function touchSession(claims: SessionClaims, now = Date.now()): SessionClaims {
  return { ...claims, lastActivity: now };
}

export async function signSession(
  claims: SessionClaims,
  secret: string,
): Promise<string> {
  const payload = serializePayload(claims);
  const sig = await hmacHex(secret, payload);
  return `${payload}.${sig}`;
}

export function shouldRefreshSession(claims: SessionClaims, now = Date.now()): boolean {
  const idleRemaining = claims.lastActivity + SESSION_IDLE_SEC * 1000 - now;
  return idleRemaining < 60 * 60 * 1000;
}

export async function verifyCsrf(
  cookieToken: string | undefined,
  headerToken: string | null,
): Promise<boolean> {
  if (!cookieToken || !headerToken) return false;
  if (cookieToken.length !== headerToken.length) return false;
  let diff = 0;
  for (let i = 0; i < cookieToken.length; i++) {
    diff |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i);
  }
  return diff === 0;
}

export { CSRF_COOKIE, SESSION_COOKIE } from "./config";
