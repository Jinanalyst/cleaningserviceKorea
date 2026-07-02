import Link from "next/link";
import { COMPANY } from "@/lib/data";

// 정책·안내 문서 페이지 공통 레이아웃 (읽기 편한 문서형 카드).
export default function PolicyLayout({
  title,
  intro,
  updatedAt = "2026-07-02",
  children,
}: {
  title: string;
  intro?: string;
  updatedAt?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <nav className="mb-6 text-sm text-ink-soft">
        <Link href="/" className="hover:text-brand">
          홈
        </Link>{" "}
        <span className="text-ink-soft/50">/</span> <span className="text-ink">{title}</span>
      </nav>

      <h1 className="text-3xl font-black tracking-tight text-ink">{title}</h1>
      {intro && (
        <p className="mt-3 text-base leading-relaxed text-ink-soft">{intro}</p>
      )}

      <div className="mt-8 space-y-6 rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
        {children}
      </div>

      <div className="mt-6 rounded-2xl bg-cream-deep/50 px-5 py-4 text-xs leading-relaxed text-ink-soft">
        <p>
          {COMPANY.bizName} · 서비스명 {COMPANY.service} · 대표 {COMPANY.ceo} · 사업자등록번호{" "}
          {COMPANY.bizNumber}
        </p>
        <p className="mt-1">
          고객센터 {COMPANY.tel} · 이메일 {COMPANY.email} · 운영시간 {COMPANY.hours}
        </p>
        <p className="mt-1">최종 개정일 {updatedAt}</p>
      </div>
    </div>
  );
}

// 문서 내 하나의 절(제목 + 본문).
export function PolicySection({
  heading,
  children,
}: {
  heading?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      {heading && (
        <h2 className="text-lg font-black text-ink">{heading}</h2>
      )}
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-ink-soft">
        {children}
      </div>
    </section>
  );
}

// 강조 안내 박스 (결제 고정 안내 등).
export function CalloutBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50 px-5 py-4 text-sm font-medium leading-relaxed text-brand-700">
      {children}
    </div>
  );
}
