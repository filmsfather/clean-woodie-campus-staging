import { Router } from 'express';
import { GamificationController } from '../controllers/GamificationController';
import { AuthMiddleware } from '../../middleware/AuthMiddleware';
import { RateLimitMiddleware } from '../../middleware/RateLimitMiddleware';
import { ValidationMiddleware } from '../../middleware/ValidationMiddleware';

export class GamificationRoutes {
  public router: Router;

  constructor(
    private gamificationController: GamificationController,
    private authMiddleware: AuthMiddleware,
    private rateLimitMiddleware: RateLimitMiddleware,
    private validationMiddleware: ValidationMiddleware
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // 모든 라우트에 인증 미들웨어 적용
    this.router.use(this.authMiddleware.authenticate);

    // 대시보드 조회
    this.router.get(
      '/dashboard',
      this.rateLimitMiddleware.createLimiter({ windowMs: 60000, max: 30 }), // 1분에 30회
      this.gamificationController.getDashboard
    );

    // 리더보드 조회
    this.router.get(
      '/leaderboards',
      this.rateLimitMiddleware.createLimiter({ windowMs: 60000, max: 20 }), // 1분에 20회
      this.gamificationController.getLeaderboards
    );

    // 보상 교환
    this.router.post(
      '/rewards/redeem',
      this.rateLimitMiddleware.createLimiter({ windowMs: 60000, max: 5 }), // 1분에 5회
      this.validationMiddleware.validateBody({
        rewardCode: { required: true, type: 'string', minLength: 1, maxLength: 50 }
      }),
      this.gamificationController.redeemReward
    );

    // 학습 이벤트 처리 라우트들
    const eventLimiter = this.rateLimitMiddleware.createLimiter({ 
      windowMs: 60000, 
      max: 100 
    }); // 1분에 100회

    // 퀴즈 완료
    this.router.post(
      '/events/quiz-completed',
      eventLimiter,
      this.validationMiddleware.validateBody({
        score: { required: true, type: 'number', min: 0 },
        totalQuestions: { required: true, type: 'number', min: 1 }
      }),
      this.gamificationController.onQuizCompleted
    );

    // 과제 제출
    this.router.post(
      '/events/assignment-submitted',
      eventLimiter,
      this.validationMiddleware.validateBody({
        isOnTime: { required: false, type: 'boolean' }
      }),
      this.gamificationController.onAssignmentSubmitted
    );

    // 출석
    this.router.post(
      '/events/attendance',
      eventLimiter,
      this.validationMiddleware.validateBody({
        consecutiveDays: { required: false, type: 'number', min: 1 }
      }),
      this.gamificationController.onAttendance
    );

    // 학습 목표 달성
    this.router.post(
      '/events/goal-achieved',
      eventLimiter,
      this.validationMiddleware.validateBody({
        goalType: { required: true, type: 'string', enum: ['daily', 'weekly', 'monthly'] },
        goalName: { required: true, type: 'string', minLength: 1, maxLength: 200 }
      }),
      this.gamificationController.onGoalAchieved
    );

    // 관리자용 토큰 지급 (추가 권한 체크 필요)
    this.router.post(
      '/tokens/award',
      this.authMiddleware.requireRole(['admin', 'teacher']), // 관리자/교사만 가능
      this.rateLimitMiddleware.createLimiter({ windowMs: 60000, max: 10 }), // 1분에 10회
      this.validationMiddleware.validateBody({
        studentId: { required: true, type: 'string', minLength: 1 },
        amount: { required: true, type: 'number', min: 1, max: 1000 },
        reason: { required: true, type: 'string', minLength: 1, maxLength: 200 }
      }),
      this.gamificationController.awardTokens
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}