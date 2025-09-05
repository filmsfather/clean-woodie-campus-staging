import { Router } from 'express';
import { AssignmentTargetController } from '../controllers';
import { authMiddleware } from '../../middleware/AuthMiddleware';
import { requireAssignmentOwnerOrAdmin } from '../middleware/AssignmentAuthMiddleware';
import {
  validateAssignToClass,
  validateAssignToStudent,
  validateRevokeAssignment,
  validateExtendDueDate,
  validateChangeDueDate,
  validateAssignmentIdParam
} from '../middleware/AssignmentValidationMiddleware';

export class AssignmentTargetRoutes {
  public router: Router;

  constructor(private assignmentTargetController: AssignmentTargetController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // 모든 라우트에 인증 필요
    this.router.use(authMiddleware);

    // POST /assignments/:id/assign-class - 클래스에 과제 배정
    this.router.post(
      '/:id/assign-class',
      validateAssignmentIdParam,
      requireAssignmentOwnerOrAdmin,
      validateAssignToClass,
      this.assignmentTargetController.assignToClass.bind(this.assignmentTargetController)
    );

    // POST /assignments/:id/assign-student - 학생에게 과제 배정
    this.router.post(
      '/:id/assign-student',
      validateAssignmentIdParam,
      requireAssignmentOwnerOrAdmin,
      validateAssignToStudent,
      this.assignmentTargetController.assignToStudent.bind(this.assignmentTargetController)
    );

    // DELETE /assignments/:id/revoke - 과제 배정 철회
    this.router.delete(
      '/:id/revoke',
      validateAssignmentIdParam,
      requireAssignmentOwnerOrAdmin,
      validateRevokeAssignment,
      this.assignmentTargetController.revokeAssignment.bind(this.assignmentTargetController)
    );

    // PUT /assignments/:id/extend-due-date - 마감일 연장
    this.router.put(
      '/:id/extend-due-date',
      validateAssignmentIdParam,
      requireAssignmentOwnerOrAdmin,
      validateExtendDueDate,
      this.assignmentTargetController.extendDueDate.bind(this.assignmentTargetController)
    );

    // PUT /assignments/:id/change-due-date - 마감일 변경
    this.router.put(
      '/:id/change-due-date',
      validateAssignmentIdParam,
      requireAssignmentOwnerOrAdmin,
      validateChangeDueDate,
      this.assignmentTargetController.changeDueDate.bind(this.assignmentTargetController)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}