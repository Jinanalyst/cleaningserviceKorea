"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatKRW } from "@/lib/data";
import {
  COMMISSION_STATUS_LABEL,
  DEFAULT_SETTINGS,
  type CommissionSettings,
  type CommissionStatus,
  type ReferredType,
} from "@/lib/commission";

type Commission = {
  id: string;
  createdAt: string;
  referrerCode: string;
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
  bank: string;
  account: string;
  holder: string;
};
type Relation = {
  id: string;
  createdAt: string;
  referrerCode: string;
  referredType: ReferredType;
  referredName: string;
  referredKey: string;
  status: "active" | "suspended" | "ended";
  completedCount: number;
  grossAmount: number;
  totalCommission: number;
};
type Payout = {
  id: string;
  createdAt: string;
  referrerCode: string;
  amount: number;
  count: number;
  status: string;
  period: string;
  bank: string;
  account: string;
  holder: string;
  paidAt: string | null;
};

type Tab = "commissions" | "relations" | "payouts" | "settings";

export default function AdminReferralsPage() {
  const [tab, setTab] = useState<Tab>("commissions");
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [settings, setSettings] = useState<CommissionSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/referrals", { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      setCommissions(d.commissions ?? []);
      setRelations(d.relations ?? []);
      setPayouts(d.payouts ?? []);
      setSettings(d.settings ?? DEFAULT_SETTINGS);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        await load();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totals = useMemo(() => {
    const sum = (s: CommissionStatus) =>
      commissions.filter((c) => c.status === s).reduce((a, c) => a + c.amount, 0);
    return {
      pending: sum("pending"),
      available: sum("available"),
      paid: sum("paid"),
      deducted: sum("deducted"),
    };
  }, [commissions]);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <p className="text-sm font-bold text-brand">운영 대시보드</p>
      <h1 className="mt-1 text-3xl font-black tracking-tight text-ink">추천 커미션</h1>
      <p className="mt-1 text-ink-soft">리커링 커미션 적립·정산·비율을 관리하세요.</p>

      {/* 상단 탭 */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/admin" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink-soft ring-1 ring-line transition hover:bg-cream-deep">예약 관리</Link>
        <Link href="/admin/partners" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink-soft ring-1 ring-line transition hover:bg-cream-deep">파트너 심사</Link>
        <Link href="/admin/customers" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink-soft ring-1 ring-line transition hover:bg-cream-deep">고객 관리</Link>
        <span className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream">추천 커미션</span>
      </div>

      {/* 요약 */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="적립 예정" value={formatKRW(totals.pending)} tone="text-amber-600" />
        <Tile label="정산 가능" value={formatKRW(totals.available)} tone="text-brand" />
        <Tile label="지급 완료" value={formatKRW(totals.paid)} tone="text-emerald-600" />
        <Tile label="차감" value={formatKRW(totals.deducted)} tone="text-rose-500" />
      </div>

      {/* 하위 탭 */}
      <div className="mt-6 flex flex-wrap gap-2">
        {([
          ["commissions", "커미션 원장"],
          ["relations", "추천 관계"],
          ["payouts", "정산 배치"],
          ["settings", "비율 설정"],
        ] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
              tab === t ? "bg-brand text-white" : "bg-white text-ink-soft ring-1 ring-line hover:bg-cream-deep"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-10 text-center text-ink-soft">불러오는 중…</p>
      ) : tab === "commissions" ? (
        <CommissionsPanel commissions={commissions} onChanged={load} />
      ) : tab === "relations" ? (
        <RelationsPanel relations={relations} onChanged={load} />
      ) : tab === "payouts" ? (
        <PayoutsPanel commissions={commissions} payouts={payouts} minPayout={settings.minPayout} onChanged={load} />
      ) : (
        <SettingsPanel settings={settings} onSaved={setSettings} />
      )}
    </div>
  );
}

function Tile({ label, value, tone = "text-ink" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 text-center">
      <p className={`text-lg font-black ${tone}`}>{value}</p>
      <p className="mt-0.5 text-xs text-ink-soft">{label}</p>
    </div>
  );
}

const STATUS_TONE: Record<CommissionStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  available: "bg-brand-50 text-brand-700 ring-brand-200",
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  canceled: "bg-slate-100 text-slate-500 ring-slate-200",
  deducted: "bg-rose-50 text-rose-600 ring-rose-200",
};

const NEXT_ACTIONS: { from: CommissionStatus; to: CommissionStatus; label: string }[] = [
  { from: "pending", to: "available", label: "정산 가능 처리" },
  { from: "available", to: "paid", label: "지급 완료 처리" },
  { from: "available", to: "pending", label: "적립 예정으로" },
  { from: "paid", to: "available", label: "지급 취소(되돌리기)" },
];

function CommissionsPanel({
  commissions,
  onChanged,
}: {
  commissions: Commission[];
  onChanged: () => void;
}) {
  const [filter, setFilter] = useState<"all" | CommissionStatus>("all");
  const [busy, setBusy] = useState<string | null>(null);

  const shown = filter === "all" ? commissions : commissions.filter((c) => c.status === filter);

  async function setStatus(id: string, status: CommissionStatus) {
    setBusy(id);
    try {
      await fetch(`/api/admin/referrals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      onChanged();
    } finally {
      setBusy(null);
    }
  }

  async function flagFraud(c: Commission) {
    const reason = window.prompt("부정 거래 사유 (커미션이 취소/차감됩니다)", "");
    if (reason === null) return;
    setBusy(c.id);
    try {
      await fetch("/api/admin/referrals/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "fraud", targetType: "reservation", targetId: c.reservationId, reason }),
      });
      onChanged();
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <AttributeCard onChanged={onChanged} />

      <div className="mt-6 flex flex-wrap gap-2">
        {(["all", "pending", "available", "paid", "canceled", "deducted"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              filter === f ? "bg-brand text-white" : "bg-white text-ink-soft ring-1 ring-line hover:bg-cream-deep"
            }`}
          >
            {f === "all" ? "전체" : COMMISSION_STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-line bg-white p-8 text-center text-ink-soft">
          해당하는 커미션이 없어요.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {shown.map((c) => (
            <div key={c.id} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black text-ink">
                    {c.referredType === "customer" ? "🙋 고객 추천" : "🧹 업체 추천"} · {c.referredName || "익명"}
                    <span className="ml-2 rounded-full bg-cream px-2 py-0.5 text-[10px] font-bold text-ink-soft">
                      {c.isFirst ? "첫 예약" : `${c.sequenceNo}번째`}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    코드 <b className="text-ink">{c.referrerCode}</b> · 예약 {c.reservationId} · 거래{" "}
                    {formatKRW(c.baseAmount)} · {(c.rate * 100).toFixed(2)}% · {c.createdAt.slice(0, 10)}
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    정산 계좌:{" "}
                    {c.bank && c.account ? (
                      <span className="font-medium text-ink">{c.bank} {c.account} ({c.holder})</span>
                    ) : (
                      <span className="text-rose-500">미등록</span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-brand">{formatKRW(c.amount)}</p>
                  <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${STATUS_TONE[c.status]}`}>
                    {COMMISSION_STATUS_LABEL[c.status]}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {NEXT_ACTIONS.filter((a) => a.from === c.status).map((a) => (
                  <button
                    key={a.to}
                    onClick={() => setStatus(c.id, a.to)}
                    disabled={busy === c.id}
                    className="rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-600 disabled:opacity-40"
                  >
                    {a.label}
                  </button>
                ))}
                {c.status !== "canceled" && c.status !== "deducted" && (
                  <button
                    onClick={() => flagFraud(c)}
                    disabled={busy === c.id}
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-50 disabled:opacity-40"
                  >
                    부정 표시
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// 관리자 수동 추천 귀속(보정/테스트) — 예약을 추천코드에 연결하고 즉시 재적립.
function AttributeCard({ onChanged }: { onChanged: () => void }) {
  const [reservationId, setReservationId] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<ReferredType>("customer");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/referrals/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "attribute",
          reservationId: reservationId.trim(),
          code: code.trim(),
          type,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: d.error || "귀속에 실패했어요." });
      } else {
        setMsg({
          ok: true,
          text: d.accrued
            ? "✓ 귀속 완료 — 예약이 완료 상태라 커미션이 적립됐어요. 목록을 확인하세요."
            : "✓ 귀속 완료 — 예약이 완료되면 자동 적립됩니다.",
        });
        onChanged();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50/40 p-5">
      <p className="text-sm font-black text-ink">🔧 수동 추천 귀속 (보정·테스트)</p>
      <p className="mt-1 text-xs text-ink-soft">
        예약의 고객 또는 담당 업체를 추천코드에 연결하고 즉시 재적립해요. 완료된 예약이면 바로 커미션이 뜹니다.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
        <input
          value={reservationId}
          onChange={(e) => setReservationId(e.target.value)}
          placeholder="예약번호 (예: SG-HNC2B4)"
          className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="추천코드"
          className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ReferredType)}
          className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        >
          <option value="customer">고객 추천</option>
          <option value="provider">업체 추천</option>
        </select>
        <button
          onClick={submit}
          disabled={busy || !reservationId.trim() || !code.trim()}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-40"
        >
          {busy ? "처리 중…" : "귀속·재적립"}
        </button>
      </div>
      {msg && (
        <p className={`mt-2 text-xs font-medium ${msg.ok ? "text-brand-700" : "text-rose-600"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}

const REL_STATUS_META: Record<Relation["status"], { label: string; tone: string }> = {
  active: { label: "정상", tone: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  suspended: { label: "정지", tone: "bg-rose-50 text-rose-600 ring-rose-200" },
  ended: { label: "종료", tone: "bg-slate-100 text-slate-500 ring-slate-200" },
};

function RelationsPanel({ relations, onChanged }: { relations: Relation[]; onChanged: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);

  async function setStatus(id: string, status: Relation["status"]) {
    setBusy(id);
    try {
      await fetch("/api/admin/referrals/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "relation", id, status }),
      });
      onChanged();
    } finally {
      setBusy(null);
    }
  }

  if (relations.length === 0) {
    return (
      <p className="mt-8 rounded-2xl border border-line bg-white p-8 text-center text-ink-soft">
        아직 추천 관계가 없어요.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {relations.map((r) => (
        <div key={r.id} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-black text-ink">
                {r.referredType === "customer" ? "🙋 고객" : "🧹 업체"} · {r.referredName || "익명"}
              </p>
              <p className="mt-0.5 text-xs text-ink-soft">
                추천코드 <b className="text-ink">{r.referrerCode}</b> · 완료 {r.completedCount}건 · 거래액{" "}
                {formatKRW(r.grossAmount)} · 커미션 {formatKRW(r.totalCommission)}
              </p>
              <p className="mt-0.5 text-[11px] text-ink-soft">{r.referredKey}</p>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${REL_STATUS_META[r.status].tone}`}>
              {REL_STATUS_META[r.status].label}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {r.status !== "active" && (
              <button onClick={() => setStatus(r.id, "active")} disabled={busy === r.id}
                className="rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-600 disabled:opacity-40">
                정상 복구
              </button>
            )}
            {r.status !== "suspended" && (
              <button onClick={() => setStatus(r.id, "suspended")} disabled={busy === r.id}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50 disabled:opacity-40">
                관계 정지
              </button>
            )}
            {r.status !== "ended" && (
              <button onClick={() => setStatus(r.id, "ended")} disabled={busy === r.id}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ink-soft ring-1 ring-line hover:bg-cream-deep disabled:opacity-40">
                관계 종료
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function PayoutsPanel({
  commissions,
  payouts,
  minPayout,
  onChanged,
}: {
  commissions: Commission[];
  payouts: Payout[];
  minPayout: number;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // 코드별 정산 가능 합계(available) 집계.
  const byCode = useMemo(() => {
    const m: Record<string, { available: number; deducted: number; holder: string; bank: string; account: string }> = {};
    for (const c of commissions) {
      const e = (m[c.referrerCode] ??= { available: 0, deducted: 0, holder: c.holder, bank: c.bank, account: c.account });
      if (c.status === "available") e.available += c.amount;
      if (c.status === "deducted") e.deducted += c.amount;
    }
    return Object.entries(m)
      .map(([code, v]) => ({ code, ...v, net: v.available - v.deducted }))
      .filter((x) => x.available > 0)
      .sort((a, b) => b.net - a.net);
  }, [commissions]);

  async function payout(code: string) {
    setBusy(code);
    try {
      const res = await fetch("/api/admin/referrals/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "payout", code, period }),
      });
      const d = await res.json();
      if (!res.ok) window.alert(d.error || "정산에 실패했어요.");
      onChanged();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <div>
        <h2 className="text-base font-black text-ink">정산 대기 ({period})</h2>
        <p className="mt-1 text-xs text-ink-soft">
          최소 정산 금액 {formatKRW(minPayout)} 이상만 지급 처리할 수 있어요. 지급 시 available 커미션이 지급
          완료로 바뀌고 차감분이 반영됩니다.
        </p>
        {byCode.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-line bg-white p-6 text-center text-sm text-ink-soft">
            정산 가능한 커미션이 없어요.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {byCode.map((x) => {
              const enough = x.net >= minPayout;
              return (
                <div key={x.code} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-5 shadow-sm">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-ink">{x.code}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      정산 가능 {formatKRW(x.available)}
                      {x.deducted > 0 && <span className="text-rose-500"> · 차감 {formatKRW(x.deducted)}</span>}
                      {" · "}
                      {x.bank && x.account ? `${x.bank} ${x.account} (${x.holder})` : <span className="text-rose-500">계좌 미등록</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-brand">{formatKRW(x.net)}</p>
                    <button
                      onClick={() => payout(x.code)}
                      disabled={busy === x.code || !enough}
                      className="mt-1 rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-white transition hover:bg-brand-600 disabled:opacity-40"
                    >
                      {busy === x.code ? "처리 중…" : enough ? "지급 처리" : "최소금액 미달"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-base font-black text-ink">지급 내역</h2>
        {payouts.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-line bg-white p-6 text-center text-sm text-ink-soft">
            아직 지급 내역이 없어요.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {payouts.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink">{p.referrerCode} · {p.period || p.createdAt.slice(0, 10)}</p>
                  <p className="text-xs text-ink-soft">{p.count}건 · {p.bank} {p.account} ({p.holder})</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-emerald-600">{formatKRW(p.amount)}</p>
                  <p className="text-xs text-ink-soft">{p.paidAt ? p.paidAt.slice(0, 10) + " 지급" : p.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsPanel({
  settings,
  onSaved,
}: {
  settings: CommissionSettings;
  onSaved: (s: CommissionSettings) => void;
}) {
  // 비율은 % 로 편집, 최소 정산금액은 원 단위.
  const [platformFee, setPlatformFee] = useState((settings.platformFeeRate * 100).toString());
  const [first, setFirst] = useState((settings.firstRate * 100).toString());
  const [repeat, setRepeat] = useState((settings.repeatRate * 100).toString());
  const [splitC, setSplitC] = useState((settings.splitCustomer * 100).toString());
  const [splitP, setSplitP] = useState((settings.splitProvider * 100).toString());
  const [minPayout, setMinPayout] = useState(settings.minPayout.toString());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/commission-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformFeeRate: Number(platformFee) / 100,
          firstRate: Number(first) / 100,
          repeatRate: Number(repeat) / 100,
          splitCustomer: Number(splitC) / 100,
          splitProvider: Number(splitP) / 100,
          minPayout: Number(minPayout),
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "저장 실패");
      onSaved(d.settings);
      setMsg("✓ 설정이 저장됐어요. 이후 적립부터 적용됩니다.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  const Field = ({ label, value, onChange, suffix = "%" }: { label: string; value: string; onChange: (v: string) => void; suffix?: string }) => (
    <label className="block">
      <span className="text-xs font-bold text-ink-soft">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="decimal"
          className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-100"
        />
        <span className="shrink-0 text-sm text-ink-soft">{suffix}</span>
      </div>
    </label>
  );

  return (
    <div className="mt-6 rounded-3xl border border-line bg-white p-6 shadow-sm">
      <h2 className="text-base font-black text-ink">비율 설정</h2>
      <p className="mt-1 text-xs text-ink-soft">
        변경한 비율은 이후 새로 적립되는 커미션부터 적용돼요. 이미 적립된 건은 그대로 유지됩니다.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="플랫폼 총수수료율" value={platformFee} onChange={setPlatformFee} />
        <Field label="최소 정산 금액" value={minPayout} onChange={setMinPayout} suffix="원" />
        <Field label="첫 완료 거래 파트너 지급률" value={first} onChange={setFirst} />
        <Field label="이후 완료 거래 파트너 지급률" value={repeat} onChange={setRepeat} />
        <Field label="중복 추천 — 고객 추천자 분배" value={splitC} onChange={setSplitC} />
        <Field label="중복 추천 — 업체 추천자 분배" value={splitP} onChange={setSplitP} />
      </div>
      {msg && <p className="mt-3 text-sm font-medium text-ink-soft">{msg}</p>}
      <button
        onClick={save}
        disabled={saving}
        className="mt-4 w-full rounded-full bg-brand py-3 text-sm font-black text-white transition hover:bg-brand-600 disabled:opacity-40"
      >
        {saving ? "저장 중…" : "설정 저장"}
      </button>
    </div>
  );
}
