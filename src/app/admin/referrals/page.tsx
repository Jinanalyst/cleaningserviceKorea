"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatKRW } from "@/lib/data";

type Earning = {
  id: string;
  createdAt: string;
  referrerCode: string;
  sourceType: "customer" | "partner";
  referredName: string;
  reservationId: string;
  quoteAmount: number;
  amount: number;
  status: "pending" | "paid";
  paidAt: string | null;
  payoutBank: string;
  payoutAccount: string;
  payoutHolder: string;
};

export default function AdminReferralsPage() {
  const [rows, setRows] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "paid">("all");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/referrals", { cache: "no-store" });
        const data = await res.json();
        setRows(data.earnings ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function toggle(e: Earning) {
    const next = e.status === "paid" ? "pending" : "paid";
    setUpdating(e.id);
    try {
      const res = await fetch(`/api/admin/referrals/${e.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (res.ok) {
        setRows((prev) => prev.map((r) => (r.id === e.id ? { ...r, status: data.earning.status, paidAt: data.earning.paidAt } : r)));
      }
    } finally {
      setUpdating(null);
    }
  }

  const shown = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter]
  );
  const totalPending = rows.filter((r) => r.status === "pending").reduce((s, r) => s + r.amount, 0);
  const totalPaid = rows.filter((r) => r.status === "paid").reduce((s, r) => s + r.amount, 0);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <p className="text-sm font-bold text-brand">운영 대시보드</p>
      <h1 className="mt-1 text-3xl font-black tracking-tight text-ink">추천 정산</h1>
      <p className="mt-1 text-ink-soft">제휴 파트너 추천 적립을 확인하고 지급 처리하세요.</p>

      {/* 탭 */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/admin" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink-soft ring-1 ring-line transition hover:bg-cream-deep">예약 관리</Link>
        <Link href="/admin/partners" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink-soft ring-1 ring-line transition hover:bg-cream-deep">파트너 심사</Link>
        <Link href="/admin/customers" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink-soft ring-1 ring-line transition hover:bg-cream-deep">고객 관리</Link>
        <span className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream">추천 정산</span>
      </div>

      {/* 요약 */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="총 적립 건" value={`${rows.length}건`} />
        <Tile label="지급 대기액" value={formatKRW(totalPending)} tone="text-amber-600" />
        <Tile label="지급 완료액" value={formatKRW(totalPaid)} tone="text-emerald-600" />
        <Tile label="합계" value={formatKRW(totalPending + totalPaid)} tone="text-brand" />
      </div>

      {/* 필터 */}
      <div className="mt-6 flex gap-2">
        {(["all", "pending", "paid"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
              filter === f ? "bg-brand text-white" : "bg-white text-ink-soft ring-1 ring-line hover:bg-cream-deep"
            }`}
          >
            {f === "all" ? "전체" : f === "pending" ? "지급 대기" : "지급 완료"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-10 text-center text-ink-soft">불러오는 중…</p>
      ) : shown.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-line bg-white p-8 text-center text-ink-soft">
          해당하는 적립 내역이 없어요.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {shown.map((e) => (
            <div key={e.id} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black text-ink">
                    {e.sourceType === "customer" ? "🙋 고객 추천" : "🧹 업체 추천"} · {e.referredName || "익명"}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    추천코드 <b className="text-ink">{e.referrerCode}</b> · 예약 {e.reservationId} · 견적 {formatKRW(e.quoteAmount)}
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    정산 계좌:{" "}
                    {e.payoutBank && e.payoutAccount ? (
                      <span className="font-medium text-ink">
                        {e.payoutBank} {e.payoutAccount} ({e.payoutHolder})
                      </span>
                    ) : (
                      <span className="text-rose-500">미등록</span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-brand">{formatKRW(e.amount)}</p>
                  <button
                    onClick={() => toggle(e)}
                    disabled={updating === e.id}
                    className={`mt-1 rounded-full px-4 py-1.5 text-xs font-bold transition disabled:opacity-40 ${
                      e.status === "paid"
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
                        : "bg-brand text-white hover:bg-brand-600"
                    }`}
                  >
                    {updating === e.id ? "처리 중…" : e.status === "paid" ? "지급 완료 ✓ (되돌리기)" : "지급 완료 처리"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
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
