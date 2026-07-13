import type { Metadata } from "next";
import PolicyLayout, { CalloutBox, PolicySection } from "@/components/PolicyLayout";
export const metadata: Metadata = {
  title: "결제금액 안내 — 손길",
  description:
    "손길의 온라인 결제 금액은 청소 전체 비용이 아닌 예약 확정을 위한 예약금(견적 금액의 7%)입니다.",
};

function InfoRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-line py-3 last:border-0 sm:flex-row sm:gap-4">
      <span className="shrink-0 font-bold text-ink sm:w-36">{k}</span>
      <span className="text-ink-soft">{v}</span>
    </div>
  );
}

export default function PaymentInfoPage() {
  return (
    <PolicyLayout
      title="결제금액 안내"
      intro={`손길의 온라인 결제 금액은 청소 전체 비용이 아닌 예약 확정을 위한 예약금(견적 금액의 7%)입니다.`}
    >
      <PolicySection heading="결제 정보">
        <div className="text-sm">
          <InfoRow k="결제 상품명" v="손길 청소 예약금" />
          <InfoRow
            k="결제 금액"
            v={<b className="text-brand">견적 금액의 7% (손길 플랫폼 수수료)</b>}
          />
          <InfoRow k="결제 목적" v="예약 확정 및 파트너 배정" />
          <InfoRow
            k="결제 방식"
            v="온라인 카드결제 또는 PG사에서 제공하는 결제수단"
          />
          <InfoRow k="잔금 결제" v="청소 완료 후 현장 결제" />
          <InfoRow
            k="청소 총액"
            v="서비스 종류, 공간 크기, 오염도, 추가 요청사항에 따라 달라질 수 있음"
          />
        </div>
      </PolicySection>

      <CalloutBox>
        손길은 고객이 임의로 결제 금액을 입력하는 서비스를 제공하지 않습니다.
        온라인 결제는 예약 견적 금액의 7%(손길 플랫폼 수수료)로 자동 계산되며, 청소 총액은 상담 및
        현장 확인 후 안내됩니다.
      </CalloutBox>
    </PolicyLayout>
  );
}
