"use client";

import { formatHandwritingDisplay } from "@/lib/handwriting";

type HandwritingAnswerProps = {
  text: string | null;
  isLoading: boolean;
  error: string | null;
  pageWidth: number;
};

export function HandwritingAnswer({
  text,
  isLoading,
  error,
  pageWidth,
}: HandwritingAnswerProps) {
  if (!isLoading && !text && !error) return null;

  const displayed = text ? formatHandwritingDisplay(text) : "";

  return (
    <div
      className="bg-[#fffef9] px-8 py-5"
      style={{ width: pageWidth }}
    >
      {error && !isLoading && (
        <p className="handwriting-text text-[20px] text-[#1a1a1a]/50">{error}</p>
      )}
      {text && !isLoading && (
        <pre
          className="handwriting-text whitespace-pre-wrap text-[21px] leading-[1.85] text-[#1a1a1a]"
          style={{
            fontFamily: "var(--font-handwriting), 'Nanum Pen Script', cursive",
          }}
        >
          {displayed}
        </pre>
      )}
    </div>
  );
}
