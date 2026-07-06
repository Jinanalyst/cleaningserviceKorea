import { COMPANY } from "@/lib/data";

// 카카오톡 상담 채널 (http://pf.kakao.com/_BTrPX/chat) 로 바로 연결하는 요소들.
// 견적 상담 페이지·예약 흐름 등 여러 곳에서 재사용한다.

function KakaoIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.86 1.86 5.37 4.68 6.79-.15.53-.68 2.44-.78 2.84-.12.5.18.5.39.36.16-.1 2.53-1.72 3.56-2.42.7.1 1.42.16 2.15.16 5.52 0 10-3.58 10-8S17.52 3 12 3z" />
    </svg>
  );
}

export function KakaoConsultButton({
  className,
  label = "카카오톡 상담",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <a
      href={COMPANY.kakao}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        "inline-flex items-center justify-center gap-2 rounded-full bg-[#FEE500] px-5 py-2.5 text-sm font-bold text-[#3C1E1E] transition hover:brightness-95"
      }
    >
      <KakaoIcon />
      {label}
    </a>
  );
}

export default function KakaoConsultCard({
  title = "카카오톡으로 바로 상담",
  desc = "궁금한 점이 있으면 채팅으로 편하게 물어보세요. 상담은 무료예요.",
}: {
  title?: string;
  desc?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-cream/60 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-bold text-ink">💬 {title}</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">{desc}</p>
      </div>
      <KakaoConsultButton className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#FEE500] px-5 py-2.5 text-sm font-bold text-[#3C1E1E] transition hover:brightness-95" />
    </div>
  );
}
