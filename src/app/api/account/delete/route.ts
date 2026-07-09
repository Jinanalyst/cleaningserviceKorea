import { NextResponse, type NextRequest } from "next/server";
import { getRequestUser } from "@/lib/appAuth";
import { deleteUserAccount } from "@/lib/account";

// POST /api/account/delete
//  로그인한 본인 계정과 연결된 개인정보를 파기하고 인증 계정을 삭제한다.
//  · 웹: 쿠키 세션 / 앱: Authorization: Bearer <access_token>
//  · 본인 계정만 삭제 가능(다른 계정 지정 불가).
export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요해요. 삭제하려는 계정으로 먼저 로그인해 주세요." },
      { status: 401 }
    );
  }

  // 실수 방지를 위해 본문에 confirm: true 를 요구한다.
  let confirmed = false;
  try {
    const body = (await request.json()) as { confirm?: unknown };
    confirmed = body?.confirm === true;
  } catch {
    confirmed = false;
  }
  if (!confirmed) {
    return NextResponse.json(
      { error: "삭제 확인이 필요해요." },
      { status: 400 }
    );
  }

  try {
    const result = await deleteUserAccount(user.id);
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "계정 삭제 중 오류가 발생했어요.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
