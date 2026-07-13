import { NextResponse, type NextRequest } from "next/server";
import {
  createApplication,
  readAllApplications,
  readApplicationsByUser,
  uploadPartnerPhotos,
} from "@/lib/applicationStore";
import { SERVICES } from "@/lib/data";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import { getRequestUser } from "@/lib/appAuth";
import { normalizeCode } from "@/lib/referralStore";

const SERVICE_NAMES = SERVICES.map((s) => s.name);

// GET /api/applications
//  - 관리자: 전체 신청 (심사용)
//  - 로그인 사용자: 본인 신청만
//  - 비로그인: 401
export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }
  if (isAdminEmail(user.email)) {
    const rows = await readAllApplications();
    return NextResponse.json({ applications: rows });
  }
  const rows = await readApplicationsByUser(user.id);
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

  // 업체 대표 사진 (base64 data URL, 신뢰용) — 선택, 최대 6장
  const photos = Array.isArray(body.photos)
    ? body.photos.filter((p): p is string => typeof p === "string")
    : [];
  const MAX_PHOTOS = 6;
  const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

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
  if (photos.length > MAX_PHOTOS)
    errors.push(`사진은 최대 ${MAX_PHOTOS}장까지 첨부할 수 있어요.`);
  if (photos.some((p) => !/^data:image\/(png|jpe?g|webp);base64,/i.test(p)))
    errors.push("사진 형식이 올바르지 않아요.");
  if (photos.some((p) => p.length > MAX_PHOTO_BYTES))
    errors.push("사진 용량이 너무 커요. 더 작은 이미지를 올려주세요.");

  if (errors.length) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  // 로그인한 업체 계정이면 신청을 해당 계정과 연결
  const user = await getCurrentUser();
  const userId = user?.id ?? null;

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
    referrerCode: normalizeCode(body.ref), // 추천으로 소개된 업체
  });

  // 사진을 신청 id 기준으로 Storage(partner-photos)에 업로드 (승인 시 노출)
  if (photos.length) {
    try {
      await uploadPartnerPhotos(application.id, photos);
    } catch {
      // 사진 업로드 실패해도 신청 자체는 접수된 것으로 처리
    }
  }

  return NextResponse.json({ application }, { status: 201 });
}
