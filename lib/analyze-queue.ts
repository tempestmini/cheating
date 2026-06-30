export function isQuotaErrorMessage(message: string): boolean {
  return /quota|429|한도|RESOURCE_EXHAUSTED|Too Many Requests/i.test(message);
}

export async function waitIfQuotaBlocked(): Promise<void> {
  /* no client-side throttle — Gemini handles limits */
}

export function markQuotaHit(): void {
  /* noop */
}

export function getAnalyzeCooldownMs(): number {
  return 0;
}
