import { Request, Response } from 'express';
import { BaseController } from '../../common/BaseController';
import {
  CreateAssignmentUseCase,
  UpdateAssignmentUseCase,
  DeleteAssignmentUseCase,
  ActivateAssignmentUseCase,
  DeactivateAssignmentUseCase,
  CloseAssignmentUseCase,
  ArchiveAssignmentUseCase
} from '@woodie/application';
import {
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  AssignmentResponse,
  ApiResponse
} from '../interfaces';

export class AssignmentController extends BaseController {
  constructor(
    private createAssignmentUseCase: CreateAssignmentUseCase,
    private updateAssignmentUseCase: UpdateAssignmentUseCase,
    private deleteAssignmentUseCase: DeleteAssignmentUseCase,
    private activateAssignmentUseCase: ActivateAssignmentUseCase,
    private deactivateAssignmentUseCase: DeactivateAssignmentUseCase,
    private closeAssignmentUseCase: CloseAssignmentUseCase,
    private archiveAssignmentUseCase: ArchiveAssignmentUseCase
  ) {
    super();
  }

  public async createAssignment(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const requestData: CreateAssignmentRequest = req.body;

      const result = await this.createAssignmentUseCase.execute({
        teacherId: user.id,
        problemSetId: requestData.problemSetId,
        title: requestData.title,
        description: requestData.description,
        dueDate: new Date(requestData.dueDate),
        timezone: requestData.timezone,
        maxAttempts: requestData.maxAttempts,
        classIds: requestData.classIds,
        studentIds: requestData.studentIds
      });

      if (result.isFailure) {
        this.clientError(res, result.error);
        return;
      }

      const response: AssignmentResponse = {
        id: result.value.assignmentId,
        teacherId: user.id,
        problemSetId: requestData.problemSetId,
        title: result.value.title,
        description: requestData.description,
        dueDate: result.value.dueDate.toISOString(),
        maxAttempts: requestData.maxAttempts,
        status: result.value.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dueDateStatus: {
          isOverdue: false,
          isDueSoon: false,
          hoursUntilDue: Math.ceil((result.value.dueDate.getTime() - Date.now()) / (1000 * 60 * 60)),
          daysUntilDue: Math.ceil((result.value.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
          statusMessage: 'Active'
        },
        targets: {
          totalCount: result.value.targetCount,
          activeCount: result.value.targetCount,
          assignedClasses: requestData.classIds || [],
          assignedStudents: requestData.studentIds || []
        },
        permissions: {
          canEdit: true,
          canDelete: true,
          canActivate: false,
          canAssign: true
        }
      };

      this.created(res, response);
    } catch (error) {
      console.error('Create assignment error:', error);
      this.fail(res, 'Failed to create assignment');
    }
  }

  public async updateAssignment(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const assignmentId = req.params.id;
      const requestData: UpdateAssignmentRequest = req.body;

      const result = await this.updateAssignmentUseCase.execute({
        assignmentId,
        teacherId: user.id,
        title: requestData.title,
        description: requestData.description,
        dueDate: requestData.dueDate ? new Date(requestData.dueDate) : undefined,
        timezone: requestData.timezone,
        maxAttempts: requestData.maxAttempts
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
        id: result.value.assignmentId,
        title: result.value.title,
        description: result.value.description,
        dueDate: result.value.dueDate,
        maxAttempts: result.value.maxAttempts,
        status: result.value.status,
        updatedAt: result.value.updatedAt
      };

      this.ok(res, response);
    } catch (error) {
      console.error('Update assignment error:', error);
      this.fail(res, 'Failed to update assignment');
    }
  }

  public async deleteAssignment(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const assignmentId = req.params.id;

      const result = await this.deleteAssignmentUseCase.execute({
        assignmentId,
        teacherId: user.id
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

      this.ok(res, { message: 'Assignment deleted successfully' });
    } catch (error) {
      console.error('Delete assignment error:', error);
      this.fail(res, 'Failed to delete assignment');
    }
  }

  public async activateAssignment(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const assignmentId = req.params.id;

      const result = await this.activateAssignmentUseCase.execute({
        assignmentId,
        teacherId: user.id
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
        status: result.value.status,
        activatedAt: result.value.activatedAt
      };

      this.ok(res, response);
    } catch (error) {
      console.error('Activate assignment error:', error);
      this.fail(res, 'Failed to activate assignment');
    }
  }

  public async deactivateAssignment(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const assignmentId = req.params.id;

      const result = await this.deactivateAssignmentUseCase.execute({
        assignmentId,
        teacherId: user.id
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
        status: result.value.status,
        deactivatedAt: result.value.deactivatedAt
      };

      this.ok(res, response);
    } catch (error) {
      console.error('Deactivate assignment error:', error);
      this.fail(res, 'Failed to deactivate assignment');
    }
  }

  public async closeAssignment(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const assignmentId = req.params.id;

      const result = await this.closeAssignmentUseCase.execute({
        assignmentId,
        teacherId: user.id
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
        status: result.value.status,
        closedAt: result.value.closedAt
      };

      this.ok(res, response);
    } catch (error) {
      console.error('Close assignment error:', error);
      this.fail(res, 'Failed to close assignment');
    }
  }

  public async archiveAssignment(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const assignmentId = req.params.id;

      const result = await this.archiveAssignmentUseCase.execute({
        assignmentId,
        teacherId: user.id
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
        status: result.value.status,
        archivedAt: result.value.archivedAt
      };

      this.ok(res, response);
    } catch (error) {
      console.error('Archive assignment error:', error);
      this.fail(res, 'Failed to archive assignment');
    }
  }
}