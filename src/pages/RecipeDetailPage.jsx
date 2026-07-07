import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchRecipeDetail } from '../api/recipes';
import { saveCookingHistory } from '../api/cookingHistory';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextButton } from '../components/TextButton';
import { ErrorState } from '../components/ErrorState';
import { useToast } from '../components/Toast';

function RecipeSteps({ description }) {
  if (!description) return null;
  const lines = description.split('\n').filter(Boolean);
  return (
    <div className="recipe-steps">
      {lines.map((line, idx) => (
        <p key={idx}>{line}</p>
      ))}
    </div>
  );
}

function RequiredIngredientsList({ ingredients }) {
  return (
    <ul className="required-ingredients-list">
      {ingredients.map((ing) => (
        <li key={ing.name}>
          {ing.name} {ing.is_required ? '' : <span className="muted">(선택)</span>}
        </li>
      ))}
    </ul>
  );
}

export function RecipeDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') === 'fridge' ? 'fridge' : 'instant';
  const navigate = useNavigate();
  const showToast = useToast();
  const [savedOnce, setSavedOnce] = useState(false);

  const { data: recipe, isLoading, isError } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => fetchRecipeDetail(id),
  });

  const completeCookingMutation = useMutation({
    mutationFn: () => saveCookingHistory(id),
    onSuccess: () => {
      showToast('요리 기록이 저장되었어요');
      setSavedOnce(true);
      setTimeout(() => navigate('/'), 1000);
    },
    onError: () => {
      showToast('요리 기록 저장에 실패했습니다. 다시 시도해주세요.');
    },
  });

  if (isLoading) {
    return (
      <div className="page">
        <p className="muted">불러오는 중...</p>
      </div>
    );
  }

  if (isError || !recipe) {
    return (
      <div className="page">
        <ErrorState message="레시피 정보를 불러올 수 없습니다." onRetry={() => navigate(-1)} />
      </div>
    );
  }

  return (
    <div className="page">
      <h1>{recipe.name}</h1>
      <p className="recipe-detail-time">조리 시간 {recipe.cooking_time}분</p>

      <RecipeSteps description={recipe.description} />

      <h2>필요 재료</h2>
      <RequiredIngredientsList ingredients={recipe.ingredients} />

      {mode === 'fridge' && (
        <PrimaryButton
          label="요리 완료"
          disabled={completeCookingMutation.isPending || savedOnce}
          onClick={() => completeCookingMutation.mutate()}
        />
      )}

      <TextButton label="뒤로가기" onClick={() => navigate(-1)} />
    </div>
  );
}
