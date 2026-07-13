import { NextResponse, type NextRequest } from "next/server";
import { getRequestUser } from "@/lib/appAuth";
import { ensureReferralCode, normalizeCode } from "@/lib/referralStore";
import { attachReferral } from "@/lib/commissionStore";

// POST /api/referral/attach { ref } → 로그인 사용자를 추천인에게 귀속한다.
//   추천 링크(?ref=코드)로 유입돼 가입/로그인한 고객을 최초 1회 추천인에게 연결하고,
//   추천 관계를 즉시 생성해 추천인 대시보드 "추천 실적"에 바로 표시되게 한다.
//   웹 쿠키 세션 또는 앱 Authorization: Bearer 둘 다 지원. 멱등.
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401, headers: CORS });
  }

  let body: { ref?: unknown };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const ref = normalizeCode(body.ref);

  const name =
    (user.user_metadata?.name as string) ||
    (user.user_metadata?.full_name as string) ||
    null;

  // 본인 추천 코드도 보장(피추천자도 자신의 코드를 갖는다).
  await ensureReferralCode(user.id, user.email, name);
  const result = await attachReferral(user.id, ref, name);

  return NextResponse.json(result, { headers: CORS });
}
