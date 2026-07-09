// 소통 스레드 저장소 — 예약/상담 건마다 관리자↔업체·관리자↔고객 메시지.
// Supabase(Postgres) 기반, 서버 전용(service_role). 접근 권한은 라우트에서 검증한다.
import "server-only";
import { getSupabase } from "./supabase";

const TABLE = "messages";

export type ThreadType = "reservation" | "consultation";
export type Audience = "partner" | "customer";
export type Sender = "admin" | "partner" | "customer";

export type Message = {
  id: string;
  createdAt: string;
  threadType: ThreadType;
  threadId: string;
  audience: Audience;
  sender: Sender;
  senderName: string;
  body: string;
};

type Row = {
  id: string;
  created_at: string;
  thread_type: ThreadType;
  thread_id: string;
  audience: Audience;
  sender: Sender;
  sender_name: string | null;
  body: string;
};

function fromRow(r: Row): Message {
  return {
    id: r.id,
    createdAt: r.created_at,
    threadType: r.thread_type,
    threadId: r.thread_id,
    audience: r.audience,
    sender: r.sender,
    senderName: r.sender_name ?? "",
    body: r.body,
  };
}

// 한 스레드(예약/상담 + audience 채널)의 메시지를 시간순으로 반환.
export async function listMessages(
  threadType: ThreadType,
  threadId: string,
  audience: Audience
): Promise<Message[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("thread_type", threadType)
    .eq("thread_id", threadId)
    .eq("audience", audience)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as Row[]).map(fromRow);
}

export async function createMessage(input: {
  threadType: ThreadType;
  threadId: string;
  audience: Audience;
  sender: Sender;
  senderName: string;
  body: string;
}): Promise<Message> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .insert({
      thread_type: input.threadType,
      thread_id: input.threadId,
      audience: input.audience,
      sender: input.sender,
      sender_name: input.senderName,
      body: input.body,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return fromRow(data as Row);
}
