import { NextResponse, type NextRequest } from "next/server";
import { getRequestUser } from "@/lib/appAuth";
import { readReferralProfile } from "@/lib/referralStore";
import {
  readCommissionsByCode,
  readRelationsByCode,
  summarize,
  getSettings,
} from "@/lib/commissionStore";
import { SITE_URL } from "@/lib/data";

// GET /api/referral/me → 내 추천 코드·링크 + 리커링 커미션 요약·추천 실적·수익 내역 + 정산 계좌.
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

  const [commissions, relations, settings] = await Promise.all([
    readCommissionsByCode(profile.code),
    readRelationsByCode(profile.code),
    getSettings(),
  ]);

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const summary = summarize(commissions, relations, monthKey);
  const link = profile.code ? `${SITE_URL}/?ref=${profile.code}` : "";

  // 구버전 앱(APK) 하위호환 — 기존 필드(rate·summary.referredPartners·pending·earnings)를 함께 실어,
  // 아직 새 앱으로 갱신되지 않은 설치본에서도 화면이 깨지지 않게 한다.
  const legacyEarnings = commissions.map((c) => ({
    id: c.id,
    createdAt: c.createdAt,
    sourceType: c.referredType === "provider" ? "partner" : "customer",
    referredName: c.referredName,
    reservationId: c.reservationId,
    quoteAmount: c.baseAmount,
    amount: c.amount,
    status: c.status === "paid" ? "paid" : "pending",
    paidAt: c.paidAt,
  }));

  return NextResponse.json(
    {
      code: profile.code,
      link,
      rate: settings.firstRate, // 하위호환(단일 요율 표기용)
      settings: {
        firstRate: settings.firstRate,
        repeatRate: settings.repeatRate,
        minPayout: settings.minPayout,
      },
      summary: {
        ...summary,
        // 하위호환 별칭
        referredPartners: summary.referredProviders,
        pending: summary.thisMonthEstimate,
      },
      relations,
      commissions,
      earnings: legacyEarnings, // 하위호환
      payout: {
        bank: profile.payoutBank,
        account: profile.payoutAccount,
        holder: profile.payoutHolder,
      },
    },
    { headers: CORS }
  );
}
