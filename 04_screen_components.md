# FridgeMeal 화면-컴포넌트 명세서

## 1. 목적
와이어프레임 수준의 화면 설계를 프론트엔드 구현 단위(컴포넌트, 상태, 라우팅)로 분해한다.

## 2. 라우팅 구조

| 경로 | 화면 |
|---|---|
| `/` | 홈 |
| `/select-ingredients` | 재료 선택 (즉시 추천 모드) |
| `/fridge` | 내 냉장고 |
| `/fridge/manage` | 냉장고 관리 |
| `/recommend?mode=instant\|fridge` | 추천 결과 |
| `/recipes/:id?mode=instant\|fridge` | 레시피 상세 |

> `mode` 쿼리 파라미터로 즉시 추천/냉장고 기반 추천을 구분한다. 레시피 상세에서 "요리 완료" 버튼 노출 여부(냉장고 기반 모드에서만 노출)를 이 값으로 결정한다.

## 3. 화면별 컴포넌트 분해

### 3.1 홈 (`/`)
```
<HomePage>
  <ServiceLogo />
  <TagLine text="냉장고 속 재료로 오늘의 메뉴를 추천해드립니다." />
  <PrimaryButton label="즉시 추천" onClick={→ /select-ingredients} />
  <PrimaryButton label="냉장고 기반 추천" onClick={→ /fridge} />
  <TextButton label="냉장고 관리" onClick={→ /fridge/manage} />
</HomePage>
```
- 로컬 상태 없음 (순수 네비게이션 화면)

---

### 3.2 재료 선택 (`/select-ingredients`)
```
<IngredientSelectPage>
  <SearchInput onChange={setSearchQuery} />
  <CategoryFilterBar categories={...} selected={selectedCategory} onSelect={setSelectedCategory} />
  <IngredientList
    items={searchQuery ? searchResults : popularIngredients}
    onSelect={addToSelected}
  />
  <SelectedIngredientChips items={selectedIngredients} onRemove={removeFromSelected} />
  <PrimaryButton
    label="메뉴 추천받기"
    disabled={selectedIngredients.length === 0}
    onClick={() => navigate(`/recommend?mode=instant`, { state: { ingredients: selectedIngredients } })}
  />
</IngredientSelectPage>
```

**로컬 상태**
| 상태명 | 타입 | 설명 |
|---|---|---|
| searchQuery | string | 검색어 |
| selectedCategory | string \| null | 선택된 카테고리 필터 |
| selectedIngredients | string[] | 선택된 재료 목록 |

**서버 상태 (React Query)**
| 쿼리 | 설명 |
|---|---|
| `popularIngredients` | `GET /ingredients` (파라미터 없음 → `is_popular=true` 항목) |
| `searchResults` | `GET /ingredients?q={searchQuery}` |
| `categoryFiltered` | `GET /ingredients?category={selectedCategory}` |

**예외 UI**
- `selectedIngredients.length === 0` → 버튼 비활성화 + "재료를 1개 이상 선택해주세요." 인라인 메시지

---

### 3.3 내 냉장고 (`/fridge`)
```
<MyFridgePage>
  <FridgeSummary totalCount={fridgeItems.length} />
  <SearchInput onChange={setSearchQuery} />
  <FridgeItemList
    items={filteredFridgeItems}
    selectedIds={selectedIds}
    onToggle={toggleSelect}
  />
  <TextButton label="냉장고 관리" onClick={→ /fridge/manage} />
  <PrimaryButton
    label="메뉴 추천받기"
    disabled={selectedIds.length === 0}
    onClick={() => navigate(`/recommend?mode=fridge`, { state: { ingredients: selectedNames } })}
  />
</MyFridgePage>
```

**서버 상태**: `GET /fridge` → `fridgeItems`

**빈 상태 처리**
```
fridgeItems.length === 0 →
  <EmptyState
    message="냉장고가 비어 있어요."
    action={<PrimaryButton label="재료를 추가해주세요" onClick={→ /fridge/manage} />}
  />
```

---

### 3.4 냉장고 관리 (`/fridge/manage`)
```
<FridgeManagePage>
  <SearchInput onChange={setSearchQuery} />
  <FridgeEditableList
    items={fridgeItems}
    onEdit={openEditModal}
    onDelete={deleteItem}
  />
  <AddIngredientButton onClick={openAddModal} />
  <SaveButton onClick={saveChanges} />

  {isAddModalOpen && <IngredientFormModal mode="add" onSubmit={addItem} onDuplicate={showDuplicateError} />}
  {isEditModalOpen && <IngredientFormModal mode="edit" item={editingItem} onSubmit={updateItem} />}
</FridgeManagePage>
```

**로컬 상태**
| 상태명 | 설명 |
|---|---|
| isAddModalOpen / isEditModalOpen | 모달 표시 여부 |
| editingItem | 수정 중인 항목 |
| formError | "재료 이름을 입력해주세요." / "이미 존재하는 재료입니다." 등 |

**Mutation (React Query)**: `POST /fridge`, `PATCH /fridge/:id`, `DELETE /fridge/:id`

**에러 처리 매핑**
| API 에러 코드 | UI 반응 |
|---|---|
| EMPTY_NAME | 폼 인라인 에러 |
| DUPLICATE_INGREDIENT | 폼 인라인 에러 + 기존 항목으로 포커스 이동 |
| SAVE_FAILED | 토스트 메시지 + 재시도 버튼 |

---

### 3.5 추천 결과 (`/recommend`)
```
<RecommendResultPage>
  <SelectedIngredientsSummary items={ingredients} />
  <RecipeCardList
    cards={recommendResults}
    onSelectCard={(recipe) => navigate(`/recipes/${recipe.recipe_id}?mode=${mode}`)}
  />
  <SecondaryButton label="다른 메뉴 보기" onClick={requestMoreRecommendations} />
</RecommendResultPage>

<RecipeCard>
  <MenuName />
  <UsedIngredientsSummary matched={matched_ingredients} missing={missing_ingredients} />
  <CookingTime />
  <ShortDescription />
</RecipeCard>
```

**서버 상태**: `POST /recommend` 결과 → `recommendResults`, `excludeIds`(누적)

**"다른 메뉴 보기" 동작**
```js
requestMoreRecommendations = () => {
  excludeIds.push(...recommendResults.map(r => r.recipe_id));
  refetch({ ingredients, exclude_recipe_ids: excludeIds });
};
```

**예외 UI**
| 상황 | 컴포넌트 |
|---|---|
| results.length === 0 | `<EmptyState message="해당 조건으로 추천 가능한 메뉴가 없습니다." action="재료 다시 선택하기" />` |
| API 실패 | `<ErrorState message="추천 결과를 불러오지 못했습니다. 다시 시도해주세요." onRetry={refetch} />` |
| relaxed === true | 카드 리스트 상단에 `<InfoBadge text="유사 재료를 포함해 추천했어요" />` |

---

### 3.6 레시피 상세 (`/recipes/:id`)
```
<RecipeDetailPage>
  <RecipeHeader name={recipe.name} cookingTime={recipe.cooking_time} />
  <RecipeSteps steps={recipe.steps} />
  <RequiredIngredientsList ingredients={recipe.ingredients} />
  {mode === 'fridge' && (
    <PrimaryButton label="요리 완료" onClick={completeCooking} />
  )}
  <BackButton onClick={() => navigate(-1)} />
</RecipeDetailPage>
```

**Mutation**: `POST /cooking-history` (mode === 'fridge'일 때만 노출)

**예외 처리**
| 상황 | UI |
|---|---|
| 레시피 조회 실패 | "레시피 정보를 불러올 수 없습니다." |
| 요리 기록 저장 실패 | 토스트: "요리 기록 저장에 실패했습니다. 다시 시도해주세요." + 재시도 |
| 저장 성공 | 토스트: "요리 기록이 저장되었어요" → 자동으로 홈(`/`)으로 이동 (디자인 원칙 5: "모든 흐름은 홈으로 돌아온다") |

## 4. 공통 컴포넌트 목록
| 컴포넌트 | 용도 |
|---|---|
| `PrimaryButton` / `SecondaryButton` / `TextButton` | 버튼 3종 |
| `SearchInput` | 검색창 (재료 선택, 내 냉장고, 냉장고 관리 공통) |
| `EmptyState` | 빈 상태 안내 (냉장고 비어있음, 추천 결과 없음 등 공통) |
| `ErrorState` | 에러 안내 + 재시도 |
| `Chip` | 선택된 재료 표시용 |
| `Toast` | 저장 성공/실패 알림 |

## 5. 전역 상태 vs 로컬 상태 정리
- **전역/서버 상태(React Query)**: fridge 목록, recipes, recommend 결과 → 화면 이동 후에도 캐시 유지
- **화면 간 전달 상태**: 선택된 재료 목록은 `navigate(path, { state })`로 전달 (전역 스토어 불필요, MVP 규모에서는 과설계 방지)
- **로컬 상태**: 검색어, 필터, 모달 오픈 여부 등은 각 화면 내부에서만 관리
