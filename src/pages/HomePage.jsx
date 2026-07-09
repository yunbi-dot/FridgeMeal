import { useNavigate } from 'react-router-dom';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextButton } from '../components/TextButton';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="page home-page">
      <div className="home-decor" aria-hidden="true">
        <div className="home-blob home-blob-1" />
        <div className="home-blob home-blob-2" />
        <span className="home-leaf home-leaf-1" />
        <span className="home-leaf home-leaf-2" />
        <span className="home-leaf home-leaf-3" />
        <span className="home-leaf home-leaf-4" />
        <span className="home-dot home-dot-1" />
        <span className="home-dot home-dot-2" />
        <span className="home-dot home-dot-3" />
      </div>

      <div className="home-content">
        <h1 className="service-logo">FridgeMeal</h1>
        <p className="tagline">
          냉장고 속 재료로
          <br />
          오늘의 메뉴를 추천해드립니다.
        </p>
        <div className="home-actions">
          <PrimaryButton
            label="즉시 추천"
            className="btn-home-instant"
            onClick={() => navigate('/select-ingredients')}
          />
          <PrimaryButton
            label="냉장고 기반 추천"
            className="btn-home-fridge"
            onClick={() => navigate('/fridge')}
          />
          <TextButton label="냉장고 관리" onClick={() => navigate('/fridge/manage')} />
        </div>
      </div>
    </div>
  );
}
