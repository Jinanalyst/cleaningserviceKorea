# 손길 (Songil) — 청소 중개 플랫폼

검증된 동네 청소 업체를 연결해 주는 청소 예약 플랫폼입니다. 날짜를 고르고
예약금 3만원을 선결제하면 예약이 확정되고, 담당 업체가 배정됩니다.

> 따뜻하고 사람 냄새 나는(인간다운) 디자인을 지향합니다 — 크림 배경 + 세이지
> 그린 + 살구빛 포인트, 둥근 모서리, 부드러운 등장 애니메이션.

## 주요 기능

| 화면 | 경로 | 설명 |
| --- | --- | --- |
| 홈(랜딩) | `/` | 서비스 소개, 이용 방법, 청소 파트너 목록 |
| 예약하기 | `/book` | 4단계 예약 플로우 (서비스 → 캘린더 날짜·시간 → 정보 입력 → 예약금 결제) |
| 예약 조회 | `/reservations` | 예약번호/연락처로 진행 상태(접수→확정→청소중→완료) 확인 |
| 운영 대시보드 | `/admin` | 전체 예약 관리, 통계, 상태 변경 |

- **서비스 종류**: 가정 정기청소 · 입주청소 · 이사청소 · 원룸 퇴거청소 ·
  오피스텔 청소 · 사무실·상가청소 · 부분 청소.
- **캘린더 예약**: 지난 날짜는 자동으로 막히고, 원하는 방문 시간대를 선택.
- **집/회사 정보 입력**: 서비스 성격에 따라 입력 폼이 바뀝니다.
  - 주거 청소 → **집 정보**(주거 형태·방/화장실 개수·반려동물·층수)
  - 사무실·상가 → **회사 정보**(상호명·공간 형태·사업자등록번호)
  - 부분 청소 → **청소할 공간 선택**(주방·화장실·베란다 등 다중 선택)
- **연락처·주소 폼**: 이름/연락처/주소/요청사항 입력 + 유효성 검증.
- **가격 & 선결제**: 평수 기준 예상 견적 자동 계산, 예약금 **30,000원** 고정,
  잔금은 청소 완료 후 현장 결제.
- **예약 상태 표시**: 고객용 진행 트래커 + 운영자용 대시보드.

## 데이터베이스 (Supabase)

예약 데이터는 **Supabase(Postgres)** 에 저장됩니다.

1. Supabase 대시보드 → **SQL Editor** 에서 [`supabase/schema.sql`](supabase/schema.sql) 실행 (테이블 + 데모 데이터 생성)
2. 환경변수 설정 ([`.env.example`](.env.example) 참고):
   - 로컬: `.env.local` 에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - Vercel: Project → Settings → Environment Variables 에 동일하게 추가
3. `service_role` 키는 **서버 전용**입니다. 브라우저에 노출되지 않으며(`src/lib/store.ts`
   는 server-only), 테이블 RLS는 활성화되어 있어 anon 접근이 차단됩니다.

## ⚠️ 결제는 목업(테스트)입니다

`/book` 마지막 단계의 결제 버튼은 실제 결제가 아니라 **결제 완료를 시뮬레이션**
합니다. 실제 카드 결제(토스페이먼츠 등)로 전환하려면 `src/app/book/page.tsx`의
`handlePay()`와 `src/app/api/reservations/route.ts`(POST)에 PG 연동을 추가하면
됩니다.

## 실행 방법

```bash
npm install
npm run dev        # http://localhost:3000
# 또는 포트 지정: npm run dev -- -p 3050
```

## 기술 스택 / 구조

- **Next.js 16** (App Router) · **React 19** · **TypeScript** · **Tailwind CSS v4**
- 데이터 저장: **Supabase(Postgres)** — `src/lib/store.ts` + `src/lib/supabase.ts`.

```
src/
  app/
    page.tsx                     # 랜딩
    book/page.tsx                # 예약 플로우
    reservations/page.tsx        # 예약 조회
    admin/page.tsx               # 운영 대시보드
    api/reservations/route.ts    # 예약 생성(POST)/목록·조회(GET)
    api/reservations/[id]/route.ts  # 상태 변경(PATCH)
  components/Calendar.tsx         # 예약 캘린더
  lib/data.ts                     # 파트너·서비스·상태 정의, 견적 계산
  lib/store.ts                    # 예약 저장소 (Supabase, 서버 전용)
  lib/supabase.ts                 # Supabase 서버 클라이언트
supabase/schema.sql               # 테이블 스키마 + 데모 데이터
```

## 다음 단계 아이디어

- 실제 PG 결제 연동(토스페이먼츠) 및 환불 정책
- 문자/알림톡으로 예약 확정·리마인드 발송
- 청소 파트너 로그인 및 자체 일정 관리
- 후기/평점 작성, 지역·평점 기반 업체 자동 매칭 고도화
