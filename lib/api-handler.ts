import { NextRequest, NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { AppError, AuthError, CsrfError, toPublicError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getRequestId, REQUEST_ID_HEADER } from "@/lib/request-id";
import { hasRole, type Role } from "@/lib/security/rbac";
import {
  getSessionClaims,
  verifyCsrf,
  CSRF_COOKIE,
} from "@/lib/security/session";
import type { SessionClaims } from "@/lib/security/config";

type ApiContext = {
  request: NextRequest;
  requestId: string;
  claims: SessionClaims | null;
};

type ApiHandler = (ctx: ApiContext) => Promise<NextResponse>;

type ApiOptions = {
  requireAuth?: boolean;
  requireCsrf?: boolean;
  requireRole?: Role;
};

export function withApi(handler: ApiHandler, options: ApiOptions = {}) {
  const { requireAuth = false, requireCsrf = false, requireRole } = options;

  return async (request: NextRequest): Promise<NextResponse> => {
    const requestId = getRequestId(request.headers);
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    try {
      const claims = await getSessionClaims(
        request.cookies.get("quiz_session")?.value,
      );

      if (requireAuth && !claims) {
        throw new AuthError();
      }
      if (requireRole && !hasRole(claims, requireRole)) {
        throw new AuthError("권한이 없습니다.", "FORBIDDEN");
      }
      if (requireCsrf) {
        const ok = await verifyCsrf(
          request.cookies.get(CSRF_COOKIE)?.value,
          request.headers.get("x-csrf-token"),
        );
        if (!ok) {
          audit("security.csrf.failure", {
            requestId,
            ip,
            path: request.nextUrl.pathname,
          });
          throw new CsrfError();
        }
      }

      const response = await handler({ request, requestId, claims });
      response.headers.set(REQUEST_ID_HEADER, requestId);
      return response;
    } catch (error) {
      const { status, body } = toPublicError(error, requestId);
      if (!(error instanceof AppError)) {
        logger.error("unhandled_api_error", {
          requestId,
          ip,
          path: request.nextUrl.pathname,
          err: error instanceof Error ? error.message : "unknown",
          stack:
            process.env.NODE_ENV === "production"
              ? undefined
              : error instanceof Error
                ? error.stack
                : undefined,
        });
      } else if (error.status >= 500) {
        logger.error("app_error", {
          requestId,
          code: error.code,
          msg: error.message,
        });
      }
      return NextResponse.json(body, {
        status,
        headers: { [REQUEST_ID_HEADER]: requestId },
      });
    }
  };
}
