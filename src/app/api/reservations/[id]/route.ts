import { NextResponse, type NextRequest } from "next/server";
import {
  updateReservation,
  readAll,
  readById,
  isSlotTaken,
  rescheduleReservation,
  deleteReservation,
} from "@/lib/store";
import { readApprovedPartners, readApprovedPartnerIdsByUser } from "@/lib/applicationStore";
import { STATUS_META, PARTNERS, TIME_SLOTS, type ReservationStatus } from "@/lib/data";
import { isAdminEmail } from "@/lib/auth";
import { getRequestUser } from "@/lib/appAuth";
import { syncReservationCommission } from "@/lib/commissionStore";

const VALID = Object.keys(STATUS_META) as ReservationStatus[];

// 고객이 스스로 취소·일정 변경할 수 있는 상태 (진행 중·완료·취소 건은 불가)
const CUSTOMER_EDITABLE: ReservationStatus[] = ["pending", "confirmed"];

// 고객 셀프서비스(취소·일정 변경) — 본인 예약에 한해 허용.
// body.action === "cancel" | "reschedule"
async function handleCustomerPatch(
  userId: string,
  id: string,
  body: { action?: string; date?: string; timeSlot?: string },
  isAdmin = false
) {
  const target = await readById(id);
  // 고객은 본인 예약만, 관리자는 모든 예약을 취소·시간변경할 수 있다.
  if (!target || (!isAdmin && target.userId !== userId)) {
    return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });
  }

  // 취소
  if (body.action === "cancel") {
    if (!CUSTOMER_EDITABLE.includes(target.status)) {
      return NextResponse.json(
        { error: "이미 진행 중이거나 완료·취소된 예약은 취소할 수 없어요. 고객센터로 문의해 주세요." },
        { status: 400 }
      );
    }
    const updated = await updateReservation(id, { status: "cancelled" });
    if (!updated) {
      return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });
    }
    // 취소 시 추천 커미션 회수(멱등).
    try {
      await syncReservationCommission(updated);
    } catch {
      /* 커미션 처리 실패는 취소 흐름을 막지 않는다. */
    }
    return NextResponse.json({ reservation: updated });
  }

  // 일정 변경 (날짜·시간)
  if (body.action === "reschedule") {
    if (!CUSTOMER_EDITABLE.includes(target.status)) {
      return NextResponse.json(
        { error: "이미 진행 중이거나 완료·취소된 예약은 시간을 변경할 수 없어요." },
        { status: 400 }
      );
    }
    const date = typeof body.date === "string" ? body.date : "";
    const timeSlot = typeof body.timeSlot === "string" ? body.timeSlot : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "변경할 날짜를 선택해 주세요." }, { status: 400 });
    }
    if (!TIME_SLOTS.includes(timeSlot)) {
      return NextResponse.json({ error: "변경할 시간을 선택해 주세요." }, { status: 400 });
    }
    // 최소 예약 가능일 = 오늘 + 3일 (당일·긴급 변경 제외) — 예약 화면과 동일 규칙
    const min = new Date();
    min.setHours(0, 0, 0, 0);
    min.setDate(min.getDate() + 3);
    if (new Date(date + "T00:00:00") < min) {
      return NextResponse.json(
        { error: "일정 변경은 오늘로부터 3일 이후 날짜만 가능해요." },
        { status: 400 }
      );
    }
    // 같은 일시로의 변경은 무의미 → 그대로 반환
    if (date === target.date && timeSlot === target.timeSlot) {
      return NextResponse.json({ reservation: target });
    }
    // 같은 업체의 다른 예약과 겹치면 불가 (예약된 시간 외에만 가능)
    const taken = await isSlotTaken(target.partnerId, date, timeSlot, id);
    if (taken) {
      return NextResponse.json(
        { error: "이미 예약된 시간이에요. 다른 시간을 선택해 주세요." },
        { status: 409 }
      );
    }
    const updated = await rescheduleReservation(id, date, timeSlot);
    if (!updated) {
      return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json({ reservation: updated });
  }

  return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
}

// PATCH /api/reservations/[id]
//  → 관리자: 예약 상태 변경 · 업체 배정 · 협의 가격 입력 (웹 쿠키 또는 앱 Bearer)
//  → 고객(본인 예약): action="cancel" 취소 · action="reschedule" 일정 변경
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/reservations/[id]">
) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { id } = await ctx.params;
  let body: {
    action?: string;
    status?: string;
    partnerId?: string;
    agreedPrice?: number | null;
    feePaid?: boolean;
    depositorName?: string;
    feeMemo?: string;
    date?: string;
    timeSlot?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  // 셀프서비스(취소·일정 변경): 고객은 본인 예약, 관리자는 모든 예약.
  // (역할보다 먼저 분기 — 관리자 계정도 /reservations·/admin 에서 시간변경 가능.)
  if (body.action === "cancel" || body.action === "reschedule") {
    return handleCustomerPatch(user.id, id, body, isAdminEmail(user.email));
  }

  // 이하 관리자 전용 (상태 변경·업체 배정·협의가·입금 확인).
  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
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

// DELETE /api/reservations/[id]
//  → "청소 완료" 예약을 목록에서 영구 삭제.
//     허용: 관리자 · 해당 예약에 배정된 승인 업체(파트너) 계정.
//     완료(completed) 상태의 예약만 삭제할 수 있다.
export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/reservations/[id]">
) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const target = await readById(id);
  if (!target) {
    return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });
  }

  // 권한: 관리자이거나, 이 예약에 배정된 업체(본인 승인 파트너)여야 한다.
  const admin = isAdminEmail(user.email);
  let allowed = admin;
  if (!allowed) {
    const partnerIds = await readApprovedPartnerIdsByUser(user.id);
    allowed = partnerIds.includes(target.partnerId);
  }
  if (!allowed) {
    return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  }

  // 완료된 예약만 삭제 허용 (진행 중·대기 건은 상태 변경/취소로 처리).
  if (target.status !== "completed") {
    return NextResponse.json(
      { error: "청소 완료된 예약만 삭제할 수 있어요." },
      { status: 400 }
    );
  }

  const ok = await deleteReservation(id);
  if (!ok) {
    return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, id });
}
