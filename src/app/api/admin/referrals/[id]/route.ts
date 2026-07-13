import { NextResponse, type NextRequest } from "next/server";
import { getRequestUser } from "@/lib/appAuth";
import { isAdminEmail } from "@/lib/auth";
import { markCommission } from "@/lib/commissionStore";
import type { CommissionStatus } from "@/lib/commission";

// PATCH /api/admin/referrals/[id] { status } → 커미션 상태 수동 변경 (관리자 전용).
//   status: pending | available | paid | canceled | deducted
const VALID: CommissionStatus[] = ["pending", "available", "paid", "canceled", "deducted"];

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/referrals/[id]">
) {
  const user = await getRequestUser(request);
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

  if (!VALID.includes(body.status as CommissionStatus)) {
    return NextResponse.json({ error: "알 수 없는 상태입니다." }, { status: 400 });
  }

  const updated = await markCommission(id, body.status as CommissionStatus);
  if (!updated) {
    return NextResponse.json({ error: "커미션 내역을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ commission: updated });
}
