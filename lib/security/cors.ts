import type { NextRequest } from "next/server";
import { getAllowedOrigins } from "./config";

function resolveOrigin(
  origin: string | null,
  requestHost: string | null,
): string | null {
  if (!origin) return null;

  try {
    if (requestHost && new URL(origin).host === requestHost) {
      return origin;
    }
  } catch {
    return null;
  }

  const allowed = getAllowedOrigins();
  if (allowed.includes(origin)) return origin;

  if (allowed.length === 0 && process.env.NODE_ENV !== "production") {
    return origin;
  }

  return null;
}

export function corsPreflightResponse(request: NextRequest, requestId: string) {
  const origin = request.headers.get("origin");
  const allowed = resolveOrigin(origin, request.nextUrl.host);
  if (!allowed) return null;
  return new Response(null, {
    status: 204,
    headers: corsHeaders(allowed, requestId),
  });
}

export function applyCorsHeaders(
  origin: string | null,
  requestId: string,
  requestHost: string | null,
): Record<string, string> | null {
  const allowed = resolveOrigin(origin, requestHost);
  if (!allowed) return null;
  return corsHeaders(allowed, requestId);
}

function corsHeaders(origin: string, requestId: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-CSRF-Token, X-Request-Id",
    "Access-Control-Max-Age": "86400",
    "X-Request-Id": requestId,
  };
}

export function isOriginAllowed(
  origin: string | null,
  requestHost: string | null,
): boolean {
  return resolveOrigin(origin, requestHost) !== null;
}
