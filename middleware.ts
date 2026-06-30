import { NextRequest, NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { REQUEST_ID_HEADER, createRequestId } from "@/lib/request-id";
import { applyCorsHeaders, corsPreflightResponse, isOriginAllowed } from "@/lib/security/cors";
import {
  CSRF_COOKIE,
  SESSION_COOKIE,
  getAppSecret,
  isAuthConfigured,
} from "@/lib/security/config";
import {
  getSessionClaims,
  isAuthenticated,
  shouldRefreshSession,
  signSession,
  touchSession,
  verifyCsrf,
} from "@/lib/security/session";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/manifest.json"];

function setSessionCookies(
  response: NextResponse,
  sessionToken: string,
  csrfToken?: string,
) {
  response.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  if (csrfToken) {
    response.cookies.set(CSRF_COOKIE, csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
}

export async function middleware(request: NextRequest) {
  const requestId = request.headers.get(REQUEST_ID_HEADER) ?? createRequestId();
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin");
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname === "/favicon.ico" ||
    pathname === "/pdf.worker.min.mjs"
  ) {
    return NextResponse.next();
  }

  if (request.method === "OPTIONS" && pathname.startsWith("/api/")) {
    const preflight = corsPreflightResponse(request, requestId);
    if (preflight) return preflight;
    return NextResponse.json({ error: "CORS blocked" }, { status: 403 });
  }

  if (
    process.env.NODE_ENV === "production" &&
    origin &&
    pathname.startsWith("/api/") &&
    !isOriginAllowed(origin, request.nextUrl.host)
  ) {
    audit("security.cors.blocked", { requestId, ip, path: pathname });
    return NextResponse.json(
      { error: "CORS blocked", code: "FORBIDDEN", requestId },
      { status: 403, headers: { [REQUEST_ID_HEADER]: requestId } },
    );
  }

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p))) {
    const res = NextResponse.next();
    res.headers.set(REQUEST_ID_HEADER, requestId);
    return res;
  }

  if (!isAuthConfigured()) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("APP_PASSWORD_HASH / APP_SECRET 미설정", { status: 503 });
    }
    const res = NextResponse.next();
    res.headers.set(REQUEST_ID_HEADER, requestId);
    return res;
  }

  const sessionValue = request.cookies.get(SESSION_COOKIE)?.value;
  const claims = await getSessionClaims(sessionValue);

  if (
    pathname.startsWith("/api/") &&
    request.method !== "GET" &&
    pathname !== "/api/auth/login"
  ) {
    const csrfOk = await verifyCsrf(
      request.cookies.get(CSRF_COOKIE)?.value,
      request.headers.get("x-csrf-token"),
    );
    if (!csrfOk) {
      audit("security.csrf.failure", { requestId, ip, path: pathname });
      return NextResponse.json(
        { error: "CSRF 검증 실패", code: "CSRF", requestId },
        { status: 403, headers: { [REQUEST_ID_HEADER]: requestId } },
      );
    }
  }

  if (!(await isAuthenticated(sessionValue))) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "로그인이 필요합니다.", code: "AUTH_REQUIRED", requestId },
        { status: 401, headers: { [REQUEST_ID_HEADER]: requestId } },
      );
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const res = NextResponse.next();
  res.headers.set(REQUEST_ID_HEADER, requestId);

  const secret = getAppSecret();
  if (claims && secret && shouldRefreshSession(claims)) {
    const refreshed = touchSession(claims);
    const token = await signSession(refreshed, secret);
    setSessionCookies(res, token);
  }

  const cors = applyCorsHeaders(origin, requestId, request.nextUrl.host);
  if (cors) {
    for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
