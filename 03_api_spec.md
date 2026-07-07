# FridgeMeal API 명세서

> **범위 제한**: PRD(requirements.txt) 5장 API 구조에 명시된 엔드포인트만 다루되, 재료 카탈로그 API는 3장 화면 설계(재료 선택 화면의 검색/카테고리/인기 재료)를 구현하기 위해 추가로 정의했다. 그 외 PRD에 없는 필드는 포함하지 않는다.

## 1. 공통 사항
- Base URL: Supabase 프로젝트 URL (`https://<project>.supabase.co`)
- 인증: 모든 요청에 Supabase Auth Access Token을 `Authorization: Bearer <token>` 헤더로 포함
- 응답 포맷: JSON
- 공통 에러 응답 포맷
```json
{
  "error": {
    "code": "FRIDGE_EMPTY",
    "message": "냉장고가 비어 있어요."
  }
}
```

## 2. 재료 카탈로그 API

### 2.1 GET /ingredients
재료 선택 화면의 인기 재료 / 카테고리 필터 / 검색을 처리한다. (테이블: `ingredients_catalog`)

**Query Parameters**
| 파라미터 | 필수 | 설명 |
|---|---|---|
| q | N | 검색어. 있으면 검색 결과를, 없으면 인기 재료 목록을 반환 |
| category | N | 카테고리 필터 (예: `채소`) |

**Response 200 (검색어/카테고리 없음 → 인기 재료, `is_popular = true`인 항목 반환)**
```json
{ "items": [ { "id": "uuid", "name": "계란", "category": "유제품" } ] }
```

**Response 200 (q="계"로 검색, name ILIKE 매칭)**
```json
{ "items": [ { "id": "uuid", "name": "계란", "category": "유제품" } ] }
```

**Response 200 (category="채소")**
```json
{ "items": [ { "id": "uuid", "name": "양파", "category": "채소" } ] }
```

---

## 3. 냉장고 API

### 3.1 GET /fridge
냉장고에 저장된 재료 목록을 조회한다.

**Response 200**
```json
{
  "items": [
    { "id": "uuid", "name": "계란", "quantity": "6개" }
  ],
  "count": 12
}
```

**Response 200 (빈 냉장고)**
```json
{ "items": [], "count": 0 }
```
> 클라이언트는 `count === 0`일 때 "냉장고가 비어 있어요." 메시지와 재료 추가 유도 UI를 표시한다.

---

### 3.2 POST /fridge
재료를 추가한다.

**Request**
```json
{ "name": "계란", "quantity": "6개" }
```

**Response 201**
```json
{ "id": "uuid", "name": "계란", "quantity": "6개", "updated_at": "2026-07-07T10:00:00Z" }
```

**Error Cases**
| code | 상황 | message |
|---|---|---|
| `EMPTY_NAME` | name이 빈 문자열 | "재료 이름을 입력해주세요." |
| `DUPLICATE_INGREDIENT` | 동일 user_id+name 존재 (DB unique 제약 위반) | "이미 존재하는 재료입니다. 수량을 수정해주세요." |
| `SAVE_FAILED` | DB insert 실패 | "냉장고 정보 저장에 실패했습니다. 다시 시도해주세요." |

---

### 3.3 PATCH /fridge/:id
재료 정보를 수정한다 (수량 등).

**Request**
```json
{ "quantity": "4개" }
```

**Response 200**
```json
{ "id": "uuid", "name": "계란", "quantity": "4개", "updated_at": "2026-07-07T11:00:00Z" }
```

**Error Cases**: `NOT_FOUND`(404), `SAVE_FAILED`(500)

---

### 3.4 DELETE /fridge/:id
재료를 삭제한다.

**Response 204**: 본문 없음

**Error Cases**: `NOT_FOUND`(404)

---

## 4. 추천 API

### 4.1 POST /recommend
선택된 재료를 기반으로 메뉴 3개를 추천한다. (즉시 추천/냉장고 기반 추천 공통 사용)

**Request**
```json
{
  "ingredients": ["계란", "김치", "돼지고기"],
  "exclude_recipe_ids": [],
  "allow_similar": false
}
```
| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| ingredients | string[] | Y | 추천에 사용할 재료 목록 (최소 1개) |
| exclude_recipe_ids | string[] | N | "다른 메뉴 보기" 요청 시 이미 보여준 레시피 ID 목록 |
| allow_similar | boolean | N | 조건 완화(유사 재료 허용) 여부. 기본값 false |

**Response 200**
```json
{
  "results": [
    {
      "recipe_id": "uuid",
      "name": "김치찌개",
      "cooking_time": 20,
      "description": "돼지고기와 김치로 만드는 얼큰한 찌개",
      "matched_ingredients": ["계란", "김치", "돼지고기"],
      "missing_ingredients": ["두부"],
      "match_rate": 0.75
    }
  ],
  "relaxed": false
}
```
- `relaxed: true`인 경우, 조건 완화(유사 재료 포함)를 적용해 결과를 생성했음을 의미 → 클라이언트는 "유사 재료를 포함해 추천했어요" 안내 배지 표시

**Response 200 (추천 결과 없음, 완화 후에도 0건)**
```json
{ "results": [], "relaxed": true }
```
> 클라이언트는 "해당 조건으로 추천 가능한 메뉴가 없습니다." + "재료 다시 선택하기" 안내

**Error Cases**
| code | 상황 | message |
|---|---|---|
| `NO_INGREDIENTS` | ingredients 배열이 비어있음 | "재료를 1개 이상 선택해주세요." |
| `RECOMMEND_FAILED` | 서버/DB 오류 | "추천 결과를 불러오지 못했습니다. 다시 시도해주세요." |

**재추천("다른 메뉴 보기") 호출 규칙**
- 클라이언트는 직전 요청의 `ingredients`와 동일한 값을 유지하고, 직전 응답의 `recipe_id` 목록을 `exclude_recipe_ids`에 누적하여 재요청한다.
- 서버는 후보가 1개 이상 3개 미만이면 `allow_similar`를 내부적으로 true로 전환해 재시도 후 `relaxed: true`로 응답한다.

---

## 5. 레시피 API

### 5.1 GET /recipes/:id
레시피 상세 정보를 조회한다.

**Response 200**
```json
{
  "id": "uuid",
  "name": "김치찌개",
  "cooking_time": 20,
  "description": "돼지고기와 김치로 만드는 얼큰한 찌개\n1. 돼지고기를 볶는다\n2. 김치를 넣고 볶는다\n3. 물을 붓고 끓인다",
  "ingredients": [
    { "name": "돼지고기", "is_required": true },
    { "name": "김치", "is_required": true },
    { "name": "두부", "is_required": false }
  ]
}
```

**Error Cases**
| code | 상황 | message |
|---|---|---|
| `NOT_FOUND` | 레시피 없음 | "레시피 정보를 불러올 수 없습니다." |

---

## 6. 요리 기록 API

### 6.1 POST /cooking-history
요리 완료 시 기록을 저장한다.

**Request**
```json
{ "recipe_id": "uuid" }
```

**Response 201**
```json
{ "id": "uuid", "recipe_id": "uuid", "created_at": "2026-07-07T12:00:00Z" }
```

**Error Cases**
| code | 상황 | message |
|---|---|---|
| `SAVE_FAILED` | insert 실패 | "요리 기록 저장에 실패했습니다. 다시 시도해주세요." |

---

## 7. 에러 코드 종합표
| code | HTTP Status | message |
|---|---|---|
| EMPTY_NAME | 400 | 재료 이름을 입력해주세요. |
| DUPLICATE_INGREDIENT | 409 | 이미 존재하는 재료입니다. 수량을 수정해주세요. |
| NO_INGREDIENTS | 400 | 재료를 1개 이상 선택해주세요. |
| NOT_FOUND | 404 | 요청한 리소스를 찾을 수 없습니다. |
| SAVE_FAILED | 500 | 저장에 실패했습니다. 다시 시도해주세요. |
| RECOMMEND_FAILED | 500 | 추천 결과를 불러오지 못했습니다. 다시 시도해주세요. |
