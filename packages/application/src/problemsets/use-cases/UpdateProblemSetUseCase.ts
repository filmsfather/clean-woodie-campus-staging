import { BaseUseCase } from '../../use-cases/UseCase'
import { Result, UniqueEntityID, ProblemSetTitle, ProblemSetDescription, IProblemSetRepository, IUserRepository } from '@woodie/domain'
import { UpdateProblemSetRequest, UpdateProblemSetResponse, ProblemSetDto } from '../dto/ProblemSetDto'

/**
 * 문제집 수정 UseCase
 * 
 * 비즈니스 규칙:
 * - 문제집 소유자(교사)만 수정 가능
 * - 관리자는 모든 문제집 수정 가능
 * - 제목 변경 시 중복 확인 (같은 교사 내에서)
 * - 공유 설정 변경 시 기존 과제에 영향 없음
 */
export class UpdateProblemSetUseCase extends BaseUseCase<UpdateProblemSetRequest, UpdateProblemSetResponse> {
  constructor(
    private problemSetRepository: IProblemSetRepository,
    private userRepository: IUserRepository
  ) {
    super()
  }

  async execute(request: UpdateProblemSetRequest): Promise<Result<UpdateProblemSetResponse>> {
    try {
      // 1. 입력 유효성 검증
      const validationResult = this.validateRequest(request)
      if (validationResult.isFailure) {
        return Result.fail<UpdateProblemSetResponse>(validationResult.error)
      }

      // 2. 문제집 조회
      const problemSetResult = await this.problemSetRepository.findById(
        new UniqueEntityID(request.problemSetId)
      )

      if (problemSetResult.isFailure) {
        return Result.fail<UpdateProblemSetResponse>('Problem set not found')
      }

      const problemSet = problemSetResult.value

      // 3. 소유권 확인
      const ownershipResult = await this.checkOwnership(request, problemSet)
      if (ownershipResult.isFailure) {
        return Result.fail<UpdateProblemSetResponse>(ownershipResult.error)
      }

      // 4. 제목 변경 시 중복 확인
      if (request.updates.title && request.updates.title !== problemSet.title.value) {
        const titleExistsResult = await this.problemSetRepository.findByTeacherIdAndTitle(
          problemSet.teacherId,
          request.updates.title
        )

        if (titleExistsResult.isSuccess) {
          return Result.fail<UpdateProblemSetResponse>(
            'A problem set with this title already exists for this teacher'
          )
        }
      }

      // 5. 업데이트 적용
      const updatedFields: string[] = []
      const updateResult = await this.applyUpdates(problemSet, request.updates, updatedFields)
      if (updateResult.isFailure) {
        return Result.fail<UpdateProblemSetResponse>(updateResult.error)
      }

      // 6. 저장
      const saveResult = await this.problemSetRepository.save(problemSet)
      if (saveResult.isFailure) {
        return Result.fail<UpdateProblemSetResponse>(`Failed to save problem set: ${saveResult.error}`)
      }

      // 7. 응답 생성
      const problemSetDto = this.mapToDto(problemSet, request.updates.isPublic, request.updates.isShared)
      
      const response: UpdateProblemSetResponse = {
        problemSet: problemSetDto,
        updatedFields
      }

      return Result.ok<UpdateProblemSetResponse>(response)

    } catch (error) {
      return Result.fail<UpdateProblemSetResponse>(`Unexpected error updating problem set: ${error}`)
    }
  }

  private validateRequest(request: UpdateProblemSetRequest): Result<void> {
    const errors: string[] = []

    if (!request.problemSetId || request.problemSetId.trim().length === 0) {
      errors.push('Problem set ID is required')
    }

    if (!request.requesterId || request.requesterId.trim().length === 0) {
      errors.push('Requester ID is required')
    }

    if (!request.updates || Object.keys(request.updates).length === 0) {
      errors.push('At least one update field is required')
    }

    // 제목 검증
    if (request.updates.title !== undefined) {
      if (typeof request.updates.title !== 'string' || request.updates.title.trim().length === 0) {
        errors.push('Title must be a non-empty string')
      } else if (request.updates.title.length > 255) {
        errors.push('Title must be 255 characters or less')
      }
    }

    // 설명 검증
    if (request.updates.description !== undefined) {
      if (request.updates.description !== null && typeof request.updates.description !== 'string') {
        errors.push('Description must be a string or null')
      } else if (request.updates.description && request.updates.description.length > 1000) {
        errors.push('Description must be 1000 characters or less')
      }
    }

    // 공개/공유 설정 검증
    if (request.updates.isPublic !== undefined && typeof request.updates.isPublic !== 'boolean') {
      errors.push('isPublic must be a boolean')
    }

    if (request.updates.isShared !== undefined && typeof request.updates.isShared !== 'boolean') {
      errors.push('isShared must be a boolean')
    }

    if (errors.length > 0) {
      return Result.fail<void>(errors.join(', '))
    }

    return Result.ok<void>()
  }

  private async checkOwnership(request: UpdateProblemSetRequest, problemSet: any): Promise<Result<void>> {
    // 소유자 확인
    if (problemSet.isOwnedBy(request.requesterId)) {
      return Result.ok<void>()
    }

    // 관리자 권한 확인
    const user = await this.userRepository.findById(new UniqueEntityID(request.requesterId))
    if (user && user.role === 'admin') {
      return Result.ok<void>()
    }

    return Result.fail<void>('Access denied: You can only update your own problem sets')
  }

  private async applyUpdates(
    problemSet: any, 
    updates: any, 
    updatedFields: string[]
  ): Promise<Result<void>> {
    try {
      // 제목 업데이트
      if (updates.title !== undefined) {
        const titleResult = ProblemSetTitle.create(updates.title.trim())
        if (titleResult.isFailure) {
          return Result.fail<void>(`Invalid title: ${titleResult.error}`)
        }

        problemSet.updateTitle(titleResult.value)
        updatedFields.push('title')
      }

      // 설명 업데이트
      if (updates.description !== undefined) {
        if (updates.description === null || updates.description.trim() === '') {
          problemSet.clearDescription()
          updatedFields.push('description')
        } else {
          const descriptionResult = ProblemSetDescription.create(updates.description.trim())
          if (descriptionResult.isFailure) {
            return Result.fail<void>(`Invalid description: ${descriptionResult.error}`)
          }

          problemSet.updateDescription(descriptionResult.value)
          updatedFields.push('description')
        }
      }

      // 공개 설정 업데이트
      if (updates.isPublic !== undefined) {
        problemSet.setPublic(updates.isPublic)
        updatedFields.push('isPublic')
      }

      // 공유 설정 업데이트
      if (updates.isShared !== undefined) {
        problemSet.setShared(updates.isShared)
        updatedFields.push('isShared')
      }

      return Result.ok<void>()

    } catch (error) {
      return Result.fail<void>(`Failed to apply updates: ${error}`)
    }
  }

  private mapToDto(problemSet: any, isPublic?: boolean, isShared?: boolean): ProblemSetDto {
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
      updatedAt: problemSet.updatedAt
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
}