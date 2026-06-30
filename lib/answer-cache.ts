type PageAnswer = {
  text: string;
  animateKey?: string;
};

const CACHE_KEY = "quiz-answers-v1";

export type AnswersByDoc = Record<string, Record<number, PageAnswer>>;

export function loadAnswerCache(): AnswersByDoc {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as AnswersByDoc;
  } catch {
    return {};
  }
}

export function saveAnswerCache(data: AnswersByDoc): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}
