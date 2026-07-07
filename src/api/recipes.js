import { supabase } from '../lib/supabaseClient';

// GET /recipes/:id
export async function fetchRecipeDetail(id) {
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select('id, name, cooking_time, description')
    .eq('id', id)
    .single();

  if (recipeError || !recipe) {
    throw { code: 'NOT_FOUND', message: '레시피 정보를 불러올 수 없습니다.' };
  }

  const { data: ingredients, error: ingredientsError } = await supabase
    .from('recipe_ingredients')
    .select('ingredient_name, is_required')
    .eq('recipe_id', id);

  if (ingredientsError) {
    throw { code: 'NOT_FOUND', message: '레시피 정보를 불러올 수 없습니다.' };
  }

  return {
    id: recipe.id,
    name: recipe.name,
    cooking_time: recipe.cooking_time,
    description: recipe.description,
    ingredients: (ingredients ?? []).map((i) => ({ name: i.ingredient_name, is_required: i.is_required })),
  };
}
