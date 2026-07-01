// 파일 기반 예약 저장소. 서버(라우트 핸들러)에서만 사용.
// 목업 단계에서는 DB 대신 JSON 파일 + 메모리 캐시에 저장한다.
//
// ⚠️ Vercel 등 서버리스 환경은 배포 파일시스템이 읽기 전용이라
//    프로젝트 폴더에 쓸 수 없다. 이 경우 OS 임시 폴더(/tmp)로 폴백하고,
//    그마저 불가하면 메모리 캐시만으로 동작한다(재배포/콜드스타트 시 초기화).
//    실서비스에서는 이 파일을 실제 DB(Postgres/KV 등)로 교체할 것.
import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import type { ReservationStatus, PropertyInfo } from "./data";

export type Reservation = {
  id: string; // 예약 코드 (예: SG-8F3K2A)
  createdAt: string; // ISO
  partnerId: string;
  serviceId: string;
  pyeong: number;
  date: string; // YYYY-MM-DD
  timeSlot: string; // "13:00"
  customerName: string;
  phone: string;
  address: string;
  addressDetail: string;
  notes: string;
  property: PropertyInfo; // 집/회사/부분청소 정보
  price: number; // 예상 총액
  deposit: number; // 선결제 예약금
  paymentStatus: "paid"; // 목업: 항상 결제 완료로 생성
  status: ReservationStatus;
};

// 인스턴스 내 메모리 캐시 (동일 람다가 살아있는 동안 일관성 유지)
let cache: Reservation[] | null = null;
let dbFile: string | null = null;

// 쓰기 가능한 저장 경로를 한 번만 탐색한다: 프로젝트/data → OS 임시폴더 순.
async function resolveDbFile(): Promise<string> {
  if (dbFile) return dbFile;
  const candidates = [
    path.join(process.cwd(), "data"),
    path.join(os.tmpdir(), "songil-data"),
  ];
  for (const dir of candidates) {
    try {
      await fs.mkdir(dir, { recursive: true });
      const probe = path.join(dir, ".writetest");
      await fs.writeFile(probe, "ok");
      await fs.rm(probe, { force: true });
      dbFile = path.join(dir, "reservations.json");
      return dbFile;
    } catch {
      // 다음 후보로
    }
  }
  // 모두 실패해도 경로는 정해두고, 실제 쓰기는 best-effort로 처리한다.
  dbFile = path.join(os.tmpdir(), "reservations.json");
  return dbFile;
}

export async function readAll(): Promise<Reservation[]> {
  if (cache) return cache;
  const file = await resolveDbFile();
  try {
    const raw = await fs.readFile(file, "utf-8");
    cache = JSON.parse(raw) as Reservation[];
  } catch {
    // 파일이 없으면 시드로 초기화하고 best-effort로 저장한다.
    cache = [...SEED];
    try {
      await fs.writeFile(file, JSON.stringify(cache, null, 2), "utf-8");
    } catch {
      // 읽기 전용 환경: 메모리 캐시만 사용
    }
  }
  return cache;
}

async function writeAll(rows: Reservation[]) {
  cache = rows;
  const file = await resolveDbFile();
  try {
    await fs.writeFile(file, JSON.stringify(rows, null, 2), "utf-8");
  } catch {
    // 읽기 전용 환경(Vercel 등): 메모리 캐시로만 유지
  }
}

export function makeCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `SG-${s}`;
}

export async function createReservation(
  input: Omit<Reservation, "id" | "createdAt" | "status" | "paymentStatus">
): Promise<Reservation> {
  const rows = await readAll();
  let id = makeCode();
  while (rows.some((r) => r.id === id)) id = makeCode();
  const reservation: Reservation = {
    ...input,
    id,
    createdAt: new Date().toISOString(),
    paymentStatus: "paid",
    status: "pending",
  };
  rows.unshift(reservation);
  await writeAll(rows);
  return reservation;
}

export async function updateStatus(
  id: string,
  status: ReservationStatus
): Promise<Reservation | null> {
  const rows = await readAll();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  rows[idx] = { ...rows[idx], status };
  await writeAll(rows);
  return rows[idx];
}

export async function findByPhoneOrCode(query: string): Promise<Reservation[]> {
  const q = query.trim().toUpperCase();
  const digits = query.replace(/\D/g, "");
  const rows = await readAll();
  return rows.filter(
    (r) =>
      r.id.toUpperCase() === q ||
      (digits.length >= 4 && r.phone.replace(/\D/g, "").includes(digits))
  );
}

// 데모용 초기 예약 (운영자 대시보드가 비어 보이지 않도록)
const SEED: Reservation[] = [
  {
    id: "SG-K7M2PQ",
    createdAt: "2026-06-28T02:11:00.000Z",
    partnerId: "banjjak",
    serviceId: "home",
    pyeong: 24,
    date: "2026-07-03",
    timeSlot: "13:00",
    customerName: "김서연",
    phone: "010-2345-6789",
    address: "서울 마포구 월드컵북로 120",
    addressDetail: "302동 1104호",
    notes: "고양이 두 마리가 있어요. 베란다 창틀 부탁드려요.",
    property: {
      propertyType: "아파트",
      rooms: "방 3개",
      bathrooms: "2개",
      hasPet: true,
      floorInfo: "11층, 엘리베이터 있음",
    },
    price: 96000,
    deposit: 30000,
    paymentStatus: "paid",
    status: "confirmed",
  },
  {
    id: "SG-B4H9XR",
    createdAt: "2026-06-29T09:40:00.000Z",
    partnerId: "kkalkkeum",
    serviceId: "movein",
    pyeong: 32,
    date: "2026-07-05",
    timeSlot: "09:00",
    customerName: "이준호",
    phone: "010-8765-4321",
    address: "경기 성남시 분당구 판교로 255",
    addressDetail: "빌라 2층",
    notes: "이사 들어가기 전날이라 오전에 꼭 마무리돼야 해요.",
    property: {
      propertyType: "빌라·연립",
      rooms: "방 3개",
      bathrooms: "2개",
      hasPet: false,
      floorInfo: "2층, 엘리베이터 없음",
    },
    price: 288000,
    deposit: 30000,
    paymentStatus: "paid",
    status: "pending",
  },
  {
    id: "SG-T3N8WC",
    createdAt: "2026-06-25T05:20:00.000Z",
    partnerId: "sonkkeut",
    serviceId: "home",
    pyeong: 9,
    date: "2026-06-30",
    timeSlot: "15:00",
    customerName: "박민지",
    phone: "010-5555-1212",
    address: "서울 관악구 봉천로 45",
    addressDetail: "원룸 501호",
    notes: "",
    property: {
      propertyType: "원룸",
      rooms: "원룸",
      bathrooms: "1개",
      hasPet: false,
      floorInfo: "5층, 엘리베이터 있음",
    },
    price: 60000,
    deposit: 30000,
    paymentStatus: "paid",
    status: "completed",
  },
];
