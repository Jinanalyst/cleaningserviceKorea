"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  APPLICATION_STATUS_META,
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

const STATUS_ORDER: ApplicationStatus[] = [
  "submitted",
  "reviewing",
  "approved",
  "rejected",
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

export default function AdminPartnersPage() {
  const [rows, setRows] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/applications", { cache: "no-store" });
      const data = await res.json();
      setRows(data.applications ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function review(id: string, status: ApplicationStatus) {
    setBusy(id);
    const reviewNote = notes[id] ?? rows.find((r) => r.id === id)?.reviewNote ?? "";
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status, reviewNote } : r)));
    try {
      await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNote }),
      });
    } finally {
      setBusy(null);
    }
  }

  const stats = useMemo(() => {
    return {
      total: rows.length,
      submitted: rows.filter((r) => r.status === "submitted").length,
      reviewing: rows.filter((r) => r.status === "reviewing").length,
      approved: rows.filter((r) => r.status === "approved").length,
    };
  }, [rows]);

  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter]
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <p className="text-sm font-bold text-brand">운영 대시보드</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-black tracking-tight text-ink">파트너 심사</h1>
        <button
          onClick={load}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-ink ring-1 ring-line transition hover:bg-cream-deep"
        >
          ↻ 새로고침
        </button>
      </div>

      {/* 탭 네비게이션 */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin"
          className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink-soft ring-1 ring-line transition hover:bg-cream-deep"
        >
          예약 관리
        </Link>
        <span className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream">
          파트너 심사
        </span>
        <Link
          href="/admin/customers"
          className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink-soft ring-1 ring-line transition hover:bg-cream-deep"
        >
          고객 관리
        </Link>
      </div>

      {/* 통계 */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="전체 신청" value={`${stats.total}건`} emoji="📋" />
        <StatCard label="심사 대기" value={`${stats.submitted}건`} emoji="⏳" tone="amber" />
        <StatCard label="심사 중" value={`${stats.reviewing}건`} emoji="🔍" tone="sky" />
        <StatCard label="승인 완료" value={`${stats.approved}건`} emoji="✅" tone="emerald" />
      </div>

      {/* 필터 */}
      <div className="mt-8 flex flex-wrap gap-2">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          전체 {rows.length}
        </FilterChip>
        {STATUS_ORDER.map((s) => (
          <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>
            {APPLICATION_STATUS_META[s].label} {rows.filter((r) => r.status === s).length}
          </FilterChip>
        ))}
      </div>

      {loading ? (
        <p className="py-20 text-center text-ink-soft">불러오는 중…</p>
      ) : visible.length === 0 ? (
        <p className="py-20 text-center text-ink-soft">해당하는 신청이 없어요.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {visible.map((r) => {
            const meta = APPLICATION_STATUS_META[r.status];
            return (
              <div key={r.id} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-black text-ink">{r.companyName}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${meta.tone}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                      <span className="text-xs text-ink-soft">
                        {r.id} · {formatDate(r.createdAt)} 신청
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.services.map((s) => (
                        <span key={s} className="rounded-full bg-cream px-2.5 py-1 text-xs font-medium text-ink-soft">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <dl className="mt-4 grid gap-x-6 gap-y-2 border-t border-line pt-4 text-sm sm:grid-cols-2">
                  <Detail k="대표자" v={r.ownerName} />
                  <Detail k="사업자등록번호" v={r.bizNumber} />
                  <Detail k="연락처" v={r.phone} />
                  <Detail k="이메일" v={r.email} />
                  <Detail k="정산 계좌" v={`${r.bankName} ${r.accountNumber} (${r.accountHolder})`} />
                  <Detail k="지역 / 규모" v={[r.regions, r.teamSize, r.experience].filter(Boolean).join(" · ") || "-"} />
                </dl>
                {r.intro && (
                  <p className="mt-3 rounded-lg bg-cream px-3 py-2 text-sm text-ink-soft">
                    💬 {r.intro}
                  </p>
                )}

                {/* 심사 처리 */}
                <div className="mt-4 border-t border-line pt-4">
                  <label className="mb-1.5 block text-xs font-bold text-ink-soft">
                    심사 메모 / 반려 사유
                  </label>
                  <textarea
                    rows={2}
                    defaultValue={r.reviewNote}
                    onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                    placeholder="반려 시 사유를 남기면 신청자에게 표시돼요."
                    className="w-full resize-none rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-100"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ReviewBtn onClick={() => review(r.id, "reviewing")} disabled={busy === r.id} tone="sky">
                      서류 심사중
                    </ReviewBtn>
                    <ReviewBtn onClick={() => review(r.id, "approved")} disabled={busy === r.id} tone="emerald">
                      승인
                    </ReviewBtn>
                    <ReviewBtn onClick={() => review(r.id, "rejected")} disabled={busy === r.id} tone="rose">
                      반려
                    </ReviewBtn>
                  </div>
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
  tone?: "ink" | "amber" | "sky" | "emerald";
}) {
  const toneMap = {
    ink: "text-ink",
    amber: "text-amber-600",
    sky: "text-sky-600",
    emerald: "text-emerald-600",
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
        active ? "bg-ink text-cream" : "bg-white text-ink-soft ring-1 ring-line hover:bg-cream-deep",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function ReviewBtn({
  onClick,
  disabled,
  tone,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  tone: "sky" | "emerald" | "rose";
  children: React.ReactNode;
}) {
  const toneMap = {
    sky: "bg-sky-500 hover:bg-sky-600",
    emerald: "bg-emerald-500 hover:bg-emerald-600",
    rose: "bg-rose-500 hover:bg-rose-600",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-4 py-2 text-sm font-bold text-white transition disabled:opacity-40 ${toneMap[tone]}`}
    >
      {children}
    </button>
  );
}

function Detail({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-ink-soft">{k}</dt>
      <dd className="font-medium text-ink">{v}</dd>
    </div>
  );
}
