import { Router } from 'express';
import { ProblemController } from '../controllers/ProblemController';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { BulkOperationsController } from '../controllers/BulkOperationsController';
import { TagController } from '../controllers/TagController';

// 미들웨어
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware';
import { RateLimitMiddleware } from '../middleware/RateLimitMiddleware';

// 문제 관리 API 라우터
export class ProblemRoutes {
  private router: Router;

  constructor(
    private problemController: ProblemController,
    private analyticsController: AnalyticsController,
    private bulkController: BulkOperationsController,
    private tagController: TagController
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

    // === 기본 CRUD 라우트 ===
    
    // 문제 생성
    this.router.post(
      '/',
      RateLimitMiddleware.createLimit(),
      ValidationMiddleware.validateCreateProblem(),
      this.problemController.createProblem.bind(this.problemController)
    );

    // 문제 검색
    this.router.get(
      '/search',
      RateLimitMiddleware.searchLimit(),
      ValidationMiddleware.validateSearchQuery(),
      this.problemController.searchProblems.bind(this.problemController)
    );

    // 내 문제 목록
    this.router.get(
      '/mine',
      RateLimitMiddleware.standardLimit(),
      this.problemController.getMyProblems.bind(this.problemController)
    );

    // 특정 문제 조회
    this.router.get(
      '/:id',
      RateLimitMiddleware.standardLimit(),
      ValidationMiddleware.validateProblemId(),
      AuthMiddleware.requireProblemOwnership(),
      this.problemController.getProblemById.bind(this.problemController)
    );

    // 문제 수정
    this.router.put(
      '/:id',
      RateLimitMiddleware.updateLimit(),
      ValidationMiddleware.validateProblemId(),
      ValidationMiddleware.validateUpdateProblem(),
      AuthMiddleware.requireProblemOwnership(),
      this.problemController.updateProblem.bind(this.problemController)
    );

    // 문제 삭제
    this.router.delete(
      '/:id',
      RateLimitMiddleware.deleteLimit(),
      ValidationMiddleware.validateProblemId(),
      AuthMiddleware.requireProblemOwnership(),
      this.problemController.deleteProblem.bind(this.problemController)
    );

    // === 분석 및 통계 라우트 ===
    
    // 종합 분석
    this.router.get(
      '/analytics',
      RateLimitMiddleware.analyticsLimit(),
      this.analyticsController.getAnalytics.bind(this.analyticsController)
    );

    // 요약 통계
    this.router.get(
      '/analytics/summary',
      RateLimitMiddleware.analyticsLimit(),
      this.analyticsController.getSummary.bind(this.analyticsController)
    );

    // 태그 분석
    this.router.get(
      '/analytics/tags',
      RateLimitMiddleware.analyticsLimit(),
      this.analyticsController.getTagAnalytics.bind(this.analyticsController)
    );

    // 난이도 분석
    this.router.get(
      '/analytics/difficulty',
      RateLimitMiddleware.analyticsLimit(),
      this.analyticsController.getDifficultyAnalysis.bind(this.analyticsController)
    );

    // 문제 유형 분포
    this.router.get(
      '/analytics/types',
      RateLimitMiddleware.analyticsLimit(),
      this.analyticsController.getTypeDistribution.bind(this.analyticsController)
    );

    // 캐시 무효화 (관리자 전용)
    this.router.delete(
      '/analytics/cache',
      RateLimitMiddleware.adminLimit(),
      AuthMiddleware.requireAdmin(),
      this.analyticsController.invalidateCache.bind(this.analyticsController)
    );

    // === 태그 관리 라우트 ===
    
    // 태그 추천
    this.router.post(
      '/tags/recommend',
      RateLimitMiddleware.aiLimit(),
      this.tagController.getRecommendations.bind(this.tagController)
    );

    // 유사 태그 검색
    this.router.get(
      '/tags/similar',
      RateLimitMiddleware.standardLimit(),
      this.tagController.getSimilarTags.bind(this.tagController)
    );

    // 태그 검증
    this.router.post(
      '/tags/validate',
      RateLimitMiddleware.standardLimit(),
      this.tagController.validateTags.bind(this.tagController)
    );

    // 태그 사용 통계
    this.router.get(
      '/tags/usage',
      RateLimitMiddleware.analyticsLimit(),
      this.tagController.getTagUsage.bind(this.tagController)
    );

    // 태그 분포
    this.router.get(
      '/tags/distribution',
      RateLimitMiddleware.analyticsLimit(),
      this.tagController.getTagDistribution.bind(this.tagController)
    );

    // 태그 자동완성
    this.router.get(
      '/tags/search',
      RateLimitMiddleware.autocompleteLimit(),
      this.tagController.searchTags.bind(this.tagController)
    );

    // === 일괄 작업 라우트 ===
    
    // 문제 복제
    this.router.post(
      '/bulk/clone',
      RateLimitMiddleware.bulkLimit(),
      ValidationMiddleware.validateBulkOperation(),
      AuthMiddleware.requireBulkOperationPermission(),
      this.bulkController.cloneProblems.bind(this.bulkController)
    );

    // 활성 상태 일괄 업데이트
    this.router.put(
      '/bulk/status',
      RateLimitMiddleware.bulkLimit(),
      ValidationMiddleware.validateBulkOperation(),
      AuthMiddleware.requireBulkOperationPermission(),
      this.bulkController.updateActiveStatus.bind(this.bulkController)
    );

    // 태그 일괄 업데이트
    this.router.put(
      '/bulk/tags',
      RateLimitMiddleware.bulkLimit(),
      ValidationMiddleware.validateBulkUpdateTags(),
      AuthMiddleware.requireBulkOperationPermission(),
      this.bulkController.updateTags.bind(this.bulkController)
    );

    // 일괄 권한 확인
    this.router.get(
      '/bulk/permissions',
      RateLimitMiddleware.standardLimit(),
      this.bulkController.checkPermissions.bind(this.bulkController)
    );

    // 일괄 작업 검증
    this.router.post(
      '/bulk/validate',
      RateLimitMiddleware.standardLimit(),
      ValidationMiddleware.validateBulkOperation(),
      this.bulkController.validateOperation.bind(this.bulkController)
    );

    // 일괄 작업 상태 확인 (비동기 작업용)
    this.router.get(
      '/bulk/operations/:operationId/status',
      RateLimitMiddleware.standardLimit(),
      this.bulkController.getOperationStatus.bind(this.bulkController)
    );

    // === 권한 관리 라우트 ===
    
    // 문제별 권한 확인
    this.router.get(
      '/:id/permissions',
      RateLimitMiddleware.standardLimit(),
      ValidationMiddleware.validateProblemId(),
      async (req, res) => {
        // 간단한 권한 확인 응답
        const { user } = req as any;
        const { id: problemId } = req.params;
        
        try {
          // 실제 구현에서는 Repository를 통해 확인
          const response = {
            problemId,
            permissions: {
              canRead: true,
              canWrite: true,
              canDelete: true,
              isOwner: true
            },
            message: 'Permissions retrieved successfully'
          };
          
          res.json({
            success: true,
            data: response,
            meta: {
              timestamp: new Date().toISOString(),
              requestId: (req as any).requestContext?.requestId,
              version: '1.0.0'
            }
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: {
              code: 'PERMISSION_CHECK_FAILED',
              message: 'Failed to check permissions'
            }
          });
        }
      }
    );

    // === 내보내기/가져오기 라우트 (미래 확장) ===
    
    // 문제 뱅크 내보내기
    this.router.post(
      '/export',
      RateLimitMiddleware.exportLimit(),
      AuthMiddleware.requireTeacher(),
      async (req, res) => {
        res.status(501).json({
          success: false,
          error: {
            code: 'NOT_IMPLEMENTED',
            message: 'Export functionality not yet implemented'
          }
        });
      }
    );

    // 문제 뱅크 가져오기
    this.router.post(
      '/import',
      RateLimitMiddleware.importLimit(),
      AuthMiddleware.requireTeacher(),
      async (req, res) => {
        res.status(501).json({
          success: false,
          error: {
            code: 'NOT_IMPLEMENTED',
            message: 'Import functionality not yet implemented'
          }
        });
      }
    );

    // === 헬스체크 및 메타 정보 ===
    
    // API 상태 확인
    this.router.get(
      '/health',
      (req, res) => {
        res.json({
          success: true,
          data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            features: {
              crud: 'available',
              search: 'available',
              analytics: 'available',
              bulkOperations: 'available',
              tagManagement: 'available',
              exportImport: 'planned'
            }
          }
        });
      }
    );

    // API 정보
    this.router.get(
      '/info',
      (req, res) => {
        res.json({
          success: true,
          data: {
            name: 'Problem Management API',
            version: '1.0.0',
            description: 'RESTful API for educational problem management',
            endpoints: {
              problems: '/api/problems',
              search: '/api/problems/search',
              analytics: '/api/problems/analytics',
              tags: '/api/problems/tags',
              bulk: '/api/problems/bulk'
            },
            limits: {
              maxProblemsPerRequest: 100,
              maxTagsPerProblem: 10,
              maxSearchResults: 1000,
              maxBulkOperations: 100
            }
          }
        });
      }
    );
  }
}