import type { Metadata } from "next";
import Link from "next/link";
import { APP, COMPANY, DEPOSIT, formatKRW } from "@/lib/data";

export const metadata: Metadata = {
  title: "손길 앱 다운로드 — 손안의 청소 예약",
  description:
    "손길 모바일 앱을 안드로이드에서 바로 설치하세요. 예약·견적 상담·내 예약 확인은 물론, 청소 업체는 들어온 예약과 견적까지 앱에서 관리할 수 있어요.",
};

const CUSTOMER_FEATURES = [
  { icon: "📅", title: "간편 예약", desc: `날짜만 고르면 예약금 ${formatKRW(DEPOSIT)}으로 예약 완료.` },
  { icon: "🔔", title: "실시간 상태", desc: "접수·업체 배정·청소 완료까지 진행 상황을 바로 확인." },
  { icon: "💬", title: "견적 상담", desc: "카카오톡·전화로 무료 견적 상담을 바로 연결." },
  { icon: "⭐", title: "후기 작성", desc: "청소가 끝나면 사진과 함께 후기를 남길 수 있어요." },
];

const PARTNER_FEATURES = [
  { icon: "📥", title: "들어온 예약", desc: "캘린더로 날짜별 예약을 확인하고 관리해요." },
  { icon: "🧾", title: "견적 발송", desc: "요청별로 견적을 계산해 바로 보낼 수 있어요." },
  { icon: "📣", title: "소식통·후기 답변", desc: "공지를 전하고 고객 후기에 답변해요." },
];

function StoreBadge({
  ready,
  platform,
  emoji,
}: {
  ready: boolean;
  platform: string;
  emoji: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
        ready ? "bg-brand-50 text-brand-600" : "bg-cream text-ink-soft"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ready ? "bg-brand" : "bg-mint"}`} />
      {emoji} {platform} {ready ? "이용 가능" : "출시 준비 중"}
    </span>
  );
}

export default function AppDownloadPage() {
  return (
    <div>
      {/* ── Hero ── */}
      <section className="mx-auto max-w-6xl px-5 pt-14 pb-8 sm:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-medium text-brand-600 shadow-sm ring-1 ring-brand-100">
              📱 모바일 앱
            </span>
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-ink sm:text-5xl">
              손안의 청소 예약,
              <br />
              <span className="hand-underline">손길 앱</span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-soft">
              예약부터 진행 상태 확인, 견적 상담까지 앱에서 더 편하게. 청소 업체는 들어온
              예약과 견적도 앱에서 바로 관리할 수 있어요.
            </p>

            <div className="mt-8 flex flex-col items-start gap-3">
              <a
                href={APP.apk}
                download
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-8 py-4 text-base font-bold text-white shadow-lg shadow-brand/20 transition-transform hover:scale-105 active:scale-95"
              >
                📥 안드로이드 앱 다운로드
              </a>
              <div className="flex flex-wrap gap-2">
                <StoreBadge ready={APP.androidReady} platform="안드로이드 APK" emoji="🤖" />
                <StoreBadge ready={APP.iosReady} platform="iOS" emoji="🍎" />
              </div>
            </div>
            <p className="mt-4 max-w-md text-xs leading-relaxed text-ink-soft/80">
              ⓘ APK 설치 시 “출처를 알 수 없는 앱 설치”를 허용해야 할 수 있어요. 버전 {APP.version}.
            </p>
          </div>

          {/* 앱 미리보기 (폰 목업) */}
          <div className="relative flex justify-center animate-rise [animation-delay:120ms]">
            <div className="absolute -left-4 -top-6 h-24 w-24 rounded-full bg-mint-soft blur-2xl" />
            <div className="absolute -bottom-8 -right-2 h-32 w-32 rounded-full bg-brand-100 blur-2xl" />
            <div className="relative w-[240px] rounded-[2.2rem] border-[6px] border-ink/90 bg-white p-3 shadow-xl">
              <div className="mx-auto mb-2 h-1.5 w-16 rounded-full bg-ink/15" />
              <div className="rounded-[1.4rem] bg-cream p-4">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo-mark.png" alt="" aria-hidden="true" className="h-8 w-8" />
                  <span className="text-lg font-black text-ink">손길</span>
                </div>
                <div className="mt-4 rounded-2xl border border-line bg-white p-3">
                  <p className="text-xs font-bold text-ink-soft">이번 주 예약</p>
                  <div className="mt-2 space-y-2">
                    {["입주청소 · 김서연", "가정청소 · 이도현", "원룸청소 · 강하늘"].map((t, i) => (
                      <div key={t} className="flex items-center justify-between">
                        <span className="text-xs text-ink">{t}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            i === 0
                              ? "bg-amber-50 text-amber-700"
                              : i === 1
                              ? "bg-violet-50 text-violet-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {i === 0 ? "신규" : i === 1 ? "견적발송" : "완료"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 rounded-2xl bg-brand p-3 text-center">
                  <p className="text-xs font-bold text-white/90">예약금</p>
                  <p className="text-lg font-black text-white">{formatKRW(DEPOSIT)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 고객 기능 ── */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="text-2xl font-black tracking-tight text-ink">앱에서 이런 걸 할 수 있어요</h2>
        <p className="mt-2 text-ink-soft">고객이라면 예약부터 후기까지 한 곳에서.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CUSTOMER_FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-cream text-2xl">
                {f.icon}
              </div>
              <p className="mt-4 font-bold text-ink">{f.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 업체 기능 ── */}
      <section className="mx-auto max-w-6xl px-5 pb-12">
        <div className="rounded-[2rem] border border-line bg-cream-deep/40 p-6 sm:p-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-600 ring-1 ring-brand-100">
            🧹 청소 업체(파트너)라면
          </span>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-ink">
            들어온 예약과 견적을 앱에서 관리하세요
          </h2>
          <p className="mt-2 max-w-xl text-ink-soft">
            승인된 파트너는 앱에서 자기 업체에 배정된 예약을 확인하고, 견적을 보내고, 소식과 후기
            답변까지 관리할 수 있어요.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {PARTNER_FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-cream text-2xl">
                  {f.icon}
                </div>
                <p className="mt-4 font-bold text-ink">{f.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{f.desc}</p>
              </div>
            ))}
          </div>
          <Link
            href="/partners/apply"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-bold text-cream transition-transform hover:scale-105 active:scale-95"
          >
            파트너 등록 신청하기 →
          </Link>
        </div>
      </section>

      {/* ── 설치 방법 ── */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="text-2xl font-black tracking-tight text-ink">안드로이드 설치 방법</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { n: "1", t: "APK 다운로드", d: "위 ‘안드로이드 앱 다운로드’ 버튼을 눌러 설치 파일을 내려받아요." },
            { n: "2", t: "설치 허용", d: "안내가 뜨면 ‘출처를 알 수 없는 앱 설치’를 허용해 주세요." },
            { n: "3", t: "열기", d: "설치가 끝나면 손길 앱을 열고 로그인하면 끝!" },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-brand text-sm font-black text-white">
                {s.n}
              </div>
              <p className="mt-3 font-bold text-ink">{s.t}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{s.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-start gap-3 rounded-2xl bg-cream p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-ink">지금 바로 설치해 보세요</p>
            <p className="mt-1 text-sm text-ink-soft">
              설치가 어려우시면 고객센터 {COMPANY.tel} 로 문의해 주세요.
            </p>
          </div>
          <a
            href={APP.apk}
            download
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-brand/20 transition-transform hover:scale-105 active:scale-95"
          >
            📥 앱 다운로드
          </a>
        </div>
      </section>
    </div>
  );
}
