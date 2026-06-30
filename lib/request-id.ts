export const REQUEST_ID_HEADER = "x-request-id";

export function createRequestId(): string {
  return crypto.randomUUID();
}

export function getRequestId(headers: Headers): string {
  return headers.get(REQUEST_ID_HEADER)?.trim() || createRequestId();
}
