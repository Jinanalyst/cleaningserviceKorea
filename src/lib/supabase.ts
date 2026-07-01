// Supabase 서버 전용 클라이언트.
// service_role 키를 사용하므로 절대 클라이언트(브라우저)로 노출되면 안 된다.
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase 환경변수가 없습니다. SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 를 설정해 주세요."
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
