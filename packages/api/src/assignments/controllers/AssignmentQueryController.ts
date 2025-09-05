import { Request, Response } from 'express';
import { BaseController } from '../../common/BaseController';
import {
  GetAssignmentUseCase,
  GetAssignmentsForStudentUseCase,
  GetAssignmentsForClassUseCase,
  GetTeacherAssignmentsUseCase,
  GetOverdueAssignmentsUseCase,
  GetDueSoonAssignmentsUseCase
} from '@woodie/application';
import {
  AssignmentResponse,
  StudentAssignmentResponse,
  ClassAssignmentResponse,
  TeacherAssignmentResponse,
  OverdueAssignmentResponse,
  DueSoonAssignmentResponse
} from '../interfaces';

export class AssignmentQueryController extends BaseController {
  constructor(
    private getAssignmentUseCase: GetAssignmentUseCase,
    private getAssignmentsForStudentUseCase: GetAssignmentsForStudentUseCase,
    private getAssignmentsForClassUseCase: GetAssignmentsForClassUseCase,
    private getTeacherAssignmentsUseCase: GetTeacherAssignmentsUseCase,
    private getOverdueAssignmentsUseCase: GetOverdueAssignmentsUseCase,
    private getDueSoonAssignmentsUseCase: GetDueSoonAssignmentsUseCase
  ) {
    super();
  }

  public async getAssignment(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const assignmentId = req.params.id;

      const result = await this.getAssignmentUseCase.execute({
        assignmentId,
        requesterId: user.id
      });

      if (result.isFailure) {
        if (result.error.includes('not found')) {
          this.notFound(res, result.error);
          return;
        }
        if (result.error.includes('Access denied')) {
          this.forbidden(res, result.error);
          return;
        }
        this.clientError(res, result.error);
        return;
      }

      const assignment = result.value;
      const response: AssignmentResponse = {
        id: assignment.id,
        teacherId: assignment.teacherId,
        problemSetId: assignment.problemSetId,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate.toISOString(),
        maxAttempts: assignment.maxAttempts,
        status: assignment.status,
        createdAt: assignment.createdAt.toISOString(),
        updatedAt: assignment.updatedAt.toISOString(),
        dueDateStatus: assignment.dueDateStatus,
        targets: assignment.targets,
        permissions: assignment.permissions
      };

      this.ok(res, response);
    } catch (error) {
      console.error('Get assignment error:', error);
      this.fail(res, 'Failed to get assignment');
    }
  }

  public async getAssignmentsForStudent(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.params.studentId;
      const { includeCompleted, includePastDue } = req.query as any;

      const result = await this.getAssignmentsForStudentUseCase.execute({
        studentId,
        includeCompleted,
        includePastDue
      });

      if (result.isFailure) {
        this.clientError(res, result.error);
        return;
      }

      const data = result.value;
      const response: StudentAssignmentResponse = {
        studentId: data.studentId,
        assignments: data.assignments.map(assignment => ({
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueDate.toISOString(),
          maxAttempts: assignment.maxAttempts,
          status: assignment.status,
          problemSetId: assignment.problemSetId,
          teacherId: assignment.teacherId,
          dueDateStatus: assignment.dueDateStatus,
          accessibility: assignment.accessibility
        })),
        summary: data.summary
      };

      this.ok(res, response);
    } catch (error) {
      console.error('Get student assignments error:', error);
      this.fail(res, 'Failed to get student assignments');
    }
  }

  public async getAssignmentsForClass(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const classId = req.params.classId;
      const { includeInactive, includeArchived } = req.query as any;

      const result = await this.getAssignmentsForClassUseCase.execute({
        classId,
        requesterId: user.id,
        includeInactive,
        includeArchived
      });

      if (result.isFailure) {
        this.clientError(res, result.error);
        return;
      }

      const data = result.value;
      const response: ClassAssignmentResponse = {
        classId: data.classId,
        assignments: data.assignments.map(assignment => ({
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueDate.toISOString(),
          maxAttempts: assignment.maxAttempts,
          status: assignment.status,
          problemSetId: assignment.problemSetId,
          teacherId: assignment.teacherId,
          dueDateStatus: assignment.dueDateStatus,
          accessibility: assignment.accessibility
        })),
        summary: data.summary
      };

      this.ok(res, response);
    } catch (error) {
      console.error('Get class assignments error:', error);
      this.fail(res, 'Failed to get class assignments');
    }
  }

  public async getTeacherAssignments(req: Request, res: Response): Promise<void> {
    try {
      const teacherId = req.params.teacherId;
      const { includeArchived, status } = req.query as any;

      const result = await this.getTeacherAssignmentsUseCase.execute({
        teacherId,
        includeArchived,
        status
      });

      if (result.isFailure) {
        this.clientError(res, result.error);
        return;
      }

      const data = result.value;
      const response: TeacherAssignmentResponse = {
        teacherId: data.teacherId,
        assignments: data.assignments.map(assignment => ({
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueDate.toISOString(),
          maxAttempts: assignment.maxAttempts,
          status: assignment.status,
          problemSetId: assignment.problemSetId,
          teacherId: assignment.teacherId,
          dueDateStatus: {
            isOverdue: assignment.dueDateStatus.isOverdue,
            isDueSoon: assignment.dueDateStatus.isDueSoon,
            hoursUntilDue: assignment.dueDateStatus.hoursUntilDue,
            daysUntilDue: assignment.dueDateStatus.daysUntilDue
          },
          targetInfo: {
            totalTargets: assignment.targetInfo.totalTargets,
            activeTargets: assignment.targetInfo.activeTargets,
            hasClassTargets: assignment.targetInfo.assignedClasses.length > 0,
            hasStudentTargets: assignment.targetInfo.assignedStudents.length > 0
          }
        })),
        summary: data.summary
      };

      this.ok(res, response);
    } catch (error) {
      console.error('Get teacher assignments error:', error);
      this.fail(res, 'Failed to get teacher assignments');
    }
  }

  public async getOverdueAssignments(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { daysPastDue, teacherId, classId } = req.query as any;

      // 관리자가 아닌 경우, 자신의 과제만 조회 가능
      const effectiveTeacherId = user.role === 'admin' ? teacherId : user.id;

      const result = await this.getOverdueAssignmentsUseCase.execute({
        teacherId: effectiveTeacherId,
        includeArchived: false
      });

      if (result.isFailure) {
        this.clientError(res, result.error);
        return;
      }

      const data = result.value;
      const response: OverdueAssignmentResponse = {
        assignments: data.assignments.map(assignment => ({
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueDate.toISOString(),
          maxAttempts: assignment.maxAttempts,
          status: assignment.status,
          problemSetId: assignment.problemSetId,
          teacherId: assignment.teacherId,
          dueDateStatus: {
            isOverdue: assignment.dueDateStatus.isOverdue,
            isDueSoon: assignment.dueDateStatus.isDueSoon,
            hoursUntilDue: assignment.dueDateStatus.hoursUntilDue,
            daysUntilDue: assignment.dueDateStatus.daysUntilDue
          },
          overdueInfo: assignment.overdueInfo
        })),
        summary: {
          totalCount: data.summary.totalOverdueCount,
          processedCount: data.summary.activeOverdueCount,
          notificationsSent: 0 // TODO: 실제 알림 발송 수로 대체해야 함
        }
      };

      this.ok(res, response);
    } catch (error) {
      console.error('Get overdue assignments error:', error);
      this.fail(res, 'Failed to get overdue assignments');
    }
  }

  public async getDueSoonAssignments(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { hoursAhead, teacherId, classId } = req.query as any;

      // 관리자가 아닌 경우, 자신의 과제만 조회 가능
      const effectiveTeacherId = user.role === 'admin' ? teacherId : user.id;

      const result = await this.getDueSoonAssignmentsUseCase.execute({
        hoursThreshold: hoursAhead,
        teacherId: effectiveTeacherId,
        includeInactive: false
      });

      if (result.isFailure) {
        this.clientError(res, result.error);
        return;
      }

      const data = result.value;
      const response: DueSoonAssignmentResponse = {
        assignments: data.assignments.map(assignment => ({
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueDate.toISOString(),
          maxAttempts: assignment.maxAttempts,
          status: assignment.status,
          problemSetId: assignment.problemSetId,
          teacherId: assignment.teacherId,
          dueDateStatus: {
            isOverdue: assignment.dueDateStatus.isOverdue,
            isDueSoon: assignment.dueDateStatus.isDueSoon,
            hoursUntilDue: assignment.dueDateStatus.hoursUntilDue,
            daysUntilDue: assignment.dueDateStatus.daysUntilDue
          },
          dueSoonInfo: {
            hoursUntilDue: assignment.dueDateStatus.hoursUntilDue,
            daysUntilDue: assignment.dueDateStatus.daysUntilDue,
            priorityLevel: assignment.dueDateStatus.hoursUntilDue <= 24 ? 'high' : 
                          assignment.dueDateStatus.hoursUntilDue <= 72 ? 'medium' : 'low'
          }
        })),
        summary: {
          totalCount: data.summary.totalDueSoonCount,
          next24Hours: data.summary.criticalCount,
          next7Days: data.summary.totalDueSoonCount - data.summary.criticalCount
        }
      };

      this.ok(res, response);
    } catch (error) {
      console.error('Get due soon assignments error:', error);
      this.fail(res, 'Failed to get due soon assignments');
    }
  }
}