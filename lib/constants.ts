export const APP_NAME = "QuizNote";
export const CLAUDE_MODEL =
  process.env.CLAUDE_MODEL?.trim() || "claude-sonnet-4-20250514";
export const MAX_OUTPUT_TOKENS = 2048;

export const DEFAULT_PROMPT = `전자기학 문제 이미지. 모든 소문항 번호 그대로. 계산 정확히.

형식:
1-1)
풀이: 핵심 식·숫자만
답: 최종값

수식 표기 (필수, ASCII 함수명 금지):
- 제곱근: √3, 2√5 (√ 기호, sqrt() 금지)
- 적분: ∫, ∫₀¹, ∮
- 미분/편미분: d/dx, ∂/∂x, ∂²/∂x²
- 그래디언트/발산/회전: ∇, ∇·, ∇×
- 합: ∑
- 곱/내적: · 또는 × (×는 외적)
- 분수: a/b 또는 ½ (간단하면 유니코드 분수)
- 각도: π, θ, φ, 2π/3
- 좌표: ρ, φ, z / (x,y,z)
- 벡터: âx ây âz 또는 A=(1,2,3), |A|
- 극값: ±, ∞, ≤, ≥, ≠, ≈
- 지수: x², x³, e^(-t) 또는 e⁻ᵗ

LaTeX·$·\\\\·sqrt()·markdown·코드·설명 금지.`;

export const PEN_COLORS = [
  { name: "Black", value: "#1a1a1a" },
  { name: "Blue", value: "#2563eb" },
  { name: "Red", value: "#dc2626" },
  { name: "Green", value: "#16a34a" },
] as const;

export const PEN_WIDTHS = [1, 2, 4, 6] as const;
