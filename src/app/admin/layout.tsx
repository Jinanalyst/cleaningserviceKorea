import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";

// /admin 및 하위 경로는 운영자(ADMIN_EMAILS)만 접근 가능.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  if (!isAdminEmail(user.email)) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <div className="rounded-3xl border border-line bg-white p-8 shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-3xl">
            🔒
          </div>
          <h1 className="mt-4 text-xl font-black text-ink">접근 권한이 없어요</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            운영자 전용 페이지예요. 운영자 계정으로 로그인했는지 확인해 주세요.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white"
          >
            홈으로
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
