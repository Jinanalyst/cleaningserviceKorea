import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import Link from "next/link";
import AuthButtons from "@/components/AuthButtons";
import { COMPANY, SITE_URL } from "@/lib/data";
import "./globals.css";

const noto = Noto_Sans_KR({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

const DESCRIPTION =
  "검증된 청소 업체를 연결해 드리는 청소 중개 플랫폼. 날짜만 고르면 예약금(견적의 7%)으로 예약 완료.";

// metadataBase 를 지정하면 canonical·OG·트위터 카드의 상대경로가 대표 도메인
// (SITE_URL, 기본 https://handway.net) 기준 절대 URL 로 자동 변환된다.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "손길 — 믿을 수 있는 청소, 사람이 이어드려요",
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "손길",
    url: "/",
    title: "손길 — 믿을 수 있는 청소, 사람이 이어드려요",
    description: DESCRIPTION,
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "손길 — 믿을 수 있는 청소, 사람이 이어드려요",
    description: DESCRIPTION,
  },
};

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-mark.png"
        alt=""
        aria-hidden="true"
        className="h-9 w-9 transition-transform group-hover:-rotate-6"
      />
      <span className="text-xl font-black tracking-tight text-ink">손길</span>
    </Link>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-medium text-ink-soft sm:flex">
          <Link href="/#services" className="hover:text-ink transition-colors">
            서비스
          </Link>
          <Link href="/#partners" className="hover:text-ink transition-colors">
            청소 파트너
          </Link>
          <Link href="/#how" className="hover:text-ink transition-colors">
            이용 방법
          </Link>
          <Link href="/#service-info" className="hover:text-ink transition-colors">
            서비스 안내
          </Link>
          <Link href="/app" className="hover:text-ink transition-colors">
            앱 다운로드
          </Link>
          <Link href="/consult" className="hover:text-ink transition-colors">
            견적 상담
          </Link>
          <Link href="/reservations" className="hover:text-ink transition-colors">
            예약 조회
          </Link>
          <Link href="/partners/apply" className="font-bold text-brand hover:text-brand-600 transition-colors">
            파트너 등록
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <AuthButtons />
          <Link
            href="/book"
            className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream transition-transform hover:scale-105 active:scale-95 sm:px-5"
          >
            예약하기
          </Link>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-cream-deep/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* 브랜드 */}
        <div className="space-y-3">
          <Logo />
          <p className="text-sm font-bold text-mint">마음을 담은 깨끗함</p>
          <p className="max-w-xs text-sm leading-relaxed text-ink-soft">
            검증된 청소 파트너를 연결해 드리는 청소 예약 중개 플랫폼이에요.
            온라인 결제는 예약금(견적의 7%), 잔금은 청소 완료 후 현장에서 결제합니다.
          </p>
        </div>

        {/* 바로가기 */}
        <div className="text-sm text-ink-soft">
          <p className="mb-3 font-bold text-ink">바로가기</p>
          <ul className="space-y-2">
            <li>
              <Link href="/book" className="hover:text-brand">청소 예약하기</Link>
            </li>
            <li>
              <Link href="/consult" className="hover:text-brand">견적 상담 신청</Link>
            </li>
            <li>
              <Link href="/reservations" className="hover:text-brand">내 예약 조회</Link>
            </li>
            <li>
              <Link href="/partners/apply" className="hover:text-brand">파트너 등록하기</Link>
            </li>
            <li>
              <Link href="/app" className="hover:text-brand">모바일 앱 다운로드</Link>
            </li>
          </ul>
        </div>

        {/* 이용안내·약관 */}
        <div className="text-sm text-ink-soft">
          <p className="mb-3 font-bold text-ink">이용안내</p>
          <ul className="space-y-2">
            <li>
              <Link href="/service-info" className="hover:text-brand">서비스 상세정보</Link>
            </li>
            <li>
              <Link href="/payment-info" className="hover:text-brand">결제금액 안내</Link>
            </li>
            <li>
              <Link href="/refund-policy" className="hover:text-brand">환불정책</Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-brand">이용약관</Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-brand">개인정보처리방침</Link>
            </li>
            <li>
              <Link href="/account-deletion" className="hover:text-brand">계정·데이터 삭제</Link>
            </li>
          </ul>
        </div>

        {/* 고객센터·사업자 정보 */}
        <div className="text-sm text-ink-soft">
          <p className="mb-3 font-bold text-ink">고객센터</p>
          <p className="text-lg font-black text-ink">{COMPANY.tel}</p>
          <p className="mt-0.5">운영시간 {COMPANY.hours}</p>
          <p className="mt-1">
            이메일{" "}
            <a href={`mailto:${COMPANY.email}`} className="hover:text-brand">
              {COMPANY.email}
            </a>
          </p>
          <div className="mt-4 space-y-0.5 text-xs leading-relaxed text-ink-soft/80">
            <p>상호 {COMPANY.bizName} · 서비스명 {COMPANY.service}</p>
            <p>대표자 {COMPANY.ceo}</p>
            <p>사업자등록번호 {COMPANY.bizNumber}</p>
            <p>통신판매업 신고번호 {COMPANY.mailOrderNumber}</p>
            <p>{COMPANY.address}</p>
            <p>{COMPANY.domain}</p>
          </div>
        </div>
      </div>

      {/* 중개 플랫폼 안내 */}
      <div className="mx-auto max-w-6xl px-5 pb-8">
        <p className="rounded-xl bg-white/60 px-4 py-3 text-xs leading-relaxed text-ink-soft ring-1 ring-line">
          손길은 고객과 청소 파트너를 연결하는 청소 예약 중개 플랫폼입니다. 청소 서비스는
          제휴 청소 파트너가 수행하며, 손길은 예약 접수, 일정 조율, 파트너 배정, 고객 응대 및
          예약 관리를 제공합니다.
        </p>
      </div>

      <div className="border-t border-line py-5 text-center text-xs text-ink-soft/70">
        © 2026 {COMPANY.service} · {COMPANY.bizName}. 청소는 제휴 파트너가 수행하며, 손길은
        예약을 중개합니다.
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${noto.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
