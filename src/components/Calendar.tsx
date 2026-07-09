"use client";

import { useState } from "react";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export type DateStatus = "open" | "some" | "full";

function toKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DOT: Record<DateStatus, string> = {
  open: "bg-emerald-400",
  some: "bg-amber-400",
  full: "bg-rose-400",
};

export default function Calendar({
  value,
  onChange,
  minDate,
  monthsAhead = 6,
  dateStatus,
}: {
  value: string | null;
  onChange: (dateKey: string) => void;
  minDate?: Date; // 예약 가능한 최소 날짜(자정 기준). 기본: 오늘
  monthsAhead?: number; // 앞으로 이동 가능한 개월 수
  dateStatus?: (dateKey: string) => DateStatus; // 날짜별 예약 가능 상태
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const min = minDate ?? today;

  const [view, setView] = useState(
    () => new Date(min.getFullYear(), min.getMonth(), 1)
  );

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 이동 가능 범위: 최소 예약월 ~ 오늘+monthsAhead월
  const minMonth = new Date(min.getFullYear(), min.getMonth(), 1);
  const maxMonth = new Date(today.getFullYear(), today.getMonth() + monthsAhead, 1);
  const atMinMonth = firstDay <= minMonth;
  const atMaxMonth = firstDay >= maxMonth;

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => !atMinMonth && setView(new Date(year, month - 1, 1))}
          disabled={atMinMonth}
          className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition hover:bg-cream disabled:opacity-30"
          aria-label="이전 달"
        >
          ‹
        </button>
        <p className="text-base font-bold text-ink">
          {year}년 {month + 1}월
        </p>
        <button
          type="button"
          onClick={() => !atMaxMonth && setView(new Date(year, month + 1, 1))}
          disabled={atMaxMonth}
          className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition hover:bg-cream disabled:opacity-30"
          aria-label="다음 달"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-ink-soft">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`py-1 ${i === 0 ? "text-rose-400" : ""} ${i === 6 ? "text-sky-400" : ""}`}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`e${i}`} />;
          const key = toKey(date);
          const beforeMin = date < min;
          const status: DateStatus =
            !beforeMin && dateStatus ? dateStatus(key) : "open";
          const isFull = status === "full";
          const disabled = beforeMin || isFull;
          const isSelected = value === key;
          const dow = date.getDay();
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onChange(key)}
              className={[
                "relative aspect-square rounded-xl text-sm font-medium transition",
                isSelected
                  ? "bg-brand text-white shadow-md"
                  : beforeMin
                    ? "cursor-not-allowed text-ink-soft/25"
                    : isFull
                      ? "cursor-not-allowed text-ink-soft/40 line-through"
                      : "text-ink hover:bg-brand-50",
                !isSelected && !disabled && dow === 0 ? "text-rose-500" : "",
                !isSelected && !disabled && dow === 6 ? "text-sky-500" : "",
              ].join(" ")}
            >
              {date.getDate()}
              {dateStatus && !beforeMin && !isSelected && (
                <span
                  className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${DOT[status]}`}
                />
              )}
            </button>
          );
        })}
      </div>

      {dateStatus && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-soft">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> 여유
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> 일부 예약
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> 마감
          </span>
        </div>
      )}
      {minDate && (
        <p className="mt-2 text-[11px] text-ink-soft">
          예약은 <b>{toKey(min).replace(/-/g, ".")}</b>부터 가능해요 (당일·긴급
          예약 제외).
        </p>
      )}
    </div>
  );
}
