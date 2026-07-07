import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addFridgeItem, deleteFridgeItem, fetchFridgeItems, updateFridgeItem } from '../api/fridge';
import { SearchInput } from '../components/SearchInput';
import { FridgeEditableList } from '../components/FridgeEditableList';
import { IngredientFormModal } from '../components/IngredientFormModal';
import { PrimaryButton } from '../components/PrimaryButton';
import { ErrorState } from '../components/ErrorState';
import { useToast } from '../components/Toast';

export function FridgeManagePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formError, setFormError] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['fridge'], queryFn: fetchFridgeItems });
  const fridgeItems = data?.items ?? [];

  const filteredFridgeItems = useMemo(() => {
    if (!searchQuery) return fridgeItems;
    return fridgeItems.filter((item) => item.name.includes(searchQuery));
  }, [fridgeItems, searchQuery]);

  function invalidateFridge() {
    queryClient.invalidateQueries({ queryKey: ['fridge'] });
  }

  const addMutation = useMutation({
    mutationFn: addFridgeItem,
    onSuccess: () => {
      invalidateFridge();
      setIsAddModalOpen(false);
      setFormError(null);
    },
    onError: (error) => {
      if (error?.code === 'EMPTY_NAME' || error?.code === 'DUPLICATE_INGREDIENT') {
        setFormError(error.message);
      } else {
        showToast('냉장고 정보 저장에 실패했습니다. 다시 시도해주세요.');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, quantity }) => updateFridgeItem(id, { quantity }),
    onSuccess: () => {
      invalidateFridge();
      setEditingItem(null);
      setFormError(null);
    },
    onError: (error) => {
      showToast(error?.message ?? '냉장고 정보 저장에 실패했습니다. 다시 시도해주세요.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFridgeItem,
    onSuccess: invalidateFridge,
    onError: () => {
      showToast('삭제에 실패했습니다. 다시 시도해주세요.');
    },
  });

  function handleAddSubmit({ name, quantity }) {
    addMutation.mutate({ name, quantity });
  }

  function handleEditSubmit({ quantity }) {
    updateMutation.mutate({ id: editingItem.id, quantity });
  }

  function handleDelete(item) {
    deleteMutation.mutate(item.id);
  }

  if (isLoading) {
    return (
      <div className="page">
        <h1>냉장고 관리</h1>
        <p className="muted">불러오는 중...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="page">
        <h1>냉장고 관리</h1>
        <ErrorState message="냉장고 정보를 불러오지 못했습니다." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="page">
      <h1>냉장고 관리</h1>
      <SearchInput value={searchQuery} onChange={setSearchQuery} />

      <FridgeEditableList
        items={filteredFridgeItems}
        onEdit={(item) => {
          setEditingItem(item);
          setFormError(null);
        }}
        onDelete={handleDelete}
      />

      <PrimaryButton
        label="+ 재료 추가"
        onClick={() => {
          setIsAddModalOpen(true);
          setFormError(null);
        }}
      />
      <PrimaryButton label="저장" onClick={() => navigate('/')} />

      {isAddModalOpen && (
        <IngredientFormModal
          mode="add"
          onSubmit={handleAddSubmit}
          onClose={() => setIsAddModalOpen(false)}
          error={formError}
        />
      )}

      {editingItem && (
        <IngredientFormModal
          mode="edit"
          item={editingItem}
          onSubmit={handleEditSubmit}
          onClose={() => setEditingItem(null)}
          error={formError}
        />
      )}
    </div>
  );
}
