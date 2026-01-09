# 2026 목표 트래커 🎯

2026년 목표를 추적하고 관리하는 종합 웹 애플리케이션입니다.

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 빌드된 앱 미리보기
npm run preview
```

## 환경 설정

`.env` 파일을 프로젝트 루트에 생성하고 다음 값들을 설정하세요:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 데이터베이스 설정

Supabase SQL Editor에서 다음 스키마 파일들을 순서대로 실행하세요:

1. `supabase-schema.sql` - 기본 스키마 (exercise, user_settings)
2. `dopamine-add-time-type-migration.sql` - 도파민 트래킹 스키마
3. `hobby-schema.sql` - 취미 트래킹 스키마
4. `routine-schema.sql` - 일과 관리 스키마
5. `tasks-schema.sql` - 작업 관리 스키마

## 주요 기능

### 🏠 홈 (Home)
- **대시보드**: 모든 카테고리의 통합 요약
- **동기부여 명언**: 무작위 명언 표시
- **오늘의 포커스**: 오늘 완료해야 할 루틴 표시
- **카테고리별 카드**:
  - 돈 (잔액, 트렌드)
  - 운동 (목표, 연속 일수)
  - 도파민 (연속 일수, 경고)
  - 취미 (주간 분, 연속 일수)

### 💰 돈 (Money)
- **캘린더 뷰**: 수입/지출을 색상으로 표시
  - 녹색: 수입
  - 빨강: 지출
  - 그라데이션: 수입+지출 모두 있는 날
- **연간 뷰**: 12개월 전체 금융 활동 개요
- **거래 목록**: 날짜별 거래 내역
- **파이 차트**: 카테고리별 지출 비율
- **월별 요약**: 수입, 지출, 순액
- **반복 거래**: 월별 자동 반복 설정 가능

### 🏃 운동 (Exercise)
- **월별 캘린더**: 운동한 날 표시 (녹색)
- **연간 뷰**: 12개월 운동 기록 한눈에 보기
- **진행률 바**: 월별 목표 대비 진행률
- **연속 일수**: 운동 연속 기록
- **목표 설정**: 월별 목표 일수 설정

### 🎮 도파민 (Dopamine)
- **카테고리 관리**: 습관 추적 카테고리 생성
- **목표 유형**:
  - **절제 (Abstinence)**: 하지 않기 (예: 담배, 술)
  - **제한 (Limit)**: 제한하기 (예: 소셜미디어 2시간 이하)
  - **시간 추적 (Duration)**: 시간 기록 (예: 게임 시간)
- **캘린더 뷰**: 히트맵으로 습관 강도 표시
- **연간 뷰**: 12개월 습관 패턴
- **연속 일수**: 목표 달성 연속 기록
- **트렌드 차트**: 월별 평균 추세

### 🎨 취미 (Hobby)
- **카테고리 관리**: 취미 활동 카테고리 생성
- **목표 유형**:
  - **목표값 (Target)**: 매일 목표 달성 (예: 독서 30분)
  - **시간 추적 (Duration)**: 시간 기록 (예: 그림 그리기)
- **캘린더 뷰**: 히트맵으로 활동 강도 표시
- **연간 뷰**: 12개월 취미 활동 패턴
- **연속 일수**: 목표 달성 연속 기록
- **주간 합계**: 주간 총 활동 시간

### 📅 일과 (Routine)
- **일일 루틴 관리**: 매일 반복되는 작업 관리
- **일일 뷰**:
  - 날짜 탐색 (이전/다음/오늘)
  - 루틴 체크리스트
  - 진행률 표시
- **주간 뷰**: 7일 그리드로 루틴과 작업 한눈에 보기
- **작업 관리** (NEW):
  - 특정 날짜 작업 생성
  - 시간, 제목, 설명 입력
  - 과거 작업 조회 가능
  - 예: "오후 7시 페이스북 마켓플레이스 거래"
- **완료 추적**: 루틴과 작업 완료 상태 저장

### ⚙️ 설정 (Settings)
- **월별 목표**: 운동 목표 일수 설정
- **테마 선택**: 5가지 테마 중 선택
- **프로필**: Google OAuth 인증 정보

## 테마 시스템

5가지 테마 중 선택 가능:
- 🌞 밝은 테마 (기본)
- 🌙 어두운 테마
- 🌊 바다 테마
- 🌅 노을 테마
- 🌲 숲 테마

## 📱 모바일 지원 (NEW)

완전한 반응형 디자인으로 모든 기기에서 사용 가능:

### 모바일 기능
- **햄버거 메뉴**: 모바일에서 네비게이션 메뉴
- **터치 친화적**: 44x44px 최소 터치 타겟
- **스크롤 뷰**:
  - 연간 캘린더: 데스크톱 4열 → 태블릿 3열 → 모바일 2열 → 스몰폰 1열
  - 주간 일과: 가로 스크롤
- **최적화된 레이아웃**: 각 페이지 모바일 최적화
- **반응형 모달**: 화면 크기에 맞춰 조정

### 테스트된 기기
- ✅ iPhone SE (375px)
- ✅ iPhone 12/13/14 (390px)
- ✅ iPhone 14 Pro Max (430px)
- ✅ iPad (768px)
- ✅ Desktop (1920px)

자세한 내용은 `MOBILE_FIXES_SUMMARY.md` 참조

## 🕐 타임존 처리 (NEW)

사용자의 로컬 타임존을 정확히 반영:
- **UTC 변환 문제 해결**: 날짜 문자열을 로컬 시간으로 올바르게 파싱
- **타임존 헬퍼 함수**:
  - `parseLocalDate()`: 날짜 문자열을 로컬 시간으로 파싱
  - `getTodayLocal()`: 오늘 날짜를 로컬 자정으로 반환
  - `formatLocalDate()`: 날짜를 YYYY-MM-DD 형식으로 포맷
  - `isToday()`: 날짜가 오늘인지 확인
- **캘린더 정확도**: 모든 캘린더가 사용자의 타임존과 일치

## 데이터베이스 스키마

### Tables

#### `exercise_days`
운동 기록 저장
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- date (DATE)
- completed (BOOLEAN)
- created_at (TIMESTAMPTZ)
```

#### `dopamine_categories`
도파민/습관 카테고리
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- name (TEXT)
- type (TEXT) - 'dopamine'
- unit (TEXT) - 'count' | 'duration'
- color (TEXT)
- goal_type (TEXT) - 'abstinence' | 'limit'
- goal_value (INTEGER)
- created_at (TIMESTAMPTZ)
```

#### `dopamine_entries`
도파민/습관 기록
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- category_id (UUID, FK)
- date (DATE)
- value (INTEGER) - 횟수 또는 분
- created_at (TIMESTAMPTZ)
```

#### `hobby_categories`
취미 카테고리
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- name (TEXT)
- type (TEXT) - 'hobby'
- unit (TEXT) - 'minutes'
- color (TEXT)
- goal_type (TEXT) - 'target' | 'duration'
- goal_value (INTEGER)
- created_at (TIMESTAMPTZ)
```

#### `hobby_entries`
취미 활동 기록
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- category_id (UUID, FK)
- date (DATE)
- value (INTEGER) - 분
- created_at (TIMESTAMPTZ)
```

#### `transactions`
금융 거래
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- date (DATE)
- type (TEXT) - 'income' | 'expense'
- category (TEXT)
- amount (DECIMAL)
- note (TEXT)
- is_recurring (BOOLEAN)
- recurring_day (INTEGER)
- created_at (TIMESTAMPTZ)
```

#### `routines`
일일 루틴
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- time (TIME)
- activity (TEXT)
- is_active (BOOLEAN)
- created_at (TIMESTAMPTZ)
```

#### `routine_completions`
루틴 완료 기록
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- routine_id (UUID, FK)
- date (DATE)
- completed (BOOLEAN)
- created_at (TIMESTAMPTZ)
```

#### `tasks` (NEW)
일회성 작업
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- date (DATE)
- time (TIME)
- title (TEXT)
- description (TEXT)
- completed (BOOLEAN)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### `user_settings`
사용자 설정
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- exercise_monthly_goal (INTEGER)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### Row Level Security (RLS)

모든 테이블에 RLS 활성화:
- 사용자는 본인의 데이터만 조회/수정/삭제 가능
- `auth.uid() = user_id` 정책 적용

## 기술 스택

### Frontend
- **React 18** - UI 프레임워크
- **React Router** - 라우팅
- **Vite** - 빌드 도구
- **CSS3** - 스타일링 및 애니메이션
- **Recharts** - 차트 라이브러리

### Backend & Database
- **Supabase** - Backend as a Service
  - PostgreSQL 데이터베이스
  - Authentication (Google OAuth)
  - Row Level Security
  - Real-time subscriptions

### Custom Hooks
- `useIsMobile()` - 모바일 뷰포트 감지 (≤768px)
- `useBreakpoint()` - 세밀한 브레이크포인트 감지 (mobile/tablet/desktop)

### Authentication
- Google OAuth 2.0
- Supabase Auth

## 폰트

다양한 한글 폰트 지원:
- Nanum Pen Script (손글씨)
- Nanum Gothic
- Noto Sans KR
- Jua
- Cute Font
- 기타 다수

## 브라우저 지원

- ✅ Chrome (권장)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ 모바일 브라우저 (iOS Safari, Chrome Mobile)

## 개발 가이드

### 새 페이지 추가
1. `src/pages/` 에 컴포넌트 생성
2. `src/App.jsx` 에 라우트 추가
3. CSS 파일 생성 및 임포트

### 새 데이터베이스 테이블 추가
1. SQL 스키마 파일 생성
2. Supabase SQL Editor에서 실행
3. `src/lib/database.js` 에 CRUD 함수 추가
4. RLS 정책 설정

### 테마 추가
1. `src/App.jsx` 의 `themes` 객체에 추가
2. 색상 정의 (background, card, navbar, text, accent)

## 트러블슈팅

### 데이터가 표시되지 않음
- Supabase 연결 확인
- `.env` 파일의 키 확인
- RLS 정책이 올바르게 설정되었는지 확인

### 모바일에서 레이아웃 깨짐
- Chrome DevTools에서 모바일 뷰 테스트
- `useIsMobile()` 훅이 올바르게 동작하는지 확인

### 날짜가 하루 차이남
- 타임존 헬퍼 함수 사용 확인
- `parseLocalDate()` 사용 (NOT `new Date()`)

## 라이선스

이 프로젝트는 개인용입니다.

## 기여

현재 개인 프로젝트로 운영 중입니다.
