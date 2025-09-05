import { Router } from 'express';
import { ProblemUseCaseController } from '../controllers/ProblemUseCaseController';

// 미들웨어
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware';
import { RateLimitMiddleware } from '../middleware/RateLimitMiddleware';

// 문제 유스케이스 API 라우터
export class ProblemUseCaseRoutes {
  private router: Router;

  constructor(
    private problemUseCaseController: ProblemUseCaseController
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  public getRouter(): Router {
    return this.router;
  }

  private setupRoutes(): void {
    // 모든 라우트에 인증 필요
    this.router.use(AuthMiddleware.authenticate());
    this.router.use(AuthMiddleware.requireTeacher());

    // === 문제 생성 ===
    this.router.post(
      '/create',
      RateLimitMiddleware.createLimit(),
      ValidationMiddleware.validateCreateProblem(),
      this.problemUseCaseController.createProblem.bind(this.problemUseCaseController)
    );

    // === 문제 조회 ===
    
    // 단일 문제 조회
    this.router.get(
      '/:id/details',
      RateLimitMiddleware.standardLimit(),
      ValidationMiddleware.validateProblemId(),
      this.problemUseCaseController.getProblem.bind(this.problemUseCaseController)
    );

    // 문제 목록 조회
    this.router.get(
      '/list',
      RateLimitMiddleware.standardLimit(),
      this.problemUseCaseController.getProblemList.bind(this.problemUseCaseController)
    );

    // 문제 검색
    this.router.get(
      '/search',
      RateLimitMiddleware.searchLimit(),
      ValidationMiddleware.validateSearchQuery(),
      this.problemUseCaseController.searchProblems.bind(this.problemUseCaseController)
    );

    // === 문제 내용 업데이트 ===
    
    // 문제 내용 업데이트 (제목, 설명)
    this.router.put(
      '/:id/content',
      RateLimitMiddleware.updateLimit(),
      ValidationMiddleware.validateProblemId(),
      ValidationMiddleware.validateUpdateProblemContent(),
      this.problemUseCaseController.updateProblemContent.bind(this.problemUseCaseController)
    );

    // 문제 답안 업데이트
    this.router.put(
      '/:id/answer',
      RateLimitMiddleware.updateLimit(),
      ValidationMiddleware.validateProblemId(),
      ValidationMiddleware.validateUpdateProblemAnswer(),
      this.problemUseCaseController.updateProblemAnswer.bind(this.problemUseCaseController)
    );

    // 문제 난이도 변경
    this.router.put(
      '/:id/difficulty',
      RateLimitMiddleware.updateLimit(),
      ValidationMiddleware.validateProblemId(),
      ValidationMiddleware.validateChangeDifficulty(),
      this.problemUseCaseController.changeProblemDifficulty.bind(this.problemUseCaseController)
    );

    // 문제 태그 관리
    this.router.put(
      '/:id/tags',
      RateLimitMiddleware.updateLimit(),
      ValidationMiddleware.validateProblemId(),
      ValidationMiddleware.validateManageTags(),
      this.problemUseCaseController.manageProblemTags.bind(this.problemUseCaseController)
    );

    // === 문제 상태 관리 ===
    
    // 문제 활성화
    this.router.post(
      '/:id/activate',
      RateLimitMiddleware.statusChangeLimit(),
      ValidationMiddleware.validateProblemId(),
      this.problemUseCaseController.activateProblem.bind(this.problemUseCaseController)
    );

    // 문제 비활성화
    this.router.post(
      '/:id/deactivate',
      RateLimitMiddleware.statusChangeLimit(),
      ValidationMiddleware.validateProblemId(),
      this.problemUseCaseController.deactivateProblem.bind(this.problemUseCaseController)
    );

    // === 문제 복제 ===
    
    // 문제 복제
    this.router.post(
      '/:id/clone',
      RateLimitMiddleware.cloneLimit(),
      ValidationMiddleware.validateProblemId(),
      ValidationMiddleware.validateCloneProblem(),
      this.problemUseCaseController.cloneProblem.bind(this.problemUseCaseController)
    );

    // === 문제 삭제 ===
    
    // 문제 삭제
    this.router.delete(
      '/:id',
      RateLimitMiddleware.deleteLimit(),
      ValidationMiddleware.validateProblemId(),
      this.problemUseCaseController.deleteProblem.bind(this.problemUseCaseController)
    );

    // === 헬스체크 ===
    
    // Use Case API 상태 확인
    this.router.get(
      '/health',
      (req, res) => {
        res.json({
          success: true,
          data: {
            status: 'healthy',
            service: 'Problem Use Cases API',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            availableUseCases: [
              'CreateProblem',
              'GetProblem',
              'GetProblemList',
              'UpdateProblemContent',
              'UpdateProblemAnswer',
              'ChangeProblemDifficulty',
              'ManageProblemTags',
              'ActivateProblem',
              'DeactivateProblem',
              'DeleteProblem',
              'SearchProblems',
              'CloneProblem'
            ]
          }
        });
      }
    );
  }
}