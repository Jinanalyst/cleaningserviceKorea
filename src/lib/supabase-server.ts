// 서버(라우트 핸들러/서버 컴포넌트/프록시)용 Supabase 클라이언트.
// 쿠키에서 로그인 세션을 읽어 인증 사용자를 확인한다.
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 서버 컴포넌트에서 호출된 경우 set이 무시될 수 있음 (프록시가 갱신 담당)
          }
        },
      },
    }
  );
}
