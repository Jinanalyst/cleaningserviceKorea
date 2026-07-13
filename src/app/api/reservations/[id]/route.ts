import { NextResponse, type NextRequest } from "next/server";
import { updateReservation, readAll } from "@/lib/store";
import { readApprovedPartners } from "@/lib/applicationStore";
import { STATUS_META, PARTNERS, type ReservationStatus } from "@/lib/data";
import { isAdminEmail } from "@/lib/auth";
import { getRequestUser } from "@/lib/appAuth";
import { syncReservationCommission } from "@/lib/commissionStore";

const VALID = Object.keys(STATUS_META) as ReservationStatus[];

// PATCH /api/reservations/[id]
//  → 예약 상태 변경 · 업체 배정 · 협의 가격 입력 (운영자 전용, 웹 쿠키 또는 앱 Bearer)
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/reservations/[id]">
) {
  const user = await getRequestUser(request);
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  }

  const { id } = await ctx.params;
  let body: {
    status?: string;
    partnerId?: string;
    agreedPrice?: number | null;
    feePaid?: boolean;
    depositorName?: string;
    feeMemo?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  // 상태 (선택)
  if (body.status !== undefined && !VALID.includes(body.status as ReservationStatus)) {
    return NextResponse.json({ error: "알 수 없는 상태입니다." }, { status: 400 });
  }

  // 업체 배정 (선택) — 기본 시드 파트너 또는 승인된 신규 파트너 id 만 허용
  let partnerId: string | undefined = undefined;
  if (body.partnerId !== undefined) {
    const pid = String(body.partnerId).trim();
    const seedOk = PARTNERS.some((p) => p.id === pid);
    const approved = seedOk ? [] : await readApprovedPartners();
    const approvedOk = approved.some((p) => p.id === pid);
    if (!seedOk && !approvedOk) {
      return NextResponse.json({ error: "배정할 수 없는 업체입니다." }, { status: 400 });
    }
    partnerId = pid;
  }

  // 협의 가격 (선택, null = 지우기)
  let agreedPrice: number | null | undefined = undefined;
  if (body.agreedPrice !== undefined) {
    if (body.agreedPrice === null) {
      agreedPrice = null;
    } else {
      const n = Number(body.agreedPrice);
      if (!Number.isFinite(n) || n < 0 || n > 100000000) {
        return NextResponse.json({ error: "협의 가격을 확인해 주세요." }, { status: 400 });
      }
      agreedPrice = Math.round(n);
    }
  }

  // 예약금(수수료) 입금 확인 · 입금자명 · 메모 (선택)
  const feePaid = typeof body.feePaid === "boolean" ? body.feePaid : undefined;
  const depositorName =
    typeof body.depositorName === "string" ? body.depositorName.trim() : undefined;
  const feeMemo = typeof body.feeMemo === "string" ? body.feeMemo.trim() : undefined;

  const updated = await updateReservation(id, {
    status: body.status as ReservationStatus | undefined,
    partnerId,
    agreedPrice,
    feePaid,
    depositorName,
    feeMemo,
  });
  if (!updated) {
    return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });
  }

  // 예약 상태 변화에 따라 리커링 커미션 적립/회수(멱등).
  //   completed → 고객·업체 추천 커미션 적립, cancelled → 커미션 회수.
  //   협의가 변경(부분환불 등) 시 완료 건이면 금액 재계산도 여기서 처리된다.
  try {
    await syncReservationCommission(updated);
  } catch {
    /* 커미션 처리 실패는 예약 흐름을 막지 않는다. */
  }

  return NextResponse.json({ reservation: updated });
}

// GET /api/reservations/[id] → 단건 조회 (관리자 또는 본인 예약만)
export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/reservations/[id]">
) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }
  const { id } = await ctx.params;
  const rows = await readAll();
  const found = rows.find((r) => r.id.toUpperCase() === id.toUpperCase());
  if (!found || (!isAdminEmail(user.email) && found.userId !== user.id)) {
    return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ reservation: found });
}
