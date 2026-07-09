import Link from "next/link";
import { PARTNERS, SERVICES, DEPOSIT, formatKRW } from "@/lib/data";
import { readApprovedPartners } from "@/lib/applicationStore";
import PartnerCard from "@/components/PartnerCard";
import LiveBookings from "@/components/LiveBookings";

// 승인 파트너 목록이 주기적으로 갱신되도록 (최대 5분 캐시)
export const revalidate = 300;

export default async function Home() {
  // 심사 승인된 신뢰 파트너 (공개 가능한 정보만)
  let approved: Awaited<ReturnType<typeof readApprovedPartners>> = [];
  try {
    approved = await readApprovedPartners();
  } catch {
    approved = [];
  }

  return (
    <div>
      {/* ── Hero ── */}
      <section className="mx-auto max-w-6xl px-5 pt-14 pb-8 sm:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-medium text-brand-600 shadow-sm ring-1 ring-brand-100">
              🧺 검증된 동네 청소 업체 중개
            </span>
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-ink sm:text-5xl">
              손으로 전하는 깨끗함,
              <br />
              <span className="hand-underline">손길</span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-soft">
              날짜만 고르면 끝. 손길이 신뢰할 수 있는 청소 업체를 연결하고,
              예약금 {formatKRW(DEPOSIT)}으로 일정을 잡아드려요.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/book"
                className="rounded-full bg-brand px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-brand/20 transition-transform hover:scale-105 active:scale-95"
              >
                지금 예약하기 →
              </Link>
              <Link
                href="/reservations"
                className="rounded-full bg-white px-7 py-3.5 text-base font-bold text-ink ring-1 ring-line transition hover:bg-cream-deep"
              >
                예약 조회
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-ink-soft">
              <Stat n="4,500+" label="누적 청소" />
              <Stat n="4.9 / 5" label="평균 만족도" />
              <Stat n="당일" label="빠른 업체 배정" />
            </div>
          </div>

          {/* Hero 카드 일러스트 */}
          <div className="relative animate-rise [animation-delay:120ms]">
            <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-mint-soft blur-2xl" />
            <div className="absolute -bottom-8 -right-4 h-32 w-32 rounded-full bg-brand-100 blur-2xl" />
            <div className="relative rounded-[2rem] border border-line bg-white/90 p-6 shadow-xl backdrop-blur">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-ink-soft">이번 주 예약 현황</p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-600">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
                  </span>
                  실시간
                </span>
              </div>
              <LiveBookings />
              <div className="mt-5 rounded-2xl bg-cream p-4">
                <p className="text-xs text-ink-soft">지금 예약하면</p>
                <p className="mt-0.5 text-lg font-black text-ink">
                  예약금 {formatKRW(DEPOSIT)}으로 확정
                </p>
                <p className="mt-1 text-xs text-ink-soft">잔금은 청소 완료 후 현장 결제</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── App download ── */}
      <section id="app" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-4">
        <div className="flex flex-col items-center gap-5 rounded-[2rem] border border-line bg-white p-6 shadow-sm sm:flex-row sm:justify-between sm:p-8">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="" aria-hidden="true" className="h-16 w-16" />
            <div>
              <p className="text-lg font-black text-ink">손길 앱으로 더 편하게</p>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-ink-soft">
                예약·견적 상담·내 예약 확인까지 앱에서 간편하게. 안드로이드에서 지금 바로
                설치할 수 있어요.
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col items-center gap-2 sm:w-auto sm:items-end">
            <a
              href="/songil-app.apk"
              download
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-brand/20 transition-transform hover:scale-105 active:scale-95 sm:w-auto"
            >
              📱 앱 다운로드 (안드로이드)
            </a>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1 text-xs font-medium text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-mint" /> Google Play 출시 준비 중
            </span>
            <Link href="/app" className="text-xs font-bold text-brand hover:text-brand-600">
              앱 자세히 보기 →
            </Link>
          </div>
        </div>
        <p className="mt-2 px-2 text-center text-xs leading-relaxed text-ink-soft/80 sm:text-left">
          ⓘ APK 설치 시 “출처를 알 수 없는 앱 설치”를 허용해야 할 수 있어요. iOS 버전은 준비
          중입니다.
        </p>
      </section>

      {/* ── Services ── */}
      <section id="services" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
        <SectionHead
          eyebrow="어떤 청소가 필요하세요?"
          title="공간에 맞는 청소를 골라보세요"
          sub="필요한 청소를 고르면, 금액은 방문·상담 후 협의로 정해요."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {SERVICES.map((s) => (
            <div
              key={s.id}
              className="group rounded-3xl border border-line bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-cream text-3xl">
                {s.emoji}
              </div>
              <h3 className="mt-4 text-xl font-black text-ink">{s.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.blurb}</p>
              <dl className="mt-5 space-y-1.5 border-t border-line pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">예상 소요</dt>
                  <dd className="font-bold text-ink">{s.duration}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">청소 금액</dt>
                  <dd className="font-bold text-brand">상담 후 협의</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>

        {/* 가격 안내 */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-line bg-cream-deep/40 px-5 py-4 text-sm leading-relaxed text-ink-soft">
          <span className="text-base">ⓘ</span>
          <p>
            <b className="text-ink">청소 금액은 방문·상담 후 협의</b>로 정해요. 평수, 오염도,
            작업 범위에 따라 달라질 수 있으며, 온라인 결제는 예약금 3만원으로 고정되고
            잔금은 청소 완료 후 현장에서 결제합니다.
          </p>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="scroll-mt-20 bg-cream-deep/40 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHead
            eyebrow="이용 방법"
            title="네 걸음이면 청소가 예약돼요"
            sub="복잡한 통화 없이, 몇 번의 클릭으로 끝나요."
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Step n={1} title="서비스 선택" desc="가정·입주·사무실 중 필요한 청소를 골라요." />
            <Step n={2} title="날짜 선택" desc="캘린더에서 원하는 방문 날짜와 시간을 정해요." />
            <Step n={3} title="정보 입력" desc="연락처와 주소, 요청사항을 남겨주세요." />
            <Step n={4} title="예약금 결제" desc={`${formatKRW(DEPOSIT)} 선결제로 예약이 확정돼요.`} />
          </div>
        </div>
      </section>

      {/* ── Service info ── */}
      <section id="service-info" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
        <SectionHead
          eyebrow="서비스 안내"
          title="손길은 청소 예약 중개 플랫폼이에요"
          sub="손길이 무엇을 하고, 결제와 역할이 어떻게 나뉘는지 알려드릴게요."
        />
        <div className="mt-8 rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
          <p className="max-w-3xl text-base leading-relaxed text-ink-soft">
            손길은 고객이 원하는{" "}
            <b className="text-ink">청소 유형 · 날짜 · 시간 · 주소 · 요청사항</b>을 입력하면,
            검증된 <b className="text-ink">청소 파트너 업체</b>를 연결해 드리는 청소 예약
            중개 플랫폼입니다.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            <InfoCard emoji="💳" title="예약 & 결제">
              온라인에서 <b className="text-ink">예약금 {formatKRW(DEPOSIT)}</b>을 결제하면
              예약이 확정돼요. 청소 완료 후 <b className="text-ink">잔금은 현장</b>에서 파트너
              업체에 직접 결제합니다.
            </InfoCard>
            <InfoCard emoji="🧹" title="청소 파트너가 하는 일">
              실제 청소 업무는 손길과 제휴한 <b className="text-ink">검증된 청소 파트너
              업체</b>가 직접 수행합니다.
            </InfoCard>
            <InfoCard emoji="🤝" title="손길이 하는 일">
              <b className="text-ink">예약 접수, 일정 조율, 파트너 배정, 고객 응대, 예약
              관리</b>를 담당해요.
            </InfoCard>
          </div>

          <p className="mt-6 rounded-xl bg-cream px-4 py-3 text-xs leading-relaxed text-ink-soft">
            ⓘ 손길은 청소 서비스의 예약을 중개하는 플랫폼으로, 실제 청소 용역은 파트너
            업체가 제공합니다. 서비스 관련 책임과 환불 등은 관련 법령 및 이용약관을
            따릅니다.
          </p>
        </div>
      </section>

      {/* ── Partners ── */}
      <section id="partners" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
        <SectionHead
          eyebrow="청소 파트너"
          title="손길이 직접 검증한 업체들"
          sub="후기와 이력을 확인하고 마음에 드는 팀을 지정할 수 있어요."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {PARTNERS.map((p) => (
            <PartnerCard key={p.id} partner={p} />
          ))}

          {/* 심사 승인된 신규 파트너 (공개 정보만) */}
          {approved.map((p) => (
            <div
              key={p.id}
              className="flex gap-4 rounded-3xl border border-line bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-100 text-xl font-black text-brand-700">
                {p.companyName.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-black text-ink">{p.companyName}</h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600 ring-1 ring-emerald-200">
                    ✓ 인증 완료
                  </span>
                </div>
                {p.intro && (
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.intro}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.services.map((sp) => (
                    <span
                      key={sp}
                      className="rounded-full bg-cream px-2.5 py-1 text-xs font-medium text-ink-soft"
                    >
                      {sp}
                    </span>
                  ))}
                  {p.regions && (
                    <span className="rounded-full bg-cream px-2.5 py-1 text-xs font-medium text-ink-soft">
                      📍 {p.regions}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="mx-auto max-w-6xl px-5 pb-4">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-brand px-8 py-14 text-center text-white shadow-xl">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -right-6 h-52 w-52 rounded-full bg-white/10" />
          <div className="relative">
            <h2 className="text-3xl font-black sm:text-4xl">
              오늘, 조금 더 가벼운 하루를 시작해요
            </h2>
            <p className="mx-auto mt-3 max-w-md text-brand-100">
              예약금 {formatKRW(DEPOSIT)}이면 충분해요. 나머지는 손길이 챙길게요.
            </p>
            <Link
              href="/book"
              className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 text-base font-black text-brand transition-transform hover:scale-105 active:scale-95"
            >
              청소 예약 시작하기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-black text-ink">{n}</p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  );
}

function InfoCard({
  emoji,
  title,
  children,
}: {
  emoji: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-cream/40 p-5">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-white text-2xl shadow-sm">
        {emoji}
      </div>
      <h3 className="mt-3 font-black text-ink">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{children}</p>
    </div>
  );
}

function SectionHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="max-w-xl">
      <p className="text-sm font-bold uppercase tracking-wide text-brand">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-black tracking-tight text-ink">{title}</h2>
      <p className="mt-2 text-ink-soft">{sub}</p>
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-base font-black text-white">
        {n}
      </span>
      <h3 className="mt-4 text-lg font-black text-ink">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{desc}</p>
    </div>
  );
}
