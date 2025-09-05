import { Request, Response } from 'express';
import { BaseController } from '../../common/BaseController';
import {
  AssignToClassUseCase,
  AssignToStudentUseCase,
  RevokeAssignmentUseCase,
  ExtendDueDateUseCase,
  ChangeDueDateUseCase
} from '@woodie/application';
import {
  AssignToClassRequest,
  AssignToStudentRequest,
  RevokeAssignmentRequest,
  ExtendDueDateRequest,
  ChangeDueDateRequest
} from '../interfaces';

export class AssignmentTargetController extends BaseController {
  constructor(
    private assignToClassUseCase: AssignToClassUseCase,
    private assignToStudentUseCase: AssignToStudentUseCase,
    private revokeAssignmentUseCase: RevokeAssignmentUseCase,
    private extendDueDateUseCase: ExtendDueDateUseCase,
    private changeDueDateUseCase: ChangeDueDateUseCase
  ) {
    super();
  }

  public async assignToClass(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const assignmentId = req.params.id;
      const requestData: AssignToClassRequest = req.body;

      const result = await this.assignToClassUseCase.execute({
        assignmentId,
        teacherId: user.id,
        classIds: requestData.classIds
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

      const response = {
        assignmentId: result.value.assignmentId,
        assignedClassIds: result.value.assignedClassIds,
        totalTargets: result.value.totalTargets,
        message: result.value.message
      };

      this.ok(res, response);
    } catch (error) {
      console.error('Assign to class error:', error);
      this.fail(res, 'Failed to assign assignment to classes');
    }
  }

  public async assignToStudent(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const assignmentId = req.params.id;
      const requestData: AssignToStudentRequest = req.body;

      const result = await this.assignToStudentUseCase.execute({
        assignmentId,
        teacherId: user.id,
        studentIds: requestData.studentIds
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

      const response = {
        assignmentId: result.value.assignmentId,
        assignedStudentIds: result.value.assignedStudentIds,
        totalTargets: result.value.totalTargets,
        message: result.value.message
      };

      this.ok(res, response);
    } catch (error) {
      console.error('Assign to student error:', error);
      this.fail(res, 'Failed to assign assignment to students');
    }
  }

  public async revokeAssignment(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const assignmentId = req.params.id;
      const requestData: RevokeAssignmentRequest = req.body;

      const result = await this.revokeAssignmentUseCase.execute({
        assignmentId,
        teacherId: user.id,
        classIds: requestData.targetType === 'class' ? requestData.targetIds : undefined,
        studentIds: requestData.targetType === 'student' ? requestData.targetIds : undefined
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

      const response = {
        assignmentId: result.value.assignmentId,
        revokedClassIds: result.value.revokedClassIds,
        revokedStudentIds: result.value.revokedStudentIds,
        remainingTargets: result.value.remainingTargets,
        message: result.value.message
      };

      this.ok(res, response);
    } catch (error) {
      console.error('Revoke assignment error:', error);
      this.fail(res, 'Failed to revoke assignment');
    }
  }

  public async extendDueDate(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const assignmentId = req.params.id;
      const requestData: ExtendDueDateRequest = req.body;

      const result = await this.extendDueDateUseCase.execute({
        assignmentId,
        teacherId: user.id,
        additionalHours: requestData.extensionDays * 24, // 일을 시간으로 변환
        reason: requestData.reason
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

      const response = {
        assignmentId: result.value.assignmentId,
        originalDueDate: result.value.previousDueDate.toISOString(),
        newDueDate: result.value.newDueDate.toISOString(),
        extensionHours: result.value.extendedHours,
        extensionDays: result.value.extendedHours / 24,
        message: result.value.message
      };

      this.ok(res, response);
    } catch (error) {
      console.error('Extend due date error:', error);
      this.fail(res, 'Failed to extend due date');
    }
  }

  public async changeDueDate(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const assignmentId = req.params.id;
      const requestData: ChangeDueDateRequest = req.body;

      const result = await this.changeDueDateUseCase.execute({
        assignmentId,
        teacherId: user.id,
        newDueDate: new Date(requestData.newDueDate),
        reason: requestData.reason
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

      const response = {
        assignmentId: result.value.assignmentId,
        previousDueDate: result.value.previousDueDate.toISOString(),
        newDueDate: result.value.newDueDate.toISOString(),
        message: result.value.message
      };

      this.ok(res, response);
    } catch (error) {
      console.error('Change due date error:', error);
      this.fail(res, 'Failed to change due date');
    }
  }
}