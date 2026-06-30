import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { withApi } from "@/lib/api-handler";
import { CSRF_COOKIE, SESSION_COOKIE } from "@/lib/security/config";

export const POST = withApi(
  async ({ requestId, claims }) => {
    audit("auth.logout", {
      requestId,
      tenantId: claims?.tenantId,
      role: claims?.role,
    });
    const res = NextResponse.json({ ok: true, requestId });
    for (const name of [SESSION_COOKIE, CSRF_COOKIE]) {
      res.cookies.set(name, "", {
        httpOnly: name === SESSION_COOKIE,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
      });
    }
    return res;
  },
  { requireAuth: true, requireCsrf: true, requireRole: "owner" },
);
