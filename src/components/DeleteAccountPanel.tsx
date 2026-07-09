"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { COMPANY } from "@/lib/data";

const CONFIRM_WORD = "삭제";

// 로그인한 본인이 직접 계정을 삭제하는 패널.
//  · 로그인 상태: '삭제' 입력 후 버튼 → /api/account/delete 호출 → 로그아웃 후 홈 이동.
//  · 비로그인: 로그인 유도 + 이메일 요청 안내.
export default function DeleteAccountPanel() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleDelete() {
    if (confirmText.trim() !== CONFIRM_WORD || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data?.error || "계정 삭제에 실패했어요. 잠시 후 다시 시도해 주세요.");
      }
      // 세션 정리 후 완료 화면 표시.
      const supabase = createSupabaseBrowser();
      await supabase.auth.signOut().catch(() => {});
      setDone(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "계정 삭제 중 오류가 발생했어요.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-2xl">✅</p>
        <p className="mt-2 font-bold text-emerald-800">계정이 삭제되었어요</p>
        <p className="mt-1 text-sm leading-relaxed text-emerald-700">
          회원님의 개인정보가 파기되었습니다. 이용해 주셔서 감사합니다.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
        >
          홈으로
        </button>
      </div>
    );
  }

  // 로딩 중 자리 확보
  if (!ready) {
    return <div className="h-40 rounded-2xl bg-cream-deep/40" aria-hidden="true" />;
  }

  // 비로그인: 로그인 유도 + 이메일 요청 안내
  if (!user) {
    return (
      <div className="rounded-2xl border border-line bg-white p-6">
        <p className="font-bold text-ink">계정 삭제를 진행하려면</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">
          삭제하려는 계정으로 먼저 로그인한 뒤, 이 화면에서 바로 삭제할 수 있어요.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="mt-4 inline-flex items-center justify-center rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600"
        >
          로그인하고 삭제하기
        </button>
        <p className="mt-4 text-xs leading-relaxed text-ink-soft">
          로그인이 어려우시면{" "}
          <a
            href={`mailto:${COMPANY.email}?subject=${encodeURIComponent(
              "[손길] 계정 삭제 요청"
            )}&body=${encodeURIComponent(
              "가입하신 이름과 연락처(또는 이메일)를 남겨 주시면 확인 후 계정과 개인정보를 삭제해 드립니다."
            )}`}
            className="font-medium text-brand hover:underline"
          >
            {COMPANY.email}
          </a>{" "}
          또는 고객센터 {COMPANY.tel} 로 요청해 주세요.
        </p>
      </div>
    );
  }

  const name =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    user.email?.split("@")[0] ||
    "회원";

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6">
      <p className="text-sm text-ink-soft">
        <span className="font-bold text-ink">{name}</span>
        {user.email ? <span className="text-ink-soft"> ({user.email})</span> : null} 님으로
        로그인되어 있어요.
      </p>
      <p className="mt-3 text-sm font-bold text-rose-700">
        계정을 삭제하면 되돌릴 수 없어요.
      </p>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft">
        아래 칸에 <span className="font-bold text-ink">{CONFIRM_WORD}</span> 를 입력하면 삭제
        버튼이 활성화됩니다.
      </p>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder={`${CONFIRM_WORD} 입력`}
        className="mt-3 w-full max-w-xs rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
        aria-label="삭제 확인 문구 입력"
      />
      {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}
      <div className="mt-4">
        <button
          onClick={handleDelete}
          disabled={confirmText.trim() !== CONFIRM_WORD || busy}
          className="inline-flex items-center justify-center rounded-full bg-rose-600 px-6 py-2.5 text-sm font-bold text-white transition enabled:hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "삭제 중…" : "내 계정 영구 삭제"}
        </button>
      </div>
    </div>
  );
}
