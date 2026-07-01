import { NextResponse, type NextRequest } from "next/server";
import { updateApplication, readAllApplications } from "@/lib/applicationStore";
import { APPLICATION_STATUS_META, type ApplicationStatus } from "@/lib/data";

const VALID = Object.keys(APPLICATION_STATUS_META) as ApplicationStatus[];

// PATCH /api/applications/[id] → 심사 상태/사유 변경 (운영자용)
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/applications/[id]">
) {
  const { id } = await ctx.params;
  let body: { status?: string; reviewNote?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (body.status !== undefined && !VALID.includes(body.status as ApplicationStatus)) {
    return NextResponse.json({ error: "알 수 없는 상태입니다." }, { status: 400 });
  }

  const updated = await updateApplication(id, {
    status: body.status as ApplicationStatus | undefined,
    reviewNote: body.reviewNote,
  });
  if (!updated) {
    return NextResponse.json({ error: "신청을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ application: updated });
}

// GET /api/applications/[id] → 단건 조회
export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/applications/[id]">
) {
  const { id } = await ctx.params;
  const rows = await readAllApplications();
  const found = rows.find((a) => a.id.toUpperCase() === id.toUpperCase());
  if (!found) {
    return NextResponse.json({ error: "신청을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ application: found });
}
