import { NextResponse } from "next/server";
import { readApprovedPartners } from "@/lib/applicationStore";

// GET /api/partners → 심사 승인된 신규 파트너의 공개 정보 목록.
// 모바일 앱(손길 앱)에서 파트너 리스트에 함께 노출하기 위한 공개 엔드포인트.
// 민감정보(연락처·계좌·사업자번호)는 readApprovedPartners 가 이미 제외한다.
export const dynamic = "force-dynamic";

// 앱(다른 오리진)에서 호출하므로 CORS 허용.
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
  let approved: Awaited<ReturnType<typeof readApprovedPartners>> = [];
  try {
    approved = await readApprovedPartners();
  } catch {
    approved = [];
  }
  return NextResponse.json({ partners: approved }, { headers: CORS });
}
