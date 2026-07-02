"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Calendar from "@/components/Calendar";
import {
  PARTNERS,
  SERVICES,
  TIME_SLOTS,
  DEPOSIT,
  PROPERTY_TYPES,
  ROOM_OPTIONS,
  BATH_OPTIONS,
  SPACE_TYPES,
  PARTIAL_AREAS,
  estimatePrice,
  formatKRW,
  partnerById,
  serviceById,
} from "@/lib/data";

type Step = 0 | 1 | 2 | 3 | 4;
const STEP_LABELS = ["서비스", "날짜·시간", "정보 입력", "예약금 결제"];

function formatDateKo(key: string) {
  const d = new Date(key + "T00:00:00");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

export default function BookPage() {
  const [step, setStep] = useState<Step>(0);

  // 예약 데이터
  const [serviceId, setServiceId] = useState<string>("");
  const [pyeong, setPyeong] = useState<string>("");
  const [partnerId, setPartnerId] = useState<string>(""); // "" = 자동배정
  const [date, setDate] = useState<string | null>(null);
  const [timeSlot, setTimeSlot] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [notes, setNotes] = useState("");

  // 집/회사/부분청소 정보
  const [propertyType, setPropertyType] = useState("");
  const [rooms, setRooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [hasPet, setHasPet] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [spaceType, setSpaceType] = useState("");
  const [bizNumber, setBizNumber] = useState("");
  const [areas, setAreas] = useState<string[]>([]);
  const [floorInfo, setFloorInfo] = useState("");

  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{ id: string } | null>(null);

  const svc = serviceById(serviceId);
  const category = svc?.category;
  const pyNum = Number(pyeong) || 0;

  function toggleArea(a: string) {
    setAreas((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  }

  // 서비스 성격별 정보 입력 완료 여부
  const propertyOk =
    category === "commercial"
      ? companyName.trim().length > 0
      : category === "partial"
        ? areas.length > 0
        : Boolean(propertyType); // residential

  function buildProperty() {
    if (category === "commercial") {
      return { companyName, spaceType, bizNumber, floorInfo };
    }
    if (category === "partial") {
      return { areas, propertyType, floorInfo };
    }
    return { propertyType, rooms, bathrooms, hasPet, floorInfo };
  }

  // 확인 화면에 보여줄 집/회사 정보 요약 문자열
  function propertySummaryText(): string {
    if (category === "commercial") {
      return [companyName, spaceType, floorInfo].filter(Boolean).join(" · ");
    }
    if (category === "partial") {
      return [
        areas.length ? areas.join(", ") : "",
        propertyType,
        floorInfo,
      ]
        .filter(Boolean)
        .join(" · ");
    }
    return [
      propertyType,
      rooms,
      bathrooms ? `화장실 ${bathrooms}` : "",
      hasPet ? "반려동물 있음" : "",
      floorInfo,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  const propertyLabel =
    category === "commercial"
      ? "회사 정보"
      : category === "partial"
        ? "청소 공간"
        : "집 정보";
  const price = useMemo(
    () => (svc && pyNum ? estimatePrice(serviceId, pyNum) : 0),
    [serviceId, pyNum, svc]
  );

  // 선택한 서비스에 맞는 추천 파트너
  const matchingPartners = useMemo(() => {
    if (!svc) return PARTNERS;
    const m = PARTNERS.filter((p) => p.specialties.includes(svc.name));
    return m.length ? m : PARTNERS;
  }, [svc]);

  const resolvedPartner =
    partnerId === "" ? matchingPartners[0] : partnerById(partnerId);

  // 각 단계 유효성
  const canNext: Record<Step, boolean> = {
    0: Boolean(svc && pyNum >= 1 && pyNum <= 300),
    1: Boolean(date && timeSlot),
    2: Boolean(
      propertyOk &&
        customerName.trim() &&
        phone.replace(/\D/g, "").length >= 9 &&
        address.trim()
    ),
    3: true,
    4: true,
  };

  function go(next: Step) {
    setError(null);
    setStep(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handlePay() {
    setError(null);
    setPaying(true);
    // 목업 결제: 결제창이 뜬 것처럼 잠깐 대기
    await new Promise((r) => setTimeout(r, 1600));
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId: resolvedPartner?.id,
          serviceId,
          pyeong: pyNum,
          date,
          timeSlot,
          customerName,
          phone,
          address,
          addressDetail,
          notes,
          property: buildProperty(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "예약에 실패했어요.");
      setConfirmed({ id: data.reservation.id });
      go(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : "예약에 실패했어요.");
    } finally {
      setPaying(false);
    }
  }

  // ── 완료 화면 ──
  if (confirmed) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center">
        <div className="animate-rise rounded-[2rem] border border-line bg-white p-8 shadow-xl">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand-50 text-4xl">
            🎉
          </div>
          <h1 className="mt-5 text-2xl font-black text-ink">예약이 확정됐어요!</h1>
          <p className="mt-2 text-ink-soft">
            예약금 {formatKRW(DEPOSIT)} 결제가 완료됐어요.
            <br />
            담당 업체를 배정한 뒤 문자로 알려드릴게요.
          </p>
          <div className="mt-6 rounded-2xl bg-cream p-5 text-left">
            <Row k="예약 번호" v={confirmed.id} strong />
            <Row k="서비스" v={svc?.name ?? ""} />
            {propertySummaryText() && (
              <Row k={propertyLabel} v={propertySummaryText()} />
            )}
            <Row k="희망 업체" v={resolvedPartner?.name ?? ""} />
            <Row k="방문" v={`${date ? formatDateKo(date) : ""} ${timeSlot}`} />
            <Row k="예상 총액" v={formatKRW(price)} />
            <Row k="현장 잔금" v={formatKRW(Math.max(0, price - DEPOSIT))} />
          </div>
          <p className="mt-4 text-xs text-ink-soft">
            로그인한 계정의 &lsquo;내 예약&rsquo;에서 진행 상태를 확인할 수 있어요.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/reservations"
              className="flex-1 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-600"
            >
              내 예약 보기
            </Link>
            <Link
              href="/"
              className="flex-1 rounded-full bg-white px-6 py-3 text-sm font-bold text-ink ring-1 ring-line transition hover:bg-cream-deep"
            >
              홈으로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <h1 className="text-3xl font-black tracking-tight text-ink">청소 예약하기</h1>
      <p className="mt-1 text-ink-soft">차근차근 안내해 드릴게요. 언제든 뒤로 돌아갈 수 있어요.</p>

      {/* 스텝 인디케이터 */}
      <ol className="mt-6 flex items-center gap-2">
        {STEP_LABELS.map((label, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <div
                className={[
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition",
                  active
                    ? "bg-brand text-white"
                    : done
                      ? "bg-brand-100 text-brand-700"
                      : "bg-white text-ink-soft ring-1 ring-line",
                ].join(" ")}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className={`hidden text-sm font-medium sm:block ${active ? "text-ink" : "text-ink-soft"}`}
              >
                {label}
              </span>
              {i < STEP_LABELS.length - 1 && (
                <span className="mx-1 hidden h-px flex-1 bg-line sm:block" />
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* 좌측: 단계별 콘텐츠 */}
        <div className="min-w-0">
          {step === 0 && (
            <div className="animate-rise space-y-8">
              <Field title="어떤 청소가 필요하세요?">
                <div className="grid gap-3 sm:grid-cols-3">
                  {SERVICES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setServiceId(s.id);
                        setPartnerId("");
                      }}
                      className={[
                        "rounded-2xl border p-4 text-left transition",
                        serviceId === s.id
                          ? "border-brand bg-brand-50 ring-2 ring-brand"
                          : "border-line bg-white hover:border-brand-200",
                      ].join(" ")}
                    >
                      <div className="text-2xl">{s.emoji}</div>
                      <p className="mt-2 font-bold text-ink">{s.name}</p>
                      <p className="mt-1 text-xs leading-relaxed text-ink-soft">{s.blurb}</p>
                      <p className="mt-2 text-xs font-bold text-brand">
                        {formatKRW(s.minPrice)}~
                      </p>
                    </button>
                  ))}
                </div>
              </Field>

              <Field title="공간 크기 (평)" hint="대략적인 평수를 입력하면 예상 견적을 계산해요.">
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={300}
                    value={pyeong}
                    onChange={(e) => setPyeong(e.target.value)}
                    placeholder="예: 24"
                    className="w-32 rounded-xl border border-line bg-white px-4 py-3 text-lg font-bold text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-100"
                  />
                  <span className="text-ink-soft">평</span>
                  {price > 0 && (
                    <span className="ml-auto rounded-full bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700">
                      예상 견적 {formatKRW(price)}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[9, 18, 24, 32, 45].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPyeong(String(p))}
                      className="rounded-full border border-line bg-white px-3 py-1.5 text-sm text-ink-soft transition hover:border-brand-200 hover:text-brand"
                    >
                      {p}평
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-ink-soft">
                  ⓘ 1인 작업 기준 예상가예요. 오염도·작업 범위에 따라 추가 인력/시간이
                  붙을 수 있고, 최종 금액은 방문·상담 후 확정됩니다.
                </p>
              </Field>

              {svc && (
                <Field
                  title="희망하는 청소 파트너"
                  hint="원하는 업체를 지정하거나, 손길이 골라드릴 수 있어요."
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setPartnerId("")}
                      className={[
                        "rounded-2xl border p-4 text-left transition",
                        partnerId === ""
                          ? "border-brand bg-brand-50 ring-2 ring-brand"
                          : "border-line bg-white hover:border-brand-200",
                      ].join(" ")}
                    >
                      <p className="font-bold text-ink">✨ 손길이 골라줄게요</p>
                      <p className="mt-1 text-xs text-ink-soft">
                        해당 서비스에 가장 잘 맞는 검증 업체를 배정해요.
                      </p>
                    </button>
                    {matchingPartners.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPartnerId(p.id)}
                        className={[
                          "flex items-start gap-3 rounded-2xl border p-4 text-left transition",
                          partnerId === p.id
                            ? "border-brand bg-brand-50 ring-2 ring-brand"
                            : "border-line bg-white hover:border-brand-200",
                        ].join(" ")}
                      >
                        <span
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black ${p.accent}`}
                        >
                          {p.name.slice(0, 1)}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-bold text-ink">{p.name}</span>
                          <span className="block text-xs text-amber-500">
                            ★ {p.rating} · 후기 {p.reviews}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </Field>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="animate-rise space-y-8">
              <Field title="언제 방문할까요?">
                <Calendar value={date} onChange={setDate} />
              </Field>
              <Field title="방문 시간대">
                <div className="flex flex-wrap gap-2">
                  {TIME_SLOTS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTimeSlot(t)}
                      className={[
                        "rounded-xl border px-5 py-3 text-sm font-bold transition",
                        timeSlot === t
                          ? "border-brand bg-brand text-white"
                          : "border-line bg-white text-ink hover:border-brand-200",
                      ].join(" ")}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="animate-rise space-y-8">
              {/* 서비스 성격별: 집 정보 / 회사 정보 / 부분청소 정보 */}
              {category === "commercial" ? (
                <Field
                  title="회사 정보"
                  hint="사업장 정보를 알려주시면 담당 업체가 미리 준비할 수 있어요."
                >
                  <div className="grid gap-4">
                    <Input
                      label="상호(회사)명"
                      value={companyName}
                      onChange={setCompanyName}
                      placeholder="예: (주)손길컴퍼니"
                    />
                    <div>
                      <label className="mb-2 block text-sm font-bold text-ink">
                        공간 형태
                      </label>
                      <ChipGroup
                        options={SPACE_TYPES}
                        value={spaceType}
                        onChange={setSpaceType}
                      />
                    </div>
                    <Input
                      label="사업자등록번호"
                      value={bizNumber}
                      onChange={setBizNumber}
                      placeholder="세금계산서가 필요하면 입력해 주세요"
                      optional
                    />
                    <Input
                      label="층수·규모·주차 등"
                      value={floorInfo}
                      onChange={setFloorInfo}
                      placeholder="예: 3층, 약 60평, 지하주차 가능"
                      optional
                    />
                  </div>
                </Field>
              ) : category === "partial" ? (
                <Field
                  title="부분 청소 정보"
                  hint="청소가 필요한 공간을 골라주세요. (여러 곳 선택 가능)"
                >
                  <div className="grid gap-4">
                    <div className="flex flex-wrap gap-2">
                      {PARTIAL_AREAS.map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => toggleArea(a)}
                          className={[
                            "rounded-full border px-4 py-2 text-sm font-bold transition",
                            areas.includes(a)
                              ? "border-brand bg-brand text-white"
                              : "border-line bg-white text-ink-soft hover:border-brand-200",
                          ].join(" ")}
                        >
                          {areas.includes(a) ? "✓ " : ""}
                          {a}
                        </button>
                      ))}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-ink">
                        주거 형태{" "}
                        <span className="font-normal text-ink-soft">(선택)</span>
                      </label>
                      <ChipGroup
                        options={PROPERTY_TYPES}
                        value={propertyType}
                        onChange={setPropertyType}
                      />
                    </div>
                    <Input
                      label="층수·엘리베이터 등"
                      value={floorInfo}
                      onChange={setFloorInfo}
                      placeholder="예: 5층, 엘리베이터 있음"
                      optional
                    />
                  </div>
                </Field>
              ) : (
                <Field
                  title="집 정보"
                  hint="공간 정보를 알려주시면 더 정확하게 준비해 드려요."
                >
                  <div className="grid gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-ink">
                        주거 형태
                      </label>
                      <ChipGroup
                        options={PROPERTY_TYPES}
                        value={propertyType}
                        onChange={setPropertyType}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-ink">
                        방 개수
                      </label>
                      <ChipGroup
                        options={ROOM_OPTIONS}
                        value={rooms}
                        onChange={setRooms}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-ink">
                        화장실 개수
                      </label>
                      <ChipGroup
                        options={BATH_OPTIONS}
                        value={bathrooms}
                        onChange={setBathrooms}
                      />
                    </div>
                    <label className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3">
                      <span className="text-sm font-bold text-ink">
                        🐾 반려동물이 있어요
                      </span>
                      <button
                        type="button"
                        onClick={() => setHasPet((v) => !v)}
                        className={[
                          "relative h-6 w-11 rounded-full transition",
                          hasPet ? "bg-brand" : "bg-cream-deep",
                        ].join(" ")}
                        aria-pressed={hasPet}
                      >
                        <span
                          className={[
                            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                            hasPet ? "left-[22px]" : "left-0.5",
                          ].join(" ")}
                        />
                      </button>
                    </label>
                    <Input
                      label="층수·엘리베이터·주차 등"
                      value={floorInfo}
                      onChange={setFloorInfo}
                      placeholder="예: 11층, 엘리베이터 있음, 방문 주차 가능"
                      optional
                    />
                  </div>
                </Field>
              )}

              <Field title="예약자 정보">
                <div className="grid gap-4">
                  <Input
                    label="이름"
                    value={customerName}
                    onChange={setCustomerName}
                    placeholder="홍길동"
                  />
                  <Input
                    label="연락처"
                    value={phone}
                    onChange={setPhone}
                    placeholder="010-1234-5678"
                    type="tel"
                  />
                  <Input
                    label="방문 주소"
                    value={address}
                    onChange={setAddress}
                    placeholder="도로명 주소를 입력해 주세요"
                  />
                  <Input
                    label="상세 주소"
                    value={addressDetail}
                    onChange={setAddressDetail}
                    placeholder="동·호수, 출입 방법 등"
                    optional
                  />
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-ink">
                      요청사항 <span className="font-normal text-ink-soft">(선택)</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="반려동물, 특별히 신경 써야 할 공간 등을 알려주세요."
                      className="w-full resize-none rounded-xl border border-line bg-white px-4 py-3 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                </div>
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="animate-rise space-y-6">
              <Field title="예약 내용 확인">
                <div className="rounded-2xl border border-line bg-white p-5">
                  <Row k="서비스" v={`${svc?.emoji} ${svc?.name}`} />
                  <Row k="공간 크기" v={`${pyNum}평`} />
                  {propertySummaryText() && (
                    <Row k={propertyLabel} v={propertySummaryText()} />
                  )}
                  <Row k="희망 업체" v={resolvedPartner?.name ?? ""} />
                  <Row k="방문 일시" v={`${date ? formatDateKo(date) : ""} ${timeSlot}`} />
                  <Row k="예약자" v={`${customerName} · ${phone}`} />
                  <Row k="주소" v={`${address} ${addressDetail}`.trim()} />
                  {notes && <Row k="요청사항" v={notes} />}
                </div>
              </Field>

              <Field title="결제 정보">
                <div className="rounded-2xl border border-line bg-white p-5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-ink-soft">예상 총 청소비</span>
                    <span className="text-lg font-bold text-ink">{formatKRW(price)}</span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
                    <span className="font-bold text-ink">지금 결제 (예약금)</span>
                    <span className="text-2xl font-black text-brand">{formatKRW(DEPOSIT)}</span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-ink-soft">청소 완료 후 현장 결제</span>
                    <span className="font-bold text-ink">
                      {formatKRW(Math.max(0, price - DEPOSIT))}
                    </span>
                  </div>
                  <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-ink-soft">
                    ⓘ 이 금액은 <b>1인 작업 기준 예상가</b>예요. 평수·오염도·작업 범위에 따라
                    추가 인력 또는 추가 시간이 발생할 수 있으며, 최종 금액은 방문·상담 후
                    확정됩니다.
                  </p>
                </div>
                <div className="mt-3 rounded-xl bg-mint-soft/60 px-4 py-3 text-xs leading-relaxed text-ink-soft">
                  ⓘ 지금은 <b>목업(테스트) 결제</b>예요. 실제로 돈이 빠져나가지 않아요.
                  아래 버튼을 누르면 결제가 완료된 것처럼 예약이 확정됩니다.
                </div>
              </Field>

              {error && (
                <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handlePay}
                disabled={paying}
                className="w-full rounded-full bg-brand py-4 text-base font-black text-white shadow-lg shadow-brand/20 transition hover:bg-brand-600 disabled:opacity-70"
              >
                {paying ? "결제 진행 중…" : `카드로 ${formatKRW(DEPOSIT)} 결제하고 예약 확정`}
              </button>
            </div>
          )}
        </div>

        {/* 우측: 요약 사이드바 */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-ink-soft">예약 요약</p>
            <div className="mt-3 space-y-2 text-sm">
              <SummaryRow k="서비스" v={svc ? `${svc.emoji} ${svc.name}` : "미선택"} />
              <SummaryRow k="크기" v={pyNum ? `${pyNum}평` : "—"} />
              <SummaryRow k="업체" v={svc ? (resolvedPartner?.name ?? "—") : "—"} />
              <SummaryRow k="일시" v={date ? `${formatDateKo(date)} ${timeSlot}`.trim() : "—"} />
            </div>
            <div className="mt-4 border-t border-line pt-4">
              <div className="flex justify-between text-sm text-ink-soft">
                <span>예상 견적</span>
                <span className="font-bold text-ink">
                  {price ? formatKRW(price) : "—"}
                </span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="font-bold text-ink">예약금</span>
                <span className="font-black text-brand">{formatKRW(DEPOSIT)}</span>
              </div>
            </div>
          </div>

          {/* 네비게이션 */}
          <div className="mt-4 flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => go((step - 1) as Step)}
                className="flex-1 rounded-full bg-white px-5 py-3 text-sm font-bold text-ink ring-1 ring-line transition hover:bg-cream-deep"
              >
                이전
              </button>
            )}
            {step < 3 && (
              <button
                type="button"
                disabled={!canNext[step]}
                onClick={() => go((step + 1) as Step)}
                className="flex-[2] rounded-full bg-ink px-5 py-3 text-sm font-bold text-cream transition hover:opacity-90 disabled:opacity-30"
              >
                다음
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-lg font-black text-ink">{title}</h2>
      {hint && <p className="mt-0.5 mb-3 text-sm text-ink-soft">{hint}</p>}
      <div className={hint ? "" : "mt-3"}>{children}</div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  optional,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  optional?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-ink">
        {label}{" "}
        {optional && <span className="font-normal text-ink-soft">(선택)</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-line bg-white px-4 py-3 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}

function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={[
            "rounded-full border px-4 py-2 text-sm font-bold transition",
            value === opt
              ? "border-brand bg-brand text-white"
              : "border-line bg-white text-ink-soft hover:border-brand-200",
          ].join(" ")}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="shrink-0 text-ink-soft">{k}</span>
      <span className={`text-right ${strong ? "text-lg font-black text-brand" : "font-medium text-ink"}`}>
        {v}
      </span>
    </div>
  );
}

function SummaryRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="shrink-0 text-ink-soft">{k}</span>
      <span className="truncate text-right font-medium text-ink">{v}</span>
    </div>
  );
}
