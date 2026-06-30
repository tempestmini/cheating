import { AppError } from "../errors";
import {
  getAppPasswordHash,
  getAppSecret,
  getTotpSecret,
  isAuthConfigured,
} from "./config";

export function assertSecretsConfigured(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (!isAuthConfigured()) {
    throw new AppError(
      "인증 환경변수가 설정되지 않았습니다.",
      "CONFIG",
      503,
      false,
    );
  }
  const secret = getAppSecret();
  if (secret && secret.length < 32) {
    throw new AppError("APP_SECRET 길이가 부족합니다.", "CONFIG", 503, false);
  }
  const hash = getAppPasswordHash();
  if (!hash || !hash.startsWith("scrypt:")) {
    throw new AppError("APP_PASSWORD_HASH가 설정되지 않았습니다.", "CONFIG", 503, false);
  }
}

export function isTotpEnabled(): boolean {
  return !!getTotpSecret();
}
