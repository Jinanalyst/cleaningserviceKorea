"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { getStoredRef } from "@/lib/ref";
import {
  SERVICES,
  BANKS,
  APPLICATION_STATUS_META,
  APPLICATION_FLOW,
  type ApplicationStatus,
} from "@/lib/data";

type Application = {
  id: string;
  createdAt: string;
  companyName: string;
  ownerName: string;
  bizNumber: string;
  phone: string;
  email: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  regions: string;
  services: string[];
  experience: string;
  teamSize: string;
  intro: string;
  status: ApplicationStatus;
  reviewNote: string;
};

export default function PartnerApplyPage() {
  const [companyName, setCompanyName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [bizNumber, setBizNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [regions, setRegions] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [intro, setIntro] = useState("");
  const [agree, setAgree] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Application | null>(null);

  // 로그인 사용자의 내 신청 현황
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [myApps, setMyApps] = useState<Application[]>([]);

  useEffect(() => {
    (async () => {
      const supabase = createSupabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setAuthed(false);
        return;
      }
      setAuthed(true);
      if (user.email) setEmail((prev) => prev || user.email!);
      try {
        const res = await fetch("/api/applications", { cache: "no-store" });
        const data = await res.json();
        setMyApps(data.applications ?? []);
      } catch {
        setMyApps([]);
      }
    })();
  }, []);

  function toggleService(name: string) {
    setServices((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  }

  const canSubmit =
    companyName.trim() &&
    ownerName.trim() &&
    bizNumber.replace(/\D/g, "").length === 10 &&
    phone.replace(/\D/g, "").length >= 9 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    bankName &&
    accountNumber.replace(/\D/g, "").length >= 6 &&
    accountHolder.trim() &&
    services.length > 0 &&
    agree;

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName, ownerName, bizNumber, phone, email,
          bankName, accountNumber, accountHolder, regions,
          services, experience, teamSize, intro,
          ref: getStoredRef(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "신청에 실패했어요.");
      setResult(data.application);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "신청에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── 신청 완료 화면 ──
  if (result) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-12">
        <div className="animate-rise rounded-[2rem] border border-line bg-white p-8 text-center shadow-xl">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand-50 text-4xl">
            📨
          </div>
          <h1 className="mt-5 text-2xl font-black text-ink">파트너 신청이 접수됐어요!</h1>
          <p className="mt-2 text-ink-soft">
            영업일 기준 <b className="text-ink">1~3일</b> 내에 심사 결과를 문자·이메일로
            알려드릴게요.
          </p>
        </div>
        <div className="mt-6">
          <ApplicationCard app={result} />
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/"
            className="flex-1 rounded-full bg-white px-6 py-3 text-center text-sm font-bold text-ink ring-1 ring-line transition hover:bg-cream-deep"
          >
            홈으로
          </Link>
          <button
            onClick={() => {
              setResult(null);
              setAgree(false);
            }}
            className="flex-1 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-600"
          >
            다른 업체 신청
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-ink-soft">
          신청번호 <b>{result.id}</b> 로 언제든 현황을 조회할 수 있어요.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      {/* 인트로 */}
      <div className="animate-rise">
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-medium text-brand-600 shadow-sm ring-1 ring-brand-100">
          🤝 손길 파트너 모집
        </span>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-ink sm:text-4xl">
          검증된 청소 파트너가 되어보세요
        </h1>
        <p className="mt-3 max-w-xl leading-relaxed text-ink-soft">
          손길은 마케팅·예약·결제를 대신 처리해요. 파트너님은 청소에만 집중하세요.
          아래 정보를 제출하면 서류 심사를 거쳐 마켓플레이스에 입점됩니다.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Benefit emoji="📣" title="고객 연결" desc="손길이 예약 고객을 모아 연결해요." />
          <Benefit emoji="💳" title="간편 정산" desc="예약금·결제를 대신 처리하고 정산해요." />
          <Benefit emoji="⭐" title="신뢰 배지" desc="심사 통과 시 검증 파트너로 노출돼요." />
        </div>
      </div>

      {/* 내 신청 현황 (로그인 시 자동 표시) */}
      {authed && myApps.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-black text-ink">내 신청 현황</h2>
          <div className="space-y-4">
            {myApps.map((a) => (
              <ApplicationCard key={a.id} app={a} />
            ))}
          </div>
          <p className="mt-4 text-sm text-ink-soft">
            추가로 다른 업체를 등록하려면 아래 양식을 작성해 주세요.
          </p>
        </div>
      )}
      {authed === false && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-brand-50 px-5 py-4">
          <p className="text-sm font-medium text-brand-700">
            로그인하면 신청 현황을 안전하게 확인하고, 계정에 연결돼요.
          </p>
          <Link
            href="/login?next=/partners/apply"
            className="rounded-full bg-brand px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-600"
          >
            로그인
          </Link>
        </div>
      )}

      {/* 신청 폼 */}
      <div className="mt-8 space-y-8">
        <Section title="업체 정보" icon="🏢">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="업체명" value={companyName} onChange={setCompanyName} placeholder="예: OO클린" />
            <Input label="대표자명" value={ownerName} onChange={setOwnerName} placeholder="홍길동" />
            <Input
              label="사업자등록번호"
              value={bizNumber}
              onChange={setBizNumber}
              placeholder="000-00-00000"
            />
            <Input label="서비스 가능 지역" value={regions} onChange={setRegions} placeholder="예: 서울 전역, 경기 남부" optional />
          </div>
        </Section>

        <Section title="담당자 연락처" icon="📞">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="연락처" value={phone} onChange={setPhone} placeholder="010-1234-5678" type="tel" />
            <Input label="이메일" value={email} onChange={setEmail} placeholder="partner@example.com" type="email" />
          </div>
        </Section>

        <Section title="정산 계좌" icon="🏦" hint="예약금·결제 정산에 사용돼요. 예금주는 사업자명과 일치해야 합니다.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-ink">은행</label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full rounded-xl border border-line bg-white px-4 py-3 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-100"
              >
                <option value="">은행 선택</option>
                {BANKS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <Input label="예금주" value={accountHolder} onChange={setAccountHolder} placeholder="예금주명" />
            <div className="sm:col-span-2">
              <Input label="계좌번호" value={accountNumber} onChange={setAccountNumber} placeholder="'-' 없이 숫자만 입력" />
            </div>
          </div>
        </Section>

        <Section title="전문 분야 & 소개" icon="🧹">
          <label className="mb-2 block text-sm font-bold text-ink">전문 청소 분야 (복수 선택)</label>
          <div className="flex flex-wrap gap-2">
            {SERVICES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleService(s.name)}
                className={[
                  "rounded-full border px-4 py-2 text-sm font-bold transition",
                  services.includes(s.name)
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-white text-ink-soft hover:border-brand-200",
                ].join(" ")}
              >
                {services.includes(s.name) ? "✓ " : ""}
                {s.emoji} {s.name}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input label="청소 경력" value={experience} onChange={setExperience} placeholder="예: 5년" optional />
            <Input label="인력 규모" value={teamSize} onChange={setTeamSize} placeholder="예: 6명" optional />
          </div>
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-bold text-ink">
              업체 소개 <span className="font-normal text-ink-soft">(선택)</span>
            </label>
            <textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={4}
              placeholder="강점, 보유 장비, 인증 등 심사에 도움이 될 내용을 자유롭게 적어주세요."
              className="w-full resize-none rounded-xl border border-line bg-white px-4 py-3 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </Section>

        {/* 약관 동의 */}
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-white p-4">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-brand)]"
          />
          <span className="text-sm leading-relaxed text-ink-soft">
            제출한 정보가 사실이며, <b className="text-ink">손길 파트너 이용약관</b> 및
            개인정보·사업자정보 수집·이용에 동의합니다. 허위 정보 제출 시 승인이 취소될 수 있어요.
          </span>
        </label>

        {error && (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="w-full rounded-full bg-brand py-4 text-base font-black text-white shadow-lg shadow-brand/20 transition hover:bg-brand-600 disabled:opacity-40"
        >
          {submitting ? "신청 접수 중…" : "파트너 심사 신청하기"}
        </button>
        <p className="text-center text-xs text-ink-soft">
          제출 후 서류 심사를 거쳐 승인되면 마켓플레이스에 입점됩니다.
        </p>
      </div>
    </div>
  );
}

// 신청 상태 카드 (심사 진행 트래커 포함)
function ApplicationCard({ app }: { app: Application }) {
  const meta = APPLICATION_STATUS_META[app.status];
  const isRejected = app.status === "rejected";
  const activeIdx = APPLICATION_FLOW.indexOf(app.status);

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
        <div>
          <p className="text-xs text-ink-soft">신청 번호</p>
          <p className="text-lg font-black text-ink">{app.id}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ring-1 ${meta.tone}`}
        >
          <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </div>

      <div className="px-6 py-5">
        <p className="rounded-xl bg-cream px-4 py-3 text-sm text-ink-soft">{meta.desc}</p>

        {/* 심사 진행 트래커 */}
        {!isRejected ? (
          <div className="mt-6 flex items-center">
            {APPLICATION_FLOW.map((s, i) => {
              const done = i <= activeIdx;
              return (
                <div key={s} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition ${
                        done ? "bg-brand text-white" : "bg-cream-deep text-ink-soft"
                      }`}
                    >
                      {done ? "✓" : i + 1}
                    </div>
                    <span
                      className={`mt-1.5 whitespace-nowrap text-[11px] ${done ? "font-bold text-ink" : "text-ink-soft"}`}
                    >
                      {APPLICATION_STATUS_META[s].label}
                    </span>
                  </div>
                  {i < APPLICATION_FLOW.length - 1 && (
                    <div className={`mx-1 h-0.5 flex-1 ${i < activeIdx ? "bg-brand" : "bg-cream-deep"}`} />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          app.reviewNote && (
            <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              반려 사유: {app.reviewNote}
            </p>
          )
        )}

        <dl className="mt-6 grid gap-x-6 gap-y-3 border-t border-line pt-5 sm:grid-cols-2">
          <Info k="업체명" v={app.companyName} />
          <Info k="대표자" v={app.ownerName} />
          <Info k="사업자등록번호" v={app.bizNumber} />
          <Info k="전문 분야" v={app.services.join(", ") || "-"} />
          {app.regions && <Info k="서비스 지역" v={app.regions} />}
          <Info k="정산 계좌" v={`${app.bankName} ${maskAccount(app.accountNumber)}`} />
        </dl>

        {/* 승인된 파트너는 서비스 단가를 직접 설정할 수 있어요. */}
        {app.status === "approved" && (
          <Link
            href="/partners/prices"
            className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-5 py-4 transition hover:bg-brand-100"
          >
            <span className="text-sm font-bold text-brand-700">
              🧾 서비스 단가 설정하기
            </span>
            <span className="text-sm font-bold text-brand">›</span>
          </Link>
        )}
      </div>
    </div>
  );
}

function maskAccount(acc: string) {
  const d = acc.replace(/\D/g, "");
  if (d.length <= 4) return d;
  return d.slice(0, 3) + "*".repeat(Math.max(0, d.length - 6)) + d.slice(-3);
}

function Benefit({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="text-2xl">{emoji}</div>
      <p className="mt-2 font-bold text-ink">{title}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{desc}</p>
    </div>
  );
}

function Section({
  title,
  icon,
  hint,
  children,
}: {
  title: string;
  icon: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
      <h2 className="text-lg font-black text-ink">
        <span className="mr-2">{icon}</span>
        {title}
      </h2>
      {hint && <p className="mt-1 mb-4 text-sm text-ink-soft">{hint}</p>}
      <div className={hint ? "" : "mt-4"}>{children}</div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  optional,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  optional?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-ink">
        {label} {optional && <span className="font-normal text-ink-soft">(선택)</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-line bg-white px-4 py-3 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-soft">{k}</dt>
      <dd className="mt-0.5 font-medium text-ink">{v}</dd>
    </div>
  );
}
