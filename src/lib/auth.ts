// 서버 측 인증 유틸 — 현재 로그인 사용자 확인 및 관리자 판별.
import "server-only";
import { createSupabaseServer } from "./supabase-server";
import type { User } from "@supabase/supabase-js";

export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

// ADMIN_EMAILS (콤마 구분) 에 포함된 이메일만 운영자로 인정.
export function isAdminEmail(email?: string | null): boolean {
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return !!email && list.includes(email.toLowerCase());
}

export async function requireAdmin(): Promise<User | null> {
  const user = await getCurrentUser();
  if (user && isAdminEmail(user.email)) return user;
  return null;
}
