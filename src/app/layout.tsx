import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import Link from "next/link";
import AuthButtons from "@/components/AuthButtons";
import "./globals.css";

const noto = Noto_Sans_KR({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "손길 — 믿을 수 있는 청소, 사람이 이어드려요",
  description:
    "검증된 청소 업체를 연결해 드리는 청소 중개 플랫폼. 날짜만 고르면 예약금 3만원으로 예약 완료.",
};

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-mark.svg"
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
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-3">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm font-bold text-mint">마음을 담은 깨끗함</p>
          <p className="max-w-xs text-sm leading-relaxed text-ink-soft">
            검증된 동네 청소 업체를 연결해 드리는 청소 중개 플랫폼이에요.
            사람의 손길이 닿는 깨끗함을 이어드릴게요.
          </p>
        </div>
        <div className="text-sm text-ink-soft">
          <p className="mb-3 font-bold text-ink">바로가기</p>
          <ul className="space-y-2">
            <li>
              <Link href="/book" className="hover:text-brand">청소 예약하기</Link>
            </li>
            <li>
              <Link href="/reservations" className="hover:text-brand">내 예약 조회</Link>
            </li>
            <li>
              <Link href="/partners/apply" className="hover:text-brand">파트너 등록하기</Link>
            </li>
            <li>
              <Link href="/admin" className="hover:text-brand">파트너·운영 대시보드</Link>
            </li>
          </ul>
        </div>
        <div className="text-sm text-ink-soft">
          <p className="mb-3 font-bold text-ink">고객센터</p>
          <p>평일 09:00 – 18:00</p>
          <p className="mt-1 text-lg font-black text-ink">1668-0000</p>
          <p className="mt-4 text-xs leading-relaxed text-ink-soft/80">
            상호 체인랩스 · 대표 장진우
            <br />
            사업자등록번호 382-25-02223
          </p>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-ink-soft/70">
        © 2026 손길 (Songil). 청소는 파트너 업체가 수행하며, 손길은 예약을 중개합니다.
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
