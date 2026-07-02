import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { readById } from "@/lib/store";
import {
  createReview,
  getReviewByReservation,
  maskName,
} from "@/lib/reviewStore";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";

// GET /api/reviews?reservation=SG-XXXX
//  - 로그인 본인 예약의 기존 후기 존재 여부/내용을 반환 (후기 작성 페이지용)
export async function GET(request: NextRequest) {
  const reservationId = request.nextUrl.searchParams.get("reservation");
  if (!reservationId) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const isAdmin = isAdminEmail(user.email);
  const reservation = await readById(reservationId);
  // 관리자는 전체 예약(게스트 예약 포함)을 열람할 수 있다. (내 예약 목록과 동일한 정책)
  if (!reservation || (!isAdmin && reservation.userId !== user.id)) {
    return NextResponse.json({ error: "예약을 찾을 수 없어요." }, { status: 404 });
  }

  const review = await getReviewByReservation(reservationId);
  return NextResponse.json({
    reservation: {
      id: reservation.id,
      partnerId: reservation.partnerId,
      serviceId: reservation.serviceId,
      date: reservation.date,
      status: reservation.status,
    },
    review,
  });
}

// POST /api/reviews → 청소 완료된 본인 예약에 후기 작성
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const reservationId = typeof body.reservationId === "string" ? body.reservationId : "";
  const rating = Number(body.rating);
  const text = typeof body.body === "string" ? body.body.trim() : "";

  const errors: string[] = [];
  if (!reservationId) errors.push("예약 정보가 없어요.");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    errors.push("별점을 선택해 주세요.");
  if (text.length < 5) errors.push("후기를 5자 이상 작성해 주세요.");
  if (text.length > 1000) errors.push("후기는 1000자 이내로 작성해 주세요.");
  if (errors.length) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  // 예약 소유·상태 검증 (관리자는 전체 예약에 후기 작성 가능)
  const isAdmin = isAdminEmail(user.email);
  const reservation = await readById(reservationId);
  if (!reservation || (!isAdmin && reservation.userId !== user.id)) {
    return NextResponse.json({ error: "예약을 찾을 수 없어요." }, { status: 404 });
  }
  if (reservation.status !== "completed") {
    return NextResponse.json(
      { error: "청소가 완료된 예약에만 후기를 남길 수 있어요." },
      { status: 400 }
    );
  }

  // 중복 방지
  const existing = await getReviewByReservation(reservationId);
  if (existing) {
    return NextResponse.json(
      { error: "이미 이 예약에 대한 후기를 작성했어요." },
      { status: 409 }
    );
  }

  const review = await createReview({
    reservationId,
    partnerId: reservation.partnerId,
    serviceId: reservation.serviceId,
    userId: user.id,
    authorName: maskName(reservation.customerName),
    rating,
    body: text,
  });

  // 파트너 상세 페이지 캐시를 즉시 무효화 → 다음 방문 시 새 후기가 바로 반영된다
  revalidatePath(`/partners/${reservation.partnerId}`);

  return NextResponse.json({ review }, { status: 201 });
}
