"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  SERVICES,
  CONSULTATION_STATUS_META,
  serviceById,
  formatKRW,
  type ConsultationStatus,
} from "@/lib/data";

type Consultation = {
  id: string;
  createdAt: string;
  customerName: string;
  phone: string;
  serviceId: string;
  pyeong: number | null;
  preferredDate: string;
  status: ConsultationStatus;
  quotedPrice: number | null;
  quoteNote: string;
};

type Form = {
  customerName: string;
  phone: string;
  serviceId: string;
  pyeong: string;
  address: string;
  addressDetail: string;
  preferredDate: string;
  notes: string;
};

const EMPTY: Form = {
  customerName: "",
  phone: "",
  serviceId: "",
  pyeong: "",
  address: "",
  addressDetail: "",
  preferredDate: "",
  notes: "",
};

export default function ConsultPage() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<Consultation | null>(null);

  // 로그인 고객의 기존 상담 내역 (견적 조회용)
  const [mine, setMine] = useState<Consultation[]>([]);

  async function loadMine() {
    try {
      const res = await fetch("/api/consultations", { cache: "no-store" });
      if (!res.ok) return; // 비로그인(401)은 조용히 무시
      const data = await res.json();
      setMine(data.consultations ?? []);
    } catch {
      /* noop */
    }
  }

  useEffect(() => {
    loadMine();
  }, [done]);

  function set(patch: Partial<Form>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "신청에 실패했어요. 잠시 후 다시 시도해 주세요.");
        return;
      }
      setDone(data.consultation);
      setForm(EMPTY);
    } catch {
      setError("네트워크 오류가 발생했어요. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center">
        <div className="rounded-3xl border border-line bg-white p-8 shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-3xl">
            ✅
          </div>
          <h1 className="mt-4 text-2xl font-black text-ink">상담 신청 완료!</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            신청이 접수됐어요. 담당자가 곧 연락드려 방문·상담 일정을 잡고,
            현장 확인 후 <b>합의된 견적</b>을 안내드릴게요.
          </p>
          <div className="mt-5 rounded-2xl bg-cream px-5 py-4">
            <p className="text-xs text-ink-soft">상담 접수번호</p>
            <p className="mt-1 text-2xl font-black tracking-widest text-brand">
              {done.id}
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => setDone(null)}
              className="rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-cream"
            >
              추가로 신청하기
            </button>
            <Link
              href="/"
              className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-ink ring-1 ring-line"
            >
              홈으로
            </Link>
          </div>
        </div>

        {mine.length > 0 && <MyConsultations rows={mine} />}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <p className="text-sm font-bold text-brand">무료 방문 상담</p>
      <h1 className="mt-1 text-3xl font-black tracking-tight text-ink">
        견적 상담 신청
      </h1>
      <p className="mt-2 leading-relaxed text-ink-soft">
        공간을 직접 보고 정확한 견적을 잡아드려요. 아래 정보를 남겨 주시면
        담당자가 연락해 상담 일정을 잡고, 대면 상담 후 <b>합의된 견적</b>을
        안내드립니다. 상담은 무료예요.
      </p>

      <form
        onSubmit={submit}
        className="mt-8 space-y-5 rounded-3xl border border-line bg-white p-6 shadow-sm"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="이름" required>
            <input
              value={form.customerName}
              onChange={(e) => set({ customerName: e.target.value })}
              placeholder="홍길동"
              className={inputCls}
            />
          </Field>
          <Field label="연락처" required>
            <input
              value={form.phone}
              onChange={(e) => set({ phone: e.target.value })}
              placeholder="010-1234-5678"
              inputMode="tel"
              className={inputCls}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="희망 서비스">
            <select
              value={form.serviceId}
              onChange={(e) => set({ serviceId: e.target.value })}
              className={inputCls}
            >
              <option value="">선택 안 함 / 잘 모르겠어요</option>
              {SERVICES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.emoji} {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="평수 (선택)">
            <input
              value={form.pyeong}
              onChange={(e) =>
                set({ pyeong: e.target.value.replace(/[^\d]/g, "") })
              }
              placeholder="예) 24"
              inputMode="numeric"
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="주소 (선택)">
          <input
            value={form.address}
            onChange={(e) => set({ address: e.target.value })}
            placeholder="서울 마포구 월드컵북로 120"
            className={inputCls}
          />
        </Field>
        <Field label="상세 주소 (선택)">
          <input
            value={form.addressDetail}
            onChange={(e) => set({ addressDetail: e.target.value })}
            placeholder="302동 1104호"
            className={inputCls}
          />
        </Field>

        <Field label="희망 방문일 (선택)">
          <input
            value={form.preferredDate}
            onChange={(e) => set({ preferredDate: e.target.value })}
            placeholder="예) 7월 둘째 주 평일 오전"
            className={inputCls}
          />
        </Field>

        <Field label="요청사항 (선택)">
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="청소 범위, 오염 정도, 반려동물 여부 등 알려주시면 상담이 빨라져요."
            className={`${inputCls} resize-none`}
          />
        </Field>

        {error && (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 ring-1 ring-rose-200">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-brand px-6 py-3.5 text-base font-bold text-white transition hover:bg-brand-600 disabled:opacity-40"
        >
          {submitting ? "신청 중…" : "상담 신청하기"}
        </button>
        <p className="text-center text-xs text-ink-soft">
          신청 시 상담을 위한 개인정보 수집·이용에 동의하는 것으로 간주돼요.
          견적은 상담 후 확정되며, 온라인 선결제가 필요하지 않습니다.
        </p>
      </form>

      {mine.length > 0 && <MyConsultations rows={mine} />}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-100";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-ink">
        {label}
        {required && <span className="ml-1 text-brand">*</span>}
      </span>
      {children}
    </label>
  );
}

// 로그인 고객이 자신의 상담 신청과 합의 견적을 확인하는 목록
function MyConsultations({ rows }: { rows: Consultation[] }) {
  return (
    <div className="mt-10 text-left">
      <h2 className="text-lg font-black text-ink">내 상담·견적 내역</h2>
      <p className="mt-1 text-sm text-ink-soft">
        상담이 진행되면 여기에서 합의된 견적을 확인할 수 있어요.
      </p>
      <div className="mt-4 space-y-3">
        {rows.map((c) => {
          const meta = CONSULTATION_STATUS_META[c.status];
          const svc = serviceById(c.serviceId);
          return (
            <div
              key={c.id}
              className="rounded-2xl border border-line bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-black text-ink">{c.id}</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${meta.tone}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                </div>
                {c.quotedPrice != null && (
                  <span className="text-lg font-black text-brand">
                    {formatKRW(c.quotedPrice)}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-ink-soft">
                {svc ? `${svc.emoji} ${svc.name}` : "서비스 미정"}
                {c.pyeong ? ` · ${c.pyeong}평` : ""}
                {c.preferredDate ? ` · ${c.preferredDate}` : ""}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                {meta.desc}
              </p>
              {c.quoteNote && (
                <p className="mt-2 rounded-lg bg-cream px-3 py-2 text-sm text-ink-soft">
                  📋 {c.quoteNote}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
