import { z } from "zod";
import { ValidationError } from "./errors";

export const loginSchema = z.object({
  password: z.string().min(1).max(256),
  totp: z.string().regex(/^\d{6}$/).optional(),
});

export const analyzeMetaSchema = z.object({
  page: z.coerce.number().int().min(1).max(9999).default(1),
  prompt: z.string().max(500).optional(),
});

export function parseBody<T extends z.ZodType>(
  schema: T,
  data: unknown,
): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError("입력값이 올바르지 않습니다.");
  }
  return result.data;
}

export function assertImageFile(file: File | null): File {
  if (!file) throw new ValidationError("페이지 이미지가 필요합니다.");
  const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!allowed.has(file.type)) {
    throw new ValidationError("JPEG·PNG·WebP 이미지만 분석할 수 있습니다.");
  }
  const maxSize = 8 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new ValidationError("이미지 크기는 8MB 이하여야 합니다.");
  }
  if (file.size === 0) {
    throw new ValidationError("빈 이미지는 분석할 수 없습니다.");
  }
  return file;
}

export function assertPdfFile(file: File | null): File {
  if (!file) throw new ValidationError("PDF 파일이 필요합니다.");
  if (file.type !== "application/pdf") {
    throw new ValidationError("PDF 파일만 업로드할 수 있습니다.");
  }
  const maxSize = 20 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new ValidationError("파일 크기는 20MB 이하여야 합니다.");
  }
  if (file.size === 0) {
    throw new ValidationError("빈 파일은 업로드할 수 없습니다.");
  }
  return file;
}

/** SSRF 방지: URL 입력 필드 미사용, 외부 fetch 금지 */
export function assertNoOutboundUrl(value: string): void {
  if (/^https?:\/\//i.test(value.trim())) {
    throw new ValidationError("URL 입력은 허용되지 않습니다.");
  }
}
