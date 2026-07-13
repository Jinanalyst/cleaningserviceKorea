// 파트너 리커링 커미션 — 순수 계산·타입 (서버/클라이언트 공용, DB 접근 없음).
//   실제 적립·차감·집계는 commissionStore.ts(서버 전용)에서 수행하고,
//   여기서는 "비율 → 금액" 계산과 화면 표시용 타입만 다룬다.

export type ReferredType = "customer" | "provider";

// 커미션 비율 설정 (관리자가 변경, DB commission_settings 단일 행).
export type CommissionSettings = {
  platformFeeRate: number; // 플랫폼 총수수료율 (기본 0.07)
  firstRate: number; // 첫 완료 거래 파트너 지급률 (기본 0.035)
  repeatRate: number; // 이후 완료 거래 파트너 지급률 (기본 0.02)
  splitCustomer: number; // 중복 추천 시 고객 추천자 분배 (기본 0.5)
  splitProvider: number; // 중복 추천 시 업체 추천자 분배 (기본 0.5)
  minPayout: number; // 최소 정산 금액(원, 기본 10000)
};

export const DEFAULT_SETTINGS: CommissionSettings = {
  platformFeeRate: 0.07,
  firstRate: 0.035,
  repeatRate: 0.02,
  splitCustomer: 0.5,
  splitProvider: 0.5,
  minPayout: 10000,
};

// 커미션 상태.
//   pending   : 작업 완료 후 검토 중(적립 예정)
//   available : 정산 가능
//   paid      : 지급 완료
//   canceled  : 취소(예약 취소·부정·미지급 환불)
//   deducted  : 차감(이미 지급된 뒤 환불되어 다음 정산에서 차감)
export type CommissionStatus =
  | "pending"
  | "available"
  | "paid"
  | "canceled"
  | "deducted";

export const COMMISSION_STATUS_LABEL: Record<CommissionStatus, string> = {
  pending: "적립 예정",
  available: "정산 가능",
  paid: "지급 완료",
  canceled: "취소",
  deducted: "차감",
};

// 한 거래에서 특정 추천자에게 적용할 실효 적립률.
//   isFirst   : 해당 추천 관계의 "첫 완료 거래"인가
//   dual      : 같은 거래에 고객·업체 추천이 동시에 존재하는가(분배 대상)
// 반환값은 base_amount 에 곱할 최종 비율. 분배 시 자기 몫(기본 50%)만 적용한다.
export function effectiveRate(
  s: CommissionSettings,
  referredType: ReferredType,
  isFirst: boolean,
  dual: boolean
): number {
  const tierRate = isFirst ? s.firstRate : s.repeatRate;
  if (!dual) return tierRate;
  const share = referredType === "customer" ? s.splitCustomer : s.splitProvider;
  return tierRate * share;
}

// 커미션 금액(원) = 실결제 기준액 × 실효 적립률 (반올림).
export function commissionAmount(
  base: number,
  s: CommissionSettings,
  referredType: ReferredType,
  isFirst: boolean,
  dual: boolean
): number {
  const rate = effectiveRate(s, referredType, isFirst, dual);
  const amount = Math.round(base * rate);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}
