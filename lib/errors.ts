export type ErrorCode =
  | "INTERNAL"
  | "VALIDATION"
  | "AUTH_REQUIRED"
  | "AUTH_FAILED"
  | "FORBIDDEN"
  | "CSRF"
  | "RATE_LIMIT"
  | "NOT_FOUND"
  | "PAYLOAD_TOO_LARGE"
  | "SSRF"
  | "TOTP_INVALID"
  | "TOTP_REQUIRED"
  | "CONFIG";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly expose: boolean;

  constructor(
    message: string,
    code: ErrorCode,
    status: number,
    expose = false,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.expose = expose;
  }
}

export class ValidationError extends AppError {
  constructor(message = "입력값이 올바르지 않습니다.") {
    super(message, "VALIDATION", 400, true);
    this.name = "ValidationError";
  }
}

export class AuthError extends AppError {
  constructor(message = "로그인이 필요합니다.", code: ErrorCode = "AUTH_REQUIRED") {
    const status =
      code === "FORBIDDEN" ? 403 : 401;
    super(message, code, status, true);
    this.name = "AuthError";
  }
}

export class RateLimitError extends AppError {
  constructor(message = "잠시 후 다시 시도해주세요. (분당 10회 / 하루 180회)") {
    super(message, "RATE_LIMIT", 429, true);
    this.name = "RateLimitError";
  }
}

export class CsrfError extends AppError {
  constructor() {
    super("CSRF 검증에 실패했습니다.", "CSRF", 403, true);
    this.name = "CsrfError";
  }
}

export function toPublicError(error: unknown, requestId: string) {
  const isProd = process.env.NODE_ENV === "production";
  if (error instanceof AppError) {
    return {
      status: error.status,
      body: {
        error: error.expose ? error.message : "요청을 처리할 수 없습니다.",
        code: error.code,
        requestId,
      },
    };
  }
  return {
    status: 500,
    body: {
      error:
        error instanceof Error && process.env.NODE_ENV !== "production"
          ? error.message.slice(0, 280)
          : "서버 오류가 발생했습니다.",
      code: "INTERNAL" as const,
      requestId,
    },
  };
}
