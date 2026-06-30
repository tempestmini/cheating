"use client";

import { secureFetch } from "@/lib/client-api";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await secureFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          totp: totp.length === 6 ? totp : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "로그인 실패");
        return;
      }
      const from = searchParams.get("from") || "/";
      router.replace(from);
      router.refresh();
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-black px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-[#1c1c1e] p-6 shadow-xl"
      >
        <h1 className="mb-1 text-center text-lg font-semibold text-[#ebebf5]">
          문서
        </h1>
        <p className="mb-6 text-center text-xs text-[#8e8e93]">
          본인만 접근 가능합니다
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          autoComplete="current-password"
          autoFocus
          className="mb-3 w-full rounded-xl border border-[#3a3a3c] bg-[#2c2c2e] px-4 py-3 text-[#ebebf5] placeholder:text-[#636366] focus:border-[#0a84ff] focus:outline-none"
        />
        <input
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          value={totp}
          onChange={(e) => setTotp(e.target.value.replace(/\D/g, ""))}
          placeholder="2FA 코드 (설정 시)"
          autoComplete="one-time-code"
          className="mb-3 w-full rounded-xl border border-[#3a3a3c] bg-[#2c2c2e] px-4 py-3 text-[#ebebf5] placeholder:text-[#636366] focus:border-[#0a84ff] focus:outline-none"
        />
        {error && (
          <p className="mb-3 text-center text-sm text-[#ff453a]">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full rounded-xl bg-[#0a84ff] py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "확인 중..." : "들어가기"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-black text-[#8e8e93]">
          ...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
