// 파트너 등록 신청 저장소 — Supabase(Postgres) 기반. 서버 전용.
import "server-only";
import { getSupabase } from "./supabase";
import type { ApplicationStatus } from "./data";

const TABLE = "partner_applications";

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
};

export async function readApprovedPartners(): Promise<PublicPartner[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("id, company_name, services, regions, intro")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((r) => ({
    id: r.id as string,
    companyName: r.company_name as string,
    services: (r.services as string[]) ?? [],
    regions: (r.regions as string) ?? "",
    intro: (r.intro as string) ?? "",
  }));
}
