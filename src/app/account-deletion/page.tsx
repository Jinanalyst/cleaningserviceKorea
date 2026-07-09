import type { Metadata } from "next";
import PolicyLayout, { PolicySection, CalloutBox } from "@/components/PolicyLayout";
import DeleteAccountPanel from "@/components/DeleteAccountPanel";
import { COMPANY } from "@/lib/data";

export const metadata: Metadata = {
  title: "계정 및 데이터 삭제 요청 — 손길",
  description:
    "손길(체인랩스) 앱·웹 계정과 개인정보 삭제를 요청하는 방법을 안내합니다. 앱 또는 이 페이지에서 직접 삭제하거나 고객센터로 요청할 수 있어요.",
};

// 삭제되는 데이터 / 보관되는 데이터 (Google Play 데이터 삭제 요구사항 충족)
const DELETED = [
  "로그인 계정(구글·카카오 연동 정보)",
  "이름·연락처·이메일 등 프로필 정보",
  "작성한 청소 후기 및 첨부 사진",
  "예약·상담 내역에 포함된 이름·연락처·주소·요청사항",
];

const RETAINED = [
  "결제·계약 관련 거래 기록 — 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 5년",
  "대금 결제 및 재화 공급 기록 — 관계 법령에 따라 5년",
  "소비자 불만·분쟁 처리 기록 — 관계 법령에 따라 3년",
];

// 절차 단계 (스토어 등록정보 요구: 눈에 띄게 표시)
const STEPS_IN_APP = [
  "손길 앱을 열고 삭제하려는 계정으로 로그인해요.",
  "‘계정’ 탭 → ‘계정 삭제’ 를 선택해요.",
  "안내에 따라 삭제를 확인하면 계정과 개인정보가 파기돼요.",
];

const STEPS_WEB = [
  "아래 ‘계정 직접 삭제’ 영역에서 삭제하려는 계정으로 로그인해요.",
  "확인 문구(삭제)를 입력하고 ‘내 계정 영구 삭제’ 를 눌러요.",
  "삭제가 완료되면 로그아웃되고 개인정보가 파기돼요.",
];

function NumberedSteps({ items }: { items: string[] }) {
  return (
    <ol className="space-y-3">
      {items.map((it, i) => (
        <li key={it} className="flex gap-3">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-black text-white">
            {i + 1}
          </span>
          <span className="text-sm leading-relaxed text-ink-soft">{it}</span>
        </li>
      ))}
    </ol>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it} className="flex gap-2 text-sm leading-relaxed text-ink-soft">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-mint" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AccountDeletionPage() {
  return (
    <PolicyLayout
      title="계정 및 데이터 삭제 요청"
      intro="손길 앱·웹에서 만든 계정과 개인정보를 삭제하는 방법을 안내합니다. 아래에서 직접 삭제하거나 고객센터로 요청할 수 있어요."
    >
      <PolicySection heading="앱 · 개발자 정보">
        <ul className="space-y-1">
          <li>· 앱 이름: 손길 (Songil)</li>
          <li>· 개발자/사업자: {COMPANY.bizName} (대표 {COMPANY.ceo})</li>
          <li>· 사업자등록번호: {COMPANY.bizNumber}</li>
          <li>
            · 문의:{" "}
            <a href={`mailto:${COMPANY.email}`} className="text-brand hover:underline">
              {COMPANY.email}
            </a>{" "}
            · 고객센터 {COMPANY.tel}
          </li>
        </ul>
      </PolicySection>

      <PolicySection heading="1. 앱에서 삭제하기">
        <NumberedSteps items={STEPS_IN_APP} />
      </PolicySection>

      <PolicySection heading="2. 이 페이지에서 바로 삭제하기">
        <NumberedSteps items={STEPS_WEB} />
        <div className="mt-4">
          <DeleteAccountPanel />
        </div>
      </PolicySection>

      <PolicySection heading="3. 고객센터로 요청하기">
        <p>
          직접 삭제가 어려우시면 아래로 요청해 주세요. 가입하신 이름과 연락처(또는 이메일)를 함께
          알려주시면 본인 확인 후 처리해 드립니다.
        </p>
        <ul className="mt-2 space-y-1">
          <li>
            · 이메일:{" "}
            <a
              href={`mailto:${COMPANY.email}?subject=${encodeURIComponent(
                "[손길] 계정 삭제 요청"
              )}`}
              className="text-brand hover:underline"
            >
              {COMPANY.email}
            </a>
          </li>
          <li>· 고객센터: {COMPANY.tel} (운영시간 {COMPANY.hours})</li>
        </ul>
        <p className="mt-2 text-xs text-ink-soft/80">
          요청 접수 후 영업일 기준 3일 이내에 처리하며, 완료 시 안내해 드립니다.
        </p>
      </PolicySection>

      <PolicySection heading="삭제되는 데이터">
        <BulletList items={DELETED} />
      </PolicySection>

      <PolicySection heading="보관되는 데이터 및 보관 기간">
        <p className="mb-3">
          아래 항목은 관계 법령에 따라 보관 의무가 있어 즉시 삭제되지 않으며, 이름·연락처 등
          개인 식별 정보는 지우고(익명화) 거래 사실만 보관합니다. 보관 기간이 지나면 지체 없이
          파기합니다.
        </p>
        <BulletList items={RETAINED} />
      </PolicySection>

      <CalloutBox>
        계정을 삭제하면 로그인과 서비스 이용이 즉시 중단되며, 삭제된 개인정보는 되돌릴 수 없습니다.
        진행 중인 예약이 있다면 삭제 전에 완료 또는 취소를 확인해 주세요.
      </CalloutBox>
    </PolicyLayout>
  );
}
