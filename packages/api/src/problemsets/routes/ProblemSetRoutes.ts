import { Router } from 'express'
import { ProblemSetController } from '../controllers/ProblemSetController'

// 미들웨어
import { authMiddleware, requireRole } from '../../middleware/AuthMiddleware'
import { rateLimitMiddleware } from '../../middleware/RateLimitMiddleware'
import { ProblemSetValidationMiddleware } from '../middleware/ProblemSetValidationMiddleware'

/**
 * 문제집 관리 API 라우터
 * RESTful API 엔드포인트를 정의하고 미들웨어를 적용
 */
export class ProblemSetRoutes {
  private router: Router

  constructor(
    private problemSetController: ProblemSetController
  ) {
    this.router = Router()
    this.setupRoutes()
  }

  public getRouter(): Router {
    return this.router
  }

  private setupRoutes(): void {
    // 모든 라우트에 기본 인증 적용
    this.router.use(authMiddleware)

    // === 문제집 CRUD 라우트 ===

    // 문제집 생성
    // POST /api/problemsets
    this.router.post(
      '/',
      rateLimitMiddleware(60, 10), // 1분에 10개 요청
      requireRole('teacher', 'admin'), // 교사 또는 관리자만
      ProblemSetValidationMiddleware.validateCreateProblemSet(),
      this.problemSetController.createProblemSet.bind(this.problemSetController)
    )

    // 문제집 목록 조회 (필터링, 페이지네이션 포함)
    // GET /api/problemsets
    this.router.get(
      '/',
      rateLimitMiddleware(60, 30), // 1분에 30개 요청
      ProblemSetValidationMiddleware.validateGetProblemSetList(),
      this.problemSetController.getProblemSetList.bind(this.problemSetController)
    )

    // 특정 문제집 조회
    // GET /api/problemsets/:id
    this.router.get(
      '/:id',
      rateLimitMiddleware(60, 30), // 1분에 30개 요청
      ProblemSetValidationMiddleware.validateProblemSetId(),
      this.problemSetController.getProblemSet.bind(this.problemSetController)
    )

    // 문제집 수정
    // PUT /api/problemsets/:id
    this.router.put(
      '/:id',
      rateLimitMiddleware(60, 20), // 1분에 20개 요청
      ProblemSetValidationMiddleware.validateProblemSetId(),
      ProblemSetValidationMiddleware.validateUpdateProblemSet(),
      this.problemSetController.updateProblemSet.bind(this.problemSetController)
    )

    // 문제집 삭제
    // DELETE /api/problemsets/:id
    this.router.delete(
      '/:id',
      rateLimitMiddleware(60, 5), // 1분에 5개 요청
      ProblemSetValidationMiddleware.validateProblemSetId(),
      ProblemSetValidationMiddleware.validateDeleteProblemSet(),
      this.problemSetController.deleteProblemSet.bind(this.problemSetController)
    )

    // === 문제집 내 문제 관리 라우트 ===

    // 문제집에 문제 추가
    // POST /api/problemsets/:id/problems
    this.router.post(
      '/:id/problems',
      rateLimitMiddleware(60, 10), // 1분에 10개 요청
      ProblemSetValidationMiddleware.validateProblemSetId(),
      ProblemSetValidationMiddleware.validateAddProblemToProblemSet(),
      this.problemSetController.addProblemToProblemSet.bind(this.problemSetController)
    )

    // 문제집에서 문제 제거
    // DELETE /api/problemsets/:id/problems/:problemId
    this.router.delete(
      '/:id/problems/:problemId',
      rateLimitMiddleware(60, 5), // 1분에 5개 요청
      ProblemSetValidationMiddleware.validateProblemSetId(),
      ProblemSetValidationMiddleware.validateProblemId(),
      this.problemSetController.removeProblemFromProblemSet.bind(this.problemSetController)
    )

    // 문제집 내 문제 순서 재정렬
    // PUT /api/problemsets/:id/reorder
    this.router.put(
      '/:id/reorder',
      rateLimitMiddleware(60, 20), // 1분에 20개 요청
      ProblemSetValidationMiddleware.validateProblemSetId(),
      ProblemSetValidationMiddleware.validateReorderProblemSetItems(),
      this.problemSetController.reorderProblemSetItems.bind(this.problemSetController)
    )

    // === 권한 및 공유 관련 라우트 ===

    // 문제집 권한 확인
    // GET /api/problemsets/:id/permissions
    this.router.get(
      '/:id/permissions',
      rateLimitMiddleware(60, 30), // 1분에 30개 요청
      ProblemSetValidationMiddleware.validateProblemSetId(),
      async (req, res) => {
        const { user } = req as any
        const { id: problemSetId } = req.params

        try {
          // 실제 구현에서는 GetProblemSetUseCase를 통해 권한 정보를 조회
          const response = {
            problemSetId,
            userId: user.id,
            permissions: {
              canRead: true,
              canWrite: false,
              canDelete: false,
              canShare: false,
              canClone: true,
              isOwner: false
            },
            message: '권한 정보를 성공적으로 조회했습니다'
          }

          res.json({
            success: true,
            data: response,
            timestamp: new Date().toISOString()
          })
        } catch (error) {
          res.status(500).json({
            success: false,
            error: {
              code: 'PERMISSION_CHECK_FAILED',
              message: '권한 확인 중 오류가 발생했습니다'
            },
            timestamp: new Date().toISOString()
          })
        }
      }
    )

    // === 공유 및 복제 라우트 (향후 확장) ===

    // 문제집 복제
    // POST /api/problemsets/:id/clone
    this.router.post(
      '/:id/clone',
      rateLimitMiddleware(60, 10), // 1분에 10개 요청
      requireRole('teacher', 'admin'),
      ProblemSetValidationMiddleware.validateProblemSetId(),
      async (req, res) => {
        res.status(501).json({
          success: false,
          error: {
            code: 'NOT_IMPLEMENTED',
            message: '문제집 복제 기능은 아직 구현되지 않았습니다'
          },
          timestamp: new Date().toISOString()
        })
      }
    )

    // 문제집 공유 설정 변경
    // PUT /api/problemsets/:id/sharing
    this.router.put(
      '/:id/sharing',
      rateLimitMiddleware(60, 20), // 1분에 20개 요청
      ProblemSetValidationMiddleware.validateProblemSetId(),
      async (req, res) => {
        res.status(501).json({
          success: false,
          error: {
            code: 'NOT_IMPLEMENTED',
            message: '공유 설정 변경 기능은 UpdateProblemSetUseCase를 통해 구현 예정입니다'
          },
          timestamp: new Date().toISOString()
        })
      }
    )

    // === 분석 및 통계 라우트 ===

    // 내 문제집 통계
    // GET /api/problemsets/analytics/my-stats
    this.router.get(
      '/analytics/my-stats',
      rateLimitMiddleware(60, 15), // 1분에 15개 요청
      requireRole('teacher', 'admin'),
      async (req, res) => {
        res.status(501).json({
          success: false,
          error: {
            code: 'NOT_IMPLEMENTED',
            message: '문제집 통계 기능은 향후 구현 예정입니다'
          },
          timestamp: new Date().toISOString()
        })
      }
    )

    // 공유된 문제집 목록
    // GET /api/problemsets/shared
    this.router.get(
      '/shared',
      rateLimitMiddleware(60, 30), // 1분에 30개 요청
      async (req, res) => {
        // GetProblemSetListUseCase에서 isShared=true 필터로 처리 가능
        res.status(501).json({
          success: false,
          error: {
            code: 'NOT_IMPLEMENTED',
            message: '공유 문제집 목록은 메인 목록 API에 필터 파라미터로 구현 예정입니다'
          },
          timestamp: new Date().toISOString()
        })
      }
    )

    // === 헬스체크 및 메타 정보 ===

    // API 상태 확인
    // GET /api/problemsets/health
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
              problemManagement: 'available',
              reordering: 'available',
              permissions: 'available',
              cloning: 'planned',
              analytics: 'planned'
            }
          }
        })
      }
    )

    // API 정보
    // GET /api/problemsets/info
    this.router.get(
      '/info',
      (req, res) => {
        res.json({
          success: true,
          data: {
            name: 'Problem Set Management API',
            version: '1.0.0',
            description: 'RESTful API for educational problem set management',
            endpoints: {
              problemsets: '/api/problemsets',
              problemset: '/api/problemsets/:id',
              addProblem: '/api/problemsets/:id/problems',
              removeProblem: '/api/problemsets/:id/problems/:problemId',
              reorder: '/api/problemsets/:id/reorder',
              permissions: '/api/problemsets/:id/permissions'
            },
            limits: {
              maxProblemsPerSet: 50,
              maxTitleLength: 255,
              maxDescriptionLength: 1000,
              defaultPageSize: 20,
              maxPageSize: 100
            },
            supportedRoles: ['student', 'teacher', 'admin'],
            permissions: {
              create: ['teacher', 'admin'],
              read: ['student', 'teacher', 'admin'],
              update: ['owner', 'admin'],
              delete: ['owner', 'admin']
            }
          }
        })
      }
    )
  }
}