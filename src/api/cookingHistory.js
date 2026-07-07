import { supabase } from '../lib/supabaseClient';

// POST /cooking-history
export async function saveCookingHistory(recipeId) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw { code: 'SAVE_FAILED', message: '요리 기록 저장에 실패했습니다. 다시 시도해주세요.' };
  }

  const { data, error } = await supabase
    .from('cooking_history')
    .insert({ user_id: userData.user.id, recipe_id: recipeId })
    .select('id, recipe_id, created_at')
    .single();

  if (error) throw { code: 'SAVE_FAILED', message: '요리 기록 저장에 실패했습니다. 다시 시도해주세요.' };
  return data;
}
