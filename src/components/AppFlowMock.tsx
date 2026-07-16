"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

/*
  히어로 우측 — 손길 앱의 실제 예약 화면(songil-app/src/screens/Book.tsx)을
  그대로 재현해 휴대폰 프레임 안에서 자동 재생하는 모션 목업.
  앱과 동일한 5단계: 서비스 → 공간 정보 → 날짜·업체 → 정보 입력 → 예약금 결제 → 완료.
  스타일은 globals.css 의 `.appmock` 스코프(앱 styles.css 이식)와 100% 일치.
*/

const STEPS = ["서비스", "공간 정보", "날짜·업체", "정보 입력", "예약금 결제"];
const SCREEN_COUNT = STEPS.length + 1; // + 완료
const DWELL = 4200; // 각 화면 유지 시간(자동 스크롤 포함)

// 375px 논리폭을 폰 프레임 안쪽 폭(280px)에 맞춰 축소
const LOGICAL_W = 375;
const FRAME_INNER_W = 280;
const SCALE = FRAME_INNER_W / LOGICAL_W;
const SCREEN_H = 580; // 폰 화면(뷰포트) 시각 높이
const VIEW_LOGICAL_H = SCREEN_H / SCALE; // 뷰포트의 논리 높이

export default function AppFlowMock() {
  const [step, setStep] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setReduced(true);
      return; // 모션 최소화 설정이면 첫 화면만 표시(자동 진행 없음)
    }
    const t = setInterval(() => setStep((s) => (s + 1) % SCREEN_COUNT), DWELL);
    return () => clearInterval(t);
  }, []);

  // 화면 렌더 후 실제 높이를 재서 뷰포트보다 길면 그만큼 위로 스크롤(--ty)
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const h = el.offsetHeight; // 논리 높이(스케일 전)
    const ty = Math.min(0, -(h - VIEW_LOGICAL_H) - 24);
    el.style.setProperty("--ty", `${ty}px`);
  }, [step]);

  const done = step >= STEPS.length;

  return (
    <div className="relative mx-auto w-[300px] max-w-full">
      {/* 배경 광선 */}
      <div className="absolute -left-8 -top-6 h-24 w-24 rounded-full bg-mint-soft blur-2xl" />
      <div className="absolute -bottom-10 -right-6 h-32 w-32 rounded-full bg-brand-100 blur-2xl" />

      {/* 휴대폰 프레임 */}
      <div className="relative rounded-[2.6rem] border border-ink/10 bg-ink p-2.5 shadow-2xl shadow-ink/25">
        <div
          className="relative overflow-hidden rounded-[2.1rem] bg-cream"
          style={{ height: SCREEN_H }}
        >
          {/* 노치 */}
          <div className="absolute left-1/2 top-0 z-20 h-4 w-24 -translate-x-1/2 rounded-b-2xl bg-ink" />

          {/* 스케일된 앱 화면 (실제 앱 마크업) — 뷰포트보다 길면 자동 스크롤 */}
          <div key={step} className="appmock-fade absolute left-0 top-0">
            <div
              ref={contentRef}
              className={`appmock${reduced ? "" : " appmock-scroll"}`}
              style={
                {
                  width: LOGICAL_W,
                  transformOrigin: "top left",
                  transform: `scale(${SCALE})`,
                  "--s": String(SCALE),
                  "--dwell": `${DWELL}ms`,
                } as CSSProperties
              }
            >
              {/* 상태바 */}
              <div className="mockstatus">
                <span>9:41</span>
                <span style={{ letterSpacing: "1px" }}>••• 📶 🔋</span>
              </div>
              {/* 앱바 */}
              <div className="appbar">
                <span className="back">‹</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-mark.png" alt="" aria-hidden="true" className="logo" />
                <span className="title">청소 예약</span>
              </div>

              {done ? (
                <DoneScreen />
              ) : (
                <>
                  {/* 스텝바 */}
                  <div className="stepbar">
                    {STEPS.map((_, i) => (
                      <span key={i} className={`seg${i <= step ? " on" : ""}`} />
                    ))}
                  </div>
                  <div className="pad">
                    <p className="eyebrow">
                      STEP {step + 1} / {STEPS.length} · {STEPS[step]}
                    </p>
                    <Screen step={step} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 상·하단 페이드로 스크롤을 자연스럽게 */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-cream to-transparent" />
        </div>
      </div>

      {/* 프레임 하단 캡션 */}
      <p className="mt-4 text-center text-xs font-medium text-ink-soft">
        <span className="font-bold text-brand">
          앱에서 {done ? "예약 완료" : STEPS[step]}
        </span>
        <span className="mx-1.5 text-line">·</span>
        30초면 예약 끝
      </p>
    </div>
  );
}

function Screen({ step }: { step: number }) {
  switch (step) {
    case 0:
      return <ServiceStep />;
    case 1:
      return <SpaceStep />;
    case 2:
      return <DateStep />;
    case 3:
      return <InfoStep />;
    default:
      return <PayStep />;
  }
}

/* STEP 1 — 서비스 + 평수 */
const SERVICES = [
  { emoji: "🏠", name: "가정 정기청소", blurb: "주방·화장실·거실까지 생활공간을 구석구석 정돈해 드려요.", duration: "3~4시간", min: "60,000원" },
  { emoji: "📦", name: "입주청소", blurb: "빈집 상태에서 새집처럼. 사람 살기 전 바닥부터 완벽하게.", duration: "5~7시간", min: "150,000원" },
  { emoji: "🚚", name: "이사청소", blurb: "이사 나가는 날, 짐 뺀 자리까지 원상복구로 마무리해요.", duration: "4~6시간", min: "120,000원" },
  { emoji: "🔑", name: "원룸 퇴거청소", blurb: "보증금 걱정 없이 깔끔하게. 원룸·소형 평수 퇴실 청소.", duration: "2~3시간", min: "90,000원" },
];

function ServiceStep() {
  return (
    <div className="stack" style={{ marginTop: 14 }}>
      <h2 className="title-lg">어떤 청소가 필요하세요?</h2>
      {SERVICES.map((s, i) => {
        const sel = i === 0;
        return (
          <div
            key={s.name}
            className="card card-pad flex gap-12 center"
            style={{
              width: "100%",
              border: sel ? "1px solid var(--brand)" : undefined,
              background: sel ? "var(--brand-50)" : "#fff",
            }}
          >
            <span className="tile">{s.emoji}</span>
            <span className="grow">
              <b style={{ display: "block" }}>{s.name}</b>
              <span className="tiny muted">{s.blurb}</span>
              <span className="tiny" style={{ display: "block", marginTop: 4 }}>
                <span className="muted">{s.duration} · 시작</span>{" "}
                <span className="price">{s.min}~</span>
              </span>
            </span>
            {sel && <span style={{ color: "var(--brand)", fontWeight: 900 }}>✓</span>}
          </div>
        );
      })}
      <div className="field" style={{ marginBottom: 0 }}>
        <span className="label">
          평수<span className="req">*</span>
        </span>
        <div className="input">24</div>
      </div>
      <div className="notice-info">
        <span>ⓘ</span>
        <span>
          <b>24평 기본 예상 견적</b> <b className="price">96,000원</b>
          <br />
          오염 정도·주거 형태·방문 일정·추가 옵션에 따라 최종 견적이 달라져요.
        </span>
      </div>
    </div>
  );
}

/* STEP 2 — 공간 정보 */
const PROPERTY_TYPES = ["아파트", "빌라·연립", "오피스텔", "원룸", "단독주택", "기타"];
const ROOM_OPTIONS = ["원룸", "방 1개", "방 2개", "방 3개", "방 4개+"];
const BATH_OPTIONS = ["1개", "2개", "3개+"];
const DIFFICULTY = [
  { label: "보통", factor: "1" },
  { label: "오염 많음", factor: "1.2" },
  { label: "심함", factor: "1.4" },
];
const OPTIONS = [
  { label: "냉장고 내부 청소", price: "+30,000원" },
  { label: "후드·오븐 청소", price: "+20,000원" },
];

function SpaceStep() {
  return (
    <div style={{ marginTop: 14 }}>
      <h2 className="title-lg">집 정보</h2>
      <p className="small" style={{ fontWeight: 700, marginTop: 14 }}>
        주거 형태 <span style={{ color: "var(--brand)" }}>*</span>
      </p>
      <div className="opt-grid" style={{ marginTop: 8 }}>
        {PROPERTY_TYPES.map((t, i) => (
          <span key={t} className={`opt${i === 0 ? " sel" : ""}`}>{t}</span>
        ))}
      </div>
      <p className="small" style={{ fontWeight: 700, marginTop: 16 }}>방 개수</p>
      <div className="opt-grid" style={{ marginTop: 8 }}>
        {ROOM_OPTIONS.map((t) => (
          <span key={t} className={`opt${t === "방 2개" ? " sel" : ""}`}>{t}</span>
        ))}
      </div>
      <p className="small" style={{ fontWeight: 700, marginTop: 16 }}>화장실</p>
      <div className="opt-grid" style={{ marginTop: 8 }}>
        {BATH_OPTIONS.map((t) => (
          <span key={t} className={`opt${t === "1개" ? " sel" : ""}`}>{t}</span>
        ))}
      </div>
      <span className="opt" style={{ display: "inline-block", marginTop: 16 }}>
        🐾 반려동물이 있어요
      </span>
      <p className="small" style={{ fontWeight: 700, marginTop: 18 }}>오염 정도</p>
      <p className="tiny muted" style={{ margin: "2px 0 8px" }}>
        오염이 심할수록 작업 시간·인력이 늘어 견적에 반영돼요.
      </p>
      <div className="opt-grid">
        {DIFFICULTY.map((d, i) => (
          <span key={d.label} className={`opt${i === 0 ? " sel" : ""}`}>
            {d.label}
            <span className="tiny muted" style={{ marginLeft: 4 }}>×{d.factor}</span>
          </span>
        ))}
      </div>
      <p className="small" style={{ fontWeight: 700, marginTop: 18 }}>추가 옵션 (선택)</p>
      <div className="stack-sm" style={{ marginTop: 8 }}>
        {OPTIONS.map((o) => (
          <div key={o.label} className="card card-pad flex between center" style={{ width: "100%" }}>
            <span className="flex center gap-8">
              <span style={{ color: "var(--line)", fontWeight: 900 }}>☐</span>
              <span className="small"><b>{o.label}</b></span>
            </span>
            <span className="small price">{o.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* STEP 3 — 날짜·시간·업체 */
const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
const TIME_SLOTS = ["09:00", "11:00", "13:00", "15:00", "17:00"];

function DateStep() {
  // 2026년 7월: 1일 = 수요일(startWeekday=3)
  const startWeekday = 3;
  const daysInMonth = 31;
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ marginTop: 14 }}>
      <h2 className="title-lg">언제, 어느 업체로?</h2>
      <p className="small muted" style={{ marginTop: 4 }}>
        방문 날짜와 시간, 담당 업체를 골라주세요.
      </p>

      <div className="card lg card-pad" style={{ marginTop: 14 }}>
        <div className="flex between center">
          <span style={{ fontSize: "1.3rem", color: "var(--line)", padding: "4px 10px" }}>‹</span>
          <b style={{ fontSize: "1.05rem" }}>2026년 7월</b>
          <span style={{ fontSize: "1.3rem", color: "var(--ink)", padding: "4px 10px" }}>›</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginTop: 10 }}>
          {WEEK.map((w, i) => (
            <div
              key={w}
              className="tiny"
              style={{
                textAlign: "center",
                fontWeight: 700,
                padding: "4px 0",
                color: i === 0 ? "var(--rose-600)" : i === 6 ? "var(--brand)" : "var(--ink-soft)",
              }}
            >
              {w}
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginTop: 4 }}>
          {cells.map((d, i) => {
            if (d === null) return <div key={`b${i}`} />;
            const beforeMin = d < 12; // 오늘+3일 이전 비활성
            const selected = d === 19;
            const weekday = (startWeekday + d - 1) % 7;
            return (
              <div
                key={d}
                style={{
                  aspectRatio: "1",
                  borderRadius: 12,
                  display: "grid",
                  placeItems: "center",
                  position: "relative",
                  background: selected ? "var(--brand)" : "transparent",
                  color: beforeMin
                    ? "var(--line)"
                    : selected
                      ? "#fff"
                      : weekday === 0
                        ? "var(--rose-600)"
                        : "var(--ink)",
                  fontWeight: selected ? 800 : 600,
                  fontSize: "0.9rem",
                }}
              >
                {d}
                {!beforeMin && !selected && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: 5,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 5,
                      height: 5,
                      borderRadius: 999,
                      background: d % 5 === 0 ? "var(--amber-400)" : "var(--emerald-400)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="small" style={{ fontWeight: 700, marginTop: 18 }}>방문 시간대</p>
      <div className="opt-grid" style={{ marginTop: 8 }}>
        {TIME_SLOTS.map((t) => (
          <span key={t} className={`opt${t === "13:00" ? " sel" : ""}`}>{t}</span>
        ))}
      </div>

      <p className="small" style={{ fontWeight: 700, marginTop: 18 }}>담당 업체 선택</p>
      <div className="stack-sm" style={{ marginTop: 8 }}>
        <div
          className="card card-pad flex gap-10 center"
          style={{ width: "100%", border: "1px solid var(--brand)", background: "var(--brand-50)" }}
        >
          <span className="avatar acc-violet" style={{ height: 40, width: 40, fontSize: "1rem", borderRadius: 12 }}>
            청
          </span>
          <span className="grow">
            <b className="small" style={{ display: "block" }}>청소학개론</b>
            <span className="tiny muted">서울 강남 · 성남 분당</span>
          </span>
          <span style={{ color: "var(--brand)", fontWeight: 900 }}>✓</span>
        </div>
      </div>
    </div>
  );
}

/* STEP 4 — 정보 입력 */
function InfoStep() {
  return (
    <div style={{ marginTop: 14 }}>
      <h2 className="title-lg">연락처와 주소</h2>
      <div className="row-2" style={{ marginTop: 14 }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <span className="label">이름<span className="req">*</span></span>
          <div className="input">김손길</div>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <span className="label">연락처<span className="req">*</span></span>
          <div className="input">010-1234-5678</div>
        </div>
      </div>
      <div className="field" style={{ marginTop: 16 }}>
        <span className="label">주소<span className="req">*</span></span>
        <div className="input is-focus">
          서울 강남구 테헤란로 120<span className="caret animate-caret" />
        </div>
      </div>
      <div className="field">
        <span className="label">상세 주소 (선택)</span>
        <div className="input" style={{ color: "var(--ink-soft)" }}>302동 1104호</div>
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <span className="label">요청사항 (선택)</span>
        <div className="input" style={{ color: "var(--ink-soft)", minHeight: 62 }}>
          반려동물이 있어요. 베란다도 신경 써주세요.
        </div>
      </div>
    </div>
  );
}

/* STEP 5 — 예약금 결제 */
function PayStep() {
  return (
    <div style={{ marginTop: 14 }}>
      <h2 className="title-lg">예약금 결제</h2>
      <div className="card card-pad" style={{ marginTop: 14 }}>
        <div className="flex between"><span className="muted small">서비스</span><b>🏠 가정 정기청소</b></div>
        <div className="flex between mt-8"><span className="muted small">방문일</span><b>2026-07-19 13:00</b></div>
        <div className="flex between mt-8"><span className="muted small">담당 업체</span><b>청소학개론</b></div>
      </div>

      <div className="card card-pad" style={{ marginTop: 12 }}>
        <p className="small" style={{ fontWeight: 700, marginBottom: 8 }}>예상 견적 상세</p>
        <div className="flex between"><span className="muted small">기본 견적 (24평)</span><b className="small">96,000원</b></div>
        <div className="flex between mt-8"><span className="muted small">주거유형 (아파트)</span><b className="small">×1</b></div>
        <hr className="hr" />
        <div className="flex between center">
          <span style={{ fontWeight: 700 }}>최종 예상 견적</span>
          <span className="price" style={{ fontSize: "1.25rem" }}>96,000원</span>
        </div>
        <p className="tiny muted" style={{ marginTop: 8 }}>최종 금액은 현장 확인 후 확정될 수 있어요.</p>
      </div>

      <div
        className="card card-pad"
        style={{ marginTop: 12, background: "var(--brand-50)", border: "1px solid var(--brand-100)" }}
      >
        <div className="flex between center">
          <span style={{ fontWeight: 700 }}>지금 결제 (예약금·견적의 7%)</span>
          <span className="price" style={{ fontSize: "1.3rem" }}>6,720원</span>
        </div>
        <p className="tiny muted" style={{ marginTop: 6 }}>
          잔금 89,280원은 청소 완료 후 현장에서 파트너에게 결제해요.
        </p>
      </div>

      <div className="btn-brand" style={{ marginTop: 16 }}>6,720원 결제하고 예약 확정</div>
    </div>
  );
}

/* 완료 */
function DoneScreen() {
  return (
    <div className="pad center-text">
      <div className="card lg card-pad animate-pop" style={{ marginTop: 20 }}>
        <div
          className="tile"
          style={{ margin: "0 auto", background: "var(--emerald-50)", height: 64, width: 64, fontSize: "2rem" }}
        >
          ✅
        </div>
        <h1 className="title-xl">예약이 확정됐어요!</h1>
        <p className="sub small">
          예약금 결제가 완료됐어요. 방문 하루 전 담당 업체가 다시 안내드릴게요.
        </p>
        <div className="notice" style={{ marginTop: 18, textAlign: "left" }}>
          <div className="flex between"><span className="muted small">예약번호</span><b>SG-2071</b></div>
          <div className="flex between mt-8"><span className="muted small">서비스</span><b>🏠 가정 정기청소</b></div>
          <div className="flex between mt-8"><span className="muted small">방문일</span><b>2026-07-19 13:00</b></div>
          <div className="flex between mt-8"><span className="muted small">담당 업체</span><b>청소학개론</b></div>
          <div className="flex between mt-8"><span className="muted small">결제한 예약금 (견적의 7%)</span><b className="price">6,720원</b></div>
        </div>
        <div className="btn-brand" style={{ marginTop: 18 }}>내 예약 보기 →</div>
      </div>
    </div>
  );
}
