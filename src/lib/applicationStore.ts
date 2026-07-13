// 파트너 등록 신청 저장소 — Supabase(Postgres) 기반. 서버 전용.
import "server-only";
import { getSupabase } from "./supabase";
import { type ApplicationStatus, SERVICE_INFO } from "./data";

const TABLE = "partner_applications";
const PHOTO_BUCKET = "partner-photos";

// data:URL(base64) 업체 사진을 Storage에 업로드하고 공개 URL 목록 반환 (service_role).
export async function uploadPartnerPhotos(
  appId: string,
  images: string[]
): Promise<string[]> {
  const supabase = getSupabase();
  const urls: string[] = [];
  for (let i = 0; i < images.length; i++) {
    const m = /^data:(image\/(png|jpe?g|webp));base64,(.+)$/i.exec(images[i]);
    if (!m) continue;
    const contentType = m[1];
    const ext = contentType.split("/")[1].replace("jpeg", "jpg");
    const buffer = Buffer.from(m[3], "base64");
    const path = `${appId}/${Date.now()}-${i}.${ext}`;
    const { error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, buffer, { contentType, upsert: true });
    if (error) throw new Error(`사진 업로드에 실패했어요: ${error.message}`);
    urls.push(supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl);
  }
  return urls;
}

// 업체(신청 id) 폴더의 사진 공개 URL 목록.
export async function listPartnerPhotos(appId: string): Promise<string[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .list(appId, { limit: 12, sortBy: { column: "name", order: "asc" } });
  if (error || !data) return [];
  return data
    .filter((f) => f.name && !f.name.startsWith("."))
    .map(
      (f) =>
        supabase.storage.from(PHOTO_BUCKET).getPublicUrl(`${appId}/${f.name}`).data
          .publicUrl
    );
}

export type Application = {
  id: string; // 신청 코드 (예: PT-8F3K2A)
  createdAt: string;
  companyName: string; // 업체명
  ownerName: string; // 대표자명
  bizNumber: string; // 사업자등록번호
  phone: string; // 담당자 연락처
  email: string;
  bankName: string; // 정산 은행
  accountNumber: string; // 계좌번호
  accountHolder: string; // 예금주
  regions: string; // 서비스 가능 지역
  services: string[]; // 전문 청소 분야
  experience: string; // 경력 (예: "5년")
  teamSize: string; // 인력 규모
  intro: string; // 업체 소개
  status: ApplicationStatus;
  reviewNote: string; // 심사 메모/사유
  userId: string | null; // 연결된 로그인 계정 (구글 로그인 업체)
};

type Row = {
  id: string;
  created_at: string;
  company_name: string;
  owner_name: string;
  biz_number: string;
  phone: string;
  email: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  regions: string | null;
  services: string[] | null;
  experience: string | null;
  team_size: string | null;
  intro: string | null;
  status: ApplicationStatus;
  review_note: string | null;
  user_id: string | null;
};

function fromRow(r: Row): Application {
  return {
    id: r.id,
    createdAt: r.created_at,
    companyName: r.company_name,
    ownerName: r.owner_name,
    bizNumber: r.biz_number,
    phone: r.phone,
    email: r.email,
    bankName: r.bank_name,
    accountNumber: r.account_number,
    accountHolder: r.account_holder,
    regions: r.regions ?? "",
    services: r.services ?? [],
    experience: r.experience ?? "",
    teamSize: r.team_size ?? "",
    intro: r.intro ?? "",
    status: r.status,
    reviewNote: r.review_note ?? "",
    userId: r.user_id ?? null,
  };
}

export function makeAppCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `PT-${s}`;
}

export async function readAllApplications(): Promise<Application[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Row[]).map(fromRow);
}

export async function createApplication(
  input: Omit<Application, "id" | "createdAt" | "status" | "reviewNote">
): Promise<Application> {
  const supabase = getSupabase();
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = makeAppCode();
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        id,
        company_name: input.companyName,
        owner_name: input.ownerName,
        biz_number: input.bizNumber,
        phone: input.phone,
        email: input.email,
        bank_name: input.bankName,
        account_number: input.accountNumber,
        account_holder: input.accountHolder,
        regions: input.regions,
        services: input.services,
        experience: input.experience,
        team_size: input.teamSize,
        intro: input.intro,
        status: "submitted",
        review_note: "",
        user_id: input.userId,
      })
      .select("*")
      .single();

    if (!error && data) return fromRow(data as Row);
    if (error && error.code !== "23505") throw new Error(error.message);
  }
  throw new Error("신청 코드 생성에 실패했어요. 다시 시도해 주세요.");
}

export async function updateApplication(
  id: string,
  patch: { status?: ApplicationStatus; reviewNote?: string }
): Promise<Application | null> {
  const fields: Record<string, unknown> = {};
  if (patch.status) fields.status = patch.status;
  if (patch.reviewNote !== undefined) fields.review_note = patch.reviewNote;

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

// 로그인 업체 계정의 "승인된" 파트너 id 목록 (예약 조회 권한 판별용).
// 예약 테이블의 partner_id 는 승인된 신청 id(PT-XXXXXX)를 그대로 사용한다.
export async function readApprovedPartnerIdsByUser(userId: string): Promise<string[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("id")
    .eq("user_id", userId)
    .eq("status", "approved");
  if (error) return [];
  return (data ?? []).map((r) => r.id as string);
}

// 특정 로그인 계정이 낸 신청만 조회 (개인정보 보호)
export async function readApplicationsByUser(userId: string): Promise<Application[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Row[]).map(fromRow);
}

// 승인된(신뢰) 파트너의 "공개 가능한" 정보만 반환.
// 연락처·이메일·계좌·사업자번호 등 민감정보는 절대 포함하지 않는다.
export type PublicPartner = {
  id: string;
  companyName: string;
  services: string[];
  regions: string;
  intro: string;
  photos: string[];
  prices: PartnerPrice[];
};

export async function readApprovedPartners(): Promise<PublicPartner[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("id, company_name, services, regions, intro, prices")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) return [];
  const base = (data ?? []).map((r) => ({
    id: r.id as string,
    companyName: r.company_name as string,
    services: (r.services as string[]) ?? [],
    regions: (r.regions as string) ?? "",
    intro: (r.intro as string) ?? "",
    prices: parsePrices(r.prices),
  }));
  // 각 업체의 대표 사진(Storage) 첨부
  return Promise.all(
    base.map(async (p) => ({ ...p, photos: await listPartnerPhotos(p.id) }))
  );
}

// ══════════════════════════════════════════════════════════════
// 파트너 단가표 — 승인된 협력 파트너가 직접 설정하는 서비스별 시작가.
//   partner_applications.prices (jsonb) 에 저장한다.
//   파트너 id = 승인된 신청 id(PT-XXXXXX). 앱/웹 공용 설정 화면에서 편집.
// ══════════════════════════════════════════════════════════════
export type PartnerPrice = {
  id: string;
  name: string; // 서비스명
  startPrice: number; // 시작가(원)
  note: string; // 안내 문구
};

export type PartnerPriceList = {
  partnerId: string;
  companyName: string;
  prices: PartnerPrice[];
};

// 아직 단가를 설정하지 않은 파트너에게 보여줄 기본 서비스 시작가.
export const DEFAULT_PARTNER_PRICES: PartnerPrice[] = SERVICE_INFO.map((s, i) => ({
  id: `p${i}`,
  name: s.name,
  startPrice: s.startPrice,
  note: s.desc,
}));

// 저장된 jsonb 를 검증·정규화한다. 비었거나 형식이 틀리면 빈 배열.
function parsePrices(raw: unknown): PartnerPrice[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 30)
    .map((p, i) => {
      const o = (p ?? {}) as Record<string, unknown>;
      return {
        id: String(o.id ?? `p${i}`).slice(0, 40),
        name: String(o.name ?? "").trim().slice(0, 80),
        startPrice: Math.min(100000000, Math.max(0, Math.round(Number(o.startPrice) || 0))),
        note: String(o.note ?? "").trim().slice(0, 300),
      };
    })
    .filter((p) => p.name);
}

// 로그인 계정의 승인된 파트너별 단가표. 미설정이면 기본 시작가로 시드해서 편집을 유도한다.
export async function readPartnerPriceLists(userId: string): Promise<PartnerPriceList[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("id, company_name, prices")
    .eq("user_id", userId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => {
    const parsed = parsePrices(r.prices);
    return {
      partnerId: r.id as string,
      companyName: r.company_name as string,
      prices: parsed.length > 0 ? parsed : DEFAULT_PARTNER_PRICES,
    };
  });
}

// 단가표 저장 — 본인(user_id) 소유의 승인된 파트너에 한해 허용.
export async function savePartnerPrices(
  userId: string,
  partnerId: string,
  prices: PartnerPrice[]
): Promise<PartnerPriceList | null> {
  const supabase = getSupabase();
  // 소유·승인 검증: 이 파트너가 로그인 계정의 승인된 업체인지 확인.
  const { data: owned } = await supabase
    .from(TABLE)
    .select("id")
    .eq("id", partnerId)
    .eq("user_id", userId)
    .eq("status", "approved")
    .maybeSingle();
  if (!owned) return null;

  const clean = parsePrices(prices);
  const { data, error } = await supabase
    .from(TABLE)
    .update({ prices: clean })
    .eq("id", partnerId)
    .select("id, company_name, prices")
    .maybeSingle();
  if (error || !data) return null;
  return {
    partnerId: data.id as string,
    companyName: data.company_name as string,
    prices: parsePrices(data.prices),
  };
}
