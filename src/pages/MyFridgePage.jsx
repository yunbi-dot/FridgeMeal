import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchFridgeItems } from '../api/fridge';
import { SearchInput } from '../components/SearchInput';
import { FridgeItemList } from '../components/FridgeItemList';
import { TextButton } from '../components/TextButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';

export function MyFridgePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({ queryKey: ['fridge'], queryFn: fetchFridgeItems });

  const fridgeItems = data?.items ?? [];

  const filteredFridgeItems = useMemo(() => {
    if (!searchQuery) return fridgeItems;
    return fridgeItems.filter((item) => item.name.includes(searchQuery));
  }, [fridgeItems, searchQuery]);

  function toggleSelect(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }

  function handleRequestRecommend() {
    const selectedNames = fridgeItems.filter((item) => selectedIds.includes(item.id)).map((item) => item.name);
    if (selectedNames.length === 0) return;
    navigate('/recommend?mode=fridge', { state: { ingredients: selectedNames } });
  }

  if (isLoading) {
    return (
      <div className="page">
        <h1>내 냉장고</h1>
        <p className="muted">불러오는 중...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="page">
        <h1>내 냉장고</h1>
        <ErrorState message="냉장고 정보를 불러오지 못했습니다." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="page">
      <h1>내 냉장고</h1>
      <p className="fridge-summary">총 {fridgeItems.length}개 재료 보관 중</p>

      {fridgeItems.length === 0 ? (
        <EmptyState
          message="냉장고가 비어 있어요."
          action={<PrimaryButton label="재료를 추가해주세요" onClick={() => navigate('/fridge/manage')} />}
        />
      ) : (
        <>
          <SearchInput value={searchQuery} onChange={setSearchQuery} />
          <FridgeItemList items={filteredFridgeItems} selectedIds={selectedIds} onToggle={toggleSelect} />

          {selectedIds.length === 0 && <p className="inline-error">재료를 1개 이상 선택해주세요.</p>}

          <TextButton label="냉장고 관리" onClick={() => navigate('/fridge/manage')} />
          <PrimaryButton
            label="메뉴 추천받기"
            disabled={selectedIds.length === 0}
            onClick={handleRequestRecommend}
          />
        </>
      )}
    </div>
  );
}
