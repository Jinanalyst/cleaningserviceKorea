import { NextResponse, type NextRequest } from "next/server";
import { getRequestUser } from "@/lib/appAuth";
import {
  readPartnerPriceLists,
  savePartnerPrices,
  type PartnerPrice,
} from "@/lib/applicationStore";

// 파트너 단가표 조회·저장.
//  GET  /api/partner/prices        → 로그인 파트너의 업체별 단가표(미설정이면 기본 시작가 시드)
//  POST /api/partner/prices        → { partnerId, prices } 저장 (본인 승인 업체만)
// 웹 쿠키 세션 또는 앱 Authorization: Bearer <access_token> 둘 다 지원(getRequestUser).
export const dynamic = "force-dynamic";

// 앱(다른 오리진)에서도 호출할 수 있으므로 CORS 허용.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401, headers: CORS });
  }
  const lists = await readPartnerPriceLists(user.id);
  return NextResponse.json({ lists, approved: lists.length > 0 }, { headers: CORS });
}

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401, headers: CORS });
  }

  let body: { partnerId?: string; prices?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400, headers: CORS });
  }

  const partnerId = String(body.partnerId ?? "").trim();
  if (!partnerId) {
    return NextResponse.json({ error: "업체를 찾을 수 없어요." }, { status: 400, headers: CORS });
  }
  if (!Array.isArray(body.prices)) {
    return NextResponse.json({ error: "단가 정보를 확인해 주세요." }, { status: 400, headers: CORS });
  }

  const list = await savePartnerPrices(user.id, partnerId, body.prices as PartnerPrice[]);
  if (!list) {
    return NextResponse.json(
      { error: "권한이 없어요. 승인된 업체 계정으로 로그인했는지 확인해 주세요." },
      { status: 403, headers: CORS }
    );
  }
  return NextResponse.json({ list }, { headers: CORS });
}
