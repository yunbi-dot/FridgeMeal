// Postgres 에러 코드를 03_api_spec.md의 에러 코드 체계로 변환한다.
export function toAppError(error, fallbackCode, fallbackMessage) {
  if (error?.code === '23505') {
    return { code: 'DUPLICATE_INGREDIENT', message: '이미 존재하는 재료입니다. 수량을 수정해주세요.' };
  }
  if (error?.code === '23514' || error?.code === '23502') {
    return { code: 'EMPTY_NAME', message: '재료 이름을 입력해주세요.' };
  }
  if (error?.code === 'PGRST116') {
    return { code: 'NOT_FOUND', message: '요청한 리소스를 찾을 수 없습니다.' };
  }
  return { code: fallbackCode, message: fallbackMessage };
}
