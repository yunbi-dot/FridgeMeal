# FridgeMeal

냉장고 속 재료로 오늘의 메뉴를 추천해주는 서비스.

## 기술 스택
- Frontend: React + Vite (`src/`)
- Backend: Supabase (Postgres + Auth + Edge Functions, `supabase/`)
- 배포: Vercel

## 로컬 실행
```
npm install
npm run dev
```

`.env.example`을 참고해 `.env`에 Supabase 프로젝트 URL/키를 설정해야 합니다.

## 문서
- `00_requirements.txt`: PRD
- `01_architecture.md` ~ `05_recommendation_algorithm.md`: 설계 문서
