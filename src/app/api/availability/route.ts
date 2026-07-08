import { NextResponse } from "next/server";
import { readBookedSlots } from "@/lib/store";

// GET /api/availability → 오늘 이후 예약된 슬롯 목록(날짜·시간대·업체).
// 모바일 앱에서 날짜/시간대 예약 가능 여부를 표시하기 위한 공개 엔드포인트.
// 개인정보는 포함하지 않는다.
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET() {
  let slots: Awaited<ReturnType<typeof readBookedSlots>> = [];
  try {
    slots = await readBookedSlots();
  } catch {
    slots = [];
  }
  return NextResponse.json({ slots }, { headers: CORS });
}
