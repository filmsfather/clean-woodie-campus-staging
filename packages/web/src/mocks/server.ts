import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * 서버 환경용 MSW Server 설정
 * 테스트 환경에서 사용됩니다.
 */
export const server = setupServer(...handlers);