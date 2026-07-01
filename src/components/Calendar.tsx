"use client";

import { useState } from "react";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function toKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function Calendar({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (dateKey: string) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 이전 달로는 갈 수 없게 (오늘이 포함된 달이 최소)
  const atMinMonth =
    year === today.getFullYear() && month === today.getMonth();

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
          onClick={() => setView(new Date(year, month + 1, 1))}
          className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition hover:bg-cream"
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
          const isPast = date < today;
          const isSelected = value === key;
          const dow = date.getDay();
          return (
            <button
              key={key}
              type="button"
              disabled={isPast}
              onClick={() => onChange(key)}
              className={[
                "aspect-square rounded-xl text-sm font-medium transition",
                isSelected
                  ? "bg-brand text-white shadow-md"
                  : isPast
                    ? "cursor-not-allowed text-ink-soft/25"
                    : "text-ink hover:bg-brand-50",
                !isSelected && dow === 0 && !isPast ? "text-rose-500" : "",
                !isSelected && dow === 6 && !isPast ? "text-sky-500" : "",
              ].join(" ")}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
