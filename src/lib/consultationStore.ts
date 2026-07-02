// 고객 견적 상담 신청 저장소 — Supabase(Postgres) 기반. 서버 전용.
// 고객이 상담을 신청하면 여기에 쌓이고, 운영자가 대면 상담 후 합의 견적을 입력한다.
import "server-only";
import { getSupabase } from "./supabase";
import type { ConsultationStatus } from "./data";

const TABLE = "consultations";

export type Consultation = {
  id: string; // 상담 코드 (예: CS-8F3K2A)
  createdAt: string;
  customerName: string; // 고객명
  phone: string; // 연락처
  address: string; // 주소
  addressDetail: string; // 상세 주소
  serviceId: string; // 희망 서비스
  pyeong: number | null; // 평수 (선택)
  preferredDate: string; // 희망 방문일 (자유 입력)
  notes: string; // 요청사항
  status: ConsultationStatus;
  quotedPrice: number | null; // 합의된 견적 금액 (운영자 입력)
  quoteNote: string; // 견적/상담 메모 (운영자 입력)
  userId: string | null; // 연결된 로그인 계정 (구글 로그인 고객)
};

type Row = {
  id: string;
  created_at: string;
  customer_name: string;
  phone: string;
  address: string | null;
  address_detail: string | null;
  service_id: string | null;
  pyeong: number | null;
  preferred_date: string | null;
  notes: string | null;
  status: ConsultationStatus;
  quoted_price: number | null;
  quote_note: string | null;
  user_id: string | null;
};

function fromRow(r: Row): Consultation {
  return {
    id: r.id,
    createdAt: r.created_at,
    customerName: r.customer_name,
    phone: r.phone,
    address: r.address ?? "",
    addressDetail: r.address_detail ?? "",
    serviceId: r.service_id ?? "",
    pyeong: r.pyeong ?? null,
    preferredDate: r.preferred_date ?? "",
    notes: r.notes ?? "",
    status: r.status,
    quotedPrice: r.quoted_price ?? null,
    quoteNote: r.quote_note ?? "",
    userId: r.user_id ?? null,
  };
}

export function makeConsultCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `CS-${s}`;
}

export async function readAllConsultations(): Promise<Consultation[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Row[]).map(fromRow);
}

export async function createConsultation(
  input: Omit<
    Consultation,
    "id" | "createdAt" | "status" | "quotedPrice" | "quoteNote"
  >
): Promise<Consultation> {
  const supabase = getSupabase();
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = makeConsultCode();
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        id,
        customer_name: input.customerName,
        phone: input.phone,
        address: input.address,
        address_detail: input.addressDetail,
        service_id: input.serviceId,
        pyeong: input.pyeong,
        preferred_date: input.preferredDate,
        notes: input.notes,
        status: "requested",
        quoted_price: null,
        quote_note: "",
        user_id: input.userId,
      })
      .select("*")
      .single();

    if (!error && data) return fromRow(data as Row);
    if (error && error.code !== "23505") throw new Error(error.message);
  }
  throw new Error("상담 코드 생성에 실패했어요. 다시 시도해 주세요.");
}

export async function updateConsultation(
  id: string,
  patch: {
    status?: ConsultationStatus;
    quotedPrice?: number | null;
    quoteNote?: string;
  }
): Promise<Consultation | null> {
  const fields: Record<string, unknown> = {};
  if (patch.status) fields.status = patch.status;
  if (patch.quotedPrice !== undefined) fields.quoted_price = patch.quotedPrice;
  if (patch.quoteNote !== undefined) fields.quote_note = patch.quoteNote;

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

// 특정 로그인 계정이 낸 상담 신청만 조회 (개인정보 보호)
export async function readConsultationsByUser(
  userId: string
): Promise<Consultation[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Row[]).map(fromRow);
}
