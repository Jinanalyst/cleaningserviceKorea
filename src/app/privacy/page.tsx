import type { Metadata } from "next";
import PolicyLayout, { PolicySection } from "@/components/PolicyLayout";
import { COMPANY } from "@/lib/data";

export const metadata: Metadata = {
  title: "개인정보처리방침 — 손길",
  description: "체인랩스는 손길 서비스 운영을 위해 필요한 최소한의 개인정보를 수집·처리합니다.",
};

const COLLECTED = [
  "이름",
  "휴대폰번호",
  "이메일",
  "청소 주소",
  "예약 희망일",
  "청소 요청사항",
  "결제 정보",
  "서비스 이용 기록",
];

const PURPOSES = [
  "청소 예약 접수",
  "고객 상담 및 문의 응대",
  "청소 파트너 배정",
  "예약 일정 조율",
  "결제 및 환불 처리",
  "서비스 품질 개선",
  "분쟁 처리 및 기록 보관",
];

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((it) => (
        <li
          key={it}
          className="rounded-full bg-cream px-3 py-1.5 text-sm text-ink-soft ring-1 ring-line"
        >
          {it}
        </li>
      ))}
    </ul>
  );
}

export default function PrivacyPage() {
  return (
    <PolicyLayout
      title="개인정보처리방침"
      intro="체인랩스는 손길 서비스 운영을 위해 필요한 최소한의 개인정보를 수집하고 처리합니다."
    >
      <PolicySection heading="1. 수집하는 개인정보 항목">
        <BulletList items={COLLECTED} />
      </PolicySection>

      <PolicySection heading="2. 개인정보 수집 및 이용 목적">
        <BulletList items={PURPOSES} />
      </PolicySection>

      <PolicySection heading="3. 개인정보 보유 및 이용 기간">
        <p>
          개인정보는 서비스 제공 목적 달성 후 지체 없이 파기합니다. 단, 관련 법령에 따라
          보관이 필요한 경우 해당 기간 동안 보관할 수 있습니다.
        </p>
      </PolicySection>

      <PolicySection heading="4. 개인정보 제3자 제공">
        <p>
          손길은 청소 예약 수행을 위해 고객의 이름, 연락처, 방문 주소, 예약일시, 요청사항을
          배정된 제휴 청소 파트너에게 제공할 수 있습니다. 제공받는 자는 해당 예약 수행 목적
          내에서만 개인정보를 이용해야 하며, 목적 달성 후 지체 없이 파기해야 합니다.
        </p>
      </PolicySection>

      <PolicySection heading="5. 개인정보 처리위탁">
        <p>
          손길은 서비스 운영을 위해 PG사, 호스팅사, 문자/알림 발송 서비스 등 외부 업체에
          개인정보 처리를 위탁할 수 있습니다.
        </p>
      </PolicySection>

      <PolicySection heading="6. 이용자의 권리">
        <p>
          이용자는 자신의 개인정보에 대해 열람, 정정, 삭제, 처리정지를 요청할 수 있습니다.
        </p>
      </PolicySection>

      <PolicySection heading="7. 개인정보 보호책임자">
        <ul className="space-y-1">
          <li>· 책임자: {COMPANY.ceo}</li>
          <li>
            · 이메일:{" "}
            <a href={`mailto:${COMPANY.email}`} className="text-brand hover:underline">
              {COMPANY.email}
            </a>
          </li>
          <li>· 고객센터: {COMPANY.tel}</li>
        </ul>
      </PolicySection>

      <PolicySection heading="8. 문의">
        <p>
          개인정보 관련 문의는 고객센터 또는 이메일을 통해 접수할 수 있습니다.
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
