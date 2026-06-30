import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL, DEFAULT_PROMPT, MAX_OUTPUT_TOKENS } from "./constants";

const MODEL_CHAIN = [
  process.env.CLAUDE_MODEL?.trim(),
  CLAUDE_MODEL,
  "claude-3-5-sonnet-latest",
].filter((m, i, arr): m is string => Boolean(m) && arr.indexOf(m) === i);

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.");
  }
  return new Anthropic({ apiKey });
}

function isQuotaError(msg: string): boolean {
  return /429|rate.?limit|overloaded|Too Many Requests/i.test(msg);
}

function isModelUnavailable(msg: string): boolean {
  return /404|not_found|model.*not.*found/i.test(msg);
}

function formatError(error: unknown, triedModels: string[]): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (isQuotaError(msg)) {
    const retrySec = msg.match(/retry.*?(\d+)/i)?.[1];
    if (retrySec) return `${retrySec}초 후 ⋯ 버튼으로 다시 시도.`;
    return "요청 한도 초과. 1~2분 후 ⋯ 버튼으로 다시 시도.";
  }
  if (isModelUnavailable(msg)) {
    return `${triedModels[0]} 사용 불가. CLAUDE_MODEL을 확인해주세요.`;
  }
  if (/api.?key|401|403|authentication/i.test(msg)) {
    return "API 키를 확인해주세요.";
  }
  return msg.slice(0, 200);
}

async function callModel(
  modelName: string,
  imageBase64: string,
  mimeType: "image/jpeg" | "image/png" | "image/webp",
): Promise<string> {
  const client = getClient();
  const message = await client.messages.create({
    model: modelName,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: DEFAULT_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType,
              data: imageBase64,
            },
          },
          { type: "text", text: "풀이와 답만." },
        ],
      },
    ],
  });

  const text = message.content.find((block) => block.type === "text")?.text;
  if (!text?.trim()) throw new Error("빈 응답");
  return text.trim();
}

export async function analyzeImage(
  imageBase64: string,
  mimeType: "image/jpeg" | "image/png" | "image/webp",
): Promise<string> {
  const tried: string[] = [];
  let lastError: unknown;

  for (const modelName of MODEL_CHAIN) {
    tried.push(modelName);
    try {
      return await callModel(modelName, imageBase64, mimeType);
    } catch (error) {
      lastError = error;
      const msg = error instanceof Error ? error.message : "";
      if (isModelUnavailable(msg) || isQuotaError(msg)) continue;
      throw new Error(formatError(error, tried));
    }
  }

  throw new Error(formatError(lastError, tried));
}

export { CLAUDE_MODEL, MODEL_CHAIN };
