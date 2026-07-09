import { NextResponse, type NextRequest } from "next/server";
import {
  createConsultation,
  readAllConsultations,
  readConsultationsByUser,
} from "@/lib/consultationStore";
import { serviceById } from "@/lib/data";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import { getRequestUser } from "@/lib/appAuth";

// GET /api/consultations
//  - 관리자: 전체 상담 신청 (고객 관리용)
//  - 로그인 사용자: 본인 신청만
//  - 비로그인: 401
export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }
  if (isAdminEmail(user.email)) {
    const rows = await readAllConsultations();
    return NextResponse.json({ consultations: rows });
  }
  const rows = await readConsultationsByUser(user.id);
  return NextResponse.json({ consultations: rows });
}

// POST /api/consultations → 새 견적 상담 신청 (누구나 신청 가능)
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const customerName = str(body.customerName);
  const phone = str(body.phone);
  const address = str(body.address);
  const addressDetail = str(body.addressDetail);
  const preferredDate = str(body.preferredDate);
  const notes = str(body.notes);

  // 서비스는 등록된 것만 허용 (없으면 빈 값)
  const rawService = str(body.serviceId);
  const serviceId = serviceById(rawService) ? rawService : "";

  // 평수는 양의 정수만 (선택 항목)
  let pyeong: number | null = null;
  if (body.pyeong !== undefined && body.pyeong !== null && body.pyeong !== "") {
    const n = Number(body.pyeong);
    if (Number.isFinite(n) && n > 0 && n < 100000) pyeong = Math.round(n);
  }

  const errors: string[] = [];
  if (!customerName) errors.push("이름을 입력해 주세요.");
  if (phone.replace(/\D/g, "").length < 9) errors.push("연락처를 확인해 주세요.");

  if (errors.length) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  // 로그인한 고객이면 신청을 해당 계정과 연결
  const user = await getCurrentUser();
  const userId = user?.id ?? null;

  const consultation = await createConsultation({
    customerName,
    phone,
    address,
    addressDetail,
    serviceId,
    pyeong,
    preferredDate,
    notes,
    userId,
  });

  return NextResponse.json({ consultation }, { status: 201 });
}
