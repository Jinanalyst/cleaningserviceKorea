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


-- ══════════════════════════════════════════════════════════════
-- 파트너 등록 신청 테이블 (마켓플레이스 심사)
-- ══════════════════════════════════════════════════════════════
create table if not exists public.partner_applications (
  id             text primary key,                    -- 신청 코드 (예: PT-8F3K2A)
  created_at     timestamptz not null default now(),
  company_name   text not null,
  owner_name     text not null,
  biz_number     text not null,                       -- 사업자등록번호
  phone          text not null,
  email          text not null,
  bank_name      text not null,                       -- 정산 은행
  account_number text not null,                       -- 계좌번호
  account_holder text not null,                       -- 예금주
  regions        text default '',                     -- 서비스 가능 지역
  services       jsonb default '[]'::jsonb,           -- 전문 청소 분야
  experience     text default '',
  team_size      text default '',
  intro          text default '',
  status         text not null default 'submitted',   -- submitted/reviewing/approved/rejected
  review_note    text default ''                      -- 심사 메모/사유
);

create index if not exists applications_status_idx on public.partner_applications (status);
create index if not exists applications_biz_idx on public.partner_applications (biz_number);
create index if not exists applications_created_idx on public.partner_applications (created_at desc);

alter table public.partner_applications enable row level security;

-- ── 데모 신청 (원하지 않으면 아래 블록은 지워도 됩니다) ──
insert into public.partner_applications
  (id, created_at, company_name, owner_name, biz_number, phone, email,
   bank_name, account_number, account_holder, regions, services, experience, team_size, intro, status, review_note)
values
  ('PT-9WQ2MK', '2026-06-30T01:00:00Z', '싹싹클린', '정우성', '221-88-01234',
   '010-3333-2211', 'ssak@example.com', '국민은행', '12345601234567', '정우성',
   '서울 강서·양천', '["가정 정기청소","입주청소"]'::jsonb, '4년', '5명',
   '아파트 입주청소 위주로 활동해온 5인 팀입니다.', 'reviewing', ''),
  ('PT-5HTN3B', '2026-06-27T06:30:00Z', '반짝반짝세상', '한지민', '134-52-77120',
   '010-7788-9900', 'twinkle@example.com', '신한은행', '110222333444', '한지민',
   '경기 남부', '["사무실·상가청소"]'::jsonb, '7년', '12명',
   '상가·사무실 정기관리 전문 업체입니다. 세금계산서 발행 가능.', 'approved', '서류 확인 완료, 승인 처리했습니다.')
on conflict (id) do nothing;


-- ══════════════════════════════════════════════════════════════
-- 구글 로그인 사용자 프로필 (온보딩: 고객 / 업체)
-- ══════════════════════════════════════════════════════════════
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  role        text,                                   -- 'customer' | 'business'
  name        text,
  email       text,
  onboarded   boolean not null default false
);

alter table public.profiles enable row level security;

-- 본인 프로필만 읽고/쓰기 가능
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- 파트너 신청을 로그인 계정(업체)과 연결
alter table public.partner_applications
  add column if not exists user_id uuid references auth.users(id);

-- 예약을 로그인 계정(고객)과 연결 (본인 예약만 조회하도록)
alter table public.reservations
  add column if not exists user_id uuid references auth.users(id);


-- ══════════════════════════════════════════════════════════════
-- 고객 후기 테이블 (청소 완료 후 고객이 직접 작성)
-- ══════════════════════════════════════════════════════════════
create table if not exists public.reviews (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  reservation_id text not null references public.reservations(id) on delete cascade,
  partner_id     text not null,
  service_id     text default '',
  user_id        uuid references auth.users(id),
  author_name    text not null,                       -- 표시용(마스킹된 이름)
  rating         integer not null check (rating between 1 and 5),
  body           text not null,
  status         text not null default 'published'    -- published/hidden
);

-- 예약 1건당 후기 1개
create unique index if not exists reviews_reservation_uk on public.reviews (reservation_id);
create index if not exists reviews_partner_idx on public.reviews (partner_id);
create index if not exists reviews_created_idx on public.reviews (created_at desc);

-- RLS 활성화 (정책 없음 = service_role 키로만 접근, 브라우저 anon 접근 차단)
alter table public.reviews enable row level security;
