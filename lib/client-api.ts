export const CSRF_HEADER = "x-csrf-token";

export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("quiz_csrf="));
  if (!match) return null;
  return decodeURIComponent(match.split("=")[1] ?? "");
}

export async function secureFetch(
  input: RequestInfo,
  init: RequestInit = {},
): Promise<Response> {
  const csrf = getCsrfToken();
  const headers = new Headers(init.headers);
  if (csrf) headers.set(CSRF_HEADER, csrf);
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(input, { ...init, headers, credentials: "same-origin" });
}
