import Link from "next/link";
import { PARTNERS, SERVICES, DEPOSIT, formatKRW, reviewsFor } from "@/lib/data";
import { readApprovedPartners } from "@/lib/applicationStore";
import PartnerCard from "@/components/PartnerCard";

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
              집안일은 잠시 내려두세요.
              <br />
              <span className="hand-underline">사람의 손길</span>이
              <br className="sm:hidden" /> 대신 채울게요.
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
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-600">
                  실시간
                </span>
              </div>
              <div className="mt-4 space-y-3">
                <MiniBooking emoji="🏠" title="가정 정기청소" who="반짝살림" time="수 13:00" />
                <MiniBooking emoji="📦" title="입주청소" who="깔끔한하루" time="금 09:00" />
                <MiniBooking emoji="🔑" title="원룸 퇴거청소" who="손끝청소" time="토 11:00" />
              </div>
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

      {/* ── Services ── */}
      <section id="services" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
        <SectionHead
          eyebrow="어떤 청소가 필요하세요?"
          title="공간에 맞는 청소를 골라보세요"
          sub="평수를 입력하면 예상 견적을 바로 알려드려요."
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
                  <dt className="text-ink-soft">시작 가격</dt>
                  <dd className="font-bold text-brand">{formatKRW(s.minPrice)}~</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>

        {/* 가격 안내 */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-line bg-cream-deep/40 px-5 py-4 text-sm leading-relaxed text-ink-soft">
          <span className="text-base">ⓘ</span>
          <p>
            표시된 <b className="text-ink">시작 가격은 1인 작업 기준</b>이에요. 평수, 오염도,
            작업 범위에 따라 추가 인력 또는 추가 시간이 발생할 수 있으며, 최종 금액은
            방문·상담 후 확정됩니다.
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

      {/* ── Partners ── */}
      <section id="partners" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
        <SectionHead
          eyebrow="청소 파트너"
          title="손길이 직접 검증한 업체들"
          sub="후기와 이력을 확인하고 마음에 드는 팀을 지정할 수 있어요."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {PARTNERS.map((p) => (
            <PartnerCard key={p.id} partner={p} reviews={reviewsFor(p.id)} />
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

function MiniBooking({
  emoji,
  title,
  who,
  time,
}: {
  emoji: string;
  title: string;
  who: string;
  time: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line px-3 py-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-cream text-lg">
        {emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-ink">{title}</p>
        <p className="text-xs text-ink-soft">{who}</p>
      </div>
      <span className="rounded-lg bg-brand-50 px-2 py-1 text-xs font-bold text-brand-600">
        {time}
      </span>
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
