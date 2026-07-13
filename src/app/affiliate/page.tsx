"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { BANKS, formatKRW } from "@/lib/data";
import {
  COMMISSION_STATUS_LABEL,
  type CommissionStatus,
  type ReferredType,
} from "@/lib/commission";

type Commission = {
  id: string;
  createdAt: string;
  referredType: ReferredType;
  referredName: string;
  reservationId: string;
  sequenceNo: number;
  isFirst: boolean;
  baseAmount: number;
  rate: number;
  amount: number;
  status: CommissionStatus;
  paidAt: string | null;
};
type Relation = {
  id: string;
  createdAt: string;
  referredType: ReferredType;
  referredName: string;
  status: "active" | "suspended" | "ended";
  firstCompletedAt: string | null;
  completedCount: number;
  grossAmount: number;
  totalCommission: number;
};
type Summary = {
  thisMonthEstimate: number;
  available: number;
  total: number;
  paid: number;
  referredCustomers: number;
  referredProviders: number;
  thisMonthCompleted: number;
};
type ReferralData = {
  code: string;
  link: string;
  settings: { firstRate: number; repeatRate: number; minPayout: number };
  summary: Summary;
  relations: Relation[];
  commissions: Commission[];
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

  const first = data?.settings.firstRate ?? 0.035;
  const repeat = data?.settings.repeatRate ?? 0.02;

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-medium text-brand-600 shadow-sm ring-1 ring-brand-100">
        🎁 추천·제휴 파트너
      </span>
      <h1 className="mt-4 text-3xl font-black tracking-tight text-ink">
        한 번 연결하고, 예약이 이어질수록 계속 적립받으세요
      </h1>
      <p className="mt-2 leading-relaxed text-ink-soft">
        친구·이웃 <b className="text-ink">고객</b>이나 청소 <b className="text-ink">업체</b>를 한 번 연결하면,
        해당 추천 대상의 <b className="text-ink">정상 완료 거래가 이어질 때마다</b> 수익이 적립돼요.
      </p>

      <RecurringHighlight first={first} repeat={repeat} />
      <ReferralCalculator first={first} repeat={repeat} />

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
          <SummaryTiles summary={data.summary} minPayout={data.settings.minPayout} />
          <RelationsList relations={data.relations} />
          <CommissionsList commissions={data.commissions} />
          <PayoutForm initial={data.payout} />
          <CautionNote />
        </div>
      )}
    </div>
  );
}

const CALC_PRESETS = [300000, 500000, 1000000];

function pct(r: number): string {
  return `${(r * 100).toFixed(r * 100 % 1 === 0 ? 0 : 1)}%`;
}

// 리커링 수익 구조 안내 — 눈에 띄게.
function RecurringHighlight({ first, repeat }: { first: number; repeat: number }) {
  return (
    <div className="mt-6 rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 to-cream p-6">
      <p className="text-sm font-black text-brand-700">💚 이렇게 적립돼요</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-brand-100">
          <p className="text-xs text-ink-soft">첫 완료 예약</p>
          <p className="text-xl font-black text-brand">{pct(first)}</p>
        </div>
        <div className="rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-brand-100">
          <p className="text-xs text-ink-soft">이후 완료 예약마다</p>
          <p className="text-xl font-black text-brand">{pct(repeat)} 리커링 적립</p>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-ink-soft">
        정상 계정과 정상 거래가 유지되는 동안 <b className="text-ink">기간 제한 없이</b> 계속 적립됩니다.
      </p>
    </div>
  );
}

// 예상 적립금 계산기 — 첫 예약과 이후 예약을 함께 보여준다.
function ReferralCalculator({ first, repeat }: { first: number; repeat: number }) {
  const [amount, setAmount] = useState(400000);
  const firstPay = Math.round(amount * first);
  const repeatPay = Math.round(amount * repeat);

  return (
    <div className="mt-4 rounded-3xl border border-line bg-white p-6 shadow-sm">
      <p className="text-sm font-black text-ink">💰 얼마를 벌 수 있나요?</p>
      <div className="mt-3">
        <p className="text-xs text-ink-soft">청소 계약 금액</p>
        <p className="text-lg font-black text-ink">{formatKRW(amount)}</p>
      </div>
      <input
        type="range"
        min={100000}
        max={2000000}
        step={50000}
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="mt-3 w-full accent-[var(--color-brand)]"
        aria-label="청소 계약 금액"
      />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-brand-50/60 px-4 py-3 text-center">
          <p className="text-xs text-ink-soft">첫 완료 예약 ({pct(first)})</p>
          <p className="text-xl font-black text-brand">{formatKRW(firstPay)}</p>
        </div>
        <div className="rounded-2xl bg-cream px-4 py-3 text-center">
          <p className="text-xs text-ink-soft">이후 예약마다 ({pct(repeat)})</p>
          <p className="text-xl font-black text-ink">{formatKRW(repeatPay)}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {CALC_PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setAmount(p)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              amount === p ? "bg-brand text-white" : "bg-cream text-ink-soft ring-1 ring-line hover:bg-cream-deep"
            }`}
          >
            {Math.round(p / 10000)}만원
          </button>
        ))}
      </div>
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
        이 링크로 접속한 고객이 가입·예약하거나, 업체가 파트너로 등록하면 추천이 연결돼요.
        연결된 뒤에는 <b className="text-ink">완료되는 예약마다</b> 리커링 적립됩니다.
      </p>
    </div>
  );
}

function SummaryTiles({ summary, minPayout }: { summary: Summary; minPayout: number }) {
  const tiles = [
    { label: "이번 달 예상 수익", value: formatKRW(summary.thisMonthEstimate), tone: "text-brand" },
    { label: "정산 가능 금액", value: formatKRW(summary.available), tone: "text-emerald-600" },
    { label: "누적 수익", value: formatKRW(summary.total), tone: "text-ink" },
    { label: "추천 고객", value: `${summary.referredCustomers}명`, tone: "text-sky-600" },
    { label: "추천 업체", value: `${summary.referredProviders}곳`, tone: "text-violet-600" },
    { label: "이번 달 완료 거래", value: `${summary.thisMonthCompleted}건`, tone: "text-amber-600" },
  ];
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-line bg-white p-4 text-center">
            <p className={`text-lg font-black ${t.tone}`}>{t.value}</p>
            <p className="mt-0.5 text-xs text-ink-soft">{t.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-ink-soft">
        최소 정산 금액 {formatKRW(minPayout)} · 월 1회 관리자 승인 후 지급
      </p>
    </div>
  );
}

const REL_STATUS: Record<Relation["status"], { label: string; tone: string }> = {
  active: { label: "정상", tone: "text-emerald-600" },
  suspended: { label: "정지", tone: "text-rose-500" },
  ended: { label: "종료", tone: "text-ink-soft" },
};

function RelationsList({ relations }: { relations: Relation[] }) {
  return (
    <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
      <h2 className="text-base font-black text-ink">추천 실적</h2>
      {relations.length === 0 ? (
        <p className="mt-4 rounded-xl bg-cream px-4 py-6 text-center text-sm text-ink-soft">
          아직 연결된 추천 대상이 없어요. 위 링크를 공유해 첫 연결을 만들어보세요!
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {relations.map((r) => (
            <li key={r.id} className="py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">
                    {r.referredType === "customer" ? "🙋 고객" : "🧹 업체"} · {r.referredName || "익명"}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    가입 {r.createdAt.slice(0, 10)} ·{" "}
                    {r.completedCount > 0 ? `완료 ${r.completedCount}건` : "첫 거래 대기"} · 거래액{" "}
                    {formatKRW(r.grossAmount)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-black text-brand">{formatKRW(r.totalCommission)}</p>
                  <span className={`text-xs font-bold ${REL_STATUS[r.status].tone}`}>
                    {REL_STATUS[r.status].label}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const STATUS_TONE: Record<CommissionStatus, string> = {
  pending: "text-amber-600",
  available: "text-brand",
  paid: "text-emerald-600",
  canceled: "text-ink-soft",
  deducted: "text-rose-500",
};

function CommissionsList({ commissions }: { commissions: Commission[] }) {
  return (
    <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
      <h2 className="text-base font-black text-ink">수익 내역</h2>
      {commissions.length === 0 ? (
        <p className="mt-4 rounded-xl bg-cream px-4 py-6 text-center text-sm text-ink-soft">
          아직 적립 내역이 없어요. 추천 대상의 예약이 완료되면 여기에 쌓여요.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {commissions.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">
                  {c.referredType === "customer" ? "🙋 고객" : "🧹 업체"} · {c.referredName || "익명"}
                  {c.isFirst ? (
                    <span className="ml-1.5 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                      첫 예약
                    </span>
                  ) : (
                    <span className="ml-1.5 rounded-full bg-cream px-2 py-0.5 text-[10px] font-bold text-ink-soft">
                      {c.sequenceNo}번째
                    </span>
                  )}
                </p>
                <p className="text-xs text-ink-soft">
                  {c.createdAt.slice(0, 10)} · {c.reservationId} · 거래 {formatKRW(c.baseAmount)} ·{" "}
                  {(c.rate * 100).toFixed(2)}%
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={`font-black ${
                    c.status === "canceled" || c.status === "deducted"
                      ? "text-ink-soft line-through"
                      : "text-brand"
                  }`}
                >
                  {formatKRW(c.amount)}
                </p>
                <span className={`text-xs font-bold ${STATUS_TONE[c.status]}`}>
                  {COMMISSION_STATUS_LABEL[c.status]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
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

function CautionNote() {
  return (
    <p className="rounded-2xl bg-cream px-4 py-3 text-xs leading-relaxed text-ink-soft">
      ⚠️ 취소, 환불, 허위 거래 및 본인 추천 거래는 적립 대상에서 제외됩니다. 이미 지급된 적립금도 이후
      환불되면 다음 정산에서 차감될 수 있어요. 추천 대상 또는 파트너 계정이 탈퇴·정지되면 그 시점 이후
      거래부터 적립이 중단됩니다.
    </p>
  );
}
