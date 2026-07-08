import { useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/') {
    return null;
  }

  return (
    <header className="app-header">
      <button type="button" className="app-header-logo" onClick={() => navigate('/')} aria-label="홈으로 이동">
        <img src={logo} alt="FridgeMeal" className="app-header-logo-img" />
      </button>
    </header>
  );
}
