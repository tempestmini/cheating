import { audit } from "@/lib/audit";
import { withApi } from "@/lib/api-handler";
import { AppError, RateLimitError, ValidationError } from "@/lib/errors";
import { analyzeImage } from "@/lib/claude";
import {
  analyzeMetaSchema,
  assertImageFile,
  assertNoOutboundUrl,
  parseBody,
} from "@/lib/validate";
import { checkAnalyzeAllowed, rateLimitKey } from "@/lib/security/rate-limit";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export const POST = withApi(
  async ({ request, requestId, claims }) => {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const key = rateLimitKey(claims?.nonce ?? null, ip);
    if (!checkAnalyzeAllowed(key)) {
      audit("security.rate_limit", {
        requestId,
        ip,
        path: request.nextUrl.pathname,
        tenantId: claims?.tenantId,
        role: claims?.role,
      });
      throw new RateLimitError();
    }

    const formData = await request.formData();
    const image = assertImageFile(formData.get("image") as File | null);
    const pageRaw = formData.get("page");
    const promptRaw = formData.get("prompt");
    const meta = parseBody(analyzeMetaSchema, {
      page: pageRaw ?? 1,
      prompt: typeof promptRaw === "string" ? promptRaw : undefined,
    });
    if (meta.prompt) assertNoOutboundUrl(meta.prompt);

    audit("analyze.request", {
      requestId,
      ip,
      path: request.nextUrl.pathname,
      tenantId: claims?.tenantId,
      role: claims?.role,
      detail: { page: meta.page, imageSize: image.size, mime: image.type },
    });

    const mime = image.type as "image/jpeg" | "image/png" | "image/webp";
    if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) {
      throw new ValidationError("지원하지 않는 이미지 형식입니다.");
    }

    const base64 = Buffer.from(await image.arrayBuffer()).toString("base64");
    let answer: string;
    try {
      answer = await analyzeImage(base64, mime);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Claude 분석에 실패했습니다.";
      throw new AppError(msg, "INTERNAL", 502, true);
    }

    audit("analyze.success", {
      requestId,
      tenantId: claims?.tenantId,
      role: claims?.role,
      detail: { page: meta.page, answerLen: answer.length },
    });

    return NextResponse.json({ answer, requestId });
  },
  { requireAuth: true, requireCsrf: true, requireRole: "owner" },
);
