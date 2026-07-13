import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// 구글/카카오 OAuth 리디렉트 콜백 — 인증 코드를 세션으로 교환한다.
//   ⚠️ 세션 쿠키는 반드시 "리디렉트 응답 객체에 직접" 심어야 한다.
//   라우트 핸들러에서 NextResponse.redirect() 로 직접 응답을 만들면,
//   next/headers 의 cookies() 로 설정한 쿠키가 그 응답에 실리지 않아
//   "로그인은 됐는데 다음 페이지에선 로그아웃 상태"가 되는 문제가 생긴다.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=1`);
  }

  // 커스텀 도메인(handway.net/handway.online) 뒤에서도 올바른 호스트로 돌아가도록
  // x-forwarded-host 를 우선 사용한다. (로컬 개발은 origin 그대로)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocal = process.env.NODE_ENV === "development";
  const base = isLocal || !forwardedHost ? origin : `https://${forwardedHost}`;

  // 리디렉트 응답을 먼저 만들고, 세션 쿠키를 이 응답에 직접 쓴다.
  const response = NextResponse.redirect(`${base}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=1`);
  }
  return response;
}
