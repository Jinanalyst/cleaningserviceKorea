"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function AuthButtons() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    setUser(null);
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  // 초기 로딩 중엔 자리만 확보 (레이아웃 흔들림 방지)
  if (!ready) return <span className="w-14" />;

  if (!user) {
    return (
      <Link
        href="/login"
        className="text-sm font-bold text-ink-soft transition-colors hover:text-ink"
      >
        로그인
      </Link>
    );
  }

  const name =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    user.email?.split("@")[0] ||
    "회원";
  const initial = name.slice(0, 1).toUpperCase();
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-brand text-sm font-black text-white ring-1 ring-brand-200"
        aria-label="내 계정"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
            <div className="border-b border-line px-4 py-3">
              <p className="truncate text-sm font-bold text-ink">{name}</p>
              <p className="truncate text-xs text-ink-soft">{user.email}</p>
            </div>
            <div className="p-1.5 text-sm">
              <MenuLink href="/reservations" onClick={() => setOpen(false)}>
                내 예약 조회
              </MenuLink>
              <MenuLink href="/onboarding" onClick={() => setOpen(false)}>
                이용 유형 설정
              </MenuLink>
              <MenuLink href="/partners/apply" onClick={() => setOpen(false)}>
                파트너 등록·현황
              </MenuLink>
              <button
                onClick={signOut}
                className="mt-1 block w-full rounded-xl px-3 py-2 text-left font-medium text-rose-600 transition hover:bg-rose-50"
              >
                로그아웃
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MenuLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block rounded-xl px-3 py-2 font-medium text-ink transition hover:bg-cream-deep"
    >
      {children}
    </Link>
  );
}
