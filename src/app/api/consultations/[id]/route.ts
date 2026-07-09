import { NextResponse, type NextRequest } from "next/server";
import {
  updateConsultation,
  readAllConsultations,
} from "@/lib/consultationStore";
import { CONSULTATION_STATUS_META, PARTNERS, type ConsultationStatus } from "@/lib/data";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import { getRequestUser } from "@/lib/appAuth";
import { readApprovedPartners } from "@/lib/applicationStore";

const VALID = Object.keys(CONSULTATION_STATUS_META) as ConsultationStatus[];

// PATCH /api/consultations/[id]
//  → 상담 상태 변경 + 합의 견적(금액/메모) + 업체 배정 (운영자 전용, 웹 쿠키 또는 앱 Bearer)
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/consultations/[id]">
) {
  const admin = await getRequestUser(request);
  if (!admin || !isAdminEmail(admin.email)) {
    return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  }

  const { id } = await ctx.params;
  let body: {
    status?: string;
    quotedPrice?: number | null;
    quoteNote?: string;
    partnerId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (
    body.status !== undefined &&
    !VALID.includes(body.status as ConsultationStatus)
  ) {
    return NextResponse.json({ error: "알 수 없는 상태입니다." }, { status: 400 });
  }

  // 견적 금액 검증 (null = 견적 지우기, 숫자 = 원 단위 정수)
  let quotedPrice: number | null | undefined = undefined;
  if (body.quotedPrice !== undefined) {
    if (body.quotedPrice === null) {
      quotedPrice = null;
    } else {
      const n = Number(body.quotedPrice);
      if (!Number.isFinite(n) || n < 0 || n > 100000000) {
        return NextResponse.json(
          { error: "견적 금액을 확인해 주세요." },
          { status: 400 }
        );
      }
      quotedPrice = Math.round(n);
    }
  }

  // 업체 배정 (선택, "" = 배정 해제) — 시드 파트너 또는 승인된 신규 파트너만 허용
  let partnerId: string | undefined = undefined;
  if (body.partnerId !== undefined) {
    const pid = String(body.partnerId).trim();
    if (pid === "") {
      partnerId = "";
    } else {
      const seedOk = PARTNERS.some((p) => p.id === pid);
      const approved = seedOk ? [] : await readApprovedPartners();
      if (!seedOk && !approved.some((p) => p.id === pid)) {
        return NextResponse.json({ error: "배정할 수 없는 업체입니다." }, { status: 400 });
      }
      partnerId = pid;
    }
  }

  const updated = await updateConsultation(id, {
    status: body.status as ConsultationStatus | undefined,
    quotedPrice,
    quoteNote: body.quoteNote,
    partnerId,
  });
  if (!updated) {
    return NextResponse.json({ error: "상담 신청을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ consultation: updated });
}

// GET /api/consultations/[id] → 단건 조회 (관리자 또는 본인 신청만)
export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/consultations/[id]">
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }
  const { id } = await ctx.params;
  const rows = await readAllConsultations();
  const found = rows.find((c) => c.id.toUpperCase() === id.toUpperCase());
  if (!found || (!isAdminEmail(user.email) && found.userId !== user.id)) {
    return NextResponse.json({ error: "상담 신청을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ consultation: found });
}
