import type { Metadata } from "next";
import PolicyLayout, { CalloutBox, PolicySection } from "@/components/PolicyLayout";
import { COMPANY, DEPOSIT, formatKRW } from "@/lib/data";

export const metadata: Metadata = {
  title: "환불정책 — 손길",
  description: "손길의 예약금 30,000원 기준 환불 정책 안내입니다.",
};

const RULES = [
  "청소 예정일 2일 전 18:00까지 취소하는 경우 예약금 전액 환불이 가능합니다.",
  "청소 예정일 1일 전 18:00까지 취소하는 경우 파트너 일정 보상 및 운영비를 제외한 50% 환불이 가능합니다.",
  "청소 당일 취소, 고객 부재, 주소 오기재, 연락 불가로 서비스 진행이 불가능한 경우 예약금 환불이 제한될 수 있습니다.",
  "손길 또는 제휴 청소 파트너의 사정으로 예약이 취소되는 경우 예약금은 전액 환불됩니다.",
  "결제 취소 및 환불은 고객센터 접수 후 영업일 기준 3일 이내 처리합니다.",
  "카드사 및 결제수단에 따라 실제 환불 반영일은 달라질 수 있습니다.",
  "청소 서비스가 이미 시작된 이후에는 제공된 용역의 특성상 예약금 환불이 제한될 수 있습니다.",
];

export default function RefundPolicyPage() {
  return (
    <PolicyLayout
      title="환불정책"
      intro={`손길의 온라인 결제 금액은 청소 예약 확정을 위한 예약금 ${formatKRW(DEPOSIT)}입니다. 환불은 예약금 ${formatKRW(DEPOSIT)}을 기준으로 처리됩니다.`}
    >
      <PolicySection heading="환불 기준">
        <ol className="space-y-3">
          {RULES.map((rule, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-black text-brand">
                {i + 1}
              </span>
              <span>{rule}</span>
            </li>
          ))}
        </ol>
      </PolicySection>

      <CalloutBox>
        환불 문의는 고객센터 {COMPANY.tel} 또는 이메일 {COMPANY.email}로 접수해 주세요.
      </CalloutBox>
    </PolicyLayout>
  );
}
