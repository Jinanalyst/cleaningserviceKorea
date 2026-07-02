// 파트너 카드·상세에서 공용으로 쓰는 작은 UI 조각들.

// 검증 배지 (사업자 확인 / 신원 확인 / 리뷰 확인)
export function VerifyBadges({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((b) => (
        <span
          key={b}
          className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 ring-1 ring-emerald-200"
        >
          ✓ {b}
        </span>
      ))}
    </div>
  );
}

// 별점 표시
export function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="text-amber-500" aria-label={`별점 ${rating}점`}>
      {"★".repeat(full)}
      <span className="text-line">{"★".repeat(Math.max(0, 5 - full))}</span>
    </span>
  );
}

// 대표 작업 사진 (실제 이미지 자산이 없어 라벨형 플레이스홀더로 표현)
const PHOTO_TONES = [
  "from-brand-100 to-brand-50 text-brand-700",
  "from-mint-soft to-cream text-mint",
  "from-amber-100 to-amber-50 text-amber-700",
  "from-rose-100 to-rose-50 text-rose-600",
];

export function WorkPhoto({
  label,
  index,
  className = "",
}: {
  label: string;
  index: number;
  className?: string;
}) {
  const tone = PHOTO_TONES[index % PHOTO_TONES.length];
  return (
    <div
      className={`relative flex aspect-[4/3] items-end overflow-hidden rounded-2xl bg-gradient-to-br ${tone} ${className}`}
    >
      <span className="pointer-events-none absolute right-3 top-3 text-3xl opacity-40">
        📷
      </span>
      <span className="w-full bg-white/70 px-3 py-2 text-xs font-bold backdrop-blur-sm">
        {label}
      </span>
    </div>
  );
}
