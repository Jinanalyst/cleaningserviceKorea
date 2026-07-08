// 앱/웹 공용 인증 — 웹은 쿠키 세션, 모바일 앱은 Authorization: Bearer <access_token>.
// 모바일 앱(손길 앱)은 사이트의 쿠키 세션이 없으므로 Supabase 액세스 토큰을 헤더로 보낸다.
import "server-only";
import { createClient, type User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { getCurrentUser } from "./auth";

export async function getRequestUser(request: NextRequest): Promise<User | null> {
  // 1) 웹: 쿠키 세션
  const cookieUser = await getCurrentUser();
  if (cookieUser) return cookieUser;

  // 2) 앱: Bearer 토큰
  const header =
    request.headers.get("authorization") || request.headers.get("Authorization");
  const token = header?.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";
  if (!token) return null;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase.auth.getUser(token);
    return data.user ?? null;
  } catch {
    return null;
  }
}
