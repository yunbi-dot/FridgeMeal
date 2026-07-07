# FridgeMeal 시스템 아키텍처 설계서

> **범위 제한**: PRD(requirements.txt) 1~5장에 명시된 기능만 대상으로 한다. 6장 백로그 항목(알림, AI 개인화 추천, 장보기 연계 등)은 이 문서에 포함하지 않는다.

## 1. 목적
기획 명세서에 정의된 기능을 구현하기 위한 시스템 구조, 데이터 흐름, 인증 방식을 정의한다.

## 2. 전체 아키텍처 구성

```
[클라이언트 (Web/App)]
        |
        |  HTTPS (REST / Supabase Client SDK)
        v
[Supabase]
   ├─ Auth (사용자 인증)
   ├─ Postgres DB (users, fridge, recipes, recipe_ingredients, cooking_history)
   ├─ Row Level Security (사용자별 데이터 접근 제어)
   └─ Edge Function: recommend-engine (추천 로직 실행)
        |
        v
[추천 엔진 (Supabase Edge Function)]
   - 입력: 재료 리스트
   - 처리: 필터링 → 스코어링 → 상위 3개 선정
   - 출력: 추천 메뉴 3개
```

## 3. 컴포넌트별 책임

### 3.1 클라이언트
- 화면 렌더링, 사용자 입력 수집
- 상태 관리: 선택된 재료(로컬 상태), 냉장고 데이터(서버 상태 캐시)
- Supabase Client SDK를 통한 인증/DB 호출
- 추천 API 호출 및 결과 렌더링

### 3.2 Supabase Auth
- PRD의 화면 목록(IA)에 로그인 화면이 없으므로, **Supabase 익명 로그인(Anonymous Sign-in)**으로 사용자를 식별한다. 앱 최초 진입 시 자동으로 익명 세션이 생성되고, 이 세션의 `auth.uid()`가 `users.id`로 사용된다.
- `auth.uid()`를 기준으로 `users.id`와 매핑

### 3.3 Supabase DB (Postgres)
- Source of Truth: `fridge` 테이블
- RLS 정책으로 사용자는 본인의 `fridge`, `cooking_history`만 조회/수정 가능
- `recipes`, `recipe_ingredients`는 전체 공개 읽기(Public Read) 테이블

### 3.4 추천 엔진
- Supabase Edge Function(Deno, TypeScript)으로 구현
- 무상태(Stateless) 함수: 재료 리스트를 입력받아 recipes/recipe_ingredients를 조회 후 스코어링하여 반환
- "이미 보여준 메뉴 제외" 로직을 위해 클라이언트가 exclude_ids를 함께 전달 (서버는 세션을 기억하지 않음)

## 4. 데이터 흐름 시나리오

### 4.1 즉시 추천 모드 (A)
1. 클라이언트: 사용자가 재료 선택 (로컬 상태에만 보관, DB 저장 안 함)
2. 클라이언트 → Edge Function: `POST /recommend { ingredients: [...] }`
3. Edge Function → DB: recipes/recipe_ingredients 조회 및 스코어링
4. Edge Function → 클라이언트: 추천 메뉴 3개 반환
5. (선택) 레시피 상세 조회: `GET /recipes/:id`

### 4.2 냉장고 기반 추천 모드 (B)
1. 클라이언트 → DB: `GET /fridge` (RLS로 본인 데이터만 조회)
2. 사용자가 재료 선택
3. 클라이언트 → Edge Function: `POST /recommend { ingredients: [...], mode: "fridge" }`
4. 메뉴 선택 → 레시피 상세 조회
5. 요리 완료 클릭 → 클라이언트 → DB: `cooking_history`에 insert

### 4.3 냉장고 관리 모드 (C)
1. 클라이언트 → DB: `GET /fridge`
2. 추가/수정/삭제는 각각 `POST /fridge`, `PATCH /fridge/:id`, `DELETE /fridge/:id`
3. RLS 정책에 의해 본인 데이터만 변경 가능

## 5. 인증/보안 정책
- 모든 `fridge`, `cooking_history` 테이블은 RLS 활성화
- 정책 예시:
  - `fridge_select_own`: `user_id = auth.uid()`
  - `fridge_insert_own`: `user_id = auth.uid()`
  - 동일하게 update/delete에도 적용
- `recipes`, `recipe_ingredients`는 RLS 비활성화 또는 전체 공개 읽기 정책만 적용

## 6. 비기능 요구사항
| 항목 | 기준 |
|---|---|
| 추천 응답 시간 | 1초 이내 (recipes 데이터가 소규모(수백~수천 건)인 MVP 기준) |
| 동시 접속 | Supabase 기본 플랜 기준 대응 가능 |
| 데이터 정합성 | 냉장고 변경 시 즉시 반영 (Optimistic UI 지양, 서버 응답 후 갱신 권장) |

## 7. 기술 스택 (확정)
- **Frontend**: React + Vite
- **Backend**: Supabase (Postgres + Auth + Edge Functions)
- **추천 로직 언어**: TypeScript (Edge Function)
- **상태 관리**: React Query(서버 상태) + 컴포넌트 로컬 상태(선택 재료 등)

> PRD가 프론트엔드 기술을 지정하지 않아 위와 같이 하나로 확정함. 다른 스택을 원하면 알려주시면 문서를 그에 맞게 바꿉니다.
