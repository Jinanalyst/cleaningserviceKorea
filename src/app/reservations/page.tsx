"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import {
  STATUS_META,
  STATUS_FLOW,
  partnerById,
  serviceById,
  formatKRW,
  formatProperty,
  propertyLabelOf,
  DEPOSIT,
  type ReservationStatus,
  type PropertyInfo,
} from "@/lib/data";

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
};

function formatDateKo(key: string) {
  const d = new Date(key + "T00:00:00");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

function MyReservations() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [results, setResults] = useState<Reservation[] | null>(null);

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
    })();
  }, []);

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
            <ReservationCard key={r.id} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReservationCard({ r }: { r: Reservation }) {
  const svc = serviceById(r.serviceId);
  const partner = partnerById(r.partnerId);
  const meta = STATUS_META[r.status];
  const isCancelled = r.status === "cancelled";
  const activeIdx = STATUS_FLOW.indexOf(r.status);

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
          <Info k="예상 총액" v={formatKRW(r.price)} />
        </dl>

        <div className="mt-5 flex items-center justify-between rounded-2xl bg-brand-50 px-5 py-4">
          <div>
            <p className="text-xs text-brand-700">결제 완료 (예약금)</p>
            <p className="text-lg font-black text-brand">{formatKRW(r.deposit ?? DEPOSIT)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-soft">현장 잔금</p>
            <p className="font-bold text-ink">{formatKRW(Math.max(0, r.price - (r.deposit ?? DEPOSIT)))}</p>
          </div>
        </div>

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
