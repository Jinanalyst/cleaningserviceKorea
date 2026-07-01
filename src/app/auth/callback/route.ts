import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

// 구글 OAuth 리디렉트 콜백 — 인증 코드를 세션으로 교환한다.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";

  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=1`);
}
