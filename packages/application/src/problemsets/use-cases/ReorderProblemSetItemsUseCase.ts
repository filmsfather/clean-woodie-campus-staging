import { BaseUseCase } from '../../use-cases/UseCase'
import { Result, UniqueEntityID, IProblemSetRepository, IUserRepository } from '@woodie/domain'
import { ReorderProblemSetItemsRequest, ReorderProblemSetItemsResponse, DetailedProblemSetDto, ProblemSetItemDto } from '../dto/ProblemSetDto'

/**
 * 문제집 문제 순서 재정렬 UseCase
 * 
 * 비즈니스 규칙:
 * - 문제집 소유자(교사)만 순서 재정렬 가능
 * - 관리자는 모든 문제집의 순서 재정렬 가능
 * - 모든 기존 문제가 새로운 순서에 포함되어야 함
 * - 순서는 0부터 시작하는 연속된 정수여야 함
 * - 드래그앤드롭 UI에서 사용하기 적합한 로직
 */
export class ReorderProblemSetItemsUseCase extends BaseUseCase<ReorderProblemSetItemsRequest, ReorderProblemSetItemsResponse> {
  constructor(
    private problemSetRepository: IProblemSetRepository,
    private userRepository: IUserRepository
  ) {
    super()
  }

  async execute(request: ReorderProblemSetItemsRequest): Promise<Result<ReorderProblemSetItemsResponse>> {
    try {
      // 1. 입력 유효성 검증
      const validationResult = this.validateRequest(request)
      if (validationResult.isFailure) {
        return Result.fail<ReorderProblemSetItemsResponse>(validationResult.error)
      }

      // 2. 문제집 조회
      const problemSetResult = await this.problemSetRepository.findById(
        new UniqueEntityID(request.problemSetId)
      )

      if (problemSetResult.isFailure) {
        return Result.fail<ReorderProblemSetItemsResponse>('Problem set not found')
      }

      const problemSet = problemSetResult.value

      // 3. 소유권 확인
      const ownershipResult = await this.checkOwnership(request, problemSet)
      if (ownershipResult.isFailure) {
        return Result.fail<ReorderProblemSetItemsResponse>(ownershipResult.error)
      }

      // 4. 재정렬 유효성 검증
      const reorderValidationResult = this.validateReorderRequest(problemSet, request.orderedProblemIds)
      if (reorderValidationResult.isFailure) {
        return Result.fail<ReorderProblemSetItemsResponse>(reorderValidationResult.error)
      }

      // 5. 재정렬 전 상태 저장 (롤백용)
      const originalOrder = problemSet.getProblemIds()

      // 6. 순서 재정렬 실행
      const reorderEntityIds = request.orderedProblemIds.map(id => new UniqueEntityID(id))
      const reorderResult = problemSet.reorderProblems(reorderEntityIds)
      
      if (reorderResult.isFailure) {
        return Result.fail<ReorderProblemSetItemsResponse>(`Failed to reorder problems: ${reorderResult.error}`)
      }

      // 7. 저장
      const saveResult = await this.problemSetRepository.save(problemSet)
      if (saveResult.isFailure) {
        // 실패 시 롤백 시도
        await this.attemptRollback(problemSet, originalOrder)
        return Result.fail<ReorderProblemSetItemsResponse>(`Failed to save reordered problem set: ${saveResult.error}`)
      }

      // 8. 응답 생성
      const problemSetDto = await this.mapToDetailedDto(problemSet)
      const reorderedItems = problemSetDto.items

      const response: ReorderProblemSetItemsResponse = {
        problemSet: problemSetDto,
        reorderedItems
      }

      return Result.ok<ReorderProblemSetItemsResponse>(response)

    } catch (error) {
      return Result.fail<ReorderProblemSetItemsResponse>(`Unexpected error reordering problems: ${error}`)
    }
  }

  private validateRequest(request: ReorderProblemSetItemsRequest): Result<void> {
    const errors: string[] = []

    if (!request.problemSetId || request.problemSetId.trim().length === 0) {
      errors.push('Problem set ID is required')
    }

    if (!request.requesterId || request.requesterId.trim().length === 0) {
      errors.push('Requester ID is required')
    }

    if (!request.orderedProblemIds || !Array.isArray(request.orderedProblemIds)) {
      errors.push('Ordered problem IDs array is required')
    }

    if (request.orderedProblemIds && request.orderedProblemIds.length === 0) {
      errors.push('Ordered problem IDs array cannot be empty')
    }

    // 중복 ID 확인
    if (request.orderedProblemIds) {
      const uniqueIds = new Set(request.orderedProblemIds)
      if (uniqueIds.size !== request.orderedProblemIds.length) {
        errors.push('Ordered problem IDs array contains duplicates')
      }

      // 빈 문자열이나 유효하지 않은 ID 확인
      const invalidIds = request.orderedProblemIds.filter(id => !id || id.trim().length === 0)
      if (invalidIds.length > 0) {
        errors.push('Ordered problem IDs array contains invalid IDs')
      }
    }

    if (errors.length > 0) {
      return Result.fail<void>(errors.join(', '))
    }

    return Result.ok<void>()
  }

  private async checkOwnership(request: ReorderProblemSetItemsRequest, problemSet: any): Promise<Result<void>> {
    // 소유자 확인
    if (problemSet.isOwnedBy(request.requesterId)) {
      return Result.ok<void>()
    }

    // 관리자 권한 확인
    const user = await this.userRepository.findById(new UniqueEntityID(request.requesterId))
    if (user && user.role === 'admin') {
      return Result.ok<void>()
    }

    return Result.fail<void>('Access denied: You can only modify your own problem sets')
  }

  private validateReorderRequest(problemSet: any, orderedProblemIds: string[]): Result<void> {
    // 1. 개수 일치 확인
    const currentProblemIds = problemSet.getProblemIds().map((id: any) => id.toString())
    
    if (orderedProblemIds.length !== currentProblemIds.length) {
      return Result.fail<void>(
        `Number of problems mismatch: expected ${currentProblemIds.length}, received ${orderedProblemIds.length}`
      )
    }

    // 2. 모든 기존 문제 ID가 새로운 순서에 포함되는지 확인
    const currentProblemIdSet = new Set(currentProblemIds)
    const orderedProblemIdSet = new Set(orderedProblemIds)

    // 누락된 문제 확인
    const missingIds = currentProblemIds.filter((id: any) => !orderedProblemIdSet.has(id))
    if (missingIds.length > 0) {
      return Result.fail<void>(`Missing problem IDs in reorder list: ${missingIds.join(', ')}`)
    }

    // 추가된 문제 확인 (존재하지 않는 문제)
    const extraIds = orderedProblemIds.filter(id => !currentProblemIdSet.has(id))
    if (extraIds.length > 0) {
      return Result.fail<void>(`Unknown problem IDs in reorder list: ${extraIds.join(', ')}`)
    }

    return Result.ok<void>()
  }

  private async mapToDetailedDto(problemSet: any): Promise<DetailedProblemSetDto> {
    const items = problemSet.getOrderedItems()
    
    return {
      id: problemSet.id.toString(),
      title: problemSet.title.value,
      description: problemSet.description?.value,
      teacherId: problemSet.teacherId,
      itemCount: problemSet.itemCount,
      totalPoints: this.calculateTotalPoints(problemSet),
      estimatedTimeMinutes: this.calculateEstimatedTime(problemSet),
      isPublic: problemSet.isPublic,
      isShared: problemSet.isShared,
      createdAt: problemSet.createdAt,
      updatedAt: problemSet.updatedAt,
      items: items.map((item: any) => ({
        id: item.id.toString(),
        problemId: item.problemId.toString(),
        orderIndex: item.orderIndex,
        points: 10, // TODO: 실제 포인트 값
        settings: {} // TODO: 실제 설정 값
      }))
    }
  }

  private calculateTotalPoints(problemSet: any): number {
    const items = problemSet.getOrderedItems()
    return items.reduce((total: number, item: any) => total + (item.points || 10), 0)
  }

  private calculateEstimatedTime(problemSet: any): number {
    const items = problemSet.getOrderedItems()
    return items.reduce((total: number, item: any) => total + (item.estimatedTimeMinutes || 3), 0)
  }

  private async attemptRollback(problemSet: any, originalOrder: any[]): Promise<void> {
    try {
      // 원래 순서로 롤백 시도
      const rollbackResult = problemSet.reorderProblems(originalOrder)
      if (rollbackResult.isSuccess) {
        await this.problemSetRepository.save(problemSet)
      }
    } catch (error) {
      // 롤백 실패는 로그만 남기고 계속 진행
      console.error('Failed to rollback problem set order:', error)
    }
  }

  // 추가적인 유틸리티 메서드들

  private analyzeReorderImpact(originalOrder: string[], newOrder: string[]): {
    movedItems: Array<{ problemId: string; from: number; to: number }>
    significantChanges: boolean
  } {
    const movedItems: Array<{ problemId: string; from: number; to: number }> = []
    let significantChanges = false

    newOrder.forEach((problemId, newIndex) => {
      const originalIndex = originalOrder.indexOf(problemId)
      if (originalIndex !== newIndex) {
        movedItems.push({
          problemId,
          from: originalIndex,
          to: newIndex
        })

        // 5개 이상 위치가 바뀌면 significant change로 간주
        if (Math.abs(originalIndex - newIndex) >= 5) {
          significantChanges = true
        }
      }
    })

    return { movedItems, significantChanges }
  }

  private validatePedagogicalOrder(orderedProblemIds: string[]): Result<string[]> {
    const warnings: string[] = []

    // TODO: 교육학적 순서 검증
    // - 난이도가 점진적으로 증가하는지
    // - 관련 주제끼리 묶여있는지
    // - 기초 개념이 먼저 나오는지

    return Result.ok<string[]>(warnings)
  }

  private async notifyReorderToActiveAssignments(problemSetId: string): Promise<void> {
    // TODO: 활성 과제에 순서 변경 알림
    // - 진행 중인 과제의 학생들에게 알림
    // - 교사 대시보드에 변경 사항 표시
    // - 통계 데이터 업데이트 스케줄링
  }

  private generateReorderSummary(
    movedItems: Array<{ problemId: string; from: number; to: number }>
  ): string {
    if (movedItems.length === 0) {
      return 'No changes made to problem order'
    }

    const summaries = movedItems.map(item => 
      `Problem ${item.problemId}: position ${item.from + 1} → ${item.to + 1}`
    )

    return `Reordered ${movedItems.length} problem(s): ${summaries.join('; ')}`
  }
}