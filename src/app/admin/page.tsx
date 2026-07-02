"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  STATUS_META,
  partnerById,
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
};

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

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/reservations", { cache: "no-store" });
      const data = await res.json();
      setRows(data.reservations ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function changeStatus(id: string, status: ReservationStatus) {
    setUpdating(id);
    // 낙관적 업데이트
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      await fetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } finally {
      setUpdating(null);
    }
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
            const partner = partnerById(r.partnerId);
            const meta = STATUS_META[r.status];
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
                      <span>🏢 {partner?.name ?? "미배정"}</span>
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
                </div>
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
