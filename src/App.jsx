import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useAnonymousAuth } from './hooks/useAnonymousAuth';
import { HomePage } from './pages/HomePage';
import { IngredientSelectPage } from './pages/IngredientSelectPage';
import { MyFridgePage } from './pages/MyFridgePage';
import { FridgeManagePage } from './pages/FridgeManagePage';
import { RecommendResultPage } from './pages/RecommendResultPage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { ErrorState } from './components/ErrorState';
import { AppHeader } from './components/AppHeader';

export function App() {
  const { ready, error } = useAnonymousAuth();

  if (error) {
    return (
      <div className="page">
        <ErrorState message="서비스에 연결하지 못했습니다. 다시 시도해주세요." onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="page">
        <p className="muted">불러오는 중...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppHeader />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/select-ingredients" element={<IngredientSelectPage />} />
        <Route path="/fridge" element={<MyFridgePage />} />
        <Route path="/fridge/manage" element={<FridgeManagePage />} />
        <Route path="/recommend" element={<RecommendResultPage />} />
        <Route path="/recipes/:id" element={<RecipeDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
