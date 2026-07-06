"use client";

import { useEffect, useRef, useState } from "react";
import { COMPANY } from "@/lib/data";

const telHref = `tel:${COMPANY.tel.replace(/[^0-9]/g, "")}`;

// "상담 요청" → 전화 상담 / 카톡 상담을 고르는 팝오버.
// className 으로 감싸는 버튼 스타일(크기·색)을 호출부에서 지정한다.
export default function ConsultButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 바깥 클릭·ESC 로 닫기
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={className}
      >
        상담 요청
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-0 right-0 z-20 mb-2 overflow-hidden rounded-2xl border border-line bg-white shadow-lg"
        >
          <a
            href={telHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-ink transition hover:bg-cream"
          >
            <span aria-hidden className="text-base">📞</span>
            전화 상담
          </a>
          <a
            href={COMPANY.kakao}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 border-t border-line px-4 py-3 text-sm font-bold text-ink transition hover:bg-[#FEE500]/20"
          >
            <span
              aria-hidden
              className="grid h-5 w-5 place-items-center rounded-md bg-[#FEE500] text-xs"
            >
              💬
            </span>
            카톡 상담
          </a>
        </div>
      )}
    </div>
  );
}
