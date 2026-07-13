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
  version: "1.0.11",
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
};

export const PARTNERS: Partner[] = [
  {
    id: "banjjak",
    name: "반짝살림",
    tagline: "정리수납까지 함께하는 가정집 전문",
    rating: 4.9,
    reviews: 312,
    jobs: 1840,
    since: 2018,
    specialties: ["가정 정기청소", "정리수납", "부분 청소"],
    region: "서울 전역 · 경기 남부",
    regions: ["서울 강남구", "서울 서초구", "성남시 분당구", "성남시 수정구"],
    verifications: ["사업자 확인", "신원 확인", "리뷰 확인"],
    photos: ["주방 후드 시공 후", "화장실 물때 제거", "거실 정리수납", "베란다 청소"],
    accent: "bg-rose-100 text-rose-600",
    intro:
      "'남의 집이 아니라 우리 집처럼'을 원칙으로 6년째 일하고 있어요. 반려동물 가정도 편하게 맡겨 주세요.",
  },
  {
    id: "kkalkkeum",
    name: "깔끔한하루",
    tagline: "입주·이사청소 하나만 파는 팀",
    rating: 4.8,
    reviews: 208,
    jobs: 1120,
    since: 2016,
    specialties: ["입주청소", "이사청소", "오피스텔 청소"],
    region: "서울 · 인천 · 경기",
    regions: ["서울 전역", "인천 전역", "경기 부천시", "경기 김포시"],
    verifications: ["사업자 확인", "신원 확인", "리뷰 확인"],
    photos: ["입주 전 빈집 청소", "베란다 곰팡이 제거", "새시·창틀 세척", "실리콘 오염 제거"],
    accent: "bg-sky-100 text-sky-600",
    intro:
      "빈집 청소만 8년. 곰팡이, 실리콘 오염, 베란다 물때까지 사진으로 전후를 남겨 드려요.",
  },
  {
    id: "sonkkeut",
    name: "손끝청소",
    tagline: "원룸·오피스텔에 딱 맞춘 합리적인 팀",
    rating: 4.9,
    reviews: 174,
    jobs: 960,
    since: 2020,
    specialties: ["가정 정기청소", "원룸 퇴거청소", "부분 청소"],
    region: "서울 강북 · 강서",
    regions: ["서울 강북구", "서울 노원구", "서울 은평구", "서울 강서구"],
    verifications: ["사업자 확인", "신원 확인", "리뷰 확인"],
    photos: ["원룸 퇴거 청소", "냉장고 내부 세척", "화장실 줄눈 청소", "주방 기름때 제거"],
    accent: "bg-emerald-100 text-emerald-600",
    intro:
      "1인 가구가 부담 없이 부를 수 있는 청소를 만들고 있어요. 작은 공간일수록 더 꼼꼼하게.",
  },
  {
    id: "malgeun",
    name: "맑은창",
    tagline: "사무실·상가 정기관리 파트너",
    rating: 4.7,
    reviews: 96,
    jobs: 640,
    since: 2019,
    specialties: ["사무실·상가청소", "오피스텔 청소"],
    region: "서울 · 경기",
    regions: ["서울 마포구", "서울 영등포구", "경기 고양시", "경기 광명시"],
    verifications: ["사업자 확인", "신원 확인", "리뷰 확인"],
    photos: ["사무실 바닥 왁스", "상가 유리창 세척", "공용부 정기관리", "탕비실 청소"],
    accent: "bg-amber-100 text-amber-600",
    intro:
      "영업에 방해되지 않게 이른 아침·늦은 밤 시간대 청소를 전문으로 해요. 세금계산서 발행 가능.",
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

export const REVIEWS: Record<string, Review[]> = {
  banjjak: [
    {
      author: "김서연",
      rating: 5,
      date: "2026.06.24",
      service: "가정 정기청소",
      text: "이사 오고 처음 불렀는데 주방 후드랑 화장실 물때까지 반짝반짝해졌어요. 반려묘 두 마리 있는데도 털 하나 없이 정리해 주셨습니다. 재예약 확정!",
    },
    {
      author: "이도현",
      rating: 5,
      date: "2026.06.11",
      service: "정리수납",
      text: "청소만 생각했는데 주방 수납까지 도와주셔서 살림이 반은 준 느낌이에요. 어디에 뭘 뒀는지 사진으로 정리해 주신 것도 감동.",
    },
    {
      author: "박지우",
      rating: 4,
      date: "2026.05.29",
      service: "가정 정기청소",
      text: "꼼꼼하게 잘해주세요. 예상보다 시간이 조금 초과됐는데 끝까지 마무리해 주셨어요. 창틀만 조금 더 신경 써주시면 완벽할 듯!",
    },
    {
      author: "최민서",
      rating: 5,
      date: "2026.05.15",
      service: "가정 정기청소",
      text: "친절하시고 무엇보다 믿음이 가요. 집에 있는 내내 편했습니다. 다음엔 정기로 신청하려고요.",
    },
  ],
  kkalkkeum: [
    {
      author: "정우진",
      rating: 5,
      date: "2026.06.20",
      service: "입주청소",
      text: "입주청소 맡겼는데 진짜 새집 같아요. 전후 사진 다 남겨주셔서 뭘 했는지 명확했어요. 베란다 곰팡이도 싹 사라졌습니다.",
    },
    {
      author: "한소희",
      rating: 5,
      date: "2026.06.03",
      service: "이사청소",
      text: "이사 나가는 날 원상복구 청소로 불렀는데 집주인분이 보증금 바로 돌려주셨어요. 실리콘 곰팡이까지 처리해 주셔서 감사했습니다.",
    },
    {
      author: "오세훈",
      rating: 4,
      date: "2026.05.21",
      service: "입주청소",
      text: "가격 대비 만족스러워요. 예약도 빨랐고 시간 약속도 정확. 다만 주차 안내를 미리 받았으면 더 좋았을 것 같아요.",
    },
  ],
  sonkkeut: [
    {
      author: "강하늘",
      rating: 5,
      date: "2026.06.18",
      service: "원룸 퇴거청소",
      text: "작은 원룸이라 대충 하실까 걱정했는데 구석구석 정말 꼼꼼하셨어요. 냉장고 안까지 새것처럼! 보증금 전액 돌려받았습니다.",
    },
    {
      author: "윤아름",
      rating: 5,
      date: "2026.06.07",
      service: "가정 정기청소",
      text: "1인 가구라 청소 부르는 게 부담이었는데 가격도 합리적이고 결과도 깔끔해서 대만족이에요. 부담 없이 또 부를게요.",
    },
    {
      author: "서준호",
      rating: 5,
      date: "2026.05.24",
      service: "원룸 퇴거청소",
      text: "퇴실 전날 급하게 요청드렸는데 바로 잡아주셨어요. 화장실 타일 줄눈까지 하얘졌습니다. 강력 추천!",
    },
  ],
  malgeun: [
    {
      author: "김대표",
      rating: 5,
      date: "2026.06.22",
      service: "사무실·상가청소",
      text: "영업 시작 전 새벽에 오셔서 업무에 지장 하나 없었어요. 바닥 왁스 코팅까지 해주셔서 사무실 분위기가 확 살았습니다.",
    },
    {
      author: "이과장",
      rating: 4,
      date: "2026.06.05",
      service: "사무실·상가청소",
      text: "정기 계약으로 매주 관리받고 있어요. 세금계산서 발행도 깔끔하게 처리됩니다. 응대가 프로페셔널해요.",
    },
    {
      author: "박실장",
      rating: 5,
      date: "2026.05.19",
      service: "사무실·상가청소",
      text: "상가 오픈 전 청소로 불렀는데 유리창이며 바닥이며 완벽했어요. 다음 지점도 여기 맡길 예정입니다.",
    },
  ],
};

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
