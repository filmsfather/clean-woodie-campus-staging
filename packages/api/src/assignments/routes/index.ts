import { Router } from 'express';
import { AssignmentRoutes } from './AssignmentRoutes';
import { AssignmentTargetRoutes } from './AssignmentTargetRoutes';
import { AssignmentQueryRoutes } from './AssignmentQueryRoutes';

// Controllers (실제 DI 컨테이너에서 주입받아야 함)
import {
  AssignmentController,
  AssignmentTargetController,
  AssignmentQueryController
} from '../controllers';

export class AssignmentRouter {
  public router: Router;

  constructor(
    assignmentController: AssignmentController,
    assignmentTargetController: AssignmentTargetController,
    assignmentQueryController: AssignmentQueryController
  ) {
    this.router = Router();
    this.initializeRoutes(
      assignmentController,
      assignmentTargetController,
      assignmentQueryController
    );
  }

  private initializeRoutes(
    assignmentController: AssignmentController,
    assignmentTargetController: AssignmentTargetController,
    assignmentQueryController: AssignmentQueryController
  ): void {
    // 기본 과제 CRUD 및 상태 관리
    const assignmentRoutes = new AssignmentRoutes(assignmentController);
    this.router.use('/', assignmentRoutes.getRouter());

    // 과제 배정 및 마감일 관리
    const targetRoutes = new AssignmentTargetRoutes(assignmentTargetController);
    this.router.use('/', targetRoutes.getRouter());

    // 과제 조회 (단순 라우트가 복잡한 라우트보다 나중에 와야 함)
    const queryRoutes = new AssignmentQueryRoutes(assignmentQueryController);
    this.router.use('/', queryRoutes.getRouter());
  }

  public getRouter(): Router {
    return this.router;
  }
}

export * from './AssignmentRoutes';
export * from './AssignmentTargetRoutes';
export * from './AssignmentQueryRoutes';