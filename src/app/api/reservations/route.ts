import { NextResponse, type NextRequest } from "next/server";
import { createReservation, readAll, readByUser } from "@/lib/store";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import { getRequestUser } from "@/lib/appAuth";
import {
  DEPOSIT,
  estimatePrice,
  partnerById,
  serviceById,
  categoryOf,
  TIME_SLOTS,
  type PropertyInfo,
} from "@/lib/data";

// 서비스 성격에 맞게 집/회사/부분청소 정보를 정리한다.
function sanitizeProperty(
  serviceId: string,
  raw: unknown
): PropertyInfo {
  const p = (raw ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const category = categoryOf(serviceId);
  const info: PropertyInfo = {};
  if (category === "commercial") {
    info.companyName = str(p.companyName);
    info.spaceType = str(p.spaceType);
    info.bizNumber = str(p.bizNumber);
  } else if (category === "partial") {
    info.areas = Array.isArray(p.areas)
      ? p.areas.filter((a): a is string => typeof a === "string")
      : [];
    info.propertyType = str(p.propertyType);
  } else {
    // residential
    info.propertyType = str(p.propertyType);
    info.rooms = str(p.rooms);
    info.bathrooms = str(p.bathrooms);
    info.hasPet = Boolean(p.hasPet);
  }
  info.floorInfo = str(p.floorInfo);
  return info;
}

// GET /api/reservations           → 전체 목록 (운영자용)
// GET /api/reservations
//  - 관리자: 전체 예약
//  - 로그인 사용자: 본인 예약만
//  - 비로그인: 401
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }
  if (isAdminEmail(user.email)) {
    const rows = await readAll();
    return NextResponse.json({ reservations: rows });
  }
  const rows = await readByUser(user.id);
  return NextResponse.json({ reservations: rows });
}

// POST /api/reservations → 새 예약 생성 (목업 결제 완료 후 호출)
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const {
    partnerId,
    serviceId,
    pyeong,
    date,
    timeSlot,
    customerName,
    phone,
    address,
    addressDetail,
    notes,
  } = body as Record<string, string>;

  // 검증
  const errors: string[] = [];
  if (!partnerById(partnerId)) errors.push("청소 파트너를 선택해 주세요.");
  if (!serviceById(serviceId)) errors.push("서비스 종류를 선택해 주세요.");
  const py = Number(pyeong);
  if (!py || py < 1 || py > 300) errors.push("평수를 올바르게 입력해 주세요.");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push("방문 날짜를 선택해 주세요.");
  if (!TIME_SLOTS.includes(timeSlot)) errors.push("방문 시간을 선택해 주세요.");
  if (!customerName || !customerName.trim()) errors.push("이름을 입력해 주세요.");
  if (!phone || phone.replace(/\D/g, "").length < 9) errors.push("연락처를 확인해 주세요.");
  if (!address || !address.trim()) errors.push("주소를 입력해 주세요.");

  // 집/회사 정보 검증 (서비스 성격별)
  const property = sanitizeProperty(serviceId, body.property);
  const category = categoryOf(serviceId);
  if (category === "commercial" && !property.companyName) {
    errors.push("상호(회사)명을 입력해 주세요.");
  }
  if (category === "residential" && !property.propertyType) {
    errors.push("주거 형태를 선택해 주세요.");
  }
  if (category === "partial" && (!property.areas || property.areas.length === 0)) {
    errors.push("청소할 공간을 하나 이상 선택해 주세요.");
  }

  // 과거 날짜 방지
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(date + "T00:00:00") < today) errors.push("지난 날짜는 예약할 수 없어요.");
  }

  if (errors.length) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  // 로그인 상태면 예약을 계정과 연결 (웹 쿠키 또는 앱 Bearer 토큰)
  const user = await getRequestUser(request);

  const price = estimatePrice(serviceId, py);
  const reservation = await createReservation({
    partnerId,
    serviceId,
    pyeong: py,
    date,
    timeSlot,
    customerName: customerName.trim(),
    phone: phone.trim(),
    address: address.trim(),
    addressDetail: (addressDetail || "").trim(),
    notes: (notes || "").trim(),
    property,
    price,
    deposit: DEPOSIT,
    userId: user?.id ?? null,
  });

  return NextResponse.json({ reservation }, { status: 201 });
}
