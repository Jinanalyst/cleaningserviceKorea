"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { BANKS, formatKRW } from "@/lib/data";

type Earning = {
  id: string;
  createdAt: string;
  sourceType: "customer" | "partner";
  referredName: string;
  reservationId: string;
  quoteAmount: number;
  amount: number;
  status: "pending" | "paid";
  paidAt: string | null;
};
type Summary = {
  referredCustomers: number;
  referredPartners: number;
  pending: number;
  paid: number;
  total: number;
};
type ReferralData = {
  code: string;
  link: string;
  rate: number;
  summary: Summary;
  earnings: Earning[];
  payout: { bank: string; account: string; holder: string };
};

export default function AffiliatePage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReferralData | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createSupabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setAuthed(false);
        setLoading(false);
        return;
      }
      setAuthed(true);
      try {
        const res = await fetch("/api/referral/me", { cache: "no-store" });
        if (res.ok) setData(await res.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-medium text-brand-600 shadow-sm ring-1 ring-brand-100">
        🎁 추천·제휴 파트너
      </span>
      <h1 className="mt-4 text-3xl font-black tracking-tight text-ink">내 추천 링크로 함께 벌어요</h1>
      <p className="mt-2 leading-relaxed text-ink-soft">
        친구·이웃 <b className="text-ink">고객</b>이나 청소 <b className="text-ink">업체</b>를 소개하고,
        추천 링크로 들어온 분의 <b className="text-ink">첫 예약</b>마다 적립받으세요.
        <br />
        <b className="text-brand">30만원 계약이면 약 10,500원, 100만원이면 약 35,000원</b>이 내 적립금이에요.
      </p>

      <ReferralCalculator />

      {loading && <p className="mt-10 text-center text-ink-soft">불러오는 중…</p>}

      {!loading && authed === false && (
        <div className="mt-10 rounded-2xl border border-line bg-white p-8 text-center">
          <p className="text-4xl">🔒</p>
          <p className="mt-3 font-bold text-ink">로그인이 필요해요</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            로그인하면 나만의 추천 코드·링크가 발급돼요. (구글·카카오 로그인)
          </p>
          <Link
            href="/login?next=/affiliate"
            className="mt-5 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white"
          >
            로그인하기
          </Link>
        </div>
      )}

      {!loading && authed && data && (
        <div className="mt-8 space-y-6">
          <ReferralLinkCard code={data.code} link={data.link} />
          <SummaryTiles summary={data.summary} />
          <PayoutForm initial={data.payout} />
          <EarningsList earnings={data.earnings} />
        </div>
      )}
    </div>
  );
}

const RATE = 0.035;
const CALC_PRESETS = [300000, 500000, 1000000];

// 예상 적립금 계산기 — 비율(3.5%)이 아니라 실제 지급 금액을 보여준다.
function ReferralCalculator() {
  const [amount, setAmount] = useState(300000);
  const payout = Math.round(amount * RATE);

  return (
    <div className="mt-6 rounded-3xl border border-brand-100 bg-brand-50/50 p-6">
      <p className="text-sm font-black text-brand-700">💰 얼마를 벌 수 있나요?</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-ink-soft">청소 계약 금액</p>
          <p className="text-lg font-black text-ink">{formatKRW(amount)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-ink-soft">내 예상 적립금</p>
          <p className="text-2xl font-black text-brand">약 {formatKRW(payout)}</p>
        </div>
      </div>
      <input
        type="range"
        min={100000}
        max={2000000}
        step={50000}
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="mt-4 w-full accent-[var(--color-brand)]"
        aria-label="청소 계약 금액"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {CALC_PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setAmount(p)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              amount === p ? "bg-brand text-white" : "bg-white text-ink-soft ring-1 ring-line hover:bg-cream"
            }`}
          >
            {Math.round(p / 10000)}만원 → {formatKRW(Math.round(p * RATE))}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-ink-soft">
        추천 링크로 들어온 분의 <b className="text-ink">첫 예약</b> 1회, 견적의{" "}
        {(RATE * 100).toFixed(1)}%가 적립돼요. 금액이 클수록 적립금도 커집니다.
      </p>
    </div>
  );
}

function ReferralLinkCard({ code, link }: { code: string; link: string }) {
  const [copied, setCopied] = useState<"" | "link" | "code">("");

  async function copy(text: string, which: "link" | "code") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(""), 1600);
    } catch {
      /* 클립보드 미지원 브라우저: 사용자가 직접 선택 복사 */
    }
  }

  return (
    <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
      <p className="text-xs font-bold text-ink-soft">내 추천 코드</p>
      <div className="mt-1 flex items-center gap-3">
        <span className="text-2xl font-black tracking-widest text-brand">{code}</span>
        <button
          onClick={() => copy(code, "code")}
          className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-ink ring-1 ring-line transition hover:bg-cream-deep"
        >
          {copied === "code" ? "복사됨 ✓" : "코드 복사"}
        </button>
      </div>

      <p className="mt-5 text-xs font-bold text-ink-soft">추천 링크</p>
      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 select-all rounded-xl border border-line bg-cream/40 px-4 py-2.5 text-sm text-ink outline-none"
        />
        <button
          onClick={() => copy(link, "link")}
          className="shrink-0 rounded-xl bg-brand px-5 py-2.5 text-sm font-black text-white transition hover:bg-brand-600"
        >
          {copied === "link" ? "복사됨 ✓" : "링크 복사"}
        </button>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-ink-soft">
        이 링크로 접속한 분이 회원가입·예약하거나, 업체가 파트너로 등록하면 추천이 연결돼요.
        추천 대상당 <b className="text-ink">첫 예약 1회</b> 적립됩니다.
      </p>
    </div>
  );
}

function SummaryTiles({ summary }: { summary: Summary }) {
  const tiles = [
    { label: "추천 고객", value: `${summary.referredCustomers}명`, tone: "text-sky-600" },
    { label: "추천 업체", value: `${summary.referredPartners}곳`, tone: "text-violet-600" },
    { label: "지급 대기", value: formatKRW(summary.pending), tone: "text-brand" },
    { label: "지급 완료", value: formatKRW(summary.paid), tone: "text-emerald-600" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-2xl border border-line bg-white p-4 text-center">
          <p className={`text-lg font-black ${t.tone}`}>{t.value}</p>
          <p className="mt-0.5 text-xs text-ink-soft">{t.label}</p>
        </div>
      ))}
    </div>
  );
}

function PayoutForm({ initial }: { initial: { bank: string; account: string; holder: string } }) {
  const [bank, setBank] = useState(initial.bank);
  const [account, setAccount] = useState(initial.account);
  const [holder, setHolder] = useState(initial.holder);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const canSave = bank && account.replace(/\D/g, "").length >= 6 && holder.trim();

  async function save() {
    setMsg(null);
    setSaving(true);
    try {
      const res = await fetch("/api/referral/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bank, account, holder }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "저장에 실패했어요.");
      setMsg("✓ 정산 계좌가 저장됐어요.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
      <h2 className="text-base font-black text-ink">💳 정산 계좌</h2>
      <p className="mt-1 text-sm text-ink-soft">
        적립금을 지급받을 계좌예요. 예금주는 본인 명의로 입력해 주세요.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <select
          value={bank}
          onChange={(e) => setBank(e.target.value)}
          className="w-full rounded-xl border border-line bg-white px-4 py-3 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-100"
        >
          <option value="">은행 선택</option>
          {BANKS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <input
          value={holder}
          onChange={(e) => setHolder(e.target.value)}
          placeholder="예금주"
          className="w-full rounded-xl border border-line bg-white px-4 py-3 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-100"
        />
        <input
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          placeholder="계좌번호 ('-' 없이 숫자만)"
          inputMode="numeric"
          className="w-full rounded-xl border border-line bg-white px-4 py-3 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-100 sm:col-span-2"
        />
      </div>
      {msg && <p className="mt-3 text-sm font-medium text-ink-soft">{msg}</p>}
      <button
        onClick={save}
        disabled={!canSave || saving}
        className="mt-4 w-full rounded-full bg-brand py-3 text-sm font-black text-white transition hover:bg-brand-600 disabled:opacity-40"
      >
        {saving ? "저장 중…" : "정산 계좌 저장"}
      </button>
    </div>
  );
}

function EarningsList({ earnings }: { earnings: Earning[] }) {
  return (
    <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
      <h2 className="text-base font-black text-ink">적립 내역</h2>
      {earnings.length === 0 ? (
        <p className="mt-4 rounded-xl bg-cream px-4 py-6 text-center text-sm text-ink-soft">
          아직 적립 내역이 없어요. 위 링크를 공유해 첫 추천을 만들어보세요!
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {earnings.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">
                  {e.sourceType === "customer" ? "🙋 고객" : "🧹 업체"} · {e.referredName || "익명"}
                </p>
                <p className="text-xs text-ink-soft">
                  {e.reservationId} · 견적 {formatKRW(e.quoteAmount)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-black text-brand">{formatKRW(e.amount)}</p>
                <span
                  className={`text-xs font-bold ${
                    e.status === "paid" ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {e.status === "paid" ? "지급 완료" : "지급 대기"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
