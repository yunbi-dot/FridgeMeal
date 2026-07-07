# FridgeMeal DB 스키마 설계서

> **범위 제한**: 이 문서는 PRD(requirements.txt)의 5장 "데이터 및 백엔드 설계"에 명시된 테이블·컬럼만 포함한다. PRD에 없는 컬럼(카테고리, 유통기한, 이미지 등)이나 6장 백로그 항목은 포함하지 않는다.

## 1. 목적
PRD의 테이블 목록을 그대로, 구현 가능한 수준(타입, 제약조건, 인덱스, RLS)으로만 구체화한다. 필드를 임의로 추가하지 않는다.

## 2. ERD 개요

```
users (1) ──< (N) fridge
users (1) ──< (N) cooking_history
recipes (1) ──< (N) recipe_ingredients
recipes (1) ──< (N) cooking_history
ingredients_catalog (재료 선택 화면의 검색/카테고리/인기 재료 목록 제공용, 다른 테이블과 FK 관계 없음)
```

## 3. 테이블 정의

### 3.0 ingredients_catalog (재료 카탈로그)
PRD 재료 선택 화면의 "인기 재료 선택", "카테고리 필터 선택", "식재료 검색" 기능을 위한 마스터 데이터. PRD 5장 DB 구조에는 없으나, 3장 화면 설계 요구사항 구현에 필수여서 추가함.

| 컬럼 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | 카탈로그 항목 ID |
| name | text | not null, unique | 재료명 |
| category | text | not null | 카테고리 (예: 채소, 육류, 유제품, 수산물, 곡류 등) — 카테고리 필터용 |
| is_popular | boolean | not null, default false | 인기 재료 여부 — 재료 선택 화면 기본 노출 목록 기준 |

**인덱스**
- `idx_ingredients_catalog_category` on (`category`)
- `idx_ingredients_catalog_is_popular` on (`is_popular`) where `is_popular = true`
- `idx_ingredients_catalog_name` on (`name`) — 검색 성능 (trigram 인덱스 권장: `pg_trgm` 확장 사용 시 `gin (name gin_trgm_ops)`)

**RLS**: 공개 읽기 전용 (recipes와 동일 패턴). 관리자만 쓰기 가능하도록 별도 관리 도구/시드 스크립트로 데이터 적재.

---

### 3.1 users
| 컬럼 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | uuid | PK, default `auth.uid()` | Supabase Auth와 연동되는 사용자 ID |
| created_at | timestamptz | not null, default now() | 가입 시각 |

> Supabase Auth 사용 시 `auth.users`를 그대로 참조하거나, `public.users`를 별도로 두고 `id`를 `auth.users.id`의 FK로 연결하는 방식 권장 (프로필 확장 필드 대비).

---

### 3.2 fridge (냉장고 재료)
| 컬럼 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | 재료 레코드 ID |
| user_id | uuid | FK → users.id, not null | 소유 사용자 |
| name | text | not null | 재료명 |
| quantity | text | nullable | 수량(옵션, PRD 명시) |
| updated_at | timestamptz | not null, default now() | 최종 수정 시각 |

**제약조건**
- UNIQUE(`user_id`, `name`) — "동일 재료 존재 시 수량 수정 안내" 예외 처리를 DB 레벨에서 보장
- CHECK(`name` <> '') — 빈 값 입력 방지 (애플리케이션 레벨 검증과 이중 보장)

**인덱스**
- `idx_fridge_user_id` on (`user_id`) — 냉장고 조회 성능

---

### 3.3 recipes (레시피)
| 컬럼 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | 레시피 ID |
| name | text | not null | 메뉴명 |
| cooking_time | int | not null | 예상 조리 시간(분) |
| description | text | nullable | 레시피 설명 (PRD: "레시피 설명(단계별 or 텍스트)" — 단계 구분이 필요하면 description 안에 줄바꿈 텍스트로 저장, 별도 테이블 추가하지 않음) |

---

### 3.4 recipe_ingredients (레시피-재료 매핑)
| 컬럼 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | 매핑 ID (복합키 대신 단일 PK 권장 — 수정/삭제 용이) |
| recipe_id | uuid | FK → recipes.id, not null | 레시피 |
| ingredient_name | text | not null | 재료명 (fridge.name과 매칭 기준이 되는 정규화된 문자열) |
| is_required | boolean | not null, default true | 필수 재료 여부 |

**인덱스**
- `idx_recipe_ingredients_recipe_id` on (`recipe_id`)
- `idx_recipe_ingredients_ingredient_name` on (`ingredient_name`) — 재료 기반 역방향 검색(어떤 레시피가 이 재료를 쓰는지) 성능

> **재료명 매칭 이슈**: PRD 4장 재추천 로직에 "유사 재료 허용 (예: 닭가슴살 ↔ 닭고기)"이 명시되어 있어, 이를 구현하려면 아래 테이블이 반드시 필요하다. (PRD 5장 DB 구조에는 누락되어 있으나 4장 요구사항 구현을 위해 필수)

### 3.5 ingredient_synonyms (유사 재료 매핑, PRD 4장 재추천 조건 완화 구현용)
| 컬럼 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | uuid | PK | ID |
| ingredient_name | text | not null | 기준 재료명 |
| synonym_name | text | not null | 유사 재료명 |

---

### 3.6 cooking_history (요리 기록)
| 컬럼 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | 기록 ID |
| user_id | uuid | FK → users.id, not null | 사용자 |
| recipe_id | uuid | FK → recipes.id, not null | 조리한 레시피 |
| created_at | timestamptz | not null, default now() | 요리 완료 시각 |

**인덱스**
- `idx_cooking_history_user_id` on (`user_id`)

## 4. RLS(Row Level Security) 정책

```sql
-- fridge
alter table fridge enable row level security;

create policy fridge_select_own on fridge
  for select using (auth.uid() = user_id);

create policy fridge_insert_own on fridge
  for insert with check (auth.uid() = user_id);

create policy fridge_update_own on fridge
  for update using (auth.uid() = user_id);

create policy fridge_delete_own on fridge
  for delete using (auth.uid() = user_id);

-- cooking_history (동일 패턴, select/insert만 허용 — 기록은 수정/삭제 불필요)
alter table cooking_history enable row level security;

create policy history_select_own on cooking_history
  for select using (auth.uid() = user_id);

create policy history_insert_own on cooking_history
  for insert with check (auth.uid() = user_id);

-- recipes, recipe_ingredients: 공개 읽기
alter table recipes enable row level security;
create policy recipes_public_read on recipes for select using (true);

alter table recipe_ingredients enable row level security;
create policy recipe_ingredients_public_read on recipe_ingredients for select using (true);

-- ingredients_catalog: 공개 읽기
alter table ingredients_catalog enable row level security;
create policy ingredients_catalog_public_read on ingredients_catalog for select using (true);
```
