import { NextResponse, type NextRequest } from "next/server";
import {
  createApplication,
  readAllApplications,
  findApplication,
} from "@/lib/applicationStore";
import { SERVICES } from "@/lib/data";
import { createSupabaseServer } from "@/lib/supabase-server";

const SERVICE_NAMES = SERVICES.map((s) => s.name);

// GET /api/applications         → 전체 목록 (운영자 심사용)
// GET /api/applications?q=...    → 신청코드/사업자번호로 조회 (신청자용)
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (q && q.trim()) {
    const rows = await findApplication(q);
    return NextResponse.json({ applications: rows });
  }
  const rows = await readAllApplications();
  return NextResponse.json({ applications: rows });
}

// POST /api/applications → 새 파트너 등록 신청
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const companyName = str(body.companyName);
  const ownerName = str(body.ownerName);
  const bizNumber = str(body.bizNumber);
  const phone = str(body.phone);
  const email = str(body.email);
  const bankName = str(body.bankName);
  const accountNumber = str(body.accountNumber);
  const accountHolder = str(body.accountHolder);
  const regions = str(body.regions);
  const experience = str(body.experience);
  const teamSize = str(body.teamSize);
  const intro = str(body.intro);
  const services = Array.isArray(body.services)
    ? body.services.filter(
        (s): s is string => typeof s === "string" && SERVICE_NAMES.includes(s)
      )
    : [];

  const errors: string[] = [];
  if (!companyName) errors.push("업체명을 입력해 주세요.");
  if (!ownerName) errors.push("대표자명을 입력해 주세요.");
  if (bizNumber.replace(/\D/g, "").length !== 10)
    errors.push("사업자등록번호 10자리를 정확히 입력해 주세요.");
  if (phone.replace(/\D/g, "").length < 9) errors.push("연락처를 확인해 주세요.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("이메일 형식을 확인해 주세요.");
  if (!bankName) errors.push("정산 은행을 선택해 주세요.");
  if (accountNumber.replace(/\D/g, "").length < 6)
    errors.push("계좌번호를 정확히 입력해 주세요.");
  if (!accountHolder) errors.push("예금주를 입력해 주세요.");
  if (services.length === 0) errors.push("전문 청소 분야를 하나 이상 선택해 주세요.");

  if (errors.length) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  // 로그인한 업체 계정이면 신청을 해당 계정과 연결
  let userId: string | null = null;
  try {
    const authed = await createSupabaseServer();
    const {
      data: { user },
    } = await authed.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  const application = await createApplication({
    companyName,
    ownerName,
    bizNumber,
    phone,
    email,
    bankName,
    accountNumber,
    accountHolder,
    regions,
    services,
    experience,
    teamSize,
    intro,
    userId,
  });

  return NextResponse.json({ application }, { status: 201 });
}
