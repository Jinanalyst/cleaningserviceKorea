"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

function LoginInner() {
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") ? "로그인에 실패했어요. 다시 시도해 주세요." : null
  );

  async function signInWithGoogle() {
    setError(null);
    setLoading(true);
    try {
      const supabase = createSupabaseBrowser();
      const next = params.get("next") ?? "/onboarding";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
      // 성공 시 구글로 리디렉트됨
    } catch {
      setError("로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-5 py-16 text-center">
      <div className="animate-rise w-full rounded-[2rem] border border-line bg-white p-8 shadow-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.svg" alt="손길" className="mx-auto h-16 w-16" />
        <h1 className="mt-5 text-2xl font-black text-ink">손길 시작하기</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          구글 계정으로 간편하게 로그인하고
          <br />
          고객 또는 청소 파트너로 시작하세요.
        </p>

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="mt-7 flex w-full items-center justify-center gap-3 rounded-full border border-line bg-white px-6 py-3.5 text-base font-bold text-ink shadow-sm transition hover:bg-cream-deep disabled:opacity-60"
        >
          <GoogleIcon />
          {loading ? "구글로 이동 중…" : "Google 계정으로 계속하기"}
        </button>

        {error && (
          <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
            {error}
          </p>
        )}

        <p className="mt-6 text-xs leading-relaxed text-ink-soft/80">
          계속 진행하면 손길 이용약관 및 개인정보 처리방침에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="py-20 text-center text-ink-soft">불러오는 중…</p>}>
      <LoginInner />
    </Suspense>
  );
}
