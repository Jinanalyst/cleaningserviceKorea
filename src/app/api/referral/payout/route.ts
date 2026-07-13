import { NextResponse, type NextRequest } from "next/server";
import { getRequestUser } from "@/lib/appAuth";
import { savePayout } from "@/lib/referralStore";

// POST /api/referral/payout { bank, account, holder } → 내 정산 계좌 저장.
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

  let body: { bank?: string; account?: string; holder?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400, headers: CORS });
  }

  const bank = String(body.bank ?? "").trim();
  const account = String(body.account ?? "").trim();
  const holder = String(body.holder ?? "").trim();
  if (!bank || account.replace(/\D/g, "").length < 6 || !holder) {
    return NextResponse.json(
      { error: "은행·계좌번호·예금주를 정확히 입력해 주세요." },
      { status: 400, headers: CORS }
    );
  }

  await savePayout(user.id, { bank, account, holder });
  return NextResponse.json({ ok: true }, { headers: CORS });
}
