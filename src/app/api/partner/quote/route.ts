import { NextResponse, type NextRequest } from "next/server";
import { getRequestUser } from "@/lib/appAuth";
import { readById, setPartnerQuote } from "@/lib/store";
import { readApprovedPartnerIdsByUser } from "@/lib/applicationStore";

// POST /api/partner/quote {reservationId, amount, memo}
//  → 배정 업체가 앱에서 보낸 견적을 서버에 저장(관리자 화면에 표시).
//  로그인 승인 업체만, 자기 업체에 배정된 예약에 한해 허용.
export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  let body: { reservationId?: string; amount?: number; memo?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const reservationId = String(body.reservationId ?? "").trim();
  if (!reservationId) {
    return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 400 });
  }
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) {
    return NextResponse.json({ error: "견적 금액을 확인해 주세요." }, { status: 400 });
  }
  const memo = typeof body.memo === "string" ? body.memo.trim().slice(0, 2000) : "";

  const reservation = await readById(reservationId);
  if (!reservation) {
    return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });
  }

  const myPartnerIds = await readApprovedPartnerIdsByUser(user.id);
  if (!myPartnerIds.includes(reservation.partnerId)) {
    return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  }

  const updated = await setPartnerQuote(reservationId, Math.round(amount), memo);
  if (!updated) {
    return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ reservation: updated });
}
