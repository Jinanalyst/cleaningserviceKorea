// Next.js 16 Proxy (구 Middleware) — 요청마다 Supabase 로그인 세션을 갱신한다.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // 환경변수가 없으면 인증 없이 통과 (빌드/미설정 환경 보호)
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // 세션 토큰 갱신 (반드시 호출)
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    // 정적 파일/이미지 제외한 모든 경로
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.ico).*)",
  ],
};
