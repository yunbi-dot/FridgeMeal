# FridgeMeal 추천 알고리즘 설계서

## 1. 목적
기획 명세서의 추천 기준(필수 재료 충족 → 일치율 → 부족 재료 최소화 → 조리 시간)을 실제 계산 가능한 스코어링 로직으로 구체화한다.

## 2. 입력/출력

**입력**
```ts
type RecommendInput = {
  ingredients: string[];          // 사용자가 선택한 재료
  excludeRecipeIds: string[];     // 이미 보여준 레시피 (재추천 시)
  allowSimilar: boolean;          // 유사 재료 허용 여부
};
```

**출력**
```ts
type RecommendOutput = {
  results: {
    recipeId: string;
    name: string;
    cookingTime: number;
    description: string;
    matchedIngredients: string[];
    missingIngredients: string[];
    matchRate: number;
  }[];
  relaxed: boolean;
};
```

## 3. 처리 단계

### Step 1. 후보 레시피 조회
- `excludeRecipeIds`에 포함되지 않은 모든 recipes를 대상으로 함
- 각 recipe에 대해 `recipe_ingredients`를 join하여 필수/선택 재료 리스트 확보

### Step 2. 1차 필터링 — 필수 재료 충족 여부
```ts
function passesRequiredFilter(recipe, userIngredients, allowSimilar) {
  const requiredIngredients = recipe.ingredients.filter(i => i.is_required);
  return requiredIngredients.every(req =>
    userIngredients.includes(req.name) ||
    (allowSimilar && isSimilar(req.name, userIngredients))
  );
}
```
- `isSimilar`는 `ingredient_synonyms` 테이블을 참조해 유사 재료 여부 판단 (예: 닭가슴살 ↔ 닭고기)
- 이 필터를 통과하지 못하면 후보에서 완전히 제외 (가장 중요한 기준이므로 스코어링 대상에서도 제외)

### Step 3. 스코어링

각 후보 레시피에 대해 아래 점수를 계산한다. 가중치는 기획 명세서의 "위에서부터 중요" 순서를 반영한다.

```ts
function scoreRecipe(recipe, userIngredients) {
  const allIngredientNames = recipe.ingredients.map(i => i.name);
  const matched = allIngredientNames.filter(name => userIngredients.includes(name));
  const missing = allIngredientNames.filter(name => !userIngredients.includes(name));

  const matchRate = matched.length / allIngredientNames.length;       // 재료 일치율
  const missingPenalty = missing.length;                              // 부족 재료 수 (적을수록 좋음)
  const cookingTime = recipe.cooking_time;                            // 짧을수록 좋음 (보조 기준)

  // 가중치: 일치율(0.6) > 부족재료 최소화(0.3) > 조리시간(0.1)
  const normalizedMissingScore = 1 / (1 + missingPenalty);            // missing이 적을수록 1에 가까움
  const normalizedTimeScore = 1 / (1 + cookingTime / 30);             // 30분 기준 정규화

  const totalScore =
    matchRate * 0.6 +
    normalizedMissingScore * 0.3 +
    normalizedTimeScore * 0.1;

  return { recipe, matched, missing, matchRate, totalScore };
}
```

> 가중치(0.6 / 0.3 / 0.1)는 초기값이며, 실제 서비스 데이터 축적 후 A/B 테스트로 조정 가능하도록 상수로 분리해 관리한다 (하드코딩 금지, config 파일에서 관리 권장).

### Step 4. 정렬 및 상위 3개 추출
```ts
const sorted = scoredCandidates.sort((a, b) => b.totalScore - a.totalScore);
const top3 = sorted.slice(0, 3);
```

### Step 5. 조건 완화 (후보가 1개 이상 3개 미만일 때)
```ts
if (top3.length > 0 && top3.length < 3 && !allowSimilar) {
  // 유사 재료를 허용하여 재계산
  return recommend({ ...input, allowSimilar: true }); // relaxed: true로 반환
}
```

**완화 순서 (기획 명세서 기준)**
1. 유사 재료 허용 (`isSimilar` 활성화)
2. 그래도 부족하면 일부 필수 재료를 선택 재료로 재분류하여 재필터링 (예: 후보 recipe 중 필수재료 미충족이 1개뿐인 경우 완화 대상으로 포함)

### Step 6. 결과 없음 처리
```ts
if (top3.length === 0) {
  return { results: [], relaxed: true }; // 조건 완화까지 시도했지만 0건
}
```

## 4. 재추천("다른 메뉴 보기") 로직
1. 동일한 `ingredients`, 동일한 스코어링 로직 사용
2. `excludeRecipeIds`에 직전 결과의 `recipeId`를 누적 전달
3. 후보 재계산 → 상위 3개 재추출
4. 후보가 소진되어 3개 미만이면 Step 5(조건 완화) 적용

## 5. 성능 고려사항
- MVP 단계에서 recipes 데이터가 수백~수천 건이면 애플리케이션 레벨 스코어링으로 충분 (DB 쿼리 최적화 불필요)
- 데이터 규모가 커질 경우, Step 2 필터링을 SQL 레벨(재료 매칭 서브쿼리)로 이전하여 후보 수를 먼저 줄인 뒤 애플리케이션에서 스코어링하는 방식으로 전환

## 6. 테스트 케이스 예시
| 케이스 | 입력 | 기대 결과 |
|---|---|---|
| 정상 추천 | 재료 5개, 매칭 레시피 10개 이상 | 필수 재료 충족 + 점수 상위 3개 반환 |
| 후보 부족 | 재료 1개, 매칭 레시피 1개 | `allowSimilar=true`로 재시도, `relaxed: true` |
| 추천 불가 | 존재하지 않는 재료만 선택 | `results: []`, `relaxed: true` |
| 재추천 | 직전 3개 recipeId를 exclude 후 재요청 | 이전 결과와 겹치지 않는 새 3개 반환 |
| 재료 0개 | ingredients: [] | 서버 진입 전 클라이언트에서 차단 (`NO_INGREDIENTS` 에러) |
