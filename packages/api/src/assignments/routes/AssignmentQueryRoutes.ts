import { Router } from 'express';
import { AssignmentQueryController } from '../controllers';
import { authMiddleware } from '../../middleware/AuthMiddleware';
import {
  requireAdmin,
  requireStudentAccess,
  requireClassAccess,
  requireTeacherAccess
} from '../middleware/AssignmentAuthMiddleware';
import {
  validateAssignmentIdParam,
  validateStudentIdParam,
  validateClassIdParam,
  validateTeacherIdParam,
  validateStudentAssignmentQueryParams,
  validateClassAssignmentQueryParams,
  validateTeacherAssignmentQueryParams,
  validateOverdueAssignmentQueryParams,
  validateDueSoonAssignmentQueryParams
} from '../middleware/AssignmentValidationMiddleware';

export class AssignmentQueryRoutes {
  public router: Router;

  constructor(private assignmentQueryController: AssignmentQueryController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // 모든 라우트에 인증 필요
    this.router.use(authMiddleware);

    // GET /assignments/:id - 특정 과제 조회
    this.router.get(
      '/:id',
      validateAssignmentIdParam,
      this.assignmentQueryController.getAssignment.bind(this.assignmentQueryController)
    );

    // GET /students/:studentId/assignments - 특정 학생의 과제 목록 조회
    this.router.get(
      '/students/:studentId/assignments',
      validateStudentIdParam,
      requireStudentAccess,
      validateStudentAssignmentQueryParams,
      this.assignmentQueryController.getAssignmentsForStudent.bind(this.assignmentQueryController)
    );

    // GET /classes/:classId/assignments - 특정 클래스의 과제 목록 조회
    this.router.get(
      '/classes/:classId/assignments',
      validateClassIdParam,
      requireClassAccess,
      validateClassAssignmentQueryParams,
      this.assignmentQueryController.getAssignmentsForClass.bind(this.assignmentQueryController)
    );

    // GET /teachers/:teacherId/assignments - 특정 교사의 과제 목록 조회
    this.router.get(
      '/teachers/:teacherId/assignments',
      validateTeacherIdParam,
      requireTeacherAccess,
      validateTeacherAssignmentQueryParams,
      this.assignmentQueryController.getTeacherAssignments.bind(this.assignmentQueryController)
    );

    // GET /assignments/overdue - 연체된 과제 목록 조회 (관리자 또는 해당 교사)
    this.router.get(
      '/overdue',
      validateOverdueAssignmentQueryParams,
      this.assignmentQueryController.getOverdueAssignments.bind(this.assignmentQueryController)
    );

    // GET /assignments/due-soon - 곧 마감될 과제 목록 조회 (관리자 또는 해당 교사)
    this.router.get(
      '/due-soon',
      validateDueSoonAssignmentQueryParams,
      this.assignmentQueryController.getDueSoonAssignments.bind(this.assignmentQueryController)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}