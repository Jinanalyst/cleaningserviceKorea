"use client";

import { useEffect, useRef, useState } from "react";

type Booking = { emoji: string; title: string; who: string; time: string };

// 순환할 예약 풀 (실시간 피드처럼 계속 돌아감)
const POOL: Booking[] = [
  { emoji: "🏠", title: "가정 정기청소", who: "📍 서울 강남구", time: "수 13:00" },
  { emoji: "📦", title: "입주청소", who: "📍 성남 분당구", time: "금 09:00" },
  { emoji: "🔑", title: "원룸 퇴거청소", who: "📍 서울 서초구", time: "토 11:00" },
  { emoji: "🏢", title: "사무실·상가청소", who: "📍 서울 강남구", time: "월 07:00" },
  { emoji: "🚚", title: "이사청소", who: "📍 성남 분당구", time: "화 10:00" },
  { emoji: "🏙️", title: "오피스텔 청소", who: "📍 서울 송파구", time: "목 15:00" },
  { emoji: "🧽", title: "부분 청소", who: "📍 서울 서초구", time: "일 14:00" },
];

const VISIBLE = 3;
const INTERVAL = 2900;
const ANIM = 560;

type Slot = { uid: number; booking: Booking };

export default function LiveBookings() {
  const [slots, setSlots] = useState<Slot[]>(() =>
    POOL.slice(0, VISIBLE).map((b, i) => ({ uid: i, booking: b }))
  );
  const [enteringUid, setEnteringUid] = useState<number | null>(null);
  const [leavingUid, setLeavingUid] = useState<number | null>(null);
  const pointer = useRef(VISIBLE);
  const uid = useRef(VISIBLE);

  useEffect(() => {
    // 모션 최소화 설정을 존중
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const tick = setInterval(() => {
      const next = POOL[pointer.current % POOL.length];
      pointer.current += 1;
      const newUid = uid.current++;

      setSlots((prev) => {
        setEnteringUid(newUid);
        setLeavingUid(prev[prev.length - 1].uid);
        return [{ uid: newUid, booking: next }, ...prev];
      });

      window.setTimeout(() => {
        setSlots((prev) => prev.slice(0, VISIBLE));
        setEnteringUid(null);
        setLeavingUid(null);
      }, ANIM);
    }, INTERVAL);

    return () => clearInterval(tick);
  }, []);

  return (
    <div className="mt-4">
      {slots.map((s, i) => {
        const isEntering = s.uid === enteringUid;
        const isLeaving = s.uid === leavingUid;
        return (
          <div
            key={s.uid}
            className={[
              "overflow-hidden",
              isEntering ? "slot-in" : isLeaving ? "slot-out" : "mb-3",
            ].join(" ")}
          >
            <Row booking={s.booking} fresh={i === 0} />
          </div>
        );
      })}
    </div>
  );
}

function Row({ booking, fresh }: { booking: Booking; fresh: boolean }) {
  const { emoji, title, who, time } = booking;
  return (
    <div
      className={[
        "flex items-center gap-3 rounded-2xl border bg-white px-3 py-2.5 transition-colors",
        fresh ? "border-brand-200 ring-1 ring-brand-100" : "border-line",
      ].join(" ")}
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-cream text-lg">
        {emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm font-bold text-ink">
          {fresh && (
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
            </span>
          )}
          {title}
        </p>
        <p className="truncate text-xs text-ink-soft">{who}</p>
      </div>
      <span className="shrink-0 rounded-lg bg-brand-50 px-2 py-1 text-xs font-bold text-brand-600">
        {time}
      </span>
    </div>
  );
}
