import { supabase } from '../lib/supabaseClient';

// GET /ingredients: q가 있으면 검색, 없으면 category 필터, 둘 다 없으면 인기 재료
export async function fetchIngredients({ q, category } = {}) {
  let query = supabase.from('ingredients_catalog').select('id, name, category');

  if (q) {
    query = query.ilike('name', `%${q}%`);
  }
  if (category) {
    query = query.eq('category', category);
  }
  if (!q && !category) {
    query = query.eq('is_popular', true);
  }

  const { data, error } = await query.order('name', { ascending: true });
  if (error) throw { code: 'FETCH_FAILED', message: '재료 목록을 불러오지 못했습니다.' };
  return { items: data ?? [] };
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('ingredients_catalog')
    .select('category')
    .order('category', { ascending: true });
  if (error) throw { code: 'FETCH_FAILED', message: '카테고리 목록을 불러오지 못했습니다.' };
  return [...new Set((data ?? []).map((row) => row.category))];
}
