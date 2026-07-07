import { WEIGHTS, TIME_NORMALIZATION_MINUTES } from './config.ts';

export type RecipeIngredient = { name: string; isRequired: boolean };
export type Recipe = {
  id: string;
  name: string;
  cookingTime: number;
  description: string | null;
  ingredients: RecipeIngredient[];
};
export type SynonymRow = { ingredientName: string; synonymName: string };

export type ScoredRecipe = {
  recipe: Recipe;
  matched: string[];
  missing: string[];
  matchRate: number;
  totalScore: number;
};

// ingredient_synonyms은 한쪽 방향으로만 저장되어 있으므로 양방향으로 조회한다.
function isSimilar(name: string, userIngredients: string[], synonyms: SynonymRow[]): boolean {
  return synonyms.some((row) => {
    if (row.ingredientName === name) return userIngredients.includes(row.synonymName);
    if (row.synonymName === name) return userIngredients.includes(row.ingredientName);
    return false;
  });
}

function isMatch(name: string, userIngredients: string[], allowSimilar: boolean, synonyms: SynonymRow[]): boolean {
  if (userIngredients.includes(name)) return true;
  return allowSimilar && isSimilar(name, userIngredients, synonyms);
}

// Step 2. 필수 재료 충족 여부 필터
// relaxRequiredByOne: 필수 재료 중 최대 1개까지는 충족하지 못해도 후보로 남긴다 (05장 Step 5의 2차 완화)
export function passesRequiredFilter(
  recipe: Recipe,
  userIngredients: string[],
  allowSimilar: boolean,
  synonyms: SynonymRow[],
  relaxRequiredByOne: boolean,
): boolean {
  const required = recipe.ingredients.filter((i) => i.isRequired);
  const unmet = required.filter((req) => !isMatch(req.name, userIngredients, allowSimilar, synonyms));
  return relaxRequiredByOne ? unmet.length <= 1 : unmet.length === 0;
}

// Step 3. 스코어링 (일치율 0.6 > 부족재료 최소화 0.3 > 조리시간 0.1)
export function scoreRecipe(recipe: Recipe, userIngredients: string[]): ScoredRecipe {
  const allNames = recipe.ingredients.map((i) => i.name);
  const matched = allNames.filter((name) => userIngredients.includes(name));
  const missing = allNames.filter((name) => !userIngredients.includes(name));

  const matchRate = allNames.length > 0 ? matched.length / allNames.length : 0;
  const missingPenalty = missing.length;
  const cookingTime = recipe.cookingTime;

  const normalizedMissingScore = 1 / (1 + missingPenalty);
  const normalizedTimeScore = 1 / (1 + cookingTime / TIME_NORMALIZATION_MINUTES);

  const totalScore =
    matchRate * WEIGHTS.MATCH_RATE +
    normalizedMissingScore * WEIGHTS.MISSING_PENALTY +
    normalizedTimeScore * WEIGHTS.COOKING_TIME;

  return { recipe, matched, missing, matchRate, totalScore };
}

export function sortByScoreDesc(candidates: ScoredRecipe[]): ScoredRecipe[] {
  return [...candidates].sort((a, b) => b.totalScore - a.totalScore);
}
