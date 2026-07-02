import { NextResponse, type NextRequest } from "next/server";
import { partnerById } from "@/lib/data";
import { getPartnerReviews } from "@/lib/partnerReviews";

// 항상 최신 후기를 반환하도록 캐시하지 않는다 (라이브 조회용).
export const dynamic = "force-dynamic";

// GET /api/partners/[id]/reviews → 파트너의 공개 후기 목록 (고객 후기 + 시드)
export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/partners/[id]/reviews">
) {
  const { id } = await ctx.params;
  if (!partnerById(id)) {
    return NextResponse.json({ error: "파트너를 찾을 수 없어요." }, { status: 404 });
  }

  const reviews = await getPartnerReviews(id);
  return NextResponse.json(
    { reviews },
    { headers: { "Cache-Control": "no-store" } }
  );
}
