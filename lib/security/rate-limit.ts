type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();

/** 개인용 — Gemini 쪽에서만 rate limit */
const LIMITS = {
  analyze: { windowMs: 60 * 1000, max: 30 },
  analyzeDay: { windowMs: 24 * 60 * 60 * 1000, max: 500 },
  auth: { windowMs: 15 * 60 * 1000, max: 20 },
} as const;

export type RateLimitScope = keyof typeof LIMITS;

export function checkRateLimit(scope: RateLimitScope, key: string): boolean {
  const rule = LIMITS[scope];
  const now = Date.now();
  const bucketKey = `${scope}:${key}`;
  const entry = buckets.get(bucketKey);
  if (!entry || now >= entry.resetAt) {
    buckets.set(bucketKey, { count: 1, resetAt: now + rule.windowMs });
    return true;
  }
  if (entry.count >= rule.max) return false;
  entry.count += 1;
  return true;
}

export function checkAnalyzeAllowed(key: string): boolean {
  return checkRateLimit("analyze", key) && checkRateLimit("analyzeDay", key);
}

export function rateLimitKey(
  claimsSub: string | null,
  ip: string | null,
): string {
  return claimsSub ?? ip ?? "anonymous";
}
