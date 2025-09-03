import { Request, Response } from 'express';
import { BaseController } from '../../common/BaseController';
import { GamificationApplicationService } from '../../../application';

export class GamificationController extends BaseController {
  constructor(
    private gamificationService: GamificationApplicationService
  ) {
    super();
  }

  /**
   * GET /api/gamification/dashboard
   * 게임화 대시보드 데이터 조회
   */
  public getDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = req.user?.id;
      if (!studentId) {
        return this.unauthorized(res, 'Authentication required');
      }

      const result = await this.gamificationService.getDashboard(studentId);
      
      if (result.isFailure) {
        return this.fail(res, result.getErrorValue());
      }

      return this.ok(res, result.getValue());
    } catch (error) {
      return this.fail(res, `Failed to get dashboard: ${error}`);
    }
  };

  /**
   * POST /api/gamification/tokens/award
   * 토큰 지급 (관리자용)
   */
  public awardTokens = async (req: Request, res: Response): Promise<void> => {
    try {
      const { studentId, amount, reason } = req.body;

      if (!studentId || !amount || !reason) {
        return this.clientError(res, 'Missing required fields: studentId, amount, reason');
      }

      if (typeof amount !== 'number' || amount <= 0) {
        return this.clientError(res, 'Amount must be a positive number');
      }

      const result = await this.gamificationService.awardTokens(
        studentId,
        amount,
        reason
      );

      if (result.isFailure) {
        return this.fail(res, result.getErrorValue());
      }

      return this.ok(res, result.getValue());
    } catch (error) {
      return this.fail(res, `Failed to award tokens: ${error}`);
    }
  };

  /**
   * POST /api/gamification/rewards/redeem
   * 보상 교환
   */
  public redeemReward = async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = req.user?.id;
      if (!studentId) {
        return this.unauthorized(res, 'Authentication required');
      }

      const { rewardCode } = req.body;
      if (!rewardCode) {
        return this.clientError(res, 'Missing required field: rewardCode');
      }

      const result = await this.gamificationService.redeemReward(
        studentId,
        rewardCode
      );

      if (result.isFailure) {
        return this.fail(res, result.getErrorValue());
      }

      return this.ok(res, result.getValue());
    } catch (error) {
      return this.fail(res, `Failed to redeem reward: ${error}`);
    }
  };

  /**
   * GET /api/gamification/leaderboards
   * 리더보드 조회
   */
  public getLeaderboards = async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = req.user?.id;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.gamificationService.getLeaderboards(
        studentId,
        limit
      );

      if (result.isFailure) {
        return this.fail(res, result.getErrorValue());
      }

      return this.ok(res, result.getValue());
    } catch (error) {
      return this.fail(res, `Failed to get leaderboards: ${error}`);
    }
  };

  /**
   * POST /api/gamification/events/quiz-completed
   * 퀴즈 완료 이벤트 처리
   */
  public onQuizCompleted = async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = req.user?.id;
      if (!studentId) {
        return this.unauthorized(res, 'Authentication required');
      }

      const { score, totalQuestions } = req.body;
      
      if (typeof score !== 'number' || typeof totalQuestions !== 'number') {
        return this.clientError(res, 'Score and totalQuestions must be numbers');
      }

      if (score < 0 || totalQuestions <= 0 || score > totalQuestions) {
        return this.clientError(res, 'Invalid score or totalQuestions values');
      }

      const result = await this.gamificationService.onQuizCompleted(
        studentId,
        score,
        totalQuestions
      );

      if (result.isFailure) {
        return this.fail(res, result.getErrorValue());
      }

      return this.ok(res, {
        message: 'Quiz completion processed successfully',
        tokensAwarded: result.getValue()
      });
    } catch (error) {
      return this.fail(res, `Failed to process quiz completion: ${error}`);
    }
  };

  /**
   * POST /api/gamification/events/assignment-submitted
   * 과제 제출 이벤트 처리
   */
  public onAssignmentSubmitted = async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = req.user?.id;
      if (!studentId) {
        return this.unauthorized(res, 'Authentication required');
      }

      const { isOnTime = true } = req.body;

      const result = await this.gamificationService.onAssignmentSubmitted(
        studentId,
        isOnTime
      );

      if (result.isFailure) {
        return this.fail(res, result.getErrorValue());
      }

      return this.ok(res, {
        message: 'Assignment submission processed successfully',
        tokensAwarded: result.getValue()
      });
    } catch (error) {
      return this.fail(res, `Failed to process assignment submission: ${error}`);
    }
  };

  /**
   * POST /api/gamification/events/attendance
   * 출석 이벤트 처리
   */
  public onAttendance = async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = req.user?.id;
      if (!studentId) {
        return this.unauthorized(res, 'Authentication required');
      }

      const { consecutiveDays = 1 } = req.body;

      if (typeof consecutiveDays !== 'number' || consecutiveDays < 1) {
        return this.clientError(res, 'consecutiveDays must be a positive number');
      }

      const result = await this.gamificationService.onAttendance(
        studentId,
        consecutiveDays
      );

      if (result.isFailure) {
        return this.fail(res, result.getErrorValue());
      }

      return this.ok(res, {
        message: 'Attendance processed successfully',
        tokensAwarded: result.getValue()
      });
    } catch (error) {
      return this.fail(res, `Failed to process attendance: ${error}`);
    }
  };

  /**
   * POST /api/gamification/events/goal-achieved
   * 학습 목표 달성 이벤트 처리
   */
  public onGoalAchieved = async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = req.user?.id;
      if (!studentId) {
        return this.unauthorized(res, 'Authentication required');
      }

      const { goalType, goalName } = req.body;
      
      if (!goalType || !goalName) {
        return this.clientError(res, 'Missing required fields: goalType, goalName');
      }

      if (!['daily', 'weekly', 'monthly'].includes(goalType)) {
        return this.clientError(res, 'goalType must be one of: daily, weekly, monthly');
      }

      const result = await this.gamificationService.onGoalAchieved(
        studentId,
        goalType,
        goalName
      );

      if (result.isFailure) {
        return this.fail(res, result.getErrorValue());
      }

      return this.ok(res, {
        message: 'Goal achievement processed successfully',
        tokensAwarded: result.getValue()
      });
    } catch (error) {
      return this.fail(res, `Failed to process goal achievement: ${error}`);
    }
  };
}