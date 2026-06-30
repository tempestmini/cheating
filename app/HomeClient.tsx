"use client";

import dynamic from "next/dynamic";

const QuizApp = dynamic(() => import("@/components/QuizApp").then((m) => m.QuizApp), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh items-center justify-center bg-[#f5f0e8] text-sm text-[#6b5d4d]">
      QuizNote 로딩 중...
    </div>
  ),
});

export default function HomeClient() {
  return <QuizApp />;
}
