function replaceSqrt(text: string): string {
  let out = text;
  for (let i = 0; i < 8; i += 1) {
    const next = out
      .replace(/(\d)\s*sqrt\s*\(\s*([^)]+?)\s*\)/gi, "$1√$2")
      .replace(/sqrt\s*\(\s*([^)]+?)\s*\)/gi, "√$1")
      .replace(/(\d)\s*√\s*\(\s*([^)]+?)\s*\)/g, "$1√$2")
      .replace(/\\sqrt\s*\{\s*([^}]+?)\s*\}/g, "√$1");
    if (next === out) break;
    out = next;
  }
  return out;
}

function replaceIntegrals(text: string): string {
  return text
    .replace(/\\int\b/g, "∫")
    .replace(/\bintegral\b/gi, "∫")
    .replace(/\bInt\b/g, "∫")
    .replace(/∫_?\{?\s*([^}\s]+)\s*\}?\s*\^?\{?\s*([^}\s]+)\s*\}?/g, "∫_$1^$2")
    .replace(/\\oint\b/g, "∮")
    .replace(/\boint\b/g, "∮");
}

function replaceCalculus(text: string): string {
  return text
    .replace(/\\nabla\b/g, "∇")
    .replace(/\bnabla\b/gi, "∇")
    .replace(/\\partial\b/g, "∂")
    .replace(/\bpartial\b/gi, "∂")
    .replace(/\\sum\b/g, "∑")
    .replace(/\bsum\b/gi, "∑")
    .replace(/\\prod\b/g, "∏")
    .replace(/\\cdot\b/g, "·")
    .replace(/\\times\b/g, "×")
    .replace(/\\div\b/g, "÷")
    .replace(/\\pm\b/g, "±")
    .replace(/\\mp\b/g, "∓")
    .replace(/\\infty\b/g, "∞")
    .replace(/\binfty\b/gi, "∞")
    .replace(/\\leq\b/g, "≤")
    .replace(/\\geq\b/g, "≥")
    .replace(/\\neq\b/g, "≠")
    .replace(/\\approx\b/g, "≈")
    .replace(/\\propto\b/g, "∝");
}

function replaceGreek(text: string): string {
  const map: Record<string, string> = {
    pi: "π",
    theta: "θ",
    phi: "φ",
    rho: "ρ",
    mu: "μ",
    epsilon: "ε",
    eps: "ε",
    sigma: "σ",
    omega: "ω",
    alpha: "α",
    beta: "β",
    gamma: "γ",
    delta: "δ",
    lambda: "λ",
    nabla: "∇",
  };
  let out = text;
  for (const [name, sym] of Object.entries(map)) {
    out = out.replace(new RegExp(`\\\\${name}\\b`, "g"), sym);
    out = out.replace(new RegExp(`\\b${name}\\b`, "gi"), sym);
  }
  return out;
}

function replaceSuperscripts(text: string): string {
  const map: Record<string, string> = {
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
    "-": "⁻",
    "+": "⁺",
  };
  return text.replace(/\^([0-9+-]+)/g, (_, exp: string) =>
    [...exp].map((c) => map[c] ?? c).join(""),
  );
}

function replaceCommonFractions(text: string): string {
  return text
    .replace(/\b1\/2\b/g, "½")
    .replace(/\b1\/3\b/g, "⅓")
    .replace(/\b2\/3\b/g, "⅔")
    .replace(/\b1\/4\b/g, "¼")
    .replace(/\b3\/4\b/g, "¾");
}

export function normalizeHandwriting(text: string): string {
  let out = text
    .replace(/\$\$/g, "")
    .replace(/\$/g, "")
    .replace(/\\text\{([^}]*)\}/g, "$1")
    .replace(/\\vec\{([^}]*)\}/g, "$1⃗")
    .replace(/\\hat\{([^}]*)\}/g, "$1̂")
    .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, "$1");

  out = replaceSqrt(out);
  out = replaceIntegrals(out);
  out = replaceCalculus(out);
  out = replaceGreek(out);
  out = replaceSuperscripts(out);
  out = replaceCommonFractions(out);

  return out
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/[{}]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function formatHandwritingDisplay(text: string): string {
  const clean = normalizeHandwriting(text);
  if (!clean) return "";
  return clean;
}

export function splitHandwritingSections(text: string): {
  solution: string;
  answer: string;
} {
  const clean = normalizeHandwriting(text);
  const answerIdx = clean.search(/\n\s*답\s*[:：]/);
  if (answerIdx >= 0) {
    const solution = clean
      .slice(0, answerIdx)
      .replace(/^풀이\s*[:：]\s*/i, "")
      .trim();
    const answer = clean
      .slice(answerIdx)
      .replace(/^답\s*[:：]\s*/i, "")
      .trim();
    return { solution, answer };
  }
  const solutionIdx = clean.search(/풀이\s*[:：]/i);
  if (solutionIdx >= 0) {
    return {
      solution: clean.replace(/^풀이\s*[:：]\s*/i, "").trim(),
      answer: "",
    };
  }
  return { solution: clean, answer: "" };
}

export function countProblemSections(text: string): number {
  const matches = text.match(
    /(?:^|\n)\s*(?:\d+-\d+|\d+\([a-z]\)|\d+\)|\d+\.)\s*\)?/gi,
  );
  return matches?.length ?? 0;
}
