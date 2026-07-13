import { NextResponse, type NextRequest } from "next/server";
import { getRequestUser } from "@/lib/appAuth";
import {
  readReferralProfile,
  readEarningsByCode,
  summarize,
} from "@/lib/referralStore";
import { SITE_URL } from "@/lib/data";

// GET /api/referral/me → 내 추천 코드·링크·적립 요약·내역·정산 계좌.
//   로그인한 모든 사용자에게 코드를 보장(없으면 생성)한다.
//   웹 쿠키 세션 또는 앱 Authorization: Bearer 둘 다 지원.
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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

  const name =
    (user.user_metadata?.name as string) ||
    (user.user_metadata?.full_name as string) ||
    null;
  const profile = await readReferralProfile(user.id, user.email, name);
  const earnings = await readEarningsByCode(profile.code);
  const summary = summarize(earnings);
  const link = profile.code ? `${SITE_URL}/?ref=${profile.code}` : "";

  return NextResponse.json(
    {
      code: profile.code,
      link,
      rate: 0.035,
      summary,
      earnings,
      payout: {
        bank: profile.payoutBank,
        account: profile.payoutAccount,
        holder: profile.payoutHolder,
      },
    },
    { headers: CORS }
  );
}
