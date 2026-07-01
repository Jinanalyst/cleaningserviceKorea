"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

type Role = "customer" | "business";

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?next=/onboarding");
        return;
      }
      setUser(user);
      // 이미 온보딩을 마쳤으면 역할에 맞게 이동
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, onboarded")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.onboarded) {
        router.replace(profile.role === "business" ? "/partners/apply" : "/");
        return;
      }
      setChecking(false);
    })();
  }, [router]);

  async function choose(role: Role) {
    if (!user) return;
    setSaving(role);
    setError(null);
    try {
      const supabase = createSupabaseBrowser();
      const name =
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        "";
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        role,
        name,
        email: user.email,
        onboarded: true,
      });
      if (error) throw error;
      router.replace(role === "business" ? "/partners/apply" : "/");
    } catch {
      setError("저장에 실패했어요. 잠시 후 다시 시도해 주세요.");
      setSaving(null);
    }
  }

  if (checking) {
    return <p className="py-24 text-center text-ink-soft">불러오는 중…</p>;
  }

  const greeting =
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.name as string) ||
    user?.email?.split("@")[0] ||
    "회원";

  return (
    <div className="mx-auto max-w-2xl px-5 py-14">
      <div className="animate-rise text-center">
        <p className="text-sm font-bold text-brand">환영해요 👋</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-ink">
          {greeting}님, 어떻게 이용하실 건가요?
        </h1>
        <p className="mt-2 text-ink-soft">선택에 따라 딱 맞는 화면으로 안내해 드릴게요.</p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <RoleCard
          emoji="🧑‍💼"
          title="고객으로 시작"
          desc="청소를 예약하고 진행 상태를 확인해요."
          bullets={["원하는 날짜에 청소 예약", "예약금 간편 결제", "예약 현황 조회"]}
          cta="고객으로 시작하기"
          loading={saving === "customer"}
          disabled={saving !== null}
          onClick={() => choose("customer")}
        />
        <RoleCard
          emoji="🧹"
          title="청소 업체로 등록"
          desc="파트너 계정을 만들고 마켓플레이스에 입점해요."
          bullets={["업체 정보·정산 계좌 등록", "서류 심사 후 승인", "고객 예약 연결"]}
          cta="업체로 등록하기"
          highlight
          loading={saving === "business"}
          disabled={saving !== null}
          onClick={() => choose("business")}
        />
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-center text-sm font-medium text-rose-600">
          {error}
        </p>
      )}
      <p className="mt-6 text-center text-xs text-ink-soft">
        나중에 언제든 다른 유형으로도 이용할 수 있어요.
      </p>
    </div>
  );
}

function RoleCard({
  emoji,
  title,
  desc,
  bullets,
  cta,
  onClick,
  loading,
  disabled,
  highlight,
}: {
  emoji: string;
  title: string;
  desc: string;
  bullets: string[];
  cta: string;
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "flex flex-col rounded-3xl border bg-white p-6 shadow-sm transition",
        highlight ? "border-brand-200 ring-1 ring-brand-100" : "border-line",
      ].join(" ")}
    >
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-cream text-3xl">
        {emoji}
      </div>
      <h2 className="mt-4 text-xl font-black text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink-soft">{desc}</p>
      <ul className="mt-4 flex-1 space-y-2 text-sm text-ink-soft">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <span className="text-brand">✓</span>
            {b}
          </li>
        ))}
      </ul>
      <button
        onClick={onClick}
        disabled={disabled}
        className={[
          "mt-6 rounded-full py-3 text-sm font-bold transition disabled:opacity-50",
          highlight
            ? "bg-brand text-white hover:bg-brand-600"
            : "bg-ink text-cream hover:opacity-90",
        ].join(" ")}
      >
        {loading ? "저장 중…" : cta}
      </button>
    </div>
  );
}
