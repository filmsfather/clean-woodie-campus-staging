import { BaseUseCase } from '../../use-cases/UseCase'
import { Result, ProblemSet, ProblemSetTitle, ProblemSetDescription, IProblemSetRepository } from '@woodie/domain'

/**
 * 문제집 복제 UseCase
 * 
 * 비즈니스 규칙:
 * - 공유된 문제집(isShared=true)만 복제 가능
 * - 소유자는 자신의 문제집을 언제든 복제 가능
 * - 복제된 문제집은 새로운 소유자(복제 요청자)의 것이 됨
 * - 복제본은 기본적으로 비공개/비공유 상태로 생성
 * - 제목은 "Copy of [원본제목]" 형식 또는 사용자 지정
 * - 모든 문제 아이템과 설정이 복사됨
 */

export interface CloneProblemSetRequest {
  sourceProblemSetId: string
  targetTeacherId: string
  newTitle?: string
  newDescription?: string
  isPublic?: boolean
  isShared?: boolean
  preserveSettings?: boolean // 원본의 공유/공개 설정 유지 여부
}

export interface CloneProblemSetResponse {
  clonedProblemSet: {
    id: string
    title: string
    description?: string
    teacherId: string
    itemCount: number
    isPublic: boolean
    isShared: boolean
    createdAt: Date
  }
  originalProblemSet: {
    id: string
    title: string
    teacherId: string
    teacherName?: string
  }
  cloneDetails: {
    itemsCopied: number
    settingsCopied: boolean
    totalPoints: number
    estimatedTimeMinutes: number
  }
}

export class CloneProblemSetUseCase extends BaseUseCase<CloneProblemSetRequest, CloneProblemSetResponse> {
  constructor(
    private problemSetRepository: IProblemSetRepository
  ) {
    super()
  }

  async execute(request: CloneProblemSetRequest): Promise<Result<CloneProblemSetResponse>> {
    try {
      // 1. 입력 유효성 검증
      const validationResult = this.validateRequest(request)
      if (validationResult.isFailure) {
        return Result.fail<CloneProblemSetResponse>(validationResult.error)
      }

      // 2. 원본 문제집 조회
      const sourceProblemSetResult = await this.problemSetRepository.findById(request.sourceProblemSetId)
      if (sourceProblemSetResult.isFailure) {
        return Result.fail<CloneProblemSetResponse>('Source problem set not found')
      }

      const sourceProblemSet = sourceProblemSetResult.value

      // 3. 복제 권한 확인
      const canClone = this.canCloneProblemSet(sourceProblemSet, request.targetTeacherId)
      if (!canClone) {
        return Result.fail<CloneProblemSetResponse>(
          'Cannot clone this problem set. Only shared problem sets or your own problem sets can be cloned.'
        )
      }

      // 4. 새 제목 생성 (중복 확인 포함)
      const newTitleResult = await this.generateUniqueTitle(
        request.newTitle || `Copy of ${sourceProblemSet.title.value}`,
        request.targetTeacherId
      )
      if (newTitleResult.isFailure) {
        return Result.fail<CloneProblemSetResponse>(newTitleResult.error)
      }

      // 5. 도메인 Value Objects 생성
      const titleResult = ProblemSetTitle.create(newTitleResult.value)
      if (titleResult.isFailure) {
        return Result.fail<CloneProblemSetResponse>(`Invalid title: ${titleResult.error}`)
      }

      let descriptionVo: ProblemSetDescription | undefined
      const descriptionText = request.newDescription || sourceProblemSet.description?.value
      if (descriptionText) {
        const descriptionResult = ProblemSetDescription.create(descriptionText)
        if (descriptionResult.isFailure) {
          return Result.fail<CloneProblemSetResponse>(`Invalid description: ${descriptionResult.error}`)
        }
        descriptionVo = descriptionResult.value
      }

      // 6. 복제본의 공유/공개 설정 결정
      let isPublic: boolean
      let isShared: boolean

      if (request.preserveSettings) {
        isPublic = sourceProblemSet.isPublic
        isShared = sourceProblemSet.isShared
      } else {
        isPublic = request.isPublic ?? false
        isShared = request.isShared ?? false
      }

      // 7. 새 문제집 도메인 엔티티 생성
      const clonedProblemSetResult = ProblemSet.create({
        teacherId: request.targetTeacherId,
        title: titleResult.value,
        description: descriptionVo,
        isPublic,
        isShared
      })

      if (clonedProblemSetResult.isFailure) {
        return Result.fail<CloneProblemSetResponse>(`Failed to create cloned problem set: ${clonedProblemSetResult.error}`)
      }

      const clonedProblemSet = clonedProblemSetResult.value

      // 8. 원본의 모든 아이템 복사
      const sourceItems = sourceProblemSet.getOrderedItems()
      let copiedItemsCount = 0
      
      for (const sourceItem of sourceItems) {
        const addResult = clonedProblemSet.addProblem(
          sourceItem.problemId,
          sourceItem.orderIndex,
          sourceItem.points,
          sourceItem.settings
        )
        
        if (addResult.isSuccess) {
          copiedItemsCount++
        }
        // 실패한 아이템이 있어도 계속 진행 (일부 문제가 삭제되었을 수도 있음)
      }

      // 9. 복제된 문제집 저장
      const saveResult = await this.problemSetRepository.save(clonedProblemSet)
      if (saveResult.isFailure) {
        return Result.fail<CloneProblemSetResponse>(`Failed to save cloned problem set: ${saveResult.error}`)
      }

      // 10. 응답 생성
      const response: CloneProblemSetResponse = {
        clonedProblemSet: {
          id: clonedProblemSet.id.toString(),
          title: clonedProblemSet.title.value,
          description: clonedProblemSet.description?.value,
          teacherId: clonedProblemSet.teacherId,
          itemCount: clonedProblemSet.itemCount,
          isPublic: clonedProblemSet.isPublic,
          isShared: clonedProblemSet.isShared,
          createdAt: clonedProblemSet.createdAt
        },
        originalProblemSet: {
          id: sourceProblemSet.id.toString(),
          title: sourceProblemSet.title.value,
          teacherId: sourceProblemSet.teacherId
          // teacherName은 실제로는 다른 서비스에서 조회해야 함
        },
        cloneDetails: {
          itemsCopied: copiedItemsCount,
          settingsCopied: request.preserveSettings ?? false,
          totalPoints: this.calculateTotalPoints(clonedProblemSet),
          estimatedTimeMinutes: this.calculateEstimatedTime(clonedProblemSet)
        }
      }

      return Result.ok<CloneProblemSetResponse>(response)

    } catch (error) {
      return Result.fail<CloneProblemSetResponse>(`Unexpected error cloning problem set: ${error}`)
    }
  }

  private validateRequest(request: CloneProblemSetRequest): Result<void> {
    const errors: string[] = []

    if (!request.sourceProblemSetId || request.sourceProblemSetId.trim().length === 0) {
      errors.push('Source problem set ID is required')
    }

    if (!request.targetTeacherId || request.targetTeacherId.trim().length === 0) {
      errors.push('Target teacher ID is required')
    }

    if (request.newTitle && request.newTitle.length > 255) {
      errors.push('New title must be 255 characters or less')
    }

    if (request.newDescription && request.newDescription.length > 1000) {
      errors.push('New description must be 1000 characters or less')
    }

    if (errors.length > 0) {
      return Result.fail<void>(errors.join(', '))
    }

    return Result.ok<void>()
  }

  private canCloneProblemSet(problemSet: ProblemSet, requesterId: string): boolean {
    // 소유자는 항상 복제 가능
    if (problemSet.teacherId === requesterId) {
      return true
    }

    // 공유된 문제집만 다른 사람이 복제 가능
    return problemSet.isShared
  }

  private async generateUniqueTitle(baseTitle: string, teacherId: string): Promise<Result<string>> {
    let title = baseTitle
    let counter = 1

    while (counter <= 10) { // 무한루프 방지
      const existsResult = await this.problemSetRepository.findByTeacherIdAndTitle(teacherId, title)
      
      if (existsResult.isFailure) {
        // 제목이 중복되지 않음
        return Result.ok<string>(title)
      }

      // 중복되므로 번호를 붙여서 재시도
      title = `${baseTitle} (${counter})`
      counter++
    }

    return Result.fail<string>('Could not generate a unique title after 10 attempts')
  }

  private calculateTotalPoints(problemSet: ProblemSet): number {
    const items = problemSet.getOrderedItems()
    return items.reduce((total, item) => total + (item.points || 10), 0)
  }

  private calculateEstimatedTime(problemSet: ProblemSet): number {
    const items = problemSet.getOrderedItems()
    return items.reduce((totalMinutes, item) => totalMinutes + (item.estimatedTimeMinutes || 3), 0)
  }
}