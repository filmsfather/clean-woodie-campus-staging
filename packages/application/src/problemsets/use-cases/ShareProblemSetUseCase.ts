import { BaseUseCase } from '../../use-cases/UseCase'
import { Result, IProblemSetRepository } from '@woodie/domain'

/**
 * 문제집 공유 설정 변경 UseCase
 * 
 * 비즈니스 규칙:
 * - 문제집 소유자(교사)만 공유 설정을 변경할 수 있음
 * - isShared=true: 다른 교사들이 조회/복제 가능
 * - isPublic=true: 학생들도 조회 가능 (과제로 배정 시)
 * - 공유 해제 시 기존 복제본에는 영향 없음
 */

export interface ShareProblemSetRequest {
  problemSetId: string
  requesterId: string
  isShared: boolean
  isPublic?: boolean
}

export interface ShareProblemSetResponse {
  problemSetId: string
  title: string
  isShared: boolean
  isPublic: boolean
  sharedAt?: Date
  message: string
}

export class ShareProblemSetUseCase extends BaseUseCase<ShareProblemSetRequest, ShareProblemSetResponse> {
  constructor(
    private problemSetRepository: IProblemSetRepository
  ) {
    super()
  }

  async execute(request: ShareProblemSetRequest): Promise<Result<ShareProblemSetResponse>> {
    try {
      // 1. 입력 유효성 검증
      const validationResult = this.validateRequest(request)
      if (validationResult.isFailure) {
        return Result.fail<ShareProblemSetResponse>(validationResult.error)
      }

      // 2. 문제집 조회
      const problemSetResult = await this.problemSetRepository.findById(request.problemSetId)
      if (problemSetResult.isFailure) {
        return Result.fail<ShareProblemSetResponse>('Problem set not found')
      }

      const problemSet = problemSetResult.value

      // 3. 소유권 확인
      if (problemSet.teacherId !== request.requesterId) {
        return Result.fail<ShareProblemSetResponse>('Only the owner can change sharing settings')
      }

      // 4. 공유 설정 업데이트
      const currentIsShared = problemSet.isShared
      const currentIsPublic = problemSet.isPublic

      // isPublic은 요청에서 제공되지 않으면 현재 값 유지
      const newIsPublic = request.isPublic !== undefined ? request.isPublic : currentIsPublic

      // 도메인 엔티티의 공유 설정 업데이트
      problemSet.updateSharingSettings(request.isShared, newIsPublic)

      // 5. 변경사항 저장
      const saveResult = await this.problemSetRepository.save(problemSet)
      if (saveResult.isFailure) {
        return Result.fail<ShareProblemSetResponse>(`Failed to update sharing settings: ${saveResult.error}`)
      }

      // 6. 응답 메시지 생성
      let message: string
      if (request.isShared && !currentIsShared) {
        message = newIsPublic 
          ? 'Problem set is now shared with teachers and visible to students'
          : 'Problem set is now shared with other teachers'
      } else if (!request.isShared && currentIsShared) {
        message = 'Problem set sharing has been disabled'
      } else if (request.isShared && newIsPublic !== currentIsPublic) {
        message = newIsPublic
          ? 'Problem set is now also visible to students'
          : 'Problem set visibility to students has been removed'
      } else {
        message = 'Sharing settings updated'
      }

      // 7. 응답 생성
      const response: ShareProblemSetResponse = {
        problemSetId: problemSet.id.toString(),
        title: problemSet.title.value,
        isShared: problemSet.isShared,
        isPublic: problemSet.isPublic,
        sharedAt: problemSet.isShared ? new Date() : undefined,
        message
      }

      return Result.ok<ShareProblemSetResponse>(response)

    } catch (error) {
      return Result.fail<ShareProblemSetResponse>(`Unexpected error updating sharing settings: ${error}`)
    }
  }

  private validateRequest(request: ShareProblemSetRequest): Result<void> {
    const errors: string[] = []

    if (!request.problemSetId || request.problemSetId.trim().length === 0) {
      errors.push('Problem set ID is required')
    }

    if (!request.requesterId || request.requesterId.trim().length === 0) {
      errors.push('Requester ID is required')
    }

    if (typeof request.isShared !== 'boolean') {
      errors.push('isShared must be a boolean value')
    }

    if (request.isPublic !== undefined && typeof request.isPublic !== 'boolean') {
      errors.push('isPublic must be a boolean value when provided')
    }

    if (errors.length > 0) {
      return Result.fail<void>(errors.join(', '))
    }

    return Result.ok<void>()
  }
}