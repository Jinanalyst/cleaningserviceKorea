// 손길 플랫폼의 정적 데이터 — 청소 업체(파트너)와 서비스 종류.
// 서버/클라이언트 양쪽에서 안전하게 import 가능 (fs 접근 없음).

export type ReservationStatus =
  | "pending" // 예약 접수 (업체 배정 대기)
  | "confirmed" // 업체 확정
  | "in_progress" // 청소 진행 중
  | "completed" // 완료
  | "cancelled"; // 취소

export const STATUS_META: Record<
  ReservationStatus,
  { label: string; tone: string; dot: string; desc: string }
> = {
  pending: {
    label: "접수 완료",
    tone: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-400",
    desc: "예약금 결제가 확인됐어요. 담당 업체를 배정하고 있어요.",
  },
  confirmed: {
    label: "업체 확정",
    tone: "bg-sky-50 text-sky-700 ring-sky-200",
    dot: "bg-sky-400",
    desc: "담당 업체가 배정됐어요. 방문 하루 전 연락드릴게요.",
  },
  in_progress: {
    label: "청소 중",
    tone: "bg-violet-50 text-violet-700 ring-violet-200",
    dot: "bg-violet-400",
    desc: "지금 손길이 닿고 있어요. 조금만 기다려 주세요.",
  },
  completed: {
    label: "청소 완료",
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-400",
    desc: "청소가 끝났어요! 잔금은 현장에서 결제해 주세요.",
  },
  cancelled: {
    label: "취소됨",
    tone: "bg-rose-50 text-rose-700 ring-rose-200",
    dot: "bg-rose-400",
    desc: "예약이 취소됐어요. 예약금은 정책에 따라 환불돼요.",
  },
};

export const STATUS_FLOW: ReservationStatus[] = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
];

// ── 파트너 등록 신청(마켓플레이스 심사) ──
export type ApplicationStatus =
  | "submitted" // 접수 완료
  | "reviewing" // 서류 심사 중
  | "approved" // 승인 완료
  | "rejected"; // 반려

export const APPLICATION_STATUS_META: Record<
  ApplicationStatus,
  { label: string; tone: string; dot: string; desc: string }
> = {
  submitted: {
    label: "접수 완료",
    tone: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-400",
    desc: "신청이 정상 접수됐어요. 곧 서류 심사를 시작할게요.",
  },
  reviewing: {
    label: "서류 심사 중",
    tone: "bg-sky-50 text-sky-700 ring-sky-200",
    dot: "bg-sky-400",
    desc: "제출하신 사업자 정보와 정산 계좌를 확인하고 있어요.",
  },
  approved: {
    label: "승인 완료",
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-400",
    desc: "축하해요! 손길 파트너로 승인됐어요. 담당자가 곧 연락드릴게요.",
  },
  rejected: {
    label: "반려",
    tone: "bg-rose-50 text-rose-700 ring-rose-200",
    dot: "bg-rose-400",
    desc: "아쉽게도 이번 심사는 통과하지 못했어요. 사유를 확인해 주세요.",
  },
};

// 진행 트래커 순서 (반려는 별도)
export const APPLICATION_FLOW: ApplicationStatus[] = [
  "submitted",
  "reviewing",
  "approved",
];

// ── 고객 견적 상담 신청 (대면 상담 후 합의 견적) ──
export type ConsultationStatus =
  | "requested" // 상담 신청 접수
  | "consulting" // 상담 진행 중 (전화·대면 조율)
  | "quoted" // 합의 견적 확정 (관리자가 금액 입력)
  | "confirmed" // 예약 성사
  | "cancelled"; // 취소

export const CONSULTATION_STATUS_META: Record<
  ConsultationStatus,
  { label: string; tone: string; dot: string; desc: string }
> = {
  requested: {
    label: "상담 신청",
    tone: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-400",
    desc: "상담 신청이 접수됐어요. 담당자가 곧 연락드려 방문·상담 일정을 잡을게요.",
  },
  consulting: {
    label: "상담 진행 중",
    tone: "bg-sky-50 text-sky-700 ring-sky-200",
    dot: "bg-sky-400",
    desc: "현장·전화 상담을 진행하고 있어요. 공간을 확인한 뒤 견적을 안내드릴게요.",
  },
  quoted: {
    label: "견적 확정",
    tone: "bg-violet-50 text-violet-700 ring-violet-200",
    dot: "bg-violet-400",
    desc: "상담을 통해 합의된 견적이 확정됐어요. 금액과 내용을 확인해 주세요.",
  },
  confirmed: {
    label: "예약 성사",
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-400",
    desc: "청소 예약이 확정됐어요! 방문 하루 전 다시 안내드릴게요.",
  },
  cancelled: {
    label: "취소됨",
    tone: "bg-rose-50 text-rose-700 ring-rose-200",
    dot: "bg-rose-400",
    desc: "상담이 취소됐어요. 언제든 다시 신청해 주세요.",
  },
};

// 진행 트래커 순서 (취소는 별도)
export const CONSULTATION_FLOW: ConsultationStatus[] = [
  "requested",
  "consulting",
  "quoted",
  "confirmed",
];

// 정산 계좌 은행 목록
export const BANKS = [
  "국민은행",
  "신한은행",
  "우리은행",
  "하나은행",
  "농협은행",
  "기업은행",
  "카카오뱅크",
  "토스뱅크",
  "새마을금고",
  "우체국",
  "SC제일은행",
  "케이뱅크",
  "부산은행",
  "대구은행",
];

// 서비스 성격 — 입력받을 정보(집 정보 / 회사 정보 / 부분청소 대상)를 결정한다.
export type ServiceCategory = "residential" | "commercial" | "partial";

// 예약에 함께 저장되는 집/회사/부분청소 정보
export type PropertyInfo = {
  // 주거 (residential)
  propertyType?: string; // 아파트/빌라/원룸 등
  rooms?: string; // 방 개수
  bathrooms?: string; // 화장실 개수
  hasPet?: boolean; // 반려동물 여부
  // 상업 (commercial)
  companyName?: string; // 상호명
  spaceType?: string; // 업종·공간 형태
  bizNumber?: string; // 사업자등록번호 (선택)
  // 부분 청소 (partial)
  areas?: string[]; // 청소할 공간
  // 공통
  floorInfo?: string; // 층수·엘리베이터·주차 등
};

export type ServiceType = {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  category: ServiceCategory;
  pricePerPyeong: number; // 평당 단가
  minPrice: number; // 최소 금액
  duration: string; // 예상 소요 시간
};

export const SERVICES: ServiceType[] = [
  {
    id: "home",
    name: "가정 정기청소",
    emoji: "🏠",
    blurb: "주방·화장실·거실까지 생활공간을 구석구석 정돈해 드려요.",
    category: "residential",
    pricePerPyeong: 4000,
    minPrice: 60000,
    duration: "3~4시간",
  },
  {
    id: "movein",
    name: "입주청소",
    emoji: "📦",
    blurb: "빈집 상태에서 새집처럼. 사람 살기 전 바닥부터 완벽하게.",
    category: "residential",
    pricePerPyeong: 9000,
    minPrice: 150000,
    duration: "5~7시간",
  },
  {
    id: "moveout",
    name: "이사청소",
    emoji: "🚚",
    blurb: "이사 나가는 날, 짐 뺀 자리까지 원상복구로 마무리해요.",
    category: "residential",
    pricePerPyeong: 8000,
    minPrice: 120000,
    duration: "4~6시간",
  },
  {
    id: "studio",
    name: "원룸 퇴거청소",
    emoji: "🔑",
    blurb: "보증금 걱정 없이 깔끔하게. 원룸·소형 평수 퇴실 청소.",
    category: "residential",
    pricePerPyeong: 6000,
    minPrice: 90000,
    duration: "2~3시간",
  },
  {
    id: "officetel",
    name: "오피스텔 청소",
    emoji: "🏙️",
    blurb: "주거·업무 겸용 공간에 맞춘 꼼꼼한 청소.",
    category: "residential",
    pricePerPyeong: 7000,
    minPrice: 130000,
    duration: "3~4시간",
  },
  {
    id: "office",
    name: "사무실·상가청소",
    emoji: "🏢",
    blurb: "영업 전후 시간대에 맞춰 사업장을 깔끔하게 관리해요.",
    category: "commercial",
    pricePerPyeong: 5000,
    minPrice: 100000,
    duration: "3~5시간",
  },
  {
    id: "partial",
    name: "부분 청소",
    emoji: "🧽",
    blurb: "주방·화장실·베란다 등 필요한 곳만 골라서 청소해요.",
    category: "partial",
    pricePerPyeong: 4000,
    minPrice: 40000,
    duration: "1~2시간",
  },
];

export function categoryOf(serviceId: string): ServiceCategory | undefined {
  return serviceById(serviceId)?.category;
}

// 집 정보 입력 옵션 (주거 서비스)
export const PROPERTY_TYPES = [
  "아파트",
  "빌라·연립",
  "오피스텔",
  "원룸",
  "단독주택",
  "기타",
];
export const ROOM_OPTIONS = ["원룸", "방 1개", "방 2개", "방 3개", "방 4개+"];
export const BATH_OPTIONS = ["1개", "2개", "3개+"];

// 회사 정보 입력 옵션 (상업 서비스)
export const SPACE_TYPES = [
  "사무실",
  "상가·매장",
  "학원·교실",
  "병원·클리닉",
  "카페·음식점",
  "기타",
];

// 부분 청소 대상
export const PARTIAL_AREAS = [
  "주방",
  "화장실",
  "거실",
  "베란다",
  "창문·새시",
  "냉장고 내부",
  "붙박이장",
  "방충망",
];

// 손길 플랫폼 수수료(=선결제 예약금)는 견적의 7%. 계산 로직은 lib/pricing 의
// platformFee() 를 사용한다. (FEE_RATE·FEE_PERCENT·platformFee 재노출)
export { FEE_RATE, FEE_PERCENT, platformFee } from "./pricing";

// 온라인 결제 = 견적의 7% (손길 수수료). 견적 전액 결제가 아님을 명확히 안내하는 공통 문구.
export const PAYMENT_NOTICE =
  "온라인 결제 금액은 청소 전체 비용이 아닌, 예약 확정을 위한 손길 플랫폼 수수료(견적 금액의 7%)입니다. 청소 총액은 공간 크기, 오염도, 추가 요청사항에 따라 달라질 수 있으며, 잔금은 청소 완료 후 현장에서 파트너에게 결제합니다.";

// 예약금(손길 수수료 7%) 입금 계좌 — PG 연동 전, 무통장 입금 전용.
// 예약 결제 화면(/book)과 운영 대시보드(/admin)에서 공통으로 사용한다.
export const DEPOSIT_ACCOUNT = {
  bank: "토스뱅크",
  number: "100261986907",
  holder: "체인랩스",
} as const;

// PG 심사·정책 페이지·푸터에서 공통으로 쓰는 사업자/서비스 정보.
export const COMPANY = {
  bizName: "체인랩스", // 상호
  service: "손길", // 서비스명
  ceo: "장진우", // 대표자
  bizNumber: "382-25-02223", // 사업자등록번호
  mailOrderNumber: "준비 중", // 통신판매업 신고번호
  tel: "050-6990-8359", // 고객센터
  kakao: "http://pf.kakao.com/_BTrPX/chat", // 카카오톡 상담 채널
  email: "chainlabsofficial@handway.net", // 이메일
  hours: "평일 09:00 - 18:00", // 운영시간
  domain: "handway.net", // 도메인
  address: "여수울로 50 연꽃마을4단지아파트 406-403", // 주소
} as const;

// 서비스 대표 도메인(canonical/SEO/OG 기준). Vercel에 다른 도메인을 붙일 땐
// NEXT_PUBLIC_SITE_URL 환경변수로 덮어쓸 수 있음. handway.online 도 함께 연결되지만
// 검색엔진 기준(canonical)은 handway.net 하나로 통일한다.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://handway.net"
).replace(/\/$/, "");

// 모바일 앱(안드로이드) 다운로드 정보 — /app 페이지·홈 다운로드 섹션에서 사용.
// apk 파일은 public/ 에 위치. 새 버전 배포 시 앱을 재빌드해 public/songil-app.apk 교체.
export const APP = {
  apk: "/songil-app.apk",
  version: "1.0.15",
  androidReady: true,
  iosReady: false,
} as const;

// 손길이 하는 일 — 정책 페이지·약관에서 반복되는 중개 플랫폼 정의.
export const MEDIATION_NOTICE =
  "손길은 고객과 청소 파트너를 연결하는 청소 예약 중개 플랫폼입니다. 청소 서비스는 제휴 청소 파트너가 수행하며, 손길은 예약 접수, 일정 조율, 파트너 배정, 고객 응대 및 예약 관리를 제공합니다.";

// /service-info 페이지에 노출하는 서비스 목록 (예상 시작가 기준).
export const SERVICE_INFO: { name: string; desc: string; startPrice: number }[] = [
  { name: "가정 정기청소", desc: "주방, 화장실, 거실 등 생활공간 청소", startPrice: 60000 },
  { name: "원룸 퇴거청소", desc: "원룸, 오피스텔 등 소형 공간 퇴실 청소", startPrice: 90000 },
  { name: "입주청소", desc: "입주 전 빈집 상태의 청소", startPrice: 150000 },
  { name: "이사청소", desc: "이사 전후 공간 청소", startPrice: 120000 },
  { name: "부분청소", desc: "화장실, 주방, 베란다 등 일부 공간 청소", startPrice: 40000 },
  { name: "사무실/상가청소", desc: "사무실, 매장, 상가 공간 청소", startPrice: 100000 },
];

// 파트너 검증 배지 (사업자/신원/리뷰 확인)
export const VERIFICATION_BADGES = ["사업자 확인", "신원 확인", "리뷰 확인"] as const;
export type VerificationBadge = (typeof VERIFICATION_BADGES)[number];

export type Partner = {
  id: string;
  name: string;
  tagline: string;
  rating: number;
  reviews: number;
  jobs: number;
  since: number;
  specialties: string[];
  region: string; // 요약 지역 (한 줄)
  regions: string[]; // 활동 지역 목록
  verifications: VerificationBadge[]; // 검증 배지
  photos: string[]; // 대표 작업 사진 라벨 (플레이스홀더)
  accent: string; // 아바타 배경색 (tailwind 클래스)
  intro: string;
  phone?: string; // 직접 연락처 (선택)
  linkedin?: string; // 링크드인 프로필 URL (선택)
};

export const PARTNERS: Partner[] = [
  {
    id: "gaeron",
    name: "청소학개론",
    tagline: "1~2인이 직접 발로 뛰는 사무실 청소",
    rating: 0,
    reviews: 0,
    jobs: 0,
    since: 2024,
    specialties: ["사무실·상가청소"],
    region: "서울 강남 · 성남 분당",
    regions: ["서울 강남구", "서울 서초구", "성남시 분당구"],
    verifications: ["신원 확인"],
    photos: ["사무실 바닥 청소", "탕비실·화장실 청소", "유리창·파티션 세척", "공용부 정기관리"],
    accent: "bg-violet-100 text-violet-600",
    intro:
      "1~2인 소규모로 직접 발로 뛰며 청소하는 게 자부심이에요. 서울 강남과 성남 분당 지역 사무실·상가를 남의 공간이 아니라 내 공간처럼 구석구석 정성껏 관리해 드립니다.",
    phone: "010-3210-3748",
    linkedin:
      "https://www.linkedin.com/in/%EC%B2%AD%EC%86%8C%EB%B6%80-%ED%96%89%EB%B3%B5%ED%95%9C-94188a3ab/",
  },
];

// ── 파트너 후기 ──
export type Review = {
  author: string; // 마스킹된 이름 (예: 김서연)
  rating: number; // 1~5
  date: string; // "2026.06.20"
  service: string; // 이용한 서비스
  text: string;
  photos?: string[]; // 첨부 사진 공개 URL (없을 수 있음)
};

export const REVIEWS: Record<string, Review[]> = {};

export function reviewsFor(partnerId: string): Review[] {
  return REVIEWS[partnerId] ?? [];
}

// 방문 가능한 시간대
export const TIME_SLOTS = [
  "09:00",
  "11:00",
  "13:00",
  "15:00",
  "17:00",
];

export function serviceById(id: string) {
  return SERVICES.find((s) => s.id === id);
}

export function partnerById(id: string) {
  return PARTNERS.find((p) => p.id === id);
}

// 서비스 + 평수로 예상 견적 계산
export function estimatePrice(serviceId: string, pyeong: number): number {
  const svc = serviceById(serviceId);
  if (!svc) return 0;
  return Math.max(svc.minPrice, Math.round((svc.pricePerPyeong * pyeong) / 1000) * 1000);
}

export function formatKRW(n: number): string {
  return n.toLocaleString("ko-KR") + "원";
}

// 저장된 집/회사/부분청소 정보를 읽기 좋은 한 줄로 요약
export function formatProperty(
  serviceId: string,
  p?: PropertyInfo | null
): string {
  if (!p) return "";
  const cat = categoryOf(serviceId);
  const parts: string[] = [];
  if (cat === "commercial") {
    if (p.companyName) parts.push(p.companyName);
    if (p.spaceType) parts.push(p.spaceType);
    if (p.bizNumber) parts.push(`사업자 ${p.bizNumber}`);
  } else if (cat === "partial") {
    if (p.areas?.length) parts.push(p.areas.join(", "));
    if (p.propertyType) parts.push(p.propertyType);
  } else {
    if (p.propertyType) parts.push(p.propertyType);
    if (p.rooms) parts.push(p.rooms);
    if (p.bathrooms) parts.push(`화장실 ${p.bathrooms}`);
    if (p.hasPet) parts.push("반려동물 있음");
  }
  if (p.floorInfo) parts.push(p.floorInfo);
  return parts.join(" · ");
}

export function propertyLabelOf(serviceId: string): string {
  const cat = categoryOf(serviceId);
  if (cat === "commercial") return "회사 정보";
  if (cat === "partial") return "청소 공간";
  return "집 정보";
}
