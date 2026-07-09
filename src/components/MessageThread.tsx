"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Sender = "admin" | "partner" | "customer";
type Message = {
  id: string;
  createdAt: string;
  sender: Sender;
  senderName: string;
  body: string;
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const mm = `${d.getMonth() + 1}.${d.getDate()}`;
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm} ${hh}:${mi}`;
}

// 예약/상담 건의 소통 스레드 (관리자↔업체 또는 관리자↔고객).
// me = 현재 사용자의 역할. 내 메시지는 오른쪽(브랜드), 상대는 왼쪽에 표시한다.
export default function MessageThread({
  type,
  id,
  audience,
  me,
  title,
}: {
  type: "reservation" | "consultation";
  id: string;
  audience: "partner" | "customer";
  me: Sender;
  title: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const qs = `type=${type}&id=${encodeURIComponent(id)}&audience=${audience}`;

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?${qs}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [qs]);

  useEffect(() => {
    load();
  }, [load]);

  // 화면에 다시 포커스될 때 새로고침 (실시간 소켓 대신 가벼운 폴링)
  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, audience, body }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setText("");
      } else {
        setError(data.error ?? "전송에 실패했어요.");
      }
    } catch {
      setError("전송에 실패했어요.");
    } finally {
      setSending(false);
    }
  }

  const accent =
    audience === "partner"
      ? "bg-sky-50 ring-sky-100"
      : "bg-emerald-50/70 ring-emerald-100";

  return (
    <div className={`mt-3 rounded-xl p-3 ring-1 ${accent}`}>
      <p className="text-xs font-bold text-ink">{title}</p>

      <div
        ref={scrollRef}
        className="mt-2 max-h-56 space-y-2 overflow-y-auto pr-1"
      >
        {loading ? (
          <p className="py-4 text-center text-xs text-ink-soft">불러오는 중…</p>
        ) : messages.length === 0 ? (
          <p className="py-4 text-center text-xs text-ink-soft">
            아직 주고받은 메시지가 없어요.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender === me;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
              >
                <div
                  className={[
                    "max-w-[85%] rounded-2xl px-3 py-1.5 text-sm",
                    mine
                      ? "bg-brand text-white"
                      : "bg-white text-ink ring-1 ring-line",
                  ].join(" ")}
                >
                  {m.body}
                </div>
                <span className="mt-0.5 text-[10px] text-ink-soft">
                  {m.senderName} · {formatTime(m.createdAt)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}

      <div className="mt-2 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="메시지를 입력하세요"
          className="flex-1 rounded-full border border-line bg-white px-3 py-1.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-100"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="rounded-full bg-brand px-4 py-1.5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-40"
        >
          전송
        </button>
      </div>
    </div>
  );
}
