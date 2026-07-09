import { NextResponse, type NextRequest } from "next/server";
import { readByPartnerIds } from "@/lib/store";
import { readApprovedPartnerIdsByUser } from "@/lib/applicationStore";
import { getRequestUser } from "@/lib/appAuth";

// GET /api/partner/reservations
//  - 로그인 파트너(승인된 업체): 자기 업체에 배정된 예약 목록 (고객 정보 포함)
//  - 로그인했지만 승인 파트너가 아님: { reservations: [], approved: false }
//  - 비로그인: 401
//
// 웹 쿠키 세션 또는 앱 Authorization: Bearer <access_token> 둘 다 지원(getRequestUser).
export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const partnerIds = await readApprovedPartnerIdsByUser(user.id);
  if (partnerIds.length === 0) {
    // 아직 승인된 업체가 아니면 볼 예약이 없다.
    return NextResponse.json({ reservations: [], approved: false });
  }

  const reservations = await readByPartnerIds(partnerIds);
  return NextResponse.json({ reservations, approved: true });
}
