import { Router } from 'express';
import { AssignmentController } from '../controllers';
import { authMiddleware } from '../../middleware/AuthMiddleware';
import {
  requireTeacher,
  requireAssignmentOwnerOrAdmin
} from '../middleware/AssignmentAuthMiddleware';
import {
  validateCreateAssignment,
  validateUpdateAssignment,
  validateAssignmentIdParam,
  validateDueDateNotPast
} from '../middleware/AssignmentValidationMiddleware';

export class AssignmentRoutes {
  public router: Router;

  constructor(private assignmentController: AssignmentController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // 모든 라우트에 인증 필요
    this.router.use(authMiddleware);

    // POST /assignments - 과제 생성 (교사만 가능)
    this.router.post(
      '/',
      requireTeacher,
      validateCreateAssignment,
      validateDueDateNotPast,
      this.assignmentController.createAssignment.bind(this.assignmentController)
    );

    // PUT /assignments/:id - 과제 수정 (소유자 또는 관리자)
    this.router.put(
      '/:id',
      validateAssignmentIdParam,
      requireAssignmentOwnerOrAdmin,
      validateUpdateAssignment,
      validateDueDateNotPast,
      this.assignmentController.updateAssignment.bind(this.assignmentController)
    );

    // DELETE /assignments/:id - 과제 삭제 (소유자 또는 관리자)
    this.router.delete(
      '/:id',
      validateAssignmentIdParam,
      requireAssignmentOwnerOrAdmin,
      this.assignmentController.deleteAssignment.bind(this.assignmentController)
    );

    // PUT /assignments/:id/activate - 과제 활성화 (소유자 또는 관리자)
    this.router.put(
      '/:id/activate',
      validateAssignmentIdParam,
      requireAssignmentOwnerOrAdmin,
      this.assignmentController.activateAssignment.bind(this.assignmentController)
    );

    // PUT /assignments/:id/deactivate - 과제 비활성화 (소유자 또는 관리자)
    this.router.put(
      '/:id/deactivate',
      validateAssignmentIdParam,
      requireAssignmentOwnerOrAdmin,
      this.assignmentController.deactivateAssignment.bind(this.assignmentController)
    );

    // PUT /assignments/:id/close - 과제 종료 (소유자 또는 관리자)
    this.router.put(
      '/:id/close',
      validateAssignmentIdParam,
      requireAssignmentOwnerOrAdmin,
      this.assignmentController.closeAssignment.bind(this.assignmentController)
    );

    // PUT /assignments/:id/archive - 과제 아카이브 (소유자 또는 관리자)
    this.router.put(
      '/:id/archive',
      validateAssignmentIdParam,
      requireAssignmentOwnerOrAdmin,
      this.assignmentController.archiveAssignment.bind(this.assignmentController)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}