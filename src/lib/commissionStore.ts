// 파트너 리커링 커미션 저장소 — Supabase(Postgres) 기반. 서버 전용.
//   • 추천 대상(고객/업체)의 "정상 완료 거래"마다 커미션을 반복 적립한다.
//   • 첫 완료 거래 = first_rate, 이후 = repeat_rate. 관계별로 독립 판정.
//   • 한 거래에 고객·업체 추천이 동시 존재하면 각자 자기 요율의 분배 몫(기본 50%).
//   • (reservation_id, referred_type) 유니크로 멱등. 관계·부정·자기추천을 차단한다.
//   • 모든 금액 계산은 여기(서버)에서만 수행한다. 프론트는 표시만.
import "server-only";
import { getSupabase } from "./supabase";
import { normalizeCode } from "./referralStore";
import {
  DEFAULT_SETTINGS,
  commissionAmount,
  effectiveRate,
  type CommissionSettings,
  type CommissionStatus,
  type ReferredType,
} from "./commission";
import type { Reservation } from "./store";

const PROFILES = "profiles";
const APPLICATIONS = "partner_applications";
const SETTINGS = "commission_settings";
const RELATIONS = "referral_relations";
const COMMISSIONS = "partner_commissions";
const PAYOUTS = "partner_payouts";
const FRAUD = "fraud_flags";

// 커미션에서 "정상(집계 대상)"으로 보는 상태.
const LIVE_STATUSES: CommissionStatus[] = ["pending", "available", "paid"];

function digits(s: string): string {
  return (s || "").replace(/\D/g, "");
}

// ── 설정 ──────────────────────────────────────────────────────
export async function getSettings(): Promise<CommissionSettings> {
  const { data } = await getSupabase()
    .from(SETTINGS)
    .select("*")
    .eq("id", "default")
    .maybeSingle();
  if (!data) return { ...DEFAULT_SETTINGS };
  return {
    platformFeeRate: Number(data.platform_fee_rate) || DEFAULT_SETTINGS.platformFeeRate,
    firstRate: Number(data.first_rate) || DEFAULT_SETTINGS.firstRate,
    repeatRate: Number(data.repeat_rate) || DEFAULT_SETTINGS.repeatRate,
    splitCustomer: Number(data.split_customer) || DEFAULT_SETTINGS.splitCustomer,
    splitProvider: Number(data.split_provider) || DEFAULT_SETTINGS.splitProvider,
    minPayout: Number(data.min_payout) || DEFAULT_SETTINGS.minPayout,
  };
}

export async function updateSettings(
  patch: Partial<CommissionSettings>
): Promise<CommissionSettings> {
  const clampRate = (n: number) => Math.min(Math.max(n, 0), 1);
  const fields: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.platformFeeRate !== undefined) fields.platform_fee_rate = clampRate(patch.platformFeeRate);
  if (patch.firstRate !== undefined) fields.first_rate = clampRate(patch.firstRate);
  if (patch.repeatRate !== undefined) fields.repeat_rate = clampRate(patch.repeatRate);
  if (patch.splitCustomer !== undefined) fields.split_customer = clampRate(patch.splitCustomer);
  if (patch.splitProvider !== undefined) fields.split_provider = clampRate(patch.splitProvider);
  if (patch.minPayout !== undefined) fields.min_payout = Math.max(0, Math.round(patch.minPayout));
  await getSupabase().from(SETTINGS).upsert({ id: "default", ...fields });
  return getSettings();
}

// ── 추천인·부정 조회 ──────────────────────────────────────────
async function referrerUserIdByCode(code: string): Promise<string | null> {
  const { data } = await getSupabase()
    .from(PROFILES)
    .select("id")
    .eq("referral_code", code)
    .maybeSingle();
  return (data?.id as string) ?? null;
}

async function isFraud(targetType: string, targetId: string): Promise<boolean> {
  const { data } = await getSupabase()
    .from(FRAUD)
    .select("id")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();
  return !!data;
}

// ── 추천 관계 ─────────────────────────────────────────────────
export type Relation = {
  id: string;
  createdAt: string;
  referrerCode: string;
  referrerUserId: string | null;
  referredType: ReferredType;
  referredKey: string;
  referredName: string;
  referralLink: string;
  status: "active" | "suspended" | "ended";
  firstCompletedAt: string | null;
  completedCount: number;
  grossAmount: number;
  totalCommission: number;
  note: string;
};

function fromRelationRow(r: Record<string, unknown>): Relation {
  return {
    id: r.id as string,
    createdAt: r.created_at as string,
    referrerCode: r.referrer_code as string,
    referrerUserId: (r.referrer_user_id as string) ?? null,
    referredType: (r.referred_type as ReferredType) ?? "customer",
    referredKey: (r.referred_key as string) ?? "",
    referredName: (r.referred_name as string) ?? "",
    referralLink: (r.referral_link as string) ?? "",
    status: (r.status as Relation["status"]) ?? "active",
    firstCompletedAt: (r.first_completed_at as string) ?? null,
    completedCount: Number(r.completed_count) || 0,
    grossAmount: Number(r.gross_amount) || 0,
    totalCommission: Number(r.total_commission) || 0,
    note: (r.note as string) ?? "",
  };
}

// 관계를 "최초 1회"만 등록한다. 이미 있으면(다른 추천인이라도) 기존 관계를 반환.
async function ensureRelation(t: {
  referrerCode: string;
  referrerUserId: string | null;
  referredType: ReferredType;
  referredKey: string;
  referredName: string;
}): Promise<Relation | null> {
  const supabase = getSupabase();
  const { data: existing } = await supabase
    .from(RELATIONS)
    .select("*")
    .eq("referred_type", t.referredType)
    .eq("referred_key", t.referredKey)
    .maybeSingle();
  if (existing) return fromRelationRow(existing as Record<string, unknown>);

  const { data, error } = await supabase
    .from(RELATIONS)
    .insert({
      referrer_code: t.referrerCode,
      referrer_user_id: t.referrerUserId,
      referred_type: t.referredType,
      referred_key: t.referredKey,
      referred_name: t.referredName.slice(0, 80),
      status: "active",
    })
    .select("*")
    .maybeSingle();
  if (error) {
    // 경합(유니크 충돌) → 방금 생긴 행을 다시 읽는다.
    const { data: again } = await supabase
      .from(RELATIONS)
      .select("*")
      .eq("referred_type", t.referredType)
      .eq("referred_key", t.referredKey)
      .maybeSingle();
    return again ? fromRelationRow(again as Record<string, unknown>) : null;
  }
  return data ? fromRelationRow(data as Record<string, unknown>) : null;
}

// 관계의 정상 커미션 집계를 다시 계산해 캐시 컬럼을 갱신한다.
async function recomputeRelation(relationId: string): Promise<void> {
  const { data } = await getSupabase()
    .from(COMMISSIONS)
    .select("amount, base_amount, created_at, status")
    .eq("relation_id", relationId)
    .in("status", LIVE_STATUSES)
    .order("created_at", { ascending: true });
  const rows = (data ?? []) as Record<string, unknown>[];
  const completedCount = rows.length;
  const grossAmount = rows.reduce((s, r) => s + (Number(r.base_amount) || 0), 0);
  const totalCommission = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const firstCompletedAt = rows.length > 0 ? (rows[0].created_at as string) : null;
  await getSupabase()
    .from(RELATIONS)
    .update({
      completed_count: completedCount,
      gross_amount: grossAmount,
      total_commission: totalCommission,
      first_completed_at: firstCompletedAt,
    })
    .eq("id", relationId);
}

// ── 적립(완료 거래) ───────────────────────────────────────────
// 한 관계에 대해 한 예약의 커미션을 적립/재계산(멱등).
async function accrueOne(
  rel: Relation,
  referredType: ReferredType,
  reservationId: string,
  referredName: string,
  base: number,
  dual: boolean,
  settings: CommissionSettings
): Promise<void> {
  const supabase = getSupabase();

  // 이미 이 예약·유형의 커미션이 있으면 → 부분환불 등으로 금액이 바뀐 경우만 재계산.
  const { data: existing } = await supabase
    .from(COMMISSIONS)
    .select("id, status, is_first, base_amount, amount, relation_id")
    .eq("reservation_id", reservationId)
    .eq("referred_type", referredType)
    .maybeSingle();

  if (existing) {
    const st = existing.status as CommissionStatus;
    if (st === "pending" || st === "available") {
      const isFirst = !!existing.is_first;
      const amount = commissionAmount(base, settings, referredType, isFirst, dual);
      const rate = effectiveRate(settings, referredType, isFirst, dual);
      if (base !== Number(existing.base_amount) || amount !== Number(existing.amount)) {
        await supabase
          .from(COMMISSIONS)
          .update({ base_amount: base, amount, rate })
          .eq("id", existing.id as string);
        await recomputeRelation(existing.relation_id as string);
      }
    }
    return;
  }

  // 신규 적립 — 이 관계의 기존 정상 커미션 수로 첫 거래 여부/순번 판정.
  const { data: prior } = await supabase
    .from(COMMISSIONS)
    .select("id")
    .eq("relation_id", rel.id)
    .in("status", LIVE_STATUSES);
  const priorCount = (prior ?? []).length;
  const isFirst = priorCount === 0;
  const amount = commissionAmount(base, settings, referredType, isFirst, dual);
  if (amount <= 0) return;
  const rate = effectiveRate(settings, referredType, isFirst, dual);

  const { error } = await supabase.from(COMMISSIONS).insert({
    relation_id: rel.id,
    referrer_code: rel.referrerCode,
    referred_type: referredType,
    referred_name: referredName.slice(0, 80),
    reservation_id: reservationId,
    sequence_no: priorCount + 1,
    is_first: isFirst,
    base_amount: base,
    rate,
    amount,
    status: "pending",
  });
  // 유니크 충돌 = 동시 처리로 이미 적립됨. 그 외 오류도 예약 흐름을 막지 않는다.
  if (error) return;
  await recomputeRelation(rel.id);
}

// 예약이 "정상 완료"됐을 때 고객·업체 추천 커미션을 적립(멱등). 상태 완료 시 호출.
export async function accrueCompletion(res: Reservation): Promise<void> {
  if (res.status !== "completed") return;
  // 부정 표시된 거래는 적립 제외 + 기존 커미션 회수.
  if (await isFraud("reservation", res.id)) {
    await reverseReservation(res.id);
    return;
  }
  const base = Math.round(res.agreedPrice ?? res.price);
  if (!(base > 0)) return;

  const settings = await getSettings();

  const targets: {
    referredType: ReferredType;
    referredKey: string;
    referredName: string;
    referrerCode: string;
    referrerUserId: string;
  }[] = [];

  // 1) 고객 추천 — 예약에 실린 유입 추천코드.
  const custCode = normalizeCode(res.referrerCode);
  if (custCode) {
    const refUser = await referrerUserIdByCode(custCode);
    if (refUser && refUser !== res.userId) {
      const referredKey = "cust:" + (res.userId ? res.userId : "ph:" + digits(res.phone));
      targets.push({
        referredType: "customer",
        referredKey,
        referredName: res.customerName,
        referrerCode: custCode,
        referrerUserId: refUser,
      });
    }
  }

  // 2) 업체 추천 — 배정된 업체(신청)의 유입 추천코드.
  if (res.partnerId) {
    const { data: app } = await getSupabase()
      .from(APPLICATIONS)
      .select("referrer_code, company_name, user_id")
      .eq("id", res.partnerId)
      .maybeSingle();
    const ptnrCode = normalizeCode(app?.referrer_code);
    if (ptnrCode) {
      const refUser = await referrerUserIdByCode(ptnrCode);
      if (refUser && refUser !== (app?.user_id ?? null)) {
        targets.push({
          referredType: "provider",
          referredKey: "ptnr:" + res.partnerId,
          referredName: (app?.company_name as string) ?? "",
          referrerCode: ptnrCode,
          referrerUserId: refUser,
        });
      }
    }
  }

  const dual = targets.length === 2;
  for (const t of targets) {
    const rel = await ensureRelation(t);
    if (!rel || rel.status !== "active") continue;
    await accrueOne(
      rel,
      t.referredType,
      res.id,
      t.referredName,
      base,
      dual,
      settings
    );
  }
}

// 예약 취소·환불·부정 시 커미션 회수: 미지급→canceled, 지급완료→deducted.
export async function reverseReservation(reservationId: string): Promise<void> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from(COMMISSIONS)
    .select("id, status, relation_id")
    .eq("reservation_id", reservationId);
  const rows = (data ?? []) as Record<string, unknown>[];
  const affected = new Set<string>();
  for (const r of rows) {
    const st = r.status as CommissionStatus;
    let next: CommissionStatus | null = null;
    if (st === "paid") next = "deducted";
    else if (st === "pending" || st === "available") next = "canceled";
    if (!next) continue;
    await supabase.from(COMMISSIONS).update({ status: next }).eq("id", r.id as string);
    if (r.relation_id) affected.add(r.relation_id as string);
  }
  for (const relId of affected) await recomputeRelation(relId);
}

// 예약 상태 변화에 따라 적립/회수를 한 번에 처리 — 라우트에서 호출.
export async function syncReservationCommission(res: Reservation): Promise<void> {
  if (res.status === "completed") {
    await accrueCompletion(res);
  } else if (res.status === "cancelled") {
    await reverseReservation(res.id);
  }
  // pending/confirmed/in_progress 는 아직 적립 대상 아님(작업 미완료).
}

// ── 커미션 조회/집계 ─────────────────────────────────────────
export type Commission = {
  id: string;
  createdAt: string;
  referrerCode: string;
  referredType: ReferredType;
  referredName: string;
  reservationId: string;
  sequenceNo: number;
  isFirst: boolean;
  baseAmount: number;
  rate: number;
  amount: number;
  status: CommissionStatus;
  paidAt: string | null;
};

function fromCommissionRow(r: Record<string, unknown>): Commission {
  return {
    id: r.id as string,
    createdAt: r.created_at as string,
    referrerCode: r.referrer_code as string,
    referredType: (r.referred_type as ReferredType) ?? "customer",
    referredName: (r.referred_name as string) ?? "",
    reservationId: (r.reservation_id as string) ?? "",
    sequenceNo: Number(r.sequence_no) || 1,
    isFirst: !!r.is_first,
    baseAmount: Number(r.base_amount) || 0,
    rate: Number(r.rate) || 0,
    amount: Number(r.amount) || 0,
    status: (r.status as CommissionStatus) ?? "pending",
    paidAt: (r.paid_at as string) ?? null,
  };
}

export async function readCommissionsByCode(code: string): Promise<Commission[]> {
  const c = normalizeCode(code);
  if (!c) return [];
  const { data, error } = await getSupabase()
    .from(COMMISSIONS)
    .select("*")
    .eq("referrer_code", c)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(fromCommissionRow);
}

export async function readRelationsByCode(code: string): Promise<Relation[]> {
  const c = normalizeCode(code);
  if (!c) return [];
  const { data, error } = await getSupabase()
    .from(RELATIONS)
    .select("*")
    .eq("referrer_code", c)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(fromRelationRow);
}

export type CommissionSummary = {
  thisMonthEstimate: number; // 이번 달 적립(예정+가능) 합계
  available: number; // 정산 가능 금액(차감 반영)
  total: number; // 누적 수익(지급 완료+정산 가능+적립 예정)
  paid: number; // 지급 완료 누적
  referredCustomers: number;
  referredProviders: number;
  thisMonthCompleted: number; // 이번 달 완료 거래 수
};

function ym(iso: string): string {
  return (iso || "").slice(0, 7); // YYYY-MM
}

export function summarize(
  commissions: Commission[],
  relations: Relation[],
  monthKey: string
): CommissionSummary {
  let thisMonthEstimate = 0;
  let available = 0;
  let total = 0;
  let paid = 0;
  let thisMonthCompleted = 0;
  for (const c of commissions) {
    const live = c.status === "pending" || c.status === "available" || c.status === "paid";
    if (c.status === "available") available += c.amount;
    if (c.status === "deducted") available -= c.amount; // 차감분은 정산 가능액에서 뺀다
    if (c.status === "paid") paid += c.amount;
    if (live) total += c.amount;
    if (ym(c.createdAt) === monthKey) {
      if (live) {
        thisMonthCompleted += 1;
        if (c.status === "pending" || c.status === "available") thisMonthEstimate += c.amount;
      }
    }
  }
  const referredCustomers = relations.filter((r) => r.referredType === "customer").length;
  const referredProviders = relations.filter((r) => r.referredType === "provider").length;
  return {
    thisMonthEstimate,
    available: Math.max(0, available),
    total,
    paid,
    referredCustomers,
    referredProviders,
    thisMonthCompleted,
  };
}

// ── 관리자 ────────────────────────────────────────────────────
export type PayoutAccount = { bank: string; account: string; holder: string };

async function payoutAccountsByCodes(
  codes: string[]
): Promise<Record<string, PayoutAccount>> {
  const out: Record<string, PayoutAccount> = {};
  if (codes.length === 0) return out;
  const { data } = await getSupabase()
    .from(PROFILES)
    .select("referral_code, payout_bank, payout_account, payout_holder")
    .in("referral_code", codes);
  for (const p of (data ?? []) as Record<string, unknown>[]) {
    out[p.referral_code as string] = {
      bank: (p.payout_bank as string) ?? "",
      account: (p.payout_account as string) ?? "",
      holder: (p.payout_holder as string) ?? "",
    };
  }
  return out;
}

export type AdminCommission = Commission & PayoutAccount;

export async function readAllCommissions(): Promise<AdminCommission[]> {
  const { data, error } = await getSupabase()
    .from(COMMISSIONS)
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  const rows = (data as Record<string, unknown>[]).map(fromCommissionRow);
  const accounts = await payoutAccountsByCodes(
    Array.from(new Set(rows.map((r) => r.referrerCode)))
  );
  return rows.map((r) => ({ ...r, ...(accounts[r.referrerCode] ?? { bank: "", account: "", holder: "" }) }));
}

export async function readAllRelations(): Promise<Relation[]> {
  const { data, error } = await getSupabase()
    .from(RELATIONS)
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(fromRelationRow);
}

// 커미션 상태 수동 변경(정산 승인/지급/취소/차감). 변경 후 관계 집계 재계산.
export async function markCommission(
  id: string,
  status: CommissionStatus
): Promise<Commission | null> {
  const { data, error } = await getSupabase()
    .from(COMMISSIONS)
    .update({ status, paid_at: status === "paid" ? new Date().toISOString() : null })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  const row = fromCommissionRow(data as Record<string, unknown>);
  const relId = (data as Record<string, unknown>).relation_id as string | null;
  if (relId) await recomputeRelation(relId);
  return row;
}

export async function setRelationStatus(
  id: string,
  status: Relation["status"]
): Promise<Relation | null> {
  const { data, error } = await getSupabase()
    .from(RELATIONS)
    .update({ status })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  return fromRelationRow(data as Record<string, unknown>);
}

// 부정 표시: 거래면 커미션까지 회수. (관계/파트너는 표시만)
export async function flagFraud(
  targetType: "reservation" | "relation" | "partner",
  targetId: string,
  reason: string,
  by: string
): Promise<void> {
  await getSupabase()
    .from(FRAUD)
    .upsert(
      { target_type: targetType, target_id: targetId, reason: reason.slice(0, 200), created_by: by },
      { onConflict: "target_type,target_id" }
    );
  if (targetType === "reservation") await reverseReservation(targetId);
  if (targetType === "relation") await setRelationStatus(targetId, "suspended");
}

export async function unflagFraud(
  targetType: string,
  targetId: string
): Promise<void> {
  await getSupabase()
    .from(FRAUD)
    .delete()
    .eq("target_type", targetType)
    .eq("target_id", targetId);
}

export type Payout = {
  id: string;
  createdAt: string;
  referrerCode: string;
  amount: number;
  count: number;
  status: "available" | "paid" | "canceled";
  period: string;
  bank: string;
  account: string;
  holder: string;
  paidAt: string | null;
};

function fromPayoutRow(r: Record<string, unknown>): Payout {
  return {
    id: r.id as string,
    createdAt: r.created_at as string,
    referrerCode: r.referrer_code as string,
    amount: Number(r.amount) || 0,
    count: Number(r.count) || 0,
    status: (r.status as Payout["status"]) ?? "available",
    period: (r.period as string) ?? "",
    bank: (r.bank as string) ?? "",
    account: (r.account as string) ?? "",
    holder: (r.holder as string) ?? "",
    paidAt: (r.paid_at as string) ?? null,
  };
}

export async function readPayouts(): Promise<Payout[]> {
  const { data, error } = await getSupabase()
    .from(PAYOUTS)
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(fromPayoutRow);
}

// 특정 추천인의 available 커미션을 묶어 정산 배치를 생성하고 지급 완료 처리한다.
//   최소 정산 금액 미만이면 생성하지 않는다. 차감(deducted)은 총액에서 뺀다.
export async function createPayoutBatch(
  code: string,
  period: string
): Promise<Payout | null> {
  const c = normalizeCode(code);
  if (!c) return null;
  const supabase = getSupabase();
  const settings = await getSettings();

  const { data: avail } = await supabase
    .from(COMMISSIONS)
    .select("id, amount, relation_id")
    .eq("referrer_code", c)
    .eq("status", "available");
  const availRows = (avail ?? []) as Record<string, unknown>[];
  const availSum = availRows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  // 아직 정산에 반영되지 않은 차감(deducted) — 이번 지급에서 차감.
  const { data: ded } = await supabase
    .from(COMMISSIONS)
    .select("id, amount")
    .eq("referrer_code", c)
    .eq("status", "deducted")
    .is("payout_id", null);
  const dedRows = (ded ?? []) as Record<string, unknown>[];
  const dedSum = dedRows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const net = availSum - dedSum;
  if (net < settings.minPayout || availRows.length === 0) return null;

  const account = (await payoutAccountsByCodes([c]))[c] ?? { bank: "", account: "", holder: "" };
  const { data: payout, error } = await supabase
    .from(PAYOUTS)
    .insert({
      referrer_code: c,
      amount: net,
      count: availRows.length,
      status: "paid",
      period,
      bank: account.bank,
      account: account.account,
      holder: account.holder,
      paid_at: new Date().toISOString(),
    })
    .select("*")
    .maybeSingle();
  if (error || !payout) return null;
  const payoutId = (payout as Record<string, unknown>).id as string;

  // 포함된 커미션을 지급 완료로, 차감분은 반영 처리(payout_id 기록).
  const now = new Date().toISOString();
  const relIds = new Set<string>();
  for (const r of availRows) {
    await supabase
      .from(COMMISSIONS)
      .update({ status: "paid", paid_at: now, payout_id: payoutId })
      .eq("id", r.id as string);
    if (r.relation_id) relIds.add(r.relation_id as string);
  }
  for (const r of dedRows) {
    await supabase.from(COMMISSIONS).update({ payout_id: payoutId }).eq("id", r.id as string);
  }
  for (const relId of relIds) await recomputeRelation(relId);
  return fromPayoutRow(payout as Record<string, unknown>);
}
