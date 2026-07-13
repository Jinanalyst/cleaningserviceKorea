"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { formatKRW } from "@/lib/data";

type PartnerPrice = { id: string; name: string; startPrice: number; note: string };
type PriceList = { partnerId: string; companyName: string; prices: PartnerPrice[] };

export default function PartnerPricesPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [lists, setLists] = useState<PriceList[]>([]);

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
        const res = await fetch("/api/partner/prices", { cache: "no-store" });
        const data = await res.json();
        setLists(data.lists ?? []);
      } catch {
        setLists([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-medium text-brand-600 shadow-sm ring-1 ring-brand-100">
        🧾 파트너 단가 설정
      </span>
      <h1 className="mt-4 text-3xl font-black tracking-tight text-ink">우리 팀 서비스 단가</h1>
      <p className="mt-2 leading-relaxed text-ink-soft">
        서비스별 <b className="text-ink">시작 가격</b>을 직접 설정하세요. 고객이 예약 전에 대략적인
        견적을 미리 확인할 수 있어요. 최종 금액은 방문·상담 후 확정됩니다.
      </p>

      {loading && <p className="mt-10 text-center text-ink-soft">불러오는 중…</p>}

      {/* 비로그인 */}
      {!loading && authed === false && (
        <div className="mt-10 rounded-2xl border border-line bg-white p-8 text-center">
          <p className="text-4xl">🔒</p>
          <p className="mt-3 font-bold text-ink">로그인이 필요해요</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            단가는 승인된 파트너 계정으로 로그인해야 설정할 수 있어요.
          </p>
          <Link
            href="/login?next=/partners/prices"
            className="mt-5 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white"
          >
            로그인하기
          </Link>
        </div>
      )}

      {/* 로그인했지만 승인된 파트너가 아님 */}
      {!loading && authed && lists.length === 0 && (
        <div className="mt-10 rounded-2xl border border-line bg-white p-8 text-center">
          <p className="text-4xl">🤝</p>
          <p className="mt-3 font-bold text-ink">아직 승인된 파트너가 아니에요</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            파트너 심사에 통과하면 이 화면에서 서비스 단가를 직접 설정할 수 있어요.
          </p>
          <Link
            href="/partners/apply"
            className="mt-5 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white"
          >
            파트너 신청하기
          </Link>
        </div>
      )}

      {/* 단가 편집 */}
      {!loading && authed && lists.length > 0 && (
        <div className="mt-8 space-y-8">
          {lists.map((list) => (
            <PartnerPriceEditor key={list.partnerId} list={list} />
          ))}
        </div>
      )}
    </div>
  );
}

function PartnerPriceEditor({ list }: { list: PriceList }) {
  const [prices, setPrices] = useState<PartnerPrice[]>(list.prices);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(id: string, patch: Partial<PartnerPrice>) {
    setPrices((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    setSaved(false);
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/partner/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId: list.partnerId, prices }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "저장에 실패했어요.");
      setPrices(data.list.prices);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
        <div>
          <p className="text-xs text-ink-soft">업체</p>
          <p className="text-lg font-black text-ink">{list.companyName}</p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700">
          {list.partnerId}
        </span>
      </div>

      <div className="space-y-4 px-6 py-5">
        {prices.map((p) => (
          <div key={p.id} className="rounded-2xl border border-line bg-cream/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <b className="text-ink">{p.name}</b>
              <span className="shrink-0 text-sm font-bold text-brand">
                {formatKRW(p.startPrice)}~
              </span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink-soft">
                  시작 가격 (원)
                </label>
                <input
                  inputMode="numeric"
                  value={p.startPrice ? String(p.startPrice) : ""}
                  onChange={(e) =>
                    update(p.id, {
                      startPrice: parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0,
                    })
                  }
                  placeholder="예: 60000"
                  className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink-soft">안내 문구</label>
                <input
                  value={p.note}
                  onChange={(e) => update(p.id, { note: e.target.value })}
                  placeholder="고객에게 보여줄 설명"
                  className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>
          </div>
        ))}

        {error && (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-ink-soft">
            {saved ? "✓ 저장됐어요. 고객에게 반영돼요." : "변경 후 저장을 눌러 주세요."}
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-brand px-6 py-2.5 text-sm font-black text-white transition hover:bg-brand-600 disabled:opacity-40"
          >
            {saving ? "저장 중…" : "단가 저장하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
