import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { requestRecommend } from '../api/recommend';
import { RecipeCard } from '../components/RecipeCard';
import { SecondaryButton } from '../components/SecondaryButton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { InfoBadge } from '../components/InfoBadge';
import { PrimaryButton } from '../components/PrimaryButton';

export function RecommendResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') === 'fridge' ? 'fridge' : 'instant';

  const ingredients = location.state?.ingredients;

  const [results, setResults] = useState([]);
  const [relaxed, setRelaxed] = useState(false);
  const [excludeIds, setExcludeIds] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error

  async function fetchRecommendations(exclude) {
    setStatus('loading');
    try {
      const data = await requestRecommend({ ingredients, excludeRecipeIds: exclude });
      setResults(data.results);
      setRelaxed(data.relaxed);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  useEffect(() => {
    if (!ingredients || ingredients.length === 0) return;
    setExcludeIds([]);
    fetchRecommendations([]);
    // 최초 진입 시 1회만 조회한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function requestMoreRecommendations() {
    const nextExclude = [...excludeIds, ...results.map((r) => r.recipe_id)];
    setExcludeIds(nextExclude);
    fetchRecommendations(nextExclude);
  }

  function backToSelection() {
    navigate(mode === 'fridge' ? '/fridge' : '/select-ingredients');
  }

  if (!ingredients || ingredients.length === 0) {
    return (
      <div className="page">
        <ErrorState message="재료 정보를 찾을 수 없습니다. 재료를 다시 선택해주세요." onRetry={backToSelection} />
      </div>
    );
  }

  return (
    <div className="page">
      <h1>추천 결과</h1>
      <p className="selected-ingredients-summary">선택한 재료: {ingredients.join(', ')}</p>

      {status === 'loading' && <p className="muted">추천 결과를 불러오는 중...</p>}

      {status === 'error' && (
        <ErrorState
          message="추천 결과를 불러오지 못했습니다. 다시 시도해주세요."
          onRetry={() => fetchRecommendations(excludeIds)}
        />
      )}

      {status === 'success' && results.length === 0 && (
        <EmptyState
          message="해당 조건으로 추천 가능한 메뉴가 없습니다."
          action={<PrimaryButton label="재료 다시 선택하기" onClick={backToSelection} />}
        />
      )}

      {status === 'success' && results.length > 0 && (
        <>
          {relaxed && <InfoBadge text="유사 재료를 포함해 추천했어요" />}
          <div className="recipe-card-list">
            {results.map((recipe) => (
              <RecipeCard
                key={recipe.recipe_id}
                recipe={recipe}
                onClick={() => navigate(`/recipes/${recipe.recipe_id}?mode=${mode}`)}
              />
            ))}
          </div>
          <SecondaryButton label="다른 메뉴 보기" onClick={requestMoreRecommendations} />
        </>
      )}
    </div>
  );
}
