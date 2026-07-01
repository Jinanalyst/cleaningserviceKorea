"use client";

import { useEffect, useState } from "react";
import type { Partner, Review } from "@/lib/data";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-500" aria-label={`별점 ${rating}점`}>
      {"★".repeat(rating)}
      <span className="text-line">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default function PartnerCard({
  partner,
  reviews,
}: {
  partner: Partner;
  reviews: Review[];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div className="flex gap-4 rounded-3xl border border-line bg-white p-6 shadow-sm transition hover:shadow-md">
        <div
          className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-xl font-black ${partner.accent}`}
        >
          {partner.name.slice(0, 1)}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-ink">{partner.name}</h3>
            <span className="text-sm font-bold text-amber-500">★ {partner.rating}</span>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="text-xs font-medium text-brand underline decoration-brand/40 underline-offset-2 transition hover:decoration-brand"
            >
              후기 {partner.reviews} 보기
            </button>
          </div>
          <p className="mt-0.5 text-sm font-medium text-brand-600">{partner.tagline}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{partner.intro}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {partner.specialties.map((sp) => (
              <span
                key={sp}
                className="rounded-full bg-cream px-2.5 py-1 text-xs font-medium text-ink-soft"
              >
                {sp}
              </span>
            ))}
            <span className="rounded-full bg-cream px-2.5 py-1 text-xs font-medium text-ink-soft">
              📍 {partner.region}
            </span>
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="animate-rise relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl">
            {/* 헤더 */}
            <div className="flex items-start justify-between gap-3 border-b border-line px-6 py-5">
              <div className="flex items-center gap-3">
                <div
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-lg font-black ${partner.accent}`}
                >
                  {partner.name.slice(0, 1)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-ink">{partner.name}</h3>
                  <p className="text-sm text-ink-soft">
                    <span className="font-bold text-amber-500">★ {partner.rating}</span>
                    {" · "}
                    후기 {partner.reviews}개
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-cream"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            {/* 후기 목록 */}
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {reviews.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink-soft">
                  아직 등록된 후기가 없어요.
                </p>
              ) : (
                reviews.map((r, i) => (
                  <div key={i} className="rounded-2xl border border-line bg-cream/40 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink">{r.author}</span>
                      <span className="text-xs text-ink-soft">{r.date}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      <Stars rating={r.rating} />
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-ink-soft ring-1 ring-line">
                        {r.service}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-ink">{r.text}</p>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-line px-6 py-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full rounded-full bg-ink py-3 text-sm font-bold text-cream transition hover:opacity-90"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
