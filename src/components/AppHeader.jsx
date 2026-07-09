import { useLocation, useNavigate } from 'react-router-dom';

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/') {
    return null;
  }

  return (
    <header className="app-header">
      <button type="button" className="app-header-logo" onClick={() => navigate('/')}>
        FridgeMeal
      </button>
    </header>
  );
}
