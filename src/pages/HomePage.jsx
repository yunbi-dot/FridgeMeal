import { useNavigate } from 'react-router-dom';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextButton } from '../components/TextButton';
import { Sparkle } from '../components/Sparkle';
import { FridgeIllustration } from '../components/FridgeIllustration';
import logo from '../assets/logo.png';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="page home-page">
      <div className="home-sparkle">
        <Sparkle size={18} />
      </div>
      <img src={logo} alt="FridgeMeal" className="home-logo-img" />
      <p className="tagline">냉장고 속 재료로 오늘의 메뉴를 추천해드립니다.</p>
      <FridgeIllustration size={140} className="home-illustration" />
      <div className="home-actions">
        <PrimaryButton label="즉시 추천" onClick={() => navigate('/select-ingredients')} />
        <PrimaryButton label="냉장고 기반 추천" onClick={() => navigate('/fridge')} />
        <TextButton label="냉장고 관리" onClick={() => navigate('/fridge/manage')} />
      </div>
    </div>
  );
}
