"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import MessageThread from "@/components/MessageThread";
import {
  STATUS_META,
  PARTNERS,
  serviceById,
  formatKRW,
  formatProperty,
  propertyLabelOf,
  type ReservationStatus,
  type PropertyInfo,
} from "@/lib/data";

type Reservation = {
  id: string;
  createdAt: string;
  partnerId: string;
  serviceId: string;
  pyeong: number;
  date: string;
  timeSlot: string;
  customerName: string;
  phone: string;
  address: string;
  addressDetail: string;
  notes: string;
  property?: PropertyInfo;
  price: number;
  deposit: number;
  status: ReservationStatus;
  agreedPrice: number | null;
  partnerQuote: number | null;
  partnerQuoteNote: string;
};

type AssignablePartner = { id: string; name: string };

const STATUS_ORDER: ReservationStatus[] = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
];

function formatDateKo(key: string) {
  const d = new Date(key + "T00:00:00");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}.${d.getDate()} (${days[d.getDay()]})`;
}

export default function AdminPage() {
  const [rows, setRows] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReservationStatus | "all">("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [approved, setApproved] = useState<AssignablePartner[]>([]);
  const [priceDraft, setPriceDraft] = useState<Record<string, string>>({});
  const [openId, setOpenId] = useState<string | null>(null);

  // 배정 가능한 업체 = 기본 시드 파트너 + 심사 승인된 신규 파트너
  const partnerOptions: AssignablePartner[] = useMemo(
    () => [...PARTNERS.map((p) => ({ id: p.id, name: p.name })), ...approved],
    [approved]
  );

  function partnerNameOf(id: string) {
    return partnerOptions.find((p) => p.id === id)?.name ?? "미배정";
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/reservations", { cache: "no-store" });
      const data = await res.json();
      const list: Reservation[] = data.reservations ?? [];
      setRows(list);
      setPriceDraft((prev) => {
        const next = { ...prev };
        for (const r of list) {
          if (next[r.id] === undefined) {
            next[r.id] = r.agreedPrice != null ? String(r.agreedPrice) : "";
          }
        }
        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // 승인된 신규 파트너 목록 (배정 드롭다운용)
    fetch("/api/partners", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) =>
        setApproved(
          (d.partners ?? []).map((p: { id: string; companyName: string }) => ({
            id: p.id,
            name: p.companyName,
          }))
        )
      )
      .catch(() => setApproved([]));
  }, []);

  async function patchReservation(
    id: string,
    body: { status?: ReservationStatus; partnerId?: string; agreedPrice?: number | null }
  ) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.reservation) {
        setRows((prev) => prev.map((r) => (r.id === id ? data.reservation : r)));
      }
    } finally {
      setUpdating(null);
    }
  }

  async function changeStatus(id: string, status: ReservationStatus) {
    // 낙관적 업데이트
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    await patchReservation(id, { status });
  }

  function saveAgreedPrice(id: string) {
    const digits = (priceDraft[id] ?? "").replace(/[^\d]/g, "");
    patchReservation(id, { agreedPrice: digits ? Number(digits) : null });
  }

  const stats = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((r) => r.status === "pending").length;
    const active = rows.filter(
      (r) => r.status === "confirmed" || r.status === "in_progress"
    ).length;
    const revenue = rows
      .filter((r) => r.status !== "cancelled")
      .reduce((sum, r) => sum + (r.deposit ?? 0), 0);
    return { total, pending, active, revenue };
  }, [rows]);

  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter]
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-brand">운영 대시보드</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-ink">예약 관리</h1>
          <p className="mt-1 text-ink-soft">들어온 예약을 확인하고 진행 상태를 업데이트하세요.</p>
        </div>
        <button
          onClick={load}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-ink ring-1 ring-line transition hover:bg-cream-deep"
        >
          ↻ 새로고침
        </button>
      </div>

      {/* 탭 네비게이션 */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream">
          예약 관리
        </span>
        <Link
          href="/admin/partners"
          className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink-soft ring-1 ring-line transition hover:bg-cream-deep"
        >
          파트너 심사
        </Link>
        <Link
          href="/admin/customers"
          className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink-soft ring-1 ring-line transition hover:bg-cream-deep"
        >
          고객 관리
        </Link>
      </div>

      {/* 통계 */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="전체 예약" value={`${stats.total}건`} emoji="📋" />
        <StatCard label="배정 대기" value={`${stats.pending}건`} emoji="⏳" tone="amber" />
        <StatCard label="진행 중" value={`${stats.active}건`} emoji="🧹" tone="sky" />
        <StatCard label="예약금 합계" value={formatKRW(stats.revenue)} emoji="💰" tone="brand" />
      </div>

      {/* 필터 */}
      <div className="mt-8 flex flex-wrap gap-2">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          전체 {rows.length}
        </FilterChip>
        {STATUS_ORDER.map((s) => {
          const count = rows.filter((r) => r.status === s).length;
          return (
            <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>
              {STATUS_META[s].label} {count}
            </FilterChip>
          );
        })}
      </div>

      {/* 목록 */}
      {loading ? (
        <p className="py-20 text-center text-ink-soft">불러오는 중…</p>
      ) : visible.length === 0 ? (
        <p className="py-20 text-center text-ink-soft">해당하는 예약이 없어요.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {visible.map((r) => {
            const svc = serviceById(r.serviceId);
            const meta = STATUS_META[r.status];
            const isOpen = openId === r.id;
            return (
              <div
                key={r.id}
                className="rounded-2xl border border-line bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-ink">{r.id}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${meta.tone}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
                      <span className="font-medium text-ink">
                        {svc?.emoji} {svc?.name} · {r.pyeong}평
                      </span>
                      <span>🗓 {formatDateKo(r.date)} {r.timeSlot}</span>
                      <span>🏢 {partnerNameOf(r.partnerId)}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
                      <span>👤 {r.customerName} · {r.phone}</span>
                      <span>📍 {r.address} {r.addressDetail}</span>
                    </div>
                    {formatProperty(r.serviceId, r.property) && (
                      <div className="mt-1 text-sm text-ink-soft">
                        🧾 {propertyLabelOf(r.serviceId)}: {formatProperty(r.serviceId, r.property)}
                      </div>
                    )}
                    {r.notes && (
                      <p className="mt-2 rounded-lg bg-cream px-3 py-2 text-sm text-ink-soft">
                        💬 {r.notes}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-ink-soft">예약금 / 총액</p>
                    <p className="font-bold text-brand">{formatKRW(r.deposit ?? 0)}</p>
                    <p className="text-xs text-ink-soft">{formatKRW(r.price)}</p>
                    {r.agreedPrice != null && (
                      <p className="mt-1 text-xs font-bold text-emerald-600">
                        협의가 {formatKRW(r.agreedPrice)}
                      </p>
                    )}
                    {r.partnerQuote != null && (
                      <p className="text-[11px] text-sky-600">
                        업체 견적 {formatKRW(r.partnerQuote)}
                      </p>
                    )}
                  </div>
                </div>

                {/* 상태 변경 */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                  <span className="text-xs font-bold text-ink-soft">상태 변경:</span>
                  {STATUS_ORDER.map((s) => (
                    <button
                      key={s}
                      disabled={r.status === s || updating === r.id}
                      onClick={() => changeStatus(r.id, s)}
                      className={[
                        "rounded-full px-3 py-1.5 text-xs font-bold transition",
                        r.status === s
                          ? "bg-brand text-white"
                          : "bg-cream text-ink-soft hover:bg-cream-deep disabled:opacity-40",
                      ].join(" ")}
                    >
                      {STATUS_META[s].label}
                    </button>
                  ))}
                  <button
                    onClick={() => setOpenId(isOpen ? null : r.id)}
                    className="ml-auto rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-cream transition hover:opacity-90"
                  >
                    {isOpen ? "관리 닫기" : "업체 배정·가격·소통"}
                  </button>
                </div>

                {/* 업체 배정 · 협의 가격 · 소통 */}
                {isOpen && (
                  <div className="mt-3 space-y-3 border-t border-line pt-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-ink-soft">
                          담당 업체 배정
                        </label>
                        <select
                          value={r.partnerId}
                          disabled={updating === r.id}
                          onChange={(e) => patchReservation(r.id, { partnerId: e.target.value })}
                          className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-brand"
                        >
                          {!partnerOptions.some((p) => p.id === r.partnerId) && (
                            <option value={r.partnerId}>{r.partnerId} (미등록)</option>
                          )}
                          {partnerOptions.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        {r.partnerQuote != null && (
                          <p className="mt-1 text-xs text-sky-600">
                            🧾 업체 제안가 {formatKRW(r.partnerQuote)}
                            {r.partnerQuoteNote && ` · ${r.partnerQuoteNote}`}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-ink-soft">
                          협의 확정가 (원)
                        </label>
                        <div className="flex gap-2">
                          <input
                            inputMode="numeric"
                            value={priceDraft[r.id] ?? ""}
                            onChange={(e) =>
                              setPriceDraft((d) => ({
                                ...d,
                                [r.id]: e.target.value.replace(/[^\d]/g, ""),
                              }))
                            }
                            placeholder="예) 180000"
                            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-bold text-ink outline-none focus:border-brand"
                          />
                          <button
                            onClick={() => saveAgreedPrice(r.id)}
                            disabled={updating === r.id}
                            className="shrink-0 rounded-xl bg-brand px-4 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-40"
                          >
                            저장
                          </button>
                        </div>
                      </div>
                    </div>

                    <MessageThread
                      type="reservation"
                      id={r.id}
                      audience="partner"
                      me="admin"
                      title="🏢 업체와 소통 (배정 업체만 열람)"
                    />
                    <MessageThread
                      type="reservation"
                      id={r.id}
                      audience="customer"
                      me="admin"
                      title="👤 고객과 소통 (로그인 고객만 열람)"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  emoji,
  tone = "ink",
}: {
  label: string;
  value: string;
  emoji: string;
  tone?: "ink" | "amber" | "sky" | "brand";
}) {
  const toneMap = {
    ink: "text-ink",
    amber: "text-amber-600",
    sky: "text-sky-600",
    brand: "text-brand",
  };
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-soft">{label}</span>
        <span className="text-xl">{emoji}</span>
      </div>
      <p className={`mt-2 text-2xl font-black ${toneMap[tone]}`}>{value}</p>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full px-4 py-2 text-sm font-bold transition",
        active
          ? "bg-ink text-cream"
          : "bg-white text-ink-soft ring-1 ring-line hover:bg-cream-deep",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
