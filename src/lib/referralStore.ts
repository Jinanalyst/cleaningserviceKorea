// 추천(레퍼럴)·제휴 정산 저장소 — Supabase(Postgres) 기반. 서버 전용.
//   • 모든 로그인 사용자에게 고유 추천 코드를 발급/보장.
//   • 추천 링크로 유입된 고객의 "첫 예약", 또는 추천으로 소개돼 승인된 업체의
//     "첫 예약"에서 견적의 3.5%(REFERRAL_RATE)를 추천인에게 적립.
//   • (source_type, referred_key) 유니크로 "첫 1회만" 적립을 보장한다.
import "server-only";
import { getSupabase } from "./supabase";

const PROFILES = "profiles";
const EARNINGS = "referral_earnings";
const APPLICATIONS = "partner_applications";

// 견적 수수료 7% 중 추천인에게 지급하는 비율 (손길 3.5% 유지).
export const REFERRAL_RATE = 0.035;

export type ReferralEarning = {
  id: string;
  createdAt: string;
  referrerCode: string;
  sourceType: "customer" | "partner";
  referredName: string;
  reservationId: string;
  quoteAmount: number;
  amount: number;
  status: "pending" | "paid";
  paidAt: string | null;
};

export type ReferralSummary = {
  referredCustomers: number;
  referredPartners: number;
  pending: number; // 지급 대기 적립액 합계
  paid: number; // 지급 완료 합계
  total: number; // 전체 적립액
};

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

// 추천 코드 → 추천인 user_id (자기추천 방지·유효성 확인용).
async function referrerUserIdByCode(code: string): Promise<string | null> {
  const { data } = await getSupabase()
    .from(PROFILES)
    .select("id")
    .eq("referral_code", code)
    .maybeSingle();
  return (data?.id as string) ?? null;
}

function normDigits(s: string): string {
  return (s || "").replace(/\D/g, "");
}

// 유입 추천코드를 정규화 (대문자, 공백 제거).
export function normalizeCode(raw: unknown): string {
  return String(raw ?? "").trim().toUpperCase().slice(0, 16);
}

// 커미션 적립(첫 1회) — 유니크 충돌/오류는 조용히 무시(예약 흐름을 절대 막지 않는다).
async function insertEarning(row: {
  referrerCode: string;
  sourceType: "customer" | "partner";
  referredKey: string;
  referredName: string;
  reservationId: string;
  quote: number;
}): Promise<void> {
  const amount = Math.round(row.quote * REFERRAL_RATE);
  if (!Number.isFinite(amount) || amount <= 0) return;
  try {
    await getSupabase()
      .from(EARNINGS)
      .insert({
        referrer_code: row.referrerCode,
        source_type: row.sourceType,
        referred_key: row.referredKey,
        referred_name: row.referredName.slice(0, 80),
        reservation_id: row.reservationId,
        quote_amount: Math.round(row.quote),
        rate: REFERRAL_RATE,
        amount,
        status: "pending",
      });
  } catch {
    /* 유니크 충돌 = 이미 첫 예약 적립됨. 무시. */
  }
}

// 예약 1건에 대해 고객·업체 추천 적립을 모두 시도(멱등). 예약 생성/배정 시 호출.
export async function accrueForReservation(res: {
  id: string;
  referrerCode: string;
  userId: string | null;
  phone: string;
  customerName: string;
  partnerId: string;
  price: number;
  agreedPrice: number | null;
}): Promise<void> {
  const quote = res.agreedPrice ?? res.price;

  // 1) 고객 추천: 예약에 실린 유입 추천코드로 적립.
  const custCode = normalizeCode(res.referrerCode);
  if (custCode) {
    const refUserId = await referrerUserIdByCode(custCode);
    // 유효 코드 + 자기추천 아님
    if (refUserId && refUserId !== res.userId) {
      const referredKey =
        "cust:" + (res.userId ? res.userId : "ph:" + normDigits(res.phone));
      await insertEarning({
        referrerCode: custCode,
        sourceType: "customer",
        referredKey,
        referredName: res.customerName,
        reservationId: res.id,
        quote,
      });
    }
  }

  // 2) 업체 추천: 배정된 업체(신청)의 유입 추천코드로 적립.
  if (res.partnerId) {
    const { data: app } = await getSupabase()
      .from(APPLICATIONS)
      .select("referrer_code, company_name, user_id")
      .eq("id", res.partnerId)
      .maybeSingle();
    const ptnrCode = normalizeCode(app?.referrer_code);
    if (ptnrCode) {
      const refUserId = await referrerUserIdByCode(ptnrCode);
      if (refUserId && refUserId !== (app?.user_id ?? null)) {
        await insertEarning({
          referrerCode: ptnrCode,
          sourceType: "partner",
          referredKey: "ptnr:" + res.partnerId,
          referredName: (app?.company_name as string) ?? "",
          reservationId: res.id,
          quote,
        });
      }
    }
  }
}

function fromEarningRow(r: Record<string, unknown>): ReferralEarning {
  return {
    id: r.id as string,
    createdAt: r.created_at as string,
    referrerCode: r.referrer_code as string,
    sourceType: (r.source_type as "customer" | "partner") ?? "customer",
    referredName: (r.referred_name as string) ?? "",
    reservationId: (r.reservation_id as string) ?? "",
    quoteAmount: Number(r.quote_amount) || 0,
    amount: Number(r.amount) || 0,
    status: (r.status as "pending" | "paid") ?? "pending",
    paidAt: (r.paid_at as string) ?? null,
  };
}

// 특정 추천인의 적립 내역.
export async function readEarningsByCode(code: string): Promise<ReferralEarning[]> {
  const c = normalizeCode(code);
  if (!c) return [];
  const { data, error } = await getSupabase()
    .from(EARNINGS)
    .select("*")
    .eq("referrer_code", c)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(fromEarningRow);
}

export function summarize(earnings: ReferralEarning[]): ReferralSummary {
  let referredCustomers = 0;
  let referredPartners = 0;
  let pending = 0;
  let paid = 0;
  for (const e of earnings) {
    if (e.sourceType === "customer") referredCustomers++;
    else referredPartners++;
    if (e.status === "paid") paid += e.amount;
    else pending += e.amount;
  }
  return { referredCustomers, referredPartners, pending, paid, total: pending + paid };
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

// ── 관리자 정산 ──
export type AdminEarning = ReferralEarning & {
  payoutBank: string;
  payoutAccount: string;
  payoutHolder: string;
};

// 전체 적립 내역 + 각 추천인의 정산 계좌(프로필 조인) — 관리자 지급 처리용.
export async function readAllEarnings(): Promise<AdminEarning[]> {
  const { data, error } = await getSupabase()
    .from(EARNINGS)
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  const rows = (data as Record<string, unknown>[]).map(fromEarningRow);

  // 코드별 정산 계좌 로드
  const codes = Array.from(new Set(rows.map((r) => r.referrerCode)));
  const payouts: Record<string, { bank: string; account: string; holder: string }> = {};
  if (codes.length > 0) {
    const { data: profs } = await getSupabase()
      .from(PROFILES)
      .select("referral_code, payout_bank, payout_account, payout_holder")
      .in("referral_code", codes);
    for (const p of (profs ?? []) as Record<string, unknown>[]) {
      payouts[p.referral_code as string] = {
        bank: (p.payout_bank as string) ?? "",
        account: (p.payout_account as string) ?? "",
        holder: (p.payout_holder as string) ?? "",
      };
    }
  }
  return rows.map((r) => ({
    ...r,
    payoutBank: payouts[r.referrerCode]?.bank ?? "",
    payoutAccount: payouts[r.referrerCode]?.account ?? "",
    payoutHolder: payouts[r.referrerCode]?.holder ?? "",
  }));
}

// 적립 건 지급 상태 변경 (관리자).
export async function markEarning(
  id: string,
  status: "pending" | "paid"
): Promise<ReferralEarning | null> {
  const { data, error } = await getSupabase()
    .from(EARNINGS)
    .update({ status, paid_at: status === "paid" ? new Date().toISOString() : null })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  return fromEarningRow(data as Record<string, unknown>);
}
