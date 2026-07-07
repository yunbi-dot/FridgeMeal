// FridgeMeal 추천 엔진 (Supabase Edge Function)
// 03_api_spec.md 4.1 POST /recommend, 05_recommendation_algorithm.md 처리 단계를 그대로 구현한다.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import {
  Recipe,
  ScoredRecipe,
  SynonymRow,
  passesRequiredFilter,
  scoreRecipe,
  sortByScoreDesc,
} from './scoring.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function fetchCandidates(
  supabase: ReturnType<typeof createClient>,
  excludeRecipeIds: string[],
): Promise<Recipe[]> {
  let query = supabase
    .from('recipes')
    .select('id, name, cooking_time, description, recipe_ingredients(ingredient_name, is_required)');

  if (excludeRecipeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeRecipeIds.join(',')})`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    cookingTime: row.cooking_time,
    description: row.description,
    ingredients: (row.recipe_ingredients ?? []).map((ri: any) => ({
      name: ri.ingredient_name,
      isRequired: ri.is_required,
    })),
  }));
}

async function fetchSynonyms(supabase: ReturnType<typeof createClient>): Promise<SynonymRow[]> {
  const { data, error } = await supabase.from('ingredient_synonyms').select('ingredient_name, synonym_name');
  if (error) throw error;
  return (data ?? []).map((row: any) => ({ ingredientName: row.ingredient_name, synonymName: row.synonym_name }));
}

function toApiShape(scored: ScoredRecipe) {
  return {
    recipe_id: scored.recipe.id,
    name: scored.recipe.name,
    cooking_time: scored.recipe.cookingTime,
    description: scored.recipe.description,
    matched_ingredients: scored.matched,
    missing_ingredients: scored.missing,
    match_rate: Math.round(scored.matchRate * 100) / 100,
  };
}

type RecommendInput = {
  ingredients: string[];
  excludeRecipeIds: string[];
  allowSimilar: boolean;
};

// stage 0: 엄격 필터 / stage 1: 유사 재료 허용 / stage 2: 유사 재료 허용 + 필수재료 1개 미충족 허용
async function recommend(
  supabase: ReturnType<typeof createClient>,
  input: RecommendInput,
  stage: number,
  candidates: Recipe[],
  synonyms: SynonymRow[] | null,
): Promise<{ results: ReturnType<typeof toApiShape>[]; relaxed: boolean }> {
  const allowSimilar = input.allowSimilar || stage >= 1;
  const relaxRequiredByOne = stage >= 2;

  if (allowSimilar && synonyms === null) {
    synonyms = await fetchSynonyms(supabase);
  }

  const filtered = candidates.filter((r) =>
    passesRequiredFilter(r, input.ingredients, allowSimilar, synonyms ?? [], relaxRequiredByOne),
  );
  const scored = sortByScoreDesc(filtered.map((r) => scoreRecipe(r, input.ingredients)));
  const top3 = scored.slice(0, 3);

  // Step 4/6: 3개를 확보했거나, 완화 단계를 모두 소진했으면 현재 결과를 반환한다.
  if (top3.length >= 3 || stage >= 2) {
    return { results: top3.map(toApiShape), relaxed: allowSimilar };
  }

  // Step 5: 후보가 1개 이상 3개 미만이거나 0개이면 다음 완화 단계로 재시도한다.
  return recommend(supabase, input, stage + 1, candidates, synonyms);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: { code: 'RECOMMEND_FAILED', message: '추천 결과를 불러오지 못했습니다. 다시 시도해주세요.' } }, 405);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: { code: 'RECOMMEND_FAILED', message: '추천 결과를 불러오지 못했습니다. 다시 시도해주세요.' } }, 400);
  }

  const ingredients: string[] = Array.isArray(body?.ingredients) ? body.ingredients : [];
  const excludeRecipeIds: string[] = Array.isArray(body?.exclude_recipe_ids) ? body.exclude_recipe_ids : [];
  const allowSimilar: boolean = body?.allow_similar === true;

  if (ingredients.length === 0) {
    return jsonResponse({ error: { code: 'NO_INGREDIENTS', message: '재료를 1개 이상 선택해주세요.' } }, 400);
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );

    const candidates = await fetchCandidates(supabase, excludeRecipeIds);
    const result = await recommend(
      supabase,
      { ingredients, excludeRecipeIds, allowSimilar },
      0,
      candidates,
      null,
    );

    return jsonResponse(result, 200);
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: { code: 'RECOMMEND_FAILED', message: '추천 결과를 불러오지 못했습니다. 다시 시도해주세요.' } }, 500);
  }
});
