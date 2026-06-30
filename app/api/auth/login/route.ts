import { loginSchema, parseBody } from "@/lib/validate";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { withApi } from "@/lib/api-handler";
import {
  createCsrfToken,
  createSessionToken,
  isTotpRequired,
  verifyPassword,
  verifyTotp,
  getAppSecret,
  isAuthConfigured,
  SESSION_COOKIE,
  CSRF_COOKIE,
} from "@/lib/auth";
import { AppError, AuthError, RateLimitError, ValidationError } from "@/lib/errors";

export const POST = withApi(
  async ({ request, requestId }) => {
    if (!isAuthConfigured()) {
      throw new AppError("인증 설정 없음", "CONFIG", 503, false);
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    if (!checkRateLimit("auth", rateLimitKey(null, ip))) {
      audit("security.rate_limit", { requestId, ip, path: "/api/auth/login" });
      throw new RateLimitError();
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ValidationError("잘못된 요청입니다.");
    }

    const { password, totp } = parseBody(loginSchema, body);
    const secret = getAppSecret();
    if (!secret || !(await verifyPassword(password))) {
      audit("auth.login.failure", { requestId, ip, path: "/api/auth/login" });
      throw new AuthError("비밀번호가 올바르지 않습니다.", "AUTH_FAILED");
    }

    if (isTotpRequired() && !verifyTotp(totp)) {
      audit("auth.totp.failure", { requestId, ip, path: "/api/auth/login" });
      throw new AuthError("2FA 코드가 올바르지 않습니다.", "TOTP_INVALID");
    }

    const sessionToken = createSessionToken(secret);
    const csrfToken = createCsrfToken();
    const res = NextResponse.json({ ok: true, requestId, totpRequired: isTotpRequired() });
    res.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    res.cookies.set(CSRF_COOKIE, csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    audit("auth.login.success", {
      requestId,
      ip,
      path: "/api/auth/login",
      tenantId: "default",
      role: "owner",
    });

    return res;
  },
  { requireAuth: false, requireCsrf: false },
);
