import { BaseUseCase } from '../../use-cases/UseCase'
import { Result, IProblemSetRepository } from '@woodie/domain'

/**
 * 문제집 공개 설정 변경 UseCase
 * 
 * 비즈니스 규칙:
 * - 문제집 소유자(교사)만 공개 설정을 변경할 수 있음
 * - isPublic=true: 학생들이 조회 가능 (과제로 배정되거나 공개 문제집으로)
 * - 공개 문제집은 자동으로 공유(isShared=true)도 됨
 * - 공개 해제 시에도 기존 과제/복제본에는 영향 없음
 * - 빈 문제집(아이템 없음)은 공개할 수 없음
 */

export interface PublishProblemSetRequest {
  problemSetId: string
  requesterId: string
  isPublic: boolean
  publishNote?: string // 공개 시 관리자/다른 교사들에게 보여줄 메모
}

export interface PublishProblemSetResponse {
  problemSetId: string
  title: string
  isPublic: boolean
  isShared: boolean
  publishedAt?: Date
  unpublishedAt?: Date
  message: string
  warnings?: string[]
}

export class PublishProblemSetUseCase extends BaseUseCase<PublishProblemSetRequest, PublishProblemSetResponse> {
  constructor(
    private problemSetRepository: IProblemSetRepository
  ) {
    super()
  }

  async execute(request: PublishProblemSetRequest): Promise<Result<PublishProblemSetResponse>> {
    try {
      // 1. 입력 유효성 검증
      const validationResult = this.validateRequest(request)
      if (validationResult.isFailure) {
        return Result.fail<PublishProblemSetResponse>(validationResult.error)
      }

      // 2. 문제집 조회
      const problemSetResult = await this.problemSetRepository.findById(request.problemSetId)
      if (problemSetResult.isFailure) {
        return Result.fail<PublishProblemSetResponse>('Problem set not found')
      }

      const problemSet = problemSetResult.value

      // 3. 소유권 확인
      if (problemSet.teacherId !== request.requesterId) {
        return Result.fail<PublishProblemSetResponse>('Only the owner can change publish settings')
      }

      // 4. 공개 가능성 검증
      const warnings: string[] = []
      
      if (request.isPublic) {
        // 빈 문제집은 공개할 수 없음
        if (problemSet.itemCount === 0) {
          return Result.fail<PublishProblemSetResponse>(
            'Cannot publish an empty problem set. Please add at least one problem.'
          )
        }

        // 제목이나 설명이 부적절할 수 있는 경우 경고
        if (!problemSet.description || problemSet.description.value.trim().length < 20) {
          warnings.push('Consider adding a detailed description for better discoverability')
        }

        // 문제 수가 너무 적은 경우 경고
        if (problemSet.itemCount < 3) {
          warnings.push('Problem sets with fewer than 3 problems may not provide sufficient practice')
        }
      }

      // 5. 공개 설정 업데이트
      const wasPublic = problemSet.isPublic
      const wasShared = problemSet.isShared

      if (request.isPublic) {
        // 공개 시 자동으로 공유도 활성화
        problemSet.updateSharingSettings(true, true)
        
        // 공개 메모가 있다면 설정 (도메인 엔티티에 publishNote 필드가 있다고 가정)
        if (request.publishNote) {
          // problemSet.setPublishNote(request.publishNote)
        }
      } else {
        // 공개 해제 (공유 설정은 유지)
        problemSet.updateSharingSettings(wasShared, false)
      }

      // 6. 변경사항 저장
      const saveResult = await this.problemSetRepository.save(problemSet)
      if (saveResult.isFailure) {
        return Result.fail<PublishProblemSetResponse>(`Failed to update publish settings: ${saveResult.error}`)
      }

      // 7. 응답 메시지 생성
      let message: string
      const now = new Date()

      if (request.isPublic && !wasPublic) {
        message = 'Problem set has been published and is now visible to students'
      } else if (!request.isPublic && wasPublic) {
        message = 'Problem set has been unpublished and is no longer visible to students'
      } else if (request.isPublic) {
        message = 'Problem set publish settings updated'
      } else {
        message = 'Problem set remains private'
      }

      // 8. 응답 생성
      const response: PublishProblemSetResponse = {
        problemSetId: problemSet.id.toString(),
        title: problemSet.title.value,
        isPublic: problemSet.isPublic,
        isShared: problemSet.isShared,
        publishedAt: problemSet.isPublic && !wasPublic ? now : undefined,
        unpublishedAt: !problemSet.isPublic && wasPublic ? now : undefined,
        message,
        ...(warnings.length > 0 && { warnings })
      }

      return Result.ok<PublishProblemSetResponse>(response)

    } catch (error) {
      return Result.fail<PublishProblemSetResponse>(`Unexpected error updating publish settings: ${error}`)
    }
  }

  private validateRequest(request: PublishProblemSetRequest): Result<void> {
    const errors: string[] = []

    if (!request.problemSetId || request.problemSetId.trim().length === 0) {
      errors.push('Problem set ID is required')
    }

    if (!request.requesterId || request.requesterId.trim().length === 0) {
      errors.push('Requester ID is required')
    }

    if (typeof request.isPublic !== 'boolean') {
      errors.push('isPublic must be a boolean value')
    }

    if (request.publishNote && request.publishNote.length > 500) {
      errors.push('Publish note must be 500 characters or less')
    }

    if (errors.length > 0) {
      return Result.fail<void>(errors.join(', '))
    }

    return Result.ok<void>()
  }
}