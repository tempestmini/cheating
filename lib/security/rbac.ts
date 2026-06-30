import type { SessionClaims } from "./config";

export type Role = "owner";

const ROLE_RANK: Record<Role, number> = { owner: 100 };

export function hasRole(claims: SessionClaims | null, role: Role): boolean {
  if (!claims) return false;
  return ROLE_RANK[claims.role] >= ROLE_RANK[role];
}

export function assertTenant(
  claims: SessionClaims | null,
  tenantId: string,
): boolean {
  return !!claims && claims.tenantId === tenantId;
}

export const DEFAULT_TENANT = "default";
