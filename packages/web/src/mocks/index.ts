/**
 * MSW Mocks 내보내기
 * 
 * 개발 환경과 Storybook에서 모든 UseCase에 대한 현실적인 API 모킹을 제공합니다.
 * 
 * **사용법:**
 * ```typescript
 * // 개발 환경에서
 * import { worker } from './mocks';
 * if (process.env.NODE_ENV === 'development') {
 *   worker.start();
 * }
 * 
 * // 테스트 환경에서
 * import { server } from './mocks';
 * beforeAll(() => server.listen());
 * afterEach(() => server.resetHandlers());
 * afterAll(() => server.close());
 * ```
 * 
 * **지원하는 UseCases:**
 * - Auth: SignIn, SignUp, GetProfile, UpdateProfile
 * - Dashboard: GetStudentDashboard
 * - SRS: GetTodayReviews, SubmitReviewFeedback, GetReviewStatistics
 * - Progress: GetClassProgress, GetStreakRankings
 * - Gamification: GetLeaderboards, GetAvailableRewards, RedeemReward
 */

export { worker } from './browser';
export { server } from './server';
export { handlers } from './handlers';