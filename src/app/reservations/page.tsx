"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import MessageThread from "@/components/MessageThread";
import Calendar, { type DateStatus } from "@/components/Calendar";
import {
  STATUS_META,
  STATUS_FLOW,
  TIME_SLOTS,
  partnerById,
  serviceById,
  formatKRW,
  formatProperty,
  propertyLabelOf,
  platformFee,
  type ReservationStatus,
  type PropertyInfo,
} from "@/lib/data";

type BookedSlot = { date: string; timeSlot: string; partnerId: string };

type Reservation = {
  id: string;
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
};

function formatDateKo(key: string) {
  const d = new Date(key + "T00:00:00");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

function MyReservations() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [results, setResults] = useState<Reservation[] | null>(null);
  const [booked, setBooked] = useState<BookedSlot[]>([]);

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
      try {
        const res = await fetch("/api/reservations", { cache: "no-store" });
        const data = await res.json();
        setResults(data.reservations ?? []);
      } catch {
        setResults([]);
      }
      // 시간 변경 시 마감 슬롯을 표시하기 위한 예약 현황 (개인정보 없음)
      fetch("/api/availability", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setBooked(d?.slots ?? []))
        .catch(() => setBooked([]));
    })();
  }, []);

  // 한 예약이 취소/변경되면 목록을 갱신한다.
  function applyUpdate(updated: Reservation) {
    setResults((prev) =>
      prev ? prev.map((r) => (r.id === updated.id ? updated : r)) : prev
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-3xl font-black tracking-tight text-ink">내 예약</h1>
      <p className="mt-1 text-ink-soft">
        본인 계정으로 예약한 내역과 진행 상태를 확인하세요.
      </p>

      {authed === null && (
        <p className="mt-10 text-center text-ink-soft">불러오는 중…</p>
      )}

      {/* 비로그인 안내 */}
      {authed === false && (
        <div className="mt-10 rounded-2xl border border-line bg-white p-8 text-center">
          <p className="text-4xl">🔒</p>
          <p className="mt-3 font-bold text-ink">로그인이 필요해요</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            개인정보 보호를 위해, 예약 내역은 본인 계정으로 로그인해야 볼 수 있어요.
          </p>
          <Link
            href="/login?next=/reservations"
            className="mt-5 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white"
          >
            로그인하기
          </Link>
        </div>
      )}

      {/* 예약 없음 */}
      {authed && results && results.length === 0 && (
        <div className="mt-10 rounded-2xl border border-line bg-white p-8 text-center">
          <p className="text-4xl">🧺</p>
          <p className="mt-3 font-bold text-ink">아직 예약 내역이 없어요</p>
          <p className="mt-1 text-sm text-ink-soft">
            로그인한 상태로 예약하면 여기에서 진행 상태를 확인할 수 있어요.
          </p>
          <Link
            href="/book"
            className="mt-5 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white"
          >
            청소 예약하기
          </Link>
        </div>
      )}

      {authed && results && results.length > 0 && (
        <div className="mt-8 space-y-6">
          {results.map((r) => (
            <ReservationCard
              key={r.id}
              r={r}
              booked={booked}
              onUpdated={applyUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReservationCard({
  r,
  booked,
  onUpdated,
}: {
  r: Reservation;
  booked: BookedSlot[];
  onUpdated: (r: Reservation) => void;
}) {
  const svc = serviceById(r.serviceId);
  const partner = partnerById(r.partnerId);
  const meta = STATUS_META[r.status];
  const isCancelled = r.status === "cancelled";
  const activeIdx = STATUS_FLOW.indexOf(r.status);
  // 고객이 스스로 취소·시간 변경할 수 있는 상태 (접수·업체확정 단계까지)
  const canEdit = r.status === "pending" || r.status === "confirmed";

  const [editing, setEditing] = useState(false); // 시간 변경 패널 열림
  const [newDate, setNewDate] = useState<string | null>(r.date);
  const [newTime, setNewTime] = useState<string>(r.timeSlot);
  const [busy, setBusy] = useState<null | "cancel" | "reschedule">(null);
  const [err, setErr] = useState<string | null>(null);

  // 변경 가능한 최소 날짜 = 오늘 + 3일 (예약 화면과 동일 규칙)
  const minDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3);
    return d;
  }, []);

  // 이 예약의 담당 업체·날짜별로 이미 잡힌 시간대 Set (자기 예약의 현재 슬롯은 선택 가능)
  const takenByDate = useMemo(() => {
    const m = new Map<string, Set<string>>();
    booked.forEach((s) => {
      if (s.partnerId !== r.partnerId) return;
      // 자기 자신(현재 예약)의 슬롯은 충돌로 보지 않는다.
      if (s.date === r.date && s.timeSlot === r.timeSlot) return;
      if (!m.has(s.date)) m.set(s.date, new Set());
      m.get(s.date)!.add(s.timeSlot);
    });
    return m;
  }, [booked, r.partnerId, r.date, r.timeSlot]);

  function slotTaken(date: string | null, t: string): boolean {
    if (!date) return false;
    return takenByDate.get(date)?.has(t) ?? false;
  }

  function dateStatus(dateStr: string): DateStatus {
    const taken = takenByDate.get(dateStr)?.size ?? 0;
    if (taken >= TIME_SLOTS.length) return "full";
    return taken > 0 ? "some" : "open";
  }

  async function handleCancel() {
    if (!window.confirm("이 예약을 정말 취소할까요? 예약금은 환불 정책에 따라 처리돼요.")) {
      return;
    }
    setErr(null);
    setBusy("cancel");
    try {
      const res = await fetch(`/api/reservations/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "취소에 실패했어요.");
      onUpdated(data.reservation);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "취소에 실패했어요.");
    } finally {
      setBusy(null);
    }
  }

  async function handleReschedule() {
    if (!newDate || !newTime) {
      setErr("변경할 날짜와 시간을 선택해 주세요.");
      return;
    }
    if (newDate === r.date && newTime === r.timeSlot) {
      setEditing(false);
      return;
    }
    setErr(null);
    setBusy("reschedule");
    try {
      const res = await fetch(`/api/reservations/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reschedule", date: newDate, timeSlot: newTime }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "시간 변경에 실패했어요.");
      onUpdated(data.reservation);
      setEditing(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "시간 변경에 실패했어요.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
        <div>
          <p className="text-xs text-ink-soft">예약 번호</p>
          <p className="text-lg font-black text-ink">{r.id}</p>
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

        {/* 진행 상태 트래커 */}
        {!isCancelled && (
          <div className="mt-6 flex items-center">
            {STATUS_FLOW.map((s, i) => {
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
                      {STATUS_META[s].label}
                    </span>
                  </div>
                  {i < STATUS_FLOW.length - 1 && (
                    <div
                      className={`mx-1 h-0.5 flex-1 ${i < activeIdx ? "bg-brand" : "bg-cream-deep"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        <dl className="mt-6 grid gap-x-6 gap-y-3 border-t border-line pt-5 sm:grid-cols-2">
          <Info k="서비스" v={`${svc?.emoji ?? ""} ${svc?.name ?? ""} · ${r.pyeong}평`} />
          <Info k="담당 업체" v={partner?.name ?? "배정 중"} />
          {formatProperty(r.serviceId, r.property) && (
            <Info
              k={propertyLabelOf(r.serviceId)}
              v={formatProperty(r.serviceId, r.property)}
            />
          )}
          <Info k="방문 일시" v={`${formatDateKo(r.date)} ${r.timeSlot}`} />
          <Info k="예약자" v={`${r.customerName}`} />
          <Info k="주소" v={`${r.address} ${r.addressDetail}`.trim()} />
          <Info
            k="청소 총액"
            v={r.agreedPrice != null ? formatKRW(r.agreedPrice) : "상담 후 협의"}
          />
        </dl>

        <div className="mt-5 flex items-center justify-between rounded-2xl bg-brand-50 px-5 py-4">
          <div>
            <p className="text-xs text-brand-700">결제 완료 (예약금)</p>
            <p className="text-lg font-black text-brand">{formatKRW(r.deposit ?? platformFee(r.agreedPrice ?? r.price))}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-soft">현장 잔금</p>
            <p className="font-bold text-ink">
              {r.agreedPrice != null
                ? formatKRW(Math.max(0, r.agreedPrice - (r.deposit ?? platformFee(r.agreedPrice ?? r.price))))
                : "상담 후 협의"}
            </p>
          </div>
        </div>

        {/* 고객 셀프서비스 — 시간 변경 · 예약 취소 (접수·업체확정 단계) */}
        {canEdit && (
          <div className="mt-5 rounded-2xl border border-line bg-cream/50 p-4">
            {!editing ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-ink">
                  일정을 바꾸거나 예약을 취소할 수 있어요.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setErr(null);
                      setNewDate(r.date);
                      setNewTime(r.timeSlot);
                      setEditing(true);
                    }}
                    className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-600"
                  >
                    시간 변경
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={busy !== null}
                    className="rounded-full bg-white px-4 py-2 text-sm font-bold text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-50 disabled:opacity-40"
                  >
                    {busy === "cancel" ? "취소 중…" : "예약 취소"}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-ink">방문 시간 변경</p>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="text-xs font-bold text-ink-soft hover:text-ink"
                  >
                    닫기 ✕
                  </button>
                </div>
                <p className="mt-1 text-xs text-ink-soft">
                  이미 예약된 시간은 선택할 수 없어요. (담당 업체: {partner?.name ?? "배정 중"})
                </p>
                <div className="mt-3">
                  <Calendar
                    value={newDate}
                    onChange={(d) => {
                      setNewDate(d);
                      // 날짜가 바뀌어 선택 시간이 마감이면 해제
                      if (slotTaken(d, newTime)) setNewTime("");
                    }}
                    minDate={minDate}
                    dateStatus={dateStatus}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {TIME_SLOTS.map((t) => {
                    const sold = slotTaken(newDate, t);
                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={sold}
                        onClick={() => !sold && setNewTime(t)}
                        className={[
                          "rounded-xl border px-4 py-2.5 text-sm font-bold transition",
                          newTime === t
                            ? "border-brand bg-brand text-white"
                            : sold
                              ? "cursor-not-allowed border-line bg-cream text-ink-soft/40 line-through"
                              : "border-line bg-white text-ink hover:border-brand-200",
                        ].join(" ")}
                      >
                        {t}
                        {sold ? " 마감" : ""}
                      </button>
                    );
                  })}
                </div>
                {err && (
                  <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">
                    {err}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleReschedule}
                  disabled={busy !== null || !newDate || !newTime}
                  className="mt-3 w-full rounded-full bg-brand py-3 text-sm font-black text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy === "reschedule" ? "변경 중…" : "이 시간으로 변경하기"}
                </button>
              </div>
            )}
            {!editing && err && (
              <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">
                {err}
              </p>
            )}
          </div>
        )}

        {/* 운영팀과 소통 (전화·카카오와 별개로 기록이 남는 채널) */}
        <MessageThread
          type="reservation"
          id={r.id}
          audience="customer"
          me="customer"
          title="💬 손길 운영팀과 소통"
        />

        {/* 청소가 완료되면 후기 작성 */}
        {r.status === "completed" && (
          <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-amber-800">
              ⭐ 청소가 완료됐어요! 후기를 남겨주시겠어요?
            </p>
            <Link
              href={`/reservations/${r.id}/review`}
              className="shrink-0 rounded-full bg-amber-500 px-5 py-2.5 text-center text-sm font-bold text-white transition hover:bg-amber-600"
            >
              후기 작성하기
            </Link>
          </div>
        )}
      </div>
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

export default function ReservationsPage() {
  return <MyReservations />;
}
