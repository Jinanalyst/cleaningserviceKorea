-- 손길 예약 테이블 스키마
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 "Run" 하세요.

create table if not exists public.reservations (
  id             text primary key,                    -- 예약 코드 (예: SG-K7M2PQ)
  created_at     timestamptz not null default now(),
  partner_id     text not null,
  service_id     text not null,
  pyeong         integer not null,
  date           date not null,
  time_slot      text not null,
  customer_name  text not null,
  phone          text not null,
  address        text not null,
  address_detail text default '',
  notes          text default '',
  property       jsonb default '{}'::jsonb,            -- 집/회사/부분청소 정보
  price          integer not null,
  deposit        integer not null,
  payment_status text not null default 'paid',
  status         text not null default 'pending'
);

-- 조회 성능용 인덱스
create index if not exists reservations_phone_idx on public.reservations (phone);
create index if not exists reservations_status_idx on public.reservations (status);
create index if not exists reservations_created_idx on public.reservations (created_at desc);

-- RLS 활성화 (정책 없음 = service_role 키로만 접근 가능, 브라우저 anon 접근 차단)
alter table public.reservations enable row level security;

-- ── 데모 데이터 (원하지 않으면 아래 블록은 지워도 됩니다) ──
insert into public.reservations
  (id, created_at, partner_id, service_id, pyeong, date, time_slot,
   customer_name, phone, address, address_detail, notes, property, price, deposit, payment_status, status)
values
  ('SG-K7M2PQ', '2026-06-28T02:11:00Z', 'banjjak', 'home', 24, '2026-07-03', '13:00',
   '김서연', '010-2345-6789', '서울 마포구 월드컵북로 120', '302동 1104호',
   '고양이 두 마리가 있어요. 베란다 창틀 부탁드려요.',
   '{"propertyType":"아파트","rooms":"방 3개","bathrooms":"2개","hasPet":true,"floorInfo":"11층, 엘리베이터 있음"}'::jsonb,
   96000, 30000, 'paid', 'confirmed'),
  ('SG-B4H9XR', '2026-06-29T09:40:00Z', 'kkalkkeum', 'movein', 32, '2026-07-05', '09:00',
   '이준호', '010-8765-4321', '경기 성남시 분당구 판교로 255', '빌라 2층',
   '이사 들어가기 전날이라 오전에 꼭 마무리돼야 해요.',
   '{"propertyType":"빌라·연립","rooms":"방 3개","bathrooms":"2개","hasPet":false,"floorInfo":"2층, 엘리베이터 없음"}'::jsonb,
   288000, 30000, 'paid', 'pending'),
  ('SG-T3N8WC', '2026-06-25T05:20:00Z', 'sonkkeut', 'home', 9, '2026-06-30', '15:00',
   '박민지', '010-5555-1212', '서울 관악구 봉천로 45', '원룸 501호', '',
   '{"propertyType":"원룸","rooms":"원룸","bathrooms":"1개","hasPet":false,"floorInfo":"5층, 엘리베이터 있음"}'::jsonb,
   60000, 30000, 'paid', 'completed')
on conflict (id) do nothing;
