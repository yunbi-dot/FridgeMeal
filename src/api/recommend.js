import { supabase } from '../lib/supabaseClient';

// POST /recommend (Edge Function 호출)
export async function requestRecommend({ ingredients, excludeRecipeIds = [], allowSimilar = false }) {
  if (!ingredients || ingredients.length === 0) {
    throw { code: 'NO_INGREDIENTS', message: '재료를 1개 이상 선택해주세요.' };
  }

  const { data, error } = await supabase.functions.invoke('recommend', {
    body: {
      ingredients,
      exclude_recipe_ids: excludeRecipeIds,
      allow_similar: allowSimilar,
    },
  });

  if (error) {
    throw { code: 'RECOMMEND_FAILED', message: '추천 결과를 불러오지 못했습니다. 다시 시도해주세요.' };
  }

  return data; // { results, relaxed }
}
