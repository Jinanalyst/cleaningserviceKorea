import type { Metadata } from "next";
import PolicyLayout, { CalloutBox, PolicySection } from "@/components/PolicyLayout";
import { DEPOSIT, SERVICE_INFO, formatKRW } from "@/lib/data";

export const metadata: Metadata = {
  title: "서비스 상세정보 — 손길",
  description: "손길은 고객과 제휴 청소 파트너를 연결하는 청소 예약 중개 플랫폼입니다.",
};

export default function ServiceInfoPage() {
  return (
    <PolicyLayout
      title="서비스 상세정보"
      intro="손길은 고객이 원하는 청소 유형, 날짜, 시간, 주소, 요청사항을 입력하면 제휴 청소 파트너를 연결해주는 청소 예약 중개 플랫폼입니다."
    >
      <PolicySection heading="손길은 어떤 서비스인가요?">
        <p>
          고객은 온라인에서 예약금 {formatKRW(DEPOSIT)}을 결제하여 예약을 확정하고, 청소
          완료 후 잔금은 현장에서 파트너에게 직접 결제합니다.
        </p>
        <p>
          청소 서비스는 손길이 직접 수행하는 것이 아니라 제휴 청소 파트너가 수행합니다.
          손길은 예약 접수, 일정 조율, 파트너 배정, 고객 응대 및 예약 관리 업무를 제공합니다.
        </p>
      </PolicySection>

      <PolicySection heading="서비스 항목">
        <ol className="space-y-4">
          {SERVICE_INFO.map((s, i) => (
            <li
              key={s.name}
              className="rounded-2xl border border-line bg-cream/50 p-4"
            >
              <p className="font-bold text-ink">
                {i + 1}. {s.name}
              </p>
              <ul className="mt-2 space-y-1 text-sm text-ink-soft">
                <li>· {s.desc}</li>
                <li>
                  · 청소 금액: <b className="text-ink">방문·상담 후 협의</b>
                </li>
                <li>
                  · 온라인 결제:{" "}
                  <b className="text-brand">예약금 {formatKRW(DEPOSIT)}</b>
                </li>
              </ul>
            </li>
          ))}
        </ol>
      </PolicySection>

      <CalloutBox>
        청소 총액은 공간 크기, 오염도, 짐 유무, 추가 요청사항에 따라 달라지며 방문·상담
        후 협의로 확정됩니다. 온라인 결제는 예약금 {formatKRW(DEPOSIT)}으로 고정되며,
        잔금은 청소 완료 후 현장에서 결제합니다.
      </CalloutBox>
    </PolicyLayout>
  );
}
