import { NextResponse, type NextRequest } from "next/server";
import { getRequestUser } from "@/lib/appAuth";
import { isAdminEmail } from "@/lib/auth";
import {
  readAllCommissions,
  readAllRelations,
  readPayouts,
  getSettings,
} from "@/lib/commissionStore";

// GET /api/admin/referrals → 전체 커미션 + 추천 관계 + 정산 배치 + 비율 설정 (관리자 전용).
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  }
  const [commissions, relations, payouts, settings] = await Promise.all([
    readAllCommissions(),
    readAllRelations(),
    readPayouts(),
    getSettings(),
  ]);
  return NextResponse.json({ commissions, relations, payouts, settings });
}
