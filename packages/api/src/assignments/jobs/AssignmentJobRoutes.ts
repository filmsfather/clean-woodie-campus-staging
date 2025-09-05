import { Router } from 'express';
import { AssignmentJobController } from './AssignmentJobController';
import { authMiddleware } from '../../middleware/AuthMiddleware';
import { requireAdmin } from '../middleware/AssignmentAuthMiddleware';
import {
  validateProcessOverdueAssignments
} from '../middleware/AssignmentValidationMiddleware';

export class AssignmentJobRoutes {
  public router: Router;

  constructor(private assignmentJobController: AssignmentJobController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // 모든 라우트에 인증 필요
    this.router.use(authMiddleware);

    // POST /jobs/process-overdue - 연체된 과제 처리 (관리자만)
    this.router.post(
      '/process-overdue',
      requireAdmin,
      validateProcessOverdueAssignments,
      this.assignmentJobController.processOverdueAssignments
    );

    // GET /jobs/:jobId/status - 작업 상태 조회 (관리자만)
    this.router.get(
      '/:jobId/status',
      requireAdmin,
      this.assignmentJobController.getJobStatus
    );

    // POST /jobs/schedule-overdue-processing - 연체 처리 작업 스케줄링 (관리자만)
    this.router.post(
      '/schedule-overdue-processing',
      requireAdmin,
      this.assignmentJobController.scheduleOverdueProcessing
    );

    // DELETE /jobs/:jobId - 스케줄된 작업 취소 (관리자만)
    this.router.delete(
      '/:jobId',
      requireAdmin,
      this.assignmentJobController.cancelScheduledJob
    );

    // GET /jobs/scheduled - 스케줄된 작업 목록 조회 (관리자만)
    this.router.get(
      '/scheduled',
      requireAdmin,
      this.assignmentJobController.getScheduledJobs
    );

    // GET /jobs/health - 백그라운드 작업 시스템 상태 확인 (관리자만)
    this.router.get(
      '/health',
      requireAdmin,
      this.assignmentJobController.runHealthCheck
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}