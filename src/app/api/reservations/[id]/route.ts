import { NextResponse, type NextRequest } from "next/server";
import { updateStatus, readAll } from "@/lib/store";
import { STATUS_META, type ReservationStatus } from "@/lib/data";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";

const VALID = Object.keys(STATUS_META) as ReservationStatus[];

// PATCH /api/reservations/[id] → 예약 상태 변경 (운영자 전용)
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/reservations/[id]">
) {
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  }

  const { id } = await ctx.params;
  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const status = body.status as ReservationStatus;
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: "알 수 없는 상태입니다." }, { status: 400 });
  }

  const updated = await updateStatus(id, status);
  if (!updated) {
    return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ reservation: updated });
}

// GET /api/reservations/[id] → 단건 조회 (관리자 또는 본인 예약만)
export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/reservations/[id]">
) {
  const user = await getCurrentUser();
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
