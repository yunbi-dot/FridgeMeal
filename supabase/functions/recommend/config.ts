// 05_recommendation_algorithm.md: "가중치는 초기값이며 ... 하드코딩 금지, config 파일에서 관리 권장"
// 가중치 순서: 재료 일치율(0.6) > 부족 재료 최소화(0.3) > 조리 시간(0.1)
export const WEIGHTS = {
  MATCH_RATE: 0.6,
  MISSING_PENALTY: 0.3,
  COOKING_TIME: 0.1,
};

// 조리 시간 정규화 기준(분)
export const TIME_NORMALIZATION_MINUTES = 30;
