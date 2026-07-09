import { NextResponse, type NextRequest } from "next/server";
import { updateApplication, readAllApplications } from "@/lib/applicationStore";
import { APPLICATION_STATUS_META, type ApplicationStatus } from "@/lib/data";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import { getRequestUser } from "@/lib/appAuth";

const VALID = Object.keys(APPLICATION_STATUS_META) as ApplicationStatus[];

// PATCH /api/applications/[id] → 심사 상태/사유 변경 (운영자 전용, 웹 쿠키 또는 앱 Bearer)
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/applications/[id]">
) {
  const admin = await getRequestUser(request);
  if (!admin || !isAdminEmail(admin.email)) {
    return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  }

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

// GET /api/applications/[id] → 단건 조회 (관리자 또는 본인 신청만)
export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/applications/[id]">
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }
  const { id } = await ctx.params;
  const rows = await readAllApplications();
  const found = rows.find((a) => a.id.toUpperCase() === id.toUpperCase());
  if (!found || (!isAdminEmail(user.email) && found.userId !== user.id)) {
    return NextResponse.json({ error: "신청을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ application: found });
}
