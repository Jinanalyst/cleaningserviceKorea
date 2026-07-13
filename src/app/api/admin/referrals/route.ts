import { NextResponse, type NextRequest } from "next/server";
import { getRequestUser } from "@/lib/appAuth";
import { isAdminEmail } from "@/lib/auth";
import { readAllEarnings } from "@/lib/referralStore";

// GET /api/admin/referrals → 전체 추천 적립 내역 + 정산 계좌 (관리자 전용).
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  }
  const earnings = await readAllEarnings();
  return NextResponse.json({ earnings });
}
