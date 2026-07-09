import { NextResponse, type NextRequest } from "next/server";
import { getRequestUser } from "@/lib/appAuth";
import { isAdminEmail } from "@/lib/auth";
import {
  listMessages,
  createMessage,
  type ThreadType,
  type Audience,
  type Sender,
} from "@/lib/messageStore";
import { readById } from "@/lib/store";
import { readConsultationById } from "@/lib/consultationStore";
import {
  readApprovedPartnerIdsByUser,
  readApprovedPartners,
} from "@/lib/applicationStore";
import { partnerById } from "@/lib/data";
import type { User } from "@supabase/supabase-js";

// 예약/상담 스레드의 배정 업체 id·고객 계정 id 를 조회한다.
async function resolveThread(
  type: ThreadType,
  id: string
): Promise<{ partnerId: string; userId: string | null } | null> {
  if (type === "reservation") {
    const r = await readById(id);
    return r ? { partnerId: r.partnerId, userId: r.userId } : null;
  }
  const c = await readConsultationById(id);
  return c ? { partnerId: c.partnerId, userId: c.userId } : null;
}

// 배정 업체 표시명 (시드 파트너 → 이름, 승인 파트너 → 업체명, 없으면 '배정 업체')
async function partnerDisplayName(partnerId: string): Promise<string> {
  const seed = partnerById(partnerId);
  if (seed) return seed.name;
  const approved = await readApprovedPartners();
  return approved.find((p) => p.id === partnerId)?.companyName ?? "배정 업체";
}

// 호출자가 이 스레드/채널에 접근 가능한지 판별하고, 발신자 역할·표시명을 정한다.
async function authorize(
  user: User,
  type: ThreadType,
  id: string,
  audience: Audience
): Promise<{ ok: true; sender: Sender; senderName: string } | { ok: false; status: number }> {
  // 관리자: 모든 스레드·양쪽 채널
  if (isAdminEmail(user.email)) {
    return { ok: true, sender: "admin", senderName: "손길 운영팀" };
  }

  const thread = await resolveThread(type, id);
  if (!thread) return { ok: false, status: 404 };

  if (audience === "customer") {
    // 고객 채널: 본인 예약/상담만
    if (thread.userId && thread.userId === user.id) {
      const name =
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        "고객";
      return { ok: true, sender: "customer", senderName: name };
    }
    return { ok: false, status: 403 };
  }

  // 업체 채널: 승인된 업체이고 이 스레드에 자기 업체가 배정된 경우만
  if (audience === "partner") {
    if (!thread.partnerId) return { ok: false, status: 403 };
    const myPartnerIds = await readApprovedPartnerIdsByUser(user.id);
    if (myPartnerIds.includes(thread.partnerId)) {
      const name = await partnerDisplayName(thread.partnerId);
      return { ok: true, sender: "partner", senderName: name };
    }
    return { ok: false, status: 403 };
  }

  return { ok: false, status: 400 };
}

function parseParams(url: URL) {
  const type = url.searchParams.get("type");
  const id = url.searchParams.get("id");
  const audience = url.searchParams.get("audience");
  return { type, id, audience };
}

function valid(
  type: unknown,
  id: unknown,
  audience: unknown
): { type: ThreadType; id: string; audience: Audience } | null {
  if (type !== "reservation" && type !== "consultation") return null;
  if (audience !== "partner" && audience !== "customer") return null;
  if (typeof id !== "string" || !id.trim()) return null;
  return { type, id: id.trim(), audience };
}

// GET /api/messages?type=&id=&audience= → 스레드 메시지 목록
export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }
  const { type, id, audience } = parseParams(new URL(request.url));
  const v = valid(type, id, audience);
  if (!v) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });

  const auth = await authorize(user, v.type, v.id, v.audience);
  if (!auth.ok) {
    return NextResponse.json({ error: "권한이 없어요." }, { status: auth.status });
  }

  const messages = await listMessages(v.type, v.id, v.audience);
  return NextResponse.json({ messages });
}

// POST /api/messages {type,id,audience,body} → 메시지 전송
export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }
  let body: { type?: string; id?: string; audience?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const v = valid(body.type, body.id, body.audience);
  if (!v) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });

  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) return NextResponse.json({ error: "메시지를 입력해 주세요." }, { status: 400 });
  if (text.length > 2000) {
    return NextResponse.json({ error: "메시지가 너무 길어요." }, { status: 400 });
  }

  const auth = await authorize(user, v.type, v.id, v.audience);
  if (!auth.ok) {
    return NextResponse.json({ error: "권한이 없어요." }, { status: auth.status });
  }

  const message = await createMessage({
    threadType: v.type,
    threadId: v.id,
    audience: v.audience,
    sender: auth.sender,
    senderName: auth.senderName,
    body: text,
  });
  return NextResponse.json({ message }, { status: 201 });
}
