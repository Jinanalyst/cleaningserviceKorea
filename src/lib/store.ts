// 예약 저장소 — Supabase(Postgres) 기반. 서버(라우트 핸들러)에서만 사용.
// service_role 키로 접근하므로 RLS를 우회한다. 클라이언트로 노출 금지.
import "server-only";
import { getSupabase } from "./supabase";
import type { ReservationStatus, PropertyInfo } from "./data";

const TABLE = "reservations";

export type Reservation = {
  id: string; // 예약 코드 (예: SG-8F3K2A)
  createdAt: string; // ISO
  partnerId: string;
  serviceId: string;
  pyeong: number;
  date: string; // YYYY-MM-DD
  timeSlot: string; // "13:00"
  customerName: string;
  phone: string;
  address: string;
  addressDetail: string;
  notes: string;
  property: PropertyInfo; // 집/회사/부분청소 정보
  price: number; // 예상 총액
  deposit: number; // 선결제 예약금
  paymentStatus: "paid"; // 목업: 항상 결제 완료로 생성
  status: ReservationStatus;
  userId: string | null; // 예약한 로그인 계정 (비로그인 예약은 null)
  agreedPrice: number | null; // 관리자가 확정한 협의 가격 (없으면 null)
  partnerQuote: number | null; // 배정 업체가 앱에서 보낸 견적 (없으면 null)
  partnerQuoteNote: string; // 업체 견적 메모
};

// DB 행(snake_case) → Reservation(camelCase)
type Row = {
  id: string;
  created_at: string;
  partner_id: string;
  service_id: string;
  pyeong: number;
  date: string;
  time_slot: string;
  customer_name: string;
  phone: string;
  address: string;
  address_detail: string | null;
  notes: string | null;
  property: PropertyInfo | null;
  price: number;
  deposit: number;
  payment_status: string;
  status: ReservationStatus;
  user_id: string | null;
  agreed_price: number | null;
  partner_quote: number | null;
  partner_quote_note: string | null;
};

function fromRow(r: Row): Reservation {
  return {
    id: r.id,
    createdAt: r.created_at,
    partnerId: r.partner_id,
    serviceId: r.service_id,
    pyeong: r.pyeong,
    date: r.date,
    timeSlot: r.time_slot,
    customerName: r.customer_name,
    phone: r.phone,
    address: r.address,
    addressDetail: r.address_detail ?? "",
    notes: r.notes ?? "",
    property: r.property ?? {},
    price: r.price,
    deposit: r.deposit,
    paymentStatus: "paid",
    status: r.status,
    userId: r.user_id ?? null,
    agreedPrice: r.agreed_price ?? null,
    partnerQuote: r.partner_quote ?? null,
    partnerQuoteNote: r.partner_quote_note ?? "",
  };
}

export function makeCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `SG-${s}`;
}

export async function readAll(): Promise<Reservation[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Row[]).map(fromRow);
}

export async function createReservation(
  input: Omit<
    Reservation,
    | "id"
    | "createdAt"
    | "status"
    | "paymentStatus"
    | "agreedPrice"
    | "partnerQuote"
    | "partnerQuoteNote"
  >
): Promise<Reservation> {
  const supabase = getSupabase();

  // 코드 충돌 시 최대 5회까지 재시도
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = makeCode();
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        id,
        partner_id: input.partnerId,
        service_id: input.serviceId,
        pyeong: input.pyeong,
        date: input.date,
        time_slot: input.timeSlot,
        customer_name: input.customerName,
        phone: input.phone,
        address: input.address,
        address_detail: input.addressDetail,
        notes: input.notes,
        property: input.property,
        price: input.price,
        deposit: input.deposit,
        payment_status: "paid",
        status: "pending",
        user_id: input.userId,
      })
      .select("*")
      .single();

    if (!error && data) return fromRow(data as Row);
    // 23505 = unique_violation (코드 중복) → 재시도
    if (error && error.code !== "23505") throw new Error(error.message);
  }
  throw new Error("예약 코드 생성에 실패했어요. 다시 시도해 주세요.");
}

// 예약 갱신 — 상태·업체배정·협의가(관리자) 를 한 번에 처리.
export async function updateReservation(
  id: string,
  patch: {
    status?: ReservationStatus;
    partnerId?: string;
    agreedPrice?: number | null;
  }
): Promise<Reservation | null> {
  const fields: Record<string, unknown> = {};
  if (patch.status) fields.status = patch.status;
  if (patch.partnerId) fields.partner_id = patch.partnerId;
  if (patch.agreedPrice !== undefined) fields.agreed_price = patch.agreedPrice;

  const { data, error } = await getSupabase()
    .from(TABLE)
    .update(fields)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return fromRow(data as Row);
}

// 상태만 변경 (기존 호출 호환).
export async function updateStatus(
  id: string,
  status: ReservationStatus
): Promise<Reservation | null> {
  return updateReservation(id, { status });
}

// 배정 업체가 앱에서 보낸 견적을 서버에 기록 (파트너 견적 동기화).
export async function setPartnerQuote(
  id: string,
  amount: number,
  memo: string
): Promise<Reservation | null> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .update({ partner_quote: amount, partner_quote_note: memo })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return fromRow(data as Row);
}

// 예약 코드로 단건 조회
export async function readById(id: string): Promise<Reservation | null> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data as Row) : null;
}

// 예약 가능 현황용 — 오늘 이후 예약된 (날짜·시간대·업체) 슬롯만 반환.
// 개인정보(이름·연락처·주소)는 절대 포함하지 않는다. 취소 건은 제외.
export async function readBookedSlots(): Promise<
  { date: string; timeSlot: string; partnerId: string }[]
> {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const from = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(
    t.getDate()
  ).padStart(2, "0")}`;
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("date, time_slot, partner_id")
    .neq("status", "cancelled")
    .gte("date", from);
  if (error) return [];
  return (data ?? []).map((r) => ({
    date: r.date as string,
    timeSlot: r.time_slot as string,
    partnerId: r.partner_id as string,
  }));
}

// 특정 로그인 계정의 예약만 조회 (개인정보 보호)
export async function readByUser(userId: string): Promise<Reservation[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Row[]).map(fromRow);
}

// 특정 업체(파트너)에 배정된 예약만 조회 — 파트너 대시보드용.
// 파트너는 자기 배정 예약의 고객 정보(연락·주소)를 봐야 작업이 가능하므로 전체 필드를 반환한다.
// (조회 권한 검증은 라우트에서 로그인 파트너의 승인된 업체 id 로 제한한다.)
export async function readByPartnerIds(partnerIds: string[]): Promise<Reservation[]> {
  if (partnerIds.length === 0) return [];
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .in("partner_id", partnerIds)
    .order("date", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as Row[]).map(fromRow);
}
