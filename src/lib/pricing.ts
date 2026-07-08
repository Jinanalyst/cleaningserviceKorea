// 손길 견적 계산 로직 (웹/앱 공통 규칙)
// 기본견적 = max(평수 × 평당단가, 구간별 최소금액)
// 최종견적 = 기본견적 × 난이도계수 × 주거유형계수 × 일정계수 + 옵션비

export const PER_PYEONG_RATE = 10000; // 평당 단가 (조정 가능)

// 평수 구간별 최소금액
export function minByPyeong(pyeong: number): number {
  const p = Math.max(0, Math.floor(pyeong));
  if (p <= 8) return 130000; // 1~8평
  if (p <= 12) return 150000; // 9~12평
  if (p <= 18) return 180000; // 13~18평
  if (p <= 24) return 230000; // 19~24평
  if (p <= 30) return 300000; // 25~30평
  return 300000; // 31평 이상 → 평수 계산이 우선 적용됨
}

// 기본견적 = max(평수 × 평당단가, 최소금액)
export function baseEstimate(pyeong: number): number {
  const p = Math.max(0, pyeong);
  if (!p) return 0;
  return Math.max(Math.round(p * PER_PYEONG_RATE), minByPyeong(p));
}

// 난이도(오염 정도) 계수
export const DIFFICULTY = [
  { id: "normal", label: "보통", factor: 1.0, desc: "일반 생활 오염" },
  { id: "dirty", label: "오염 많음", factor: 1.2, desc: "찌든 때·오래된 오염" },
  { id: "heavy", label: "심함", factor: 1.4, desc: "곰팡이·기름때·공사 후" },
] as const;
export type DifficultyId = (typeof DIFFICULTY)[number]["id"];
export function difficultyFactor(id: string): number {
  return DIFFICULTY.find((d) => d.id === id)?.factor ?? 1.0;
}

// 주거유형 계수
export const HOUSING_FACTOR: Record<string, number> = {
  아파트: 1.0,
  "빌라·연립": 1.05,
  오피스텔: 1.0,
  원룸: 0.95,
  단독주택: 1.15,
  기타: 1.0,
  사무실: 1.1,
  "상가·매장": 1.15,
  "학원·교실": 1.1,
  "병원·클리닉": 1.2,
  "카페·음식점": 1.15,
};
export function housingFactor(propertyType?: string): number {
  if (!propertyType) return 1.0;
  return HOUSING_FACTOR[propertyType] ?? 1.0;
}

// 일정 계수 (주말·공휴일 할증)
export function scheduleFactor(dateStr: string): { factor: number; label: string } {
  if (!dateStr) return { factor: 1.0, label: "평일" };
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDay();
  if (day === 0 || day === 6) return { factor: 1.15, label: "주말·공휴일" };
  return { factor: 1.0, label: "평일" };
}

// 추가 옵션 (옵션비)
export const OPTIONS = [
  { id: "fridge", label: "냉장고 내부 청소", price: 30000 },
  { id: "hood", label: "후드·오븐 청소", price: 20000 },
  { id: "veranda", label: "베란다·창틀 집중", price: 20000 },
  { id: "pet", label: "반려동물 케어", price: 15000 },
  { id: "sterilize", label: "살균·소독", price: 40000 },
] as const;
export type OptionId = (typeof OPTIONS)[number]["id"];
export function optionsTotal(ids: string[]): number {
  return ids.reduce((sum, id) => sum + (OPTIONS.find((o) => o.id === id)?.price ?? 0), 0);
}

export type EstimateInput = {
  pyeong: number;
  difficulty: string;
  propertyType?: string;
  date: string;
  options: string[];
};

export type EstimateBreakdown = {
  base: number;
  difficulty: number;
  housing: number;
  schedule: number;
  scheduleLabel: string;
  optionsFee: number;
  final: number;
};

// 최종견적 = 기본견적 × 난이도 × 주거유형 × 일정 + 옵션비 (1,000원 단위 반올림)
export function computeEstimate(input: EstimateInput): EstimateBreakdown {
  const base = baseEstimate(input.pyeong);
  const difficulty = difficultyFactor(input.difficulty);
  const housing = housingFactor(input.propertyType);
  const sched = scheduleFactor(input.date);
  const optionsFee = optionsTotal(input.options);
  const raw = base * difficulty * housing * sched.factor + optionsFee;
  const final = base ? Math.round(raw / 1000) * 1000 : 0;
  return {
    base,
    difficulty,
    housing,
    schedule: sched.factor,
    scheduleLabel: sched.label,
    optionsFee,
    final,
  };
}
