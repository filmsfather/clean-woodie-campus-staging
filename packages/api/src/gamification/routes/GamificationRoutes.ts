import { Router } from 'express';
import { body } from 'express-validator';
import { GamificationController } from '../controllers/GamificationController';
import { authMiddleware } from '../../middleware/AuthMiddleware';
import { rateLimitMiddleware } from '../../middleware/RateLimitMiddleware';
import { validateRequest } from '../../middleware/ValidationMiddleware';

export class GamificationRoutes {
  public router: Router;

  constructor(
    private gamificationController: GamificationController
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // 모든 라우트에 인증 미들웨어 적용
    this.router.use(authMiddleware);

    // 대시보드 조회
    this.router.get(
      '/dashboard',
      rateLimitMiddleware(60, 30), // 1분에 30회
      this.gamificationController.getDashboard
    );

    // 리더보드 조회
    this.router.get(
      '/leaderboards',
      rateLimitMiddleware(60, 20), // 1분에 20회
      this.gamificationController.getLeaderboards
    );

    // 보상 교환
    this.router.post(
      '/rewards/redeem',
      rateLimitMiddleware(60, 5), // 1분에 5회
      validateRequest,
      this.gamificationController.redeemReward
    );

    // 학습 이벤트 처리 라우트들
    const eventLimiter = rateLimitMiddleware(60, 100); // 1분에 100회

    // 퀴즈 완료
    this.router.post(
      '/events/quiz-completed',
      eventLimiter,
      validateRequest,
      this.gamificationController.onQuizCompleted
    );

    // 과제 제출
    this.router.post(
      '/events/assignment-submitted',
      eventLimiter,
      body('isOnTime').optional().isBoolean().withMessage('isOnTime must be a boolean'),
      validateRequest,
      this.gamificationController.onAssignmentSubmitted
    );

    // 출석
    this.router.post(
      '/events/attendance',
      eventLimiter,
      body('consecutiveDays').optional().isInt({ min: 1 }).withMessage('consecutiveDays must be a positive integer'),
      validateRequest,
      this.gamificationController.onAttendance
    );

    // 학습 목표 달성
    this.router.post(
      '/events/goal-achieved',
      eventLimiter,
      body('goalType').isIn(['daily', 'weekly', 'monthly']).withMessage('goalType must be daily, weekly, or monthly'),
      body('goalName').isLength({ min: 1, max: 200 }).withMessage('goalName must be between 1 and 200 characters'),
      validateRequest,
      this.gamificationController.onGoalAchieved
    );

    // 관리자용 토큰 지급 (추가 권한 체크 필요)
    this.router.post(
      '/tokens/award',
      rateLimitMiddleware(60, 10), // 1분에 10회
      body('studentId').isString().isLength({ min: 1 }).withMessage('studentId is required'),
      body('amount').isInt({ min: 1, max: 1000 }).withMessage('amount must be between 1 and 1000'),
      body('reason').isLength({ min: 1, max: 200 }).withMessage('reason must be between 1 and 200 characters'),
      validateRequest,
      this.gamificationController.awardTokens
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}