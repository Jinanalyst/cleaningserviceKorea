import Link from "next/link";
import type { Partner } from "@/lib/data";
import { COMPANY } from "@/lib/data";
import { VerifyBadges, WorkPhoto } from "@/components/PartnerBits";

export default function PartnerCard({ partner }: { partner: Partner }) {
  const telHref = `tel:${COMPANY.tel.replace(/[^0-9]/g, "")}`;

  return (
    <div className="group relative flex flex-col rounded-3xl border border-line bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {/* 카드 전체 클릭 → 상세 페이지 (stretched link) */}
      <Link
        href={`/partners/${partner.id}`}
        className="absolute inset-0 z-0 rounded-3xl"
        aria-label={`${partner.name} 업체 보기`}
      />

      {/* 헤더 */}
      <div className="flex gap-4">
        <div
          className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-xl font-black ${partner.accent}`}
        >
          {partner.name.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-ink">{partner.name}</h3>
            <span className="text-sm font-bold text-amber-500">
              ★ {partner.rating}
            </span>
            <span className="text-xs text-ink-soft">후기 {partner.reviews}개</span>
          </div>
          <p className="mt-0.5 text-sm font-medium text-brand-600">
            {partner.tagline}
          </p>
        </div>
      </div>

      {/* 검증 배지 */}
      <div className="mt-4">
        <VerifyBadges items={partner.verifications} />
      </div>

      {/* 대표 작업 사진 (미리보기) */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {partner.photos.slice(0, 3).map((label, i) => (
          <WorkPhoto key={label} label={label} index={i} />
        ))}
      </div>

      {/* 활동 지역 */}
      <div className="mt-4 text-sm">
        <p className="font-bold text-ink">활동 지역</p>
        <p className="mt-0.5 text-ink-soft">{partner.regions.join(", ")}</p>
      </div>

      {/* 가능한 서비스 */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {partner.specialties.map((sp) => (
          <span
            key={sp}
            className="rounded-full bg-cream px-2.5 py-1 text-xs font-medium text-ink-soft"
          >
            {sp}
          </span>
        ))}
      </div>

      {/* 액션 버튼 (stretched link 위로 올림) */}
      <div className="relative z-10 mt-5 flex gap-2">
        <Link
          href={`/partners/${partner.id}`}
          className="flex-1 rounded-full bg-ink py-2.5 text-center text-sm font-bold text-cream transition hover:opacity-90"
        >
          업체 보기
        </Link>
        <a
          href={telHref}
          className="flex-1 rounded-full bg-white py-2.5 text-center text-sm font-bold text-brand ring-1 ring-brand-200 transition hover:bg-brand-50"
        >
          상담 요청
        </a>
      </div>
    </div>
  );
}
