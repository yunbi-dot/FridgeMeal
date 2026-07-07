import { useNavigate } from 'react-router-dom';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextButton } from '../components/TextButton';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="page home-page">
      <h1 className="service-logo">FridgeMeal</h1>
      <p className="tagline">냉장고 속 재료로 오늘의 메뉴를 추천해드립니다.</p>
      <div className="home-actions">
        <PrimaryButton label="즉시 추천" onClick={() => navigate('/select-ingredients')} />
        <PrimaryButton label="냉장고 기반 추천" onClick={() => navigate('/fridge')} />
        <TextButton label="냉장고 관리" onClick={() => navigate('/fridge/manage')} />
      </div>
    </div>
  );
}
