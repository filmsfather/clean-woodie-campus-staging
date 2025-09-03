import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * 브라우저 환경용 MSW Worker 설정
 * Storybook과 개발 환경에서 사용됩니다.
 */
export const worker = setupWorker(...handlers);