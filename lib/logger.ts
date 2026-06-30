const SENSITIVE_KEYS = [
  "password",
  "token",
  "secret",
  "apikey",
  "api_key",
  "authorization",
  "cookie",
  "anthropic",
  "totp",
  "csrf",
];

function redactValue(key: string, value: unknown): unknown {
  const lower = key.toLowerCase();
  if (SENSITIVE_KEYS.some((k) => lower.includes(k))) {
    return "[REDACTED]";
  }
  if (typeof value === "string" && value.length > 200) {
    return `${value.slice(0, 80)}…[truncated]`;
  }
  return value;
}

function redactObject(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = redactObject(value as Record<string, unknown>);
    } else {
      out[key] = redactValue(key, value);
    }
  }
  return out;
}

type LogLevel = "debug" | "info" | "warn" | "error";

function write(level: LogLevel, message: string, meta: Record<string, unknown>) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...redactObject(meta),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, meta: Record<string, unknown> = {}) =>
    write("debug", message, meta),
  info: (message: string, meta: Record<string, unknown> = {}) =>
    write("info", message, meta),
  warn: (message: string, meta: Record<string, unknown> = {}) =>
    write("warn", message, meta),
  error: (message: string, meta: Record<string, unknown> = {}) =>
    write("error", message, meta),
};
