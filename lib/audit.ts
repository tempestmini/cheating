import { logger } from "./logger";

export type AuditAction =
  | "auth.login.success"
  | "auth.login.failure"
  | "auth.logout"
  | "auth.totp.failure"
  | "analyze.request"
  | "analyze.success"
  | "analyze.failure"
  | "security.csrf.failure"
  | "security.rate_limit"
  | "security.cors.blocked";

type AuditMeta = {
  requestId: string;
  tenantId?: string;
  role?: string;
  ip?: string | null;
  path?: string;
  detail?: Record<string, unknown>;
};

export function audit(action: AuditAction, meta: AuditMeta) {
  logger.info("audit", {
    audit: action,
    requestId: meta.requestId,
    tenantId: meta.tenantId ?? "default",
    role: meta.role ?? "anonymous",
    ip: meta.ip ?? null,
    path: meta.path ?? null,
    detail: meta.detail ?? {},
  });
}
