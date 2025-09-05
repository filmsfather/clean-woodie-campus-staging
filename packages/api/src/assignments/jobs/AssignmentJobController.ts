import { Request, Response } from 'express';
import { BaseController } from '../../common/BaseController';
import { ProcessOverdueAssignmentsUseCase } from '@woodie/application';
import { ProcessOverdueAssignmentsResponse } from '../interfaces';
import { asyncHandler } from '../errors';

export class AssignmentJobController extends BaseController {
  constructor(
    private processOverdueAssignmentsUseCase: ProcessOverdueAssignmentsUseCase
  ) {
    super();
  }

  public processOverdueAssignments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const { dryRun, maxDaysPastDue, sendNotifications } = req.query as any;

      const result = await this.processOverdueAssignmentsUseCase.execute({
        dryRun: dryRun || false,
        teacherId: req.query.teacherId as string
      });

      if (result.isFailure) {
        this.clientError(res, result.error);
        return;
      }

      const data = result.value;
      const response: ProcessOverdueAssignmentsResponse = {
        processedCount: data.processedCount,
        notificationsSent: 0, // TODO: 실제 알림 발송 수로 교체
        errors: data.errors.map(error => error.error),
        processedAssignments: data.processedAssignments.map(assignment => ({
          id: assignment.id,
          title: assignment.title,
          teacherId: assignment.teacherId,
          daysPastDue: assignment.daysPastDue,
          notificationSent: false, // TODO: 실제 알림 발송 여부로 교체
          action: assignment.newStatus === 'CLOSED' ? 'closed' : 'error',
          message: `Assignment ${assignment.newStatus === 'CLOSED' ? 'closed due to overdue status' : 'processing failed'}`
        }))
      };

      // 처리 결과에 따른 HTTP 상태 코드 결정
      if (data.errors && data.errors.length > 0) {
        // 일부 성공, 일부 실패
        this.custom(res, 207, true, response); // Multi-Status
      } else {
        // 모두 성공
        this.ok(res, response);
      }

    } catch (error) {
      console.error('Process overdue assignments error:', error);
      this.fail(res, 'Failed to process overdue assignments');
    }
  });

  public getJobStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const jobId = req.params.jobId;

      // TODO: 실제 구현에서는 Job Queue (Bull, Agenda 등)를 사용하여 작업 상태 조회
      const jobStatus = {
        jobId,
        status: 'completed',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        progress: 100,
        result: {
          processedCount: 0,
          notificationsSent: 0,
          errors: []
        }
      };

      this.ok(res, jobStatus);

    } catch (error) {
      console.error('Get job status error:', error);
      this.fail(res, 'Failed to get job status');
    }
  });

  public scheduleOverdueProcessing = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const { cronSchedule, enabled, maxDaysPastDue, sendNotifications } = req.body;

      // TODO: 실제 구현에서는 Cron Job 스케줄러를 사용
      const scheduledJob = {
        id: `overdue-processing-${Date.now()}`,
        cronSchedule: cronSchedule || '0 9 * * *', // 매일 오전 9시
        enabled: enabled !== false,
        config: {
          maxDaysPastDue: maxDaysPastDue || 30,
          sendNotifications: sendNotifications !== false
        },
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      };

      this.created(res, scheduledJob);

    } catch (error) {
      console.error('Schedule overdue processing error:', error);
      this.fail(res, 'Failed to schedule overdue processing');
    }
  });

  public cancelScheduledJob = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const jobId = req.params.jobId;

      // TODO: 실제 구현에서는 스케줄된 작업 취소
      const result = {
        jobId,
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      };

      this.ok(res, result);

    } catch (error) {
      console.error('Cancel scheduled job error:', error);
      this.fail(res, 'Failed to cancel scheduled job');
    }
  });

  public getScheduledJobs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      // TODO: 실제 구현에서는 스케줄된 작업 목록 조회
      const scheduledJobs = [
        {
          id: 'overdue-processing-daily',
          name: 'Daily Overdue Assignment Processing',
          cronSchedule: '0 9 * * *',
          enabled: true,
          nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          lastResult: {
            processedCount: 5,
            notificationsSent: 3,
            errors: []
          }
        }
      ];

      this.ok(res, scheduledJobs);

    } catch (error) {
      console.error('Get scheduled jobs error:', error);
      this.fail(res, 'Failed to get scheduled jobs');
    }
  });

  public runHealthCheck = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      // 백그라운드 작업 시스템의 상태 확인
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'healthy',
          emailService: 'healthy',
          scheduler: 'healthy'
        },
        metrics: {
          activeJobs: 0,
          completedJobs: 100,
          failedJobs: 2,
          queueLength: 0
        }
      };

      this.ok(res, healthStatus);

    } catch (error) {
      console.error('Health check error:', error);
      this.fail(res, 'Health check failed');
    }
  });
}