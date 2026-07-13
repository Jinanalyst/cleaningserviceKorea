"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import MessageThread from "@/components/MessageThread";
import {
  CONSULTATION_STATUS_META,
  PARTNERS,
  serviceById,
  formatKRW,
  type ConsultationStatus,
} from "@/lib/data";

type Consultation = {
  id: string;
  createdAt: string;
  customerName: string;
  phone: string;
  address: string;
  addressDetail: string;
  serviceId: string;
  pyeong: number | null;
  preferredDate: string;
  notes: string;
  status: ConsultationStatus;
  quotedPrice: number | null;
  quoteNote: string;
  partnerId: string;
};

type AssignablePartner = { id: string; name: string };

const STATUS_ORDER: ConsultationStatus[] = [
  "requested",
  "consulting",
  "quoted",
  "confirmed",
  "cancelled",
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

export default function AdminCustomersPage() {
  const [rows, setRows] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ConsultationStatus | "all">("all");
  // 카드별 견적 입력 폼 로컬 상태 (금액 문자열 / 메모)
  const [drafts, setDrafts] = useState<
    Record<string, { price: string; note: string }>
  >({});
  const [busy, setBusy] = useState<string | null>(null);
  const [approved, setApproved] = useState<AssignablePartner[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  const partnerOptions: AssignablePartner[] = useMemo(
    () => [...PARTNERS.map((p) => ({ id: p.id, name: p.name })), ...approved],
    [approved]
  );

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/consultations", { cache: "no-store" });
      const data = await res.json();
      const list: Consultation[] = data.consultations ?? [];
      setRows(list);
      // 서버 값으로 폼 초기화 (사용자가 편집 중이 아니면)
      setDrafts((prev) => {
        const next = { ...prev };
        for (const c of list) {
          if (!next[c.id]) {
            next[c.id] = {
              price: c.quotedPrice != null ? String(c.quotedPrice) : "",
              note: c.quoteNote ?? "",
            };
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

  function setDraft(id: string, patch: Partial<{ price: string; note: string }>) {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));
  }

  async function patch(
    id: string,
    body: {
      status?: ConsultationStatus;
      quotedPrice?: number | null;
      quoteNote?: string;
      partnerId?: string;
    }
  ) {
    setBusy(id);
    try {
      const res = await fetch(`/api/consultations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.consultation) {
        const updated: Consultation = data.consultation;
        setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
      }
    } finally {
      setBusy(null);
    }
  }

  // 합의 견적 저장 → 금액·메모 저장하고 상태를 '견적 확정'으로
  async function saveQuote(id: string) {
    const draft = drafts[id] ?? { price: "", note: "" };
    const digits = draft.price.replace(/[^\d]/g, "");
    if (!digits) {
      alert("합의된 견적 금액을 입력해 주세요.");
      return;
    }
    await patch(id, {
      quotedPrice: Number(digits),
      quoteNote: draft.note,
      status: "quoted",
    });
  }

  async function changeStatus(id: string, status: ConsultationStatus) {
    await patch(id, { status });
  }

  const stats = useMemo(() => {
    return {
      total: rows.length,
      requested: rows.filter((r) => r.status === "requested").length,
      consulting: rows.filter((r) => r.status === "consulting").length,
      quoted: rows.filter(
        (r) => r.status === "quoted" || r.status === "confirmed"
      ).length,
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
        <div>
          <h1 className="text-3xl font-black tracking-tight text-ink">고객 관리</h1>
          <p className="mt-1 text-ink-soft">
            상담 신청을 확인하고, 대면 상담 후 합의된 견적을 입력하세요.
          </p>
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
        <Link
          href="/admin"
          className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink-soft ring-1 ring-line transition hover:bg-cream-deep"
        >
          예약 관리
        </Link>
        <Link
          href="/admin/partners"
          className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink-soft ring-1 ring-line transition hover:bg-cream-deep"
        >
          파트너 심사
        </Link>
        <span className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream">
          고객 관리
        </span>
        <Link
          href="/admin/referrals"
          className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink-soft ring-1 ring-line transition hover:bg-cream-deep"
        >
          추천 정산
        </Link>
      </div>

      {/* 통계 */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="전체 상담" value={`${stats.total}건`} emoji="🙋" />
        <StatCard label="신규 상담 대기" value={`${stats.requested}건`} emoji="⏳" tone="amber" />
        <StatCard label="상담 진행 중" value={`${stats.consulting}건`} emoji="💬" tone="sky" />
        <StatCard label="견적 완료" value={`${stats.quoted}건`} emoji="✅" tone="emerald" />
      </div>

      {/* 필터 */}
      <div className="mt-8 flex flex-wrap gap-2">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          전체 {rows.length}
        </FilterChip>
        {STATUS_ORDER.map((s) => (
          <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>
            {CONSULTATION_STATUS_META[s].label}{" "}
            {rows.filter((r) => r.status === s).length}
          </FilterChip>
        ))}
      </div>

      {loading ? (
        <p className="py-20 text-center text-ink-soft">불러오는 중…</p>
      ) : visible.length === 0 ? (
        <p className="py-20 text-center text-ink-soft">해당하는 상담 신청이 없어요.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {visible.map((r) => {
            const meta = CONSULTATION_STATUS_META[r.status];
            const svc = serviceById(r.serviceId);
            const draft = drafts[r.id] ?? { price: "", note: "" };
            const priceNum = Number(draft.price.replace(/[^\d]/g, ""));
            return (
              <div
                key={r.id}
                className="rounded-2xl border border-line bg-white p-5 shadow-sm"
              >
                {/* 헤더 */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-black text-ink">
                        {r.customerName}
                      </span>
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
                  </div>
                  {r.quotedPrice != null && (
                    <div className="text-right">
                      <p className="text-xs text-ink-soft">합의 견적</p>
                      <p className="text-lg font-black text-brand">
                        {formatKRW(r.quotedPrice)}
                      </p>
                    </div>
                  )}
                </div>

                {/* 상담 정보 */}
                <dl className="mt-4 grid gap-x-6 gap-y-2 border-t border-line pt-4 text-sm sm:grid-cols-2">
                  <Detail k="연락처" v={r.phone} />
                  <Detail
                    k="희망 서비스"
                    v={
                      svc
                        ? `${svc.emoji} ${svc.name}${r.pyeong ? ` · ${r.pyeong}평` : ""}`
                        : r.pyeong
                          ? `${r.pyeong}평`
                          : "-"
                    }
                  />
                  <Detail
                    k="주소"
                    v={[r.address, r.addressDetail].filter(Boolean).join(" ") || "-"}
                  />
                  <Detail k="희망 방문일" v={r.preferredDate || "-"} />
                </dl>
                {r.notes && (
                  <p className="mt-3 rounded-lg bg-cream px-3 py-2 text-sm text-ink-soft">
                    💬 {r.notes}
                  </p>
                )}

                {/* 합의 견적 입력 */}
                <div className="mt-4 rounded-xl bg-brand-50/60 p-4 ring-1 ring-brand-100">
                  <p className="text-sm font-bold text-ink">💰 합의 견적 입력</p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    대면·전화 상담 후 고객과 합의한 금액과 내용을 입력하세요. 저장하면
                    상태가 <b>견적 확정</b>으로 바뀌고 고객이 조회할 수 있어요.
                  </p>

                  <div className="mt-3 grid gap-3 sm:grid-cols-[220px_1fr]">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-ink-soft">
                        합의 금액 (원)
                      </label>
                      <div className="relative">
                        <input
                          inputMode="numeric"
                          value={draft.price}
                          onChange={(e) =>
                            setDraft(r.id, {
                              price: e.target.value.replace(/[^\d]/g, ""),
                            })
                          }
                          placeholder="예) 180000"
                          className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-bold text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-100"
                        />
                      </div>
                      {priceNum > 0 && (
                        <p className="mt-1 text-xs font-bold text-brand">
                          = {formatKRW(priceNum)}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-ink-soft">
                        상담·견적 메모
                      </label>
                      <textarea
                        rows={2}
                        value={draft.note}
                        onChange={(e) => setDraft(r.id, { note: e.target.value })}
                        placeholder="합의 내용, 방문 예정일, 포함 범위 등을 남겨 주세요."
                        className="w-full resize-none rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-100"
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => saveQuote(r.id)}
                      disabled={busy === r.id}
                      className="rounded-full bg-brand px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-40"
                    >
                      견적 저장 (견적 확정)
                    </button>
                    <button
                      onClick={() =>
                        patch(r.id, {
                          quotedPrice: priceNum > 0 ? priceNum : undefined,
                          quoteNote: draft.note,
                        })
                      }
                      disabled={busy === r.id}
                      className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink ring-1 ring-line transition hover:bg-cream-deep disabled:opacity-40"
                    >
                      메모만 저장
                    </button>
                  </div>
                </div>

                {/* 상태 변경 */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                  <span className="text-xs font-bold text-ink-soft">상태 변경:</span>
                  {STATUS_ORDER.map((s) => (
                    <button
                      key={s}
                      disabled={r.status === s || busy === r.id}
                      onClick={() => changeStatus(r.id, s)}
                      className={[
                        "rounded-full px-3 py-1.5 text-xs font-bold transition",
                        r.status === s
                          ? "bg-ink text-cream"
                          : "bg-cream text-ink-soft hover:bg-cream-deep disabled:opacity-40",
                      ].join(" ")}
                    >
                      {CONSULTATION_STATUS_META[s].label}
                    </button>
                  ))}
                  <button
                    onClick={() => setOpenId(openId === r.id ? null : r.id)}
                    className="ml-auto rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-cream transition hover:opacity-90"
                  >
                    {openId === r.id ? "관리 닫기" : "업체 배정·소통"}
                  </button>
                </div>

                {/* 업체 배정 · 소통 */}
                {openId === r.id && (
                  <div className="mt-3 space-y-3 border-t border-line pt-3">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-ink-soft">
                        담당 업체 배정
                      </label>
                      <select
                        value={r.partnerId}
                        disabled={busy === r.id}
                        onChange={(e) => patch(r.id, { partnerId: e.target.value })}
                        className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-brand sm:max-w-xs"
                      >
                        <option value="">미배정</option>
                        {partnerOptions.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <MessageThread
                      type="consultation"
                      id={r.id}
                      audience="partner"
                      me="admin"
                      title="🏢 업체와 소통 (배정 업체만 열람)"
                    />
                    <MessageThread
                      type="consultation"
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
        active
          ? "bg-ink text-cream"
          : "bg-white text-ink-soft ring-1 ring-line hover:bg-cream-deep",
      ].join(" ")}
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
