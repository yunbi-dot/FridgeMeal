import { supabase } from '../lib/supabaseClient';
import { toAppError } from './errors';

// GET /fridge
export async function fetchFridgeItems() {
  const { data, error } = await supabase
    .from('fridge')
    .select('id, name, quantity, updated_at')
    .order('updated_at', { ascending: false });
  if (error) throw toAppError(error, 'SAVE_FAILED', '냉장고 정보를 불러오지 못했습니다.');
  return { items: data ?? [], count: data?.length ?? 0 };
}

// POST /fridge
export async function addFridgeItem({ name, quantity }) {
  const trimmed = (name ?? '').trim();
  if (!trimmed) {
    throw { code: 'EMPTY_NAME', message: '재료 이름을 입력해주세요.' };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw { code: 'SAVE_FAILED', message: '냉장고 정보 저장에 실패했습니다. 다시 시도해주세요.' };
  }

  const { data, error } = await supabase
    .from('fridge')
    .insert({ user_id: userData.user.id, name: trimmed, quantity: quantity?.trim() || null })
    .select('id, name, quantity, updated_at')
    .single();

  if (error) throw toAppError(error, 'SAVE_FAILED', '냉장고 정보 저장에 실패했습니다. 다시 시도해주세요.');
  return data;
}

// PATCH /fridge/:id
export async function updateFridgeItem(id, { quantity }) {
  const { data, error } = await supabase
    .from('fridge')
    .update({ quantity: quantity?.trim() || null })
    .eq('id', id)
    .select('id, name, quantity, updated_at')
    .single();

  if (error) throw toAppError(error, 'SAVE_FAILED', '냉장고 정보 저장에 실패했습니다. 다시 시도해주세요.');
  return data;
}

// DELETE /fridge/:id
export async function deleteFridgeItem(id) {
  const { error } = await supabase.from('fridge').delete().eq('id', id);
  if (error) throw toAppError(error, 'SAVE_FAILED', '삭제에 실패했습니다. 다시 시도해주세요.');
}
