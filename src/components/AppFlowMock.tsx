"use client";

import { useEffect, useRef, useState } from "react";

/*
  히어로 우측 — 손길 앱에서 예약하는 과정을 휴대폰 프레임 안에서
  자동으로 재생하는 모션 목업. (가짜 실시간 예약 현황을 대체)
  실제 예약 흐름(서비스 → 날짜·시간 → 정보 입력 → 예약금 결제 → 완료)과 동일.
*/

const STEP_LABELS = ["서비스 선택", "날짜·시간", "정보 입력", "예약금 결제", "예약 완료"];
const SCREEN_COUNT = STEP_LABELS.length;
const DWELL = 3000; // 각 화면 유지 시간
const TAP_AT = 2350; // 탭 리플이 뜨는 시점

export default function AppFlowMock() {
  const [step, setStep] = useState(0);
  const [tap, setTap] = useState(false);
  const tapTimer = useRef<number | null>(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return; // 모션 최소화 설정이면 첫 화면만 표시
    }

    const advance = setInterval(() => {
      setStep((s) => (s + 1) % SCREEN_COUNT);
      setTap(false);
    }, DWELL);

    return () => clearInterval(advance);
  }, []);

  // 화면이 바뀔 때마다 "다음 버튼 탭" 리플을 예약
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    if (tapTimer.current) window.clearTimeout(tapTimer.current);
    // 마지막(완료) 화면에서는 탭 없음
    if (step < SCREEN_COUNT - 1) {
      tapTimer.current = window.setTimeout(() => setTap(true), TAP_AT);
    }
    return () => {
      if (tapTimer.current) window.clearTimeout(tapTimer.current);
    };
  }, [step]);

  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      {/* 배경 광선 */}
      <div className="absolute -left-8 -top-6 h-24 w-24 rounded-full bg-mint-soft blur-2xl" />
      <div className="absolute -bottom-10 -right-6 h-32 w-32 rounded-full bg-brand-100 blur-2xl" />

      {/* 휴대폰 프레임 */}
      <div className="relative rounded-[2.6rem] border border-ink/10 bg-ink p-2.5 shadow-2xl shadow-ink/20">
        <div className="relative aspect-[9/18.2] overflow-hidden rounded-[2.1rem] bg-cream">
          {/* 노치 */}
          <div className="absolute left-1/2 top-0 z-20 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-ink" />

          {/* 상태바 */}
          <div className="flex items-center justify-between px-6 pt-2.5 text-[10px] font-bold text-ink">
            <span>9:41</span>
            <span className="flex items-center gap-1 text-ink-soft">
              <span>●●●</span>
              <span>📶</span>
              <span>🔋</span>
            </span>
          </div>

          {/* 앱 헤더 */}
          <div className="flex items-center gap-2 px-4 pb-2 pt-2">
            <span className="text-sm text-ink-soft">‹</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="" aria-hidden="true" className="h-5 w-5" />
            <p className="text-sm font-black text-ink">청소 예약</p>
            <span className="ml-auto text-xs text-ink-soft">
              {Math.min(step + 1, 4)}/4
            </span>
          </div>

          {/* 진행 바 */}
          <div className="flex gap-1 px-4 pb-2">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={[
                  "h-1 flex-1 rounded-full transition-colors duration-500",
                  i <= Math.min(step, 3) ? "bg-brand" : "bg-line",
                ].join(" ")}
              />
            ))}
          </div>

          {/* 화면 본문 */}
          <div className="relative px-4 pt-1">
            <div key={step} className="animate-screen">
              <Screen step={step} />
            </div>
          </div>

          {/* 하단 CTA + 탭 리플 */}
          <div className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-3">
            <div className="relative">
              <button
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                className={[
                  "pointer-events-none w-full rounded-full py-2.5 text-center text-xs font-black text-white shadow-lg",
                  step >= SCREEN_COUNT - 1 ? "bg-mint" : "bg-brand shadow-brand/30",
                  tap ? "animate-press" : "",
                ].join(" ")}
              >
                {CTA_LABELS[step]}
              </button>
              {tap && (
                <span className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 rounded-full bg-white animate-tap" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 프레임 하단 캡션 */}
      <p className="mt-4 text-center text-xs font-medium text-ink-soft">
        <span className="font-bold text-brand">앱에서 {STEP_LABELS[step]}</span>
        <span className="mx-1.5 text-line">·</span>
        30초면 예약 끝
      </p>
    </div>
  );
}

const CTA_LABELS = [
  "다음",
  "다음",
  "다음",
  "예약금 결제하기",
  "내 예약 확인하기",
];

function Screen({ step }: { step: number }) {
  switch (step) {
    case 0:
      return <ServiceScreen />;
    case 1:
      return <DateScreen />;
    case 2:
      return <InfoScreen />;
    case 3:
      return <PayScreen />;
    default:
      return <DoneScreen />;
  }
}

/* 1) 서비스 선택 */
function ServiceScreen() {
  const services = [
    { emoji: "🏠", name: "가정 정기청소", sel: true },
    { emoji: "📦", name: "입주청소", sel: false },
    { emoji: "🚚", name: "이사청소", sel: false },
    { emoji: "🔑", name: "원룸 퇴거청소", sel: false },
  ];
  return (
    <div>
      <p className="text-[13px] font-black text-ink">어떤 청소가 필요하세요?</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {services.map((s) => (
          <div
            key={s.name}
            className={[
              "rounded-2xl border p-2.5 text-left transition",
              s.sel
                ? "border-brand bg-brand-50 ring-2 ring-brand"
                : "border-line bg-white",
            ].join(" ")}
          >
            <div className="text-lg">{s.emoji}</div>
            <p className="mt-1 text-[11px] font-bold leading-tight text-ink">
              {s.name}
            </p>
            <p className="mt-1 text-[9px] font-bold text-brand">방문·상담 후 협의</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 2) 날짜·시간 */
function DateScreen() {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return (
    <div>
      <p className="text-[13px] font-black text-ink">언제 방문할까요?</p>
      <div className="mt-3 rounded-2xl border border-line bg-white p-3">
        <p className="mb-2 text-center text-[11px] font-bold text-ink">2026년 7월</p>
        <div className="grid grid-cols-7 gap-1 text-center text-[9px] text-ink-soft">
          {days.map((d) => (
            <span key={d}>{d}</span>
          ))}
          {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => (
            <span
              key={n}
              className={[
                "grid aspect-square place-items-center rounded-md text-[9px] font-bold",
                n === 19
                  ? "bg-brand text-white"
                  : n < 12
                    ? "text-line"
                    : "text-ink",
              ].join(" ")}
            >
              {n}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-2.5 flex gap-1.5">
        {["09:00", "13:00", "15:00"].map((t) => (
          <span
            key={t}
            className={[
              "flex-1 rounded-lg border py-1.5 text-center text-[10px] font-bold",
              t === "13:00"
                ? "border-brand bg-brand text-white"
                : "border-line bg-white text-ink",
            ].join(" ")}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* 3) 정보 입력 */
function InfoScreen() {
  return (
    <div>
      <p className="text-[13px] font-black text-ink">예약자 정보를 알려주세요</p>
      <div className="mt-3 space-y-2">
        <MockField label="이름" value="김손길" />
        <MockField label="연락처" value="010-1234-5678" />
        <MockField label="방문 주소" value="서울 강남구 테헤란로…" typing />
      </div>
      <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2">
        <span className="text-xs">🐾</span>
        <span className="text-[10px] font-bold text-ink">반려동물이 있어요</span>
        <span className="ml-auto flex h-4 w-7 items-center rounded-full bg-brand px-0.5">
          <span className="ml-auto h-3 w-3 rounded-full bg-white" />
        </span>
      </div>
    </div>
  );
}

function MockField({
  label,
  value,
  typing,
}: {
  label: string;
  value: string;
  typing?: boolean;
}) {
  return (
    <div>
      <p className="mb-1 text-[9px] font-bold text-ink-soft">{label}</p>
      <div
        className={[
          "rounded-lg border bg-white px-2.5 py-1.5 text-[10px] font-medium text-ink",
          typing ? "border-brand ring-1 ring-brand-100" : "border-line",
        ].join(" ")}
      >
        {value}
        {typing && (
          <span className="animate-caret ml-0.5 inline-block h-3 w-px translate-y-0.5 bg-brand" />
        )}
      </div>
    </div>
  );
}

/* 4) 예약금 결제 */
function PayScreen() {
  return (
    <div>
      <p className="text-[13px] font-black text-ink">예약 내용 확인</p>
      <div className="mt-3 space-y-1.5 rounded-2xl border border-line bg-white p-3 text-[10px]">
        <PayRow k="서비스" v="🏠 가정 정기청소" />
        <PayRow k="방문" v="7월 19일 (토) 13:00" />
        <PayRow k="예약자" v="김손길 · 강남구" />
      </div>
      <div className="mt-2.5 rounded-2xl border-2 border-brand bg-brand-50 p-3">
        <p className="text-[9px] font-bold text-brand-700">
          온라인 결제 · 예약금 (견적의 7%)
        </p>
        <div className="mt-0.5 flex items-end justify-between">
          <span className="text-[10px] font-bold text-ink">지금 결제</span>
          <span className="text-lg font-black text-brand">21,000원</span>
        </div>
        <p className="mt-1 text-[8px] text-brand-700/80">
          잔금은 청소 완료 후 현장 결제
        </p>
      </div>
    </div>
  );
}

function PayRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="shrink-0 text-ink-soft">{k}</span>
      <span className="truncate text-right font-bold text-ink">{v}</span>
    </div>
  );
}

/* 5) 예약 완료 */
function DoneScreen() {
  return (
    <div className="flex flex-col items-center pt-6 text-center">
      <div className="animate-pop grid h-16 w-16 place-items-center rounded-full bg-mint-soft text-3xl">
        🎉
      </div>
      <p className="mt-4 text-sm font-black text-ink">예약 신청이 접수됐어요!</p>
      <p className="mt-1.5 text-[10px] leading-relaxed text-ink-soft">
        입금이 확인되면 담당 업체를 배정하고
        <br />
        문자로 알려드릴게요.
      </p>
      <div className="mt-4 w-full rounded-2xl bg-cream p-3 text-left text-[10px]">
        <div className="flex justify-between">
          <span className="text-ink-soft">예약 번호</span>
          <span className="font-black text-ink">SG-240719</span>
        </div>
        <div className="mt-1 flex justify-between border-t border-line pt-1">
          <span className="text-ink-soft">예약금</span>
          <span className="font-black text-brand">21,000원</span>
        </div>
      </div>
    </div>
  );
}
