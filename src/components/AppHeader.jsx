import { useNavigate } from 'react-router-dom';

export function AppHeader() {
  const navigate = useNavigate();

  return (
    <header className="app-header">
      <button type="button" className="app-header-logo" onClick={() => navigate('/')}>
        FridgeMeal
      </button>
    </header>
  );
}
