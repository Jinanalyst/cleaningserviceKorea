import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COMPANY, PARTNERS, partnerById } from "@/lib/data";
import { getPartnerReviews } from "@/lib/partnerReviews";
import { Stars, VerifyBadges, WorkPhoto } from "@/components/PartnerBits";
import PartnerReviews from "@/components/PartnerReviews";

// 새 후기가 반영되도록 최대 60초 캐시 (초기 렌더용, 이후 클라이언트가 라이브로 갱신)
export const revalidate = 60;

// 알려진 파트너는 정적 생성
export function generateStaticParams() {
  return PARTNERS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const partner = partnerById(id);
  if (!partner) return { title: "파트너를 찾을 수 없어요 — 손길" };
  return {
    title: `${partner.name} — 손길 청소 파트너`,
    description: `${partner.tagline} · 평점 ${partner.rating} · 후기 ${partner.reviews}개`,
  };
}

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const partner = partnerById(id);
  if (!partner) notFound();

  const reviews = await getPartnerReviews(partner.id);
  const telHref = `tel:${COMPANY.tel.replace(/[^0-9]/g, "")}`;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:py-12">
      <nav className="mb-6 text-sm text-ink-soft">
        <Link href="/" className="hover:text-brand">
          홈
        </Link>{" "}
        <span className="text-ink-soft/50">/</span>{" "}
        <Link href="/#partners" className="hover:text-brand">
          청소 파트너
        </Link>{" "}
        <span className="text-ink-soft/50">/</span>{" "}
        <span className="text-ink">{partner.name}</span>
      </nav>

      {/* 헤더 */}
      <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start gap-4">
          <div
            className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-2xl font-black ${partner.accent}`}
          >
            {partner.name.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black tracking-tight text-ink">
              {partner.name}
            </h1>
            <p className="mt-1 text-sm font-medium text-brand-600">
              {partner.tagline}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
              <span className="font-bold text-amber-500">
                <Stars rating={partner.rating} /> {partner.rating}
              </span>
              <span>후기 {partner.reviews}개</span>
              <span>· 누적 {partner.jobs.toLocaleString("ko-KR")}건</span>
              <span>· {partner.since}년부터 활동</span>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <VerifyBadges items={partner.verifications} />
        </div>

        <p className="mt-5 text-sm leading-relaxed text-ink-soft">{partner.intro}</p>
      </div>

      {/* 대표 작업 사진 */}
      <section className="mt-8">
        <h2 className="text-lg font-black text-ink">대표 작업 사진</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {partner.photos.map((label, i) => (
            <WorkPhoto key={label} label={label} index={i} />
          ))}
        </div>
      </section>

      {/* 활동 지역 & 가능한 서비스 */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-base font-black text-ink">활동 지역</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {partner.regions.map((r) => (
              <span
                key={r}
                className="rounded-full bg-cream px-2.5 py-1 text-xs font-medium text-ink-soft ring-1 ring-line"
              >
                📍 {r}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-base font-black text-ink">가능한 서비스</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {partner.specialties.map((sp) => (
              <span
                key={sp}
                className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700"
              >
                {sp}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 후기 — 스크롤 가능 + 라이브 갱신 */}
      <PartnerReviews partnerId={partner.id} initialReviews={reviews} />

      {/* 안내 */}
      <p className="mt-8 rounded-xl bg-cream px-4 py-3 text-xs leading-relaxed text-ink-soft">
        ⓘ 실제 청소는 검증된 제휴 파트너가 수행하며, 손길은 예약 접수·일정 조율·파트너
        배정·고객 응대를 담당합니다. 최종 배정 파트너는 예약 서비스·지역·일정에 따라 달라질
        수 있습니다.
      </p>

      {/* 액션 버튼 */}
      <div className="sticky bottom-4 mt-6 flex gap-3">
        <Link
          href={`/book?partner=${partner.id}`}
          className="flex-[2] rounded-full bg-brand py-3.5 text-center text-base font-black text-white shadow-lg shadow-brand/20 transition hover:bg-brand-600"
        >
          이 파트너로 예약하기
        </Link>
        <a
          href={telHref}
          className="flex-1 rounded-full bg-white py-3.5 text-center text-base font-bold text-brand ring-1 ring-brand-200 transition hover:bg-brand-50"
        >
          상담 요청
        </a>
      </div>
    </div>
  );
}
