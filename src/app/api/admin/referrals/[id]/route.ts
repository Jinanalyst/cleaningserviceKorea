import { NextResponse, type NextRequest } from "next/server";
import { getRequestUser } from "@/lib/appAuth";
import { isAdminEmail } from "@/lib/auth";
import { markEarning } from "@/lib/referralStore";

// PATCH /api/admin/referrals/[id] { status: 'paid'|'pending' } → 지급 처리 (관리자 전용).
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

  if (body.status !== "paid" && body.status !== "pending") {
    return NextResponse.json({ error: "알 수 없는 상태입니다." }, { status: 400 });
  }

  const updated = await markEarning(id, body.status);
  if (!updated) {
    return NextResponse.json({ error: "적립 내역을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ earning: updated });
}
