// 추천 코드·정산 프로필 유틸 — Supabase(Postgres) 기반. 서버 전용.
//   • 모든 로그인 사용자에게 고유 추천 코드를 발급/보장한다.
//   • 정산 계좌(payout_*)는 profiles 에 저장하며, 파트너 프로필 역할을 겸한다.
//   실제 커미션 적립·차감·집계·정산은 commissionStore.ts(리커링 엔진)가 담당한다.
import "server-only";
import { getSupabase } from "./supabase";

const PROFILES = "profiles";

export type ReferralProfile = {
  code: string;
  payoutBank: string;
  payoutAccount: string;
  payoutHolder: string;
};

// 사람이 헷갈리기 쉬운 문자(0/O/1/I) 제외한 7자리 코드.
export function makeReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 7; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// 유입 추천코드를 정규화 (대문자, 공백 제거).
export function normalizeCode(raw: unknown): string {
  return String(raw ?? "").trim().toUpperCase().slice(0, 16);
}

function normDigits(s: string): string {
  return (s || "").replace(/\D/g, "");
}

// 로그인 사용자의 추천 코드 보장 — 없으면 프로필을 만들고 코드를 부여한다.
export async function ensureReferralCode(
  userId: string,
  email?: string | null,
  name?: string | null
): Promise<string> {
  const supabase = getSupabase();
  const { data: existing } = await supabase
    .from(PROFILES)
    .select("id, referral_code")
    .eq("id", userId)
    .maybeSingle();
  if (existing?.referral_code) return existing.referral_code as string;

  // 프로필 행이 없으면 최소 정보로 생성(온보딩 전일 수 있음). 이미 있으면 무시.
  if (!existing) {
    await supabase
      .from(PROFILES)
      .insert({ id: userId, email: email ?? null, name: name ?? null });
  }

  // 코드 충돌(23505) 시 재시도. referral_code 가 이미 채워졌으면(경합) 그 값을 쓴다.
  for (let i = 0; i < 6; i++) {
    const code = makeReferralCode();
    const { error } = await supabase
      .from(PROFILES)
      .update({ referral_code: code })
      .eq("id", userId)
      .is("referral_code", null);
    if (!error) break;
  }
  const { data: after } = await supabase
    .from(PROFILES)
    .select("referral_code")
    .eq("id", userId)
    .maybeSingle();
  return (after?.referral_code as string) ?? "";
}

// 내 추천 코드 + 정산 계좌 조회 (코드 보장 포함).
export async function readReferralProfile(
  userId: string,
  email?: string | null,
  name?: string | null
): Promise<ReferralProfile> {
  const code = await ensureReferralCode(userId, email, name);
  const { data } = await getSupabase()
    .from(PROFILES)
    .select("payout_bank, payout_account, payout_holder")
    .eq("id", userId)
    .maybeSingle();
  return {
    code,
    payoutBank: (data?.payout_bank as string) ?? "",
    payoutAccount: (data?.payout_account as string) ?? "",
    payoutHolder: (data?.payout_holder as string) ?? "",
  };
}

// 정산 계좌 저장.
export async function savePayout(
  userId: string,
  payout: { bank: string; account: string; holder: string }
): Promise<void> {
  await getSupabase()
    .from(PROFILES)
    .update({
      payout_bank: payout.bank.slice(0, 40),
      payout_account: normDigits(payout.account).slice(0, 40),
      payout_holder: payout.holder.trim().slice(0, 40),
    })
    .eq("id", userId);
}
