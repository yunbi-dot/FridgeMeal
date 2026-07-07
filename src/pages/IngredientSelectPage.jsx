import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchCategories, fetchIngredients } from '../api/ingredients';
import { SearchInput } from '../components/SearchInput';
import { CategoryFilterBar } from '../components/CategoryFilterBar';
import { IngredientList } from '../components/IngredientList';
import { Chip } from '../components/Chip';
import { PrimaryButton } from '../components/PrimaryButton';
import { ErrorState } from '../components/ErrorState';

export function IngredientSelectPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  const { data: categories = [] } = useQuery({
    queryKey: ['ingredient-categories'],
    queryFn: fetchCategories,
  });

  const ingredientsQueryKey = ['ingredients', searchQuery, selectedCategory];
  const {
    data: ingredientsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ingredientsQueryKey,
    queryFn: () =>
      fetchIngredients({
        q: searchQuery || undefined,
        category: searchQuery ? undefined : selectedCategory || undefined,
      }),
  });

  function addToSelected(name) {
    setSelectedIngredients((prev) => (prev.includes(name) ? prev : [...prev, name]));
  }

  function removeFromSelected(name) {
    setSelectedIngredients((prev) => prev.filter((n) => n !== name));
  }

  function handleSelectCategory(category) {
    setSelectedCategory(category);
    setSearchQuery('');
  }

  function handleSearchChange(value) {
    setSearchQuery(value);
    if (value) setSelectedCategory(null);
  }

  function handleRequestRecommend() {
    if (selectedIngredients.length === 0) return;
    navigate('/recommend?mode=instant', { state: { ingredients: selectedIngredients } });
  }

  return (
    <div className="page">
      <h1>재료 선택</h1>

      <SearchInput value={searchQuery} onChange={handleSearchChange} />
      <CategoryFilterBar categories={categories} selected={selectedCategory} onSelect={handleSelectCategory} />

      {isLoading && <p className="muted">불러오는 중...</p>}
      {isError && <ErrorState message="재료 목록을 불러오지 못했습니다." onRetry={refetch} />}
      {!isLoading && !isError && (
        <IngredientList
          items={ingredientsData?.items ?? []}
          selectedNames={selectedIngredients}
          onSelect={addToSelected}
        />
      )}

      <div className="selected-chip-area">
        {selectedIngredients.map((name) => (
          <Chip key={name} label={name} onRemove={() => removeFromSelected(name)} />
        ))}
      </div>

      {selectedIngredients.length === 0 && <p className="inline-error">재료를 1개 이상 선택해주세요.</p>}

      <PrimaryButton
        label="메뉴 추천받기"
        disabled={selectedIngredients.length === 0}
        onClick={handleRequestRecommend}
      />
    </div>
  );
}
