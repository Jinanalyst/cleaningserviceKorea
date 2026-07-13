import { NextResponse, type NextRequest } from "next/server";
import { getRequestUser } from "@/lib/appAuth";
import { isAdminEmail } from "@/lib/auth";
import {
  setRelationStatus,
  flagFraud,
  unflagFraud,
  createPayoutBatch,
} from "@/lib/commissionStore";

// POST /api/admin/referrals/actions → 관계 정지/부정 표시/정산 지급 (관리자 전용).
//   { kind: 'relation', id, status: 'active'|'suspended'|'ended' }
//   { kind: 'fraud', targetType: 'reservation'|'relation'|'partner', targetId, reason }
//   { kind: 'unfraud', targetType, targetId }
//   { kind: 'payout', code, period }
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const kind = String(body.kind ?? "");

  if (kind === "relation") {
    const id = String(body.id ?? "");
    const status = String(body.status ?? "");
    if (!id || !["active", "suspended", "ended"].includes(status)) {
      return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }
    const rel = await setRelationStatus(id, status as "active" | "suspended" | "ended");
    if (!rel) return NextResponse.json({ error: "관계를 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json({ relation: rel });
  }

  if (kind === "fraud") {
    const targetType = String(body.targetType ?? "");
    const targetId = String(body.targetId ?? "");
    if (!["reservation", "relation", "partner"].includes(targetType) || !targetId) {
      return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }
    await flagFraud(
      targetType as "reservation" | "relation" | "partner",
      targetId,
      String(body.reason ?? ""),
      user.email ?? "admin"
    );
    return NextResponse.json({ ok: true });
  }

  if (kind === "unfraud") {
    const targetType = String(body.targetType ?? "");
    const targetId = String(body.targetId ?? "");
    if (!targetType || !targetId) {
      return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }
    await unflagFraud(targetType, targetId);
    return NextResponse.json({ ok: true });
  }

  if (kind === "payout") {
    const code = String(body.code ?? "");
    const period = String(body.period ?? "");
    if (!code) return NextResponse.json({ error: "추천 코드가 없습니다." }, { status: 400 });
    const payout = await createPayoutBatch(code, period);
    if (!payout) {
      return NextResponse.json(
        { error: "정산 가능 금액이 최소 정산금액에 못 미치거나 없습니다." },
        { status: 400 }
      );
    }
    return NextResponse.json({ payout });
  }

  return NextResponse.json({ error: "알 수 없는 작업입니다." }, { status: 400 });
}
