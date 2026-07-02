"use client";

// 고객 후기 — 서버에서 받은 초기 목록으로 즉시 렌더하고,
// 이후 클라이언트에서 라이브로 다시 불러온다(마운트/포커스 복귀/주기적 폴링).
// 목록은 스크롤 가능한 박스 안에 표시된다.
import { useCallback, useEffect, useRef, useState } from "react";
import type { Review } from "@/lib/data";
import { Stars } from "@/components/PartnerBits";

const POLL_MS = 20_000; // 20초마다 새 후기 확인

export default function PartnerReviews({
  partnerId,
  initialReviews,
}: {
  partnerId: string;
  initialReviews: Review[];
}) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [refreshing, setRefreshing] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/partners/${partnerId}/reviews`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { reviews?: Review[] };
      if (Array.isArray(data.reviews)) setReviews(data.reviews);
    } catch {
      // 네트워크 오류 시 기존 목록 유지
    } finally {
      setRefreshing(false);
    }
  }, [partnerId]);

  useEffect(() => {
    // 마운트 직후 한 번 최신화 (초기 서버 데이터가 캐시됐을 수 있으므로)
    refresh();

    const onFocus = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);

    const timer = window.setInterval(refresh, POLL_MS);

    return () => {
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
      window.clearInterval(timer);
    };
  }, [refresh]);

  return (
    <section className="mt-8">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-black text-ink">
          고객 후기 <span className="text-ink-soft">({reviews.length})</span>
        </h2>
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600 ring-1 ring-emerald-200 transition-opacity ${
            refreshing ? "opacity-100" : "opacity-70"
          }`}
          aria-live="polite"
        >
          <span
            className={`h-1.5 w-1.5 rounded-full bg-emerald-500 ${
              refreshing ? "animate-pulse" : ""
            }`}
          />
          실시간
        </span>
      </div>

      {reviews.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-line bg-white p-6 text-center text-sm text-ink-soft">
          아직 등록된 후기가 없어요.
        </p>
      ) : (
        <div
          ref={listRef}
          className="mt-3 max-h-[28rem] space-y-3 overflow-y-auto rounded-3xl border border-line bg-cream/40 p-3 [scrollbar-width:thin] sm:p-4"
        >
          {reviews.map((r, i) => (
            <div
              key={`${r.author}-${r.date}-${i}`}
              className="rounded-2xl border border-line bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink">{r.author}</span>
                <span className="text-xs text-ink-soft">{r.date}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <Stars rating={r.rating} />
                <span className="rounded-full bg-cream px-2 py-0.5 text-xs font-medium text-ink-soft ring-1 ring-line">
                  {r.service}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink">{r.text}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
