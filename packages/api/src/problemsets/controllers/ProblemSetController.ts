import { Request, Response } from 'express'
import { BaseController } from '../../common/BaseController'
import {
  CreateProblemSetUseCase,
  GetProblemSetUseCase,
  GetProblemSetListUseCase,
  UpdateProblemSetUseCase,
  DeleteProblemSetUseCase,
  AddProblemToProblemSetUseCase,
  RemoveProblemFromProblemSetUseCase,
  ReorderProblemSetItemsUseCase
} from '@woodie/application'
import {
  CreateProblemSetRequest,
  GetProblemSetRequest,
  GetProblemSetListRequest,
  UpdateProblemSetRequest,
  DeleteProblemSetRequest,
  AddProblemToProblemSetRequest,
  RemoveProblemFromProblemSetRequest,
  ReorderProblemSetItemsRequest
} from '@woodie/application'

/**
 * ProblemSet REST API 컨트롤러
 * 문제집 관련 모든 HTTP 요청을 처리하고 적절한 UseCase를 호출
 */
export class ProblemSetController extends BaseController {
  constructor(
    private createProblemSetUseCase: CreateProblemSetUseCase,
    private getProblemSetUseCase: GetProblemSetUseCase,
    private getProblemSetListUseCase: GetProblemSetListUseCase,
    private updateProblemSetUseCase: UpdateProblemSetUseCase,
    private deleteProblemSetUseCase: DeleteProblemSetUseCase,
    private addProblemToProblemSetUseCase: AddProblemToProblemSetUseCase,
    private removeProblemFromProblemSetUseCase: RemoveProblemFromProblemSetUseCase,
    private reorderProblemSetItemsUseCase: ReorderProblemSetItemsUseCase
  ) {
    super()
  }

  /**
   * POST /api/problemsets
   * 새로운 문제집 생성
   */
  public createProblemSet = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id
      const userRole = req.user?.role

      if (!userId) {
        this.unauthorized(res, '인증이 필요합니다')
        return
      }

      if (userRole !== 'teacher' && userRole !== 'admin') {
        this.forbidden(res, '교사 권한이 필요합니다')
        return
      }

      const requestData: CreateProblemSetRequest = {
        title: req.body.title,
        description: req.body.description,
        teacherId: userId,
        isPublic: req.body.isPublic ?? false,
        isShared: req.body.isShared ?? false,
        initialProblems: req.body.initialProblems
      }

      const result = await this.createProblemSetUseCase.execute(requestData)

      if (result.isFailure) {
        this.clientError(res, result.error)
        return
      }

      this.created(res, result.value)

    } catch (error: any) {
      this.fail(res, `문제집 생성 중 오류가 발생했습니다: ${error.message}`)
    }
  }

  /**
   * GET /api/problemsets/:id
   * 특정 문제집 조회
   */
  public getProblemSet = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id
      const userRole = req.user?.role
      const problemSetId = req.params.id

      if (!userId) {
        this.unauthorized(res, '인증이 필요합니다')
        return
      }

      const requestData: GetProblemSetRequest = {
        problemSetId,
        requesterId: userId,
        requesterRole: userRole as 'student' | 'teacher' | 'admin',
        includeItems: req.query.includeItems === 'true'
      }

      const result = await this.getProblemSetUseCase.execute(requestData)

      if (result.isFailure) {
        if (result.error.includes('not found')) {
          this.notFound(res, result.error)
        } else if (result.error.includes('Access denied')) {
          this.forbidden(res, result.error)
        } else {
          this.clientError(res, result.error)
        }
        return
      }

      this.ok(res, result.value)

    } catch (error: any) {
      this.fail(res, `문제집 조회 중 오류가 발생했습니다: ${error.message}`)
    }
  }

  /**
   * GET /api/problemsets
   * 문제집 목록 조회 (필터링, 페이지네이션 포함)
   */
  public getProblemSetList = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id
      const userRole = req.user?.role

      if (!userId) {
        this.unauthorized(res, '인증이 필요합니다')
        return
      }

      const { page, limit } = this.getPaginationParams(req)
      const { sortBy, sortOrder } = this.getSortParams(req, ['title', 'createdAt', 'updatedAt', 'itemCount'])

      const requestData: GetProblemSetListRequest = {
        requesterId: userId,
        requesterRole: userRole as 'student' | 'teacher' | 'admin',
        filters: {
          teacherId: req.query.teacherId as string,
          isPublic: req.query.isPublic ? req.query.isPublic === 'true' : undefined,
          isShared: req.query.isShared ? req.query.isShared === 'true' : undefined,
          search: req.query.search as string
        },
        pagination: { page, limit },
        sorting: sortBy ? {
          field: sortBy as 'title' | 'createdAt' | 'updatedAt' | 'itemCount',
          order: sortOrder.toLowerCase() as 'asc' | 'desc'
        } : undefined
      }

      const result = await this.getProblemSetListUseCase.execute(requestData)

      if (result.isFailure) {
        this.clientError(res, result.error)
        return
      }

      const { problemSets, pagination: paginationInfo } = result.value

      this.paginated(res, problemSets, {
        page: paginationInfo.currentPage,
        limit,
        total: paginationInfo.totalCount,
        totalPages: paginationInfo.totalPages
      })

    } catch (error: any) {
      this.fail(res, `문제집 목록 조회 중 오류가 발생했습니다: ${error.message}`)
    }
  }

  /**
   * PUT /api/problemsets/:id
   * 문제집 메타데이터 수정
   */
  public updateProblemSet = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id
      const problemSetId = req.params.id

      if (!userId) {
        this.unauthorized(res, '인증이 필요합니다')
        return
      }

      const requestData: UpdateProblemSetRequest = {
        problemSetId,
        requesterId: userId,
        updates: {
          title: req.body.title,
          description: req.body.description,
          isPublic: req.body.isPublic,
          isShared: req.body.isShared
        }
      }

      const result = await this.updateProblemSetUseCase.execute(requestData)

      if (result.isFailure) {
        if (result.error.includes('not found')) {
          this.notFound(res, result.error)
        } else if (result.error.includes('Access denied')) {
          this.forbidden(res, result.error)
        } else {
          this.clientError(res, result.error)
        }
        return
      }

      this.ok(res, result.value)

    } catch (error: any) {
      this.fail(res, `문제집 수정 중 오류가 발생했습니다: ${error.message}`)
    }
  }

  /**
   * DELETE /api/problemsets/:id
   * 문제집 삭제
   */
  public deleteProblemSet = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id
      const problemSetId = req.params.id

      if (!userId) {
        this.unauthorized(res, '인증이 필요합니다')
        return
      }

      const requestData: DeleteProblemSetRequest = {
        problemSetId,
        requesterId: userId,
        force: req.query.force === 'true'
      }

      const result = await this.deleteProblemSetUseCase.execute(requestData)

      if (result.isFailure) {
        if (result.error.includes('not found')) {
          this.notFound(res, result.error)
        } else if (result.error.includes('Access denied')) {
          this.forbidden(res, result.error)
        } else if (result.error.includes('Cannot delete')) {
          this.clientError(res, result.error)
        } else {
          this.clientError(res, result.error)
        }
        return
      }

      this.ok(res, result.value)

    } catch (error: any) {
      this.fail(res, `문제집 삭제 중 오류가 발생했습니다: ${error.message}`)
    }
  }

  /**
   * POST /api/problemsets/:id/problems
   * 문제집에 문제 추가
   */
  public addProblemToProblemSet = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id
      const problemSetId = req.params.id

      if (!userId) {
        this.unauthorized(res, '인증이 필요합니다')
        return
      }

      const requestData: AddProblemToProblemSetRequest = {
        problemSetId,
        problemId: req.body.problemId,
        requesterId: userId,
        orderIndex: req.body.orderIndex,
        points: req.body.points
      }

      const result = await this.addProblemToProblemSetUseCase.execute(requestData)

      if (result.isFailure) {
        if (result.error.includes('not found')) {
          this.notFound(res, result.error)
        } else if (result.error.includes('Access denied')) {
          this.forbidden(res, result.error)
        } else {
          this.clientError(res, result.error)
        }
        return
      }

      this.ok(res, result.value)

    } catch (error: any) {
      this.fail(res, `문제 추가 중 오류가 발생했습니다: ${error.message}`)
    }
  }

  /**
   * DELETE /api/problemsets/:id/problems/:problemId
   * 문제집에서 문제 제거
   */
  public removeProblemFromProblemSet = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id
      const problemSetId = req.params.id
      const problemId = req.params.problemId

      if (!userId) {
        this.unauthorized(res, '인증이 필요합니다')
        return
      }

      const requestData: RemoveProblemFromProblemSetRequest = {
        problemSetId,
        problemId,
        requesterId: userId
      }

      const result = await this.removeProblemFromProblemSetUseCase.execute(requestData)

      if (result.isFailure) {
        if (result.error.includes('not found')) {
          this.notFound(res, result.error)
        } else if (result.error.includes('Access denied')) {
          this.forbidden(res, result.error)
        } else {
          this.clientError(res, result.error)
        }
        return
      }

      this.ok(res, result.value)

    } catch (error: any) {
      this.fail(res, `문제 제거 중 오류가 발생했습니다: ${error.message}`)
    }
  }

  /**
   * PUT /api/problemsets/:id/reorder
   * 문제집 내 문제 순서 재정렬
   */
  public reorderProblemSetItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id
      const problemSetId = req.params.id

      if (!userId) {
        this.unauthorized(res, '인증이 필요합니다')
        return
      }

      const requestData: ReorderProblemSetItemsRequest = {
        problemSetId,
        requesterId: userId,
        orderedProblemIds: req.body.orderedProblemIds
      }

      const result = await this.reorderProblemSetItemsUseCase.execute(requestData)

      if (result.isFailure) {
        if (result.error.includes('not found')) {
          this.notFound(res, result.error)
        } else if (result.error.includes('Access denied')) {
          this.forbidden(res, result.error)
        } else {
          this.clientError(res, result.error)
        }
        return
      }

      this.ok(res, result.value)

    } catch (error: any) {
      this.fail(res, `문제 순서 재정렬 중 오류가 발생했습니다: ${error.message}`)
    }
  }
}