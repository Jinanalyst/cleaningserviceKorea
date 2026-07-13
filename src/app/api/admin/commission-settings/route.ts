import { NextResponse, type NextRequest } from "next/server";
import { getRequestUser } from "@/lib/appAuth";
import { isAdminEmail } from "@/lib/auth";
import { getSettings, updateSettings } from "@/lib/commissionStore";
import type { CommissionSettings } from "@/lib/commission";

// GET/POST /api/admin/commission-settings → 커미션 비율 설정 조회·변경 (관리자 전용).
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  }
  return NextResponse.json({ settings: await getSettings() });
}

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  }
  let body: Partial<CommissionSettings>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const patch: Partial<CommissionSettings> = {};
  for (const k of [
    "platformFeeRate",
    "firstRate",
    "repeatRate",
    "splitCustomer",
    "splitProvider",
    "minPayout",
  ] as const) {
    const v = body[k];
    if (typeof v === "number" && Number.isFinite(v)) patch[k] = v;
  }
  return NextResponse.json({ settings: await updateSettings(patch) });
}
