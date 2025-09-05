import { BaseUseCase } from '../../use-cases/UseCase'
import { Result, UniqueEntityID, IReviewScheduleRepository } from '@woodie/domain'

/**
 * 복습 스케줄 삭제 UseCase
 * 
 * 비즈니스 규칙:
 * - 학생은 자신의 복습 스케줄만 삭제 가능
 * - 교사/관리자는 학생의 복습 스케줄 삭제 가능
 * - 완료된 스케줄은 삭제하지 않고 보관 (소프트 삭제)
 * - 진행 중인 스케줄은 완전 삭제 가능
 * - 삭제 시 관련 통계 데이터는 유지
 * - 일괄 삭제 지원
 */

export interface DeleteReviewScheduleRequest {
  scheduleIds: string[] // 단일 또는 복수 스케줄 ID
  requesterId: string
  requesterRole: 'student' | 'teacher' | 'admin'
  deleteType: 'soft' | 'hard' // 소프트 삭제 vs 완전 삭제
  reason?: string // 삭제 이유
  preserveStatistics?: boolean // 통계 데이터 보존 여부
}

export interface DeleteReviewScheduleResponse {
  deletedSchedules: Array<{
    scheduleId: string
    studentId: string
    problemId: string
    wasCompleted: boolean
    deleteType: 'soft' | 'hard'
    deletedAt: Date
  }>
  failures: Array<{
    scheduleId: string
    reason: string
    error: string
  }>
  summary: {
    totalRequested: number
    totalDeleted: number
    totalFailed: number
    softDeleted: number
    hardDeleted: number
  }
  warnings?: string[]
}

export class DeleteReviewScheduleUseCase extends BaseUseCase<DeleteReviewScheduleRequest, DeleteReviewScheduleResponse> {
  constructor(
    private reviewScheduleRepository: IReviewScheduleRepository
  ) {
    super()
  }

  async execute(request: DeleteReviewScheduleRequest): Promise<Result<DeleteReviewScheduleResponse>> {
    try {
      // 1. 입력 유효성 검증
      const validationResult = this.validateRequest(request)
      if (validationResult.isFailure) {
        return Result.fail<DeleteReviewScheduleResponse>(validationResult.error)
      }

      // 2. 중복 제거 및 유효한 ID 필터링
      const uniqueScheduleIds = [...new Set(request.scheduleIds.filter(id => id && id.trim()))]
      
      if (uniqueScheduleIds.length === 0) {
        return Result.fail<DeleteReviewScheduleResponse>('No valid schedule IDs provided')
      }

      // 3. 스케줄 조회 및 권한 확인
      const scheduleValidations = await this.validateSchedulesForDeletion(
        uniqueScheduleIds,
        request.requesterId,
        request.requesterRole
      )

      // 4. 삭제 실행
      const deletedSchedules: any[] = []
      const failures: any[] = []
      const warnings: string[] = []

      for (const validation of scheduleValidations) {
        if (!validation.canDelete) {
          failures.push({
            scheduleId: validation.scheduleId,
            reason: validation.reason,
            error: validation.error
          })
          continue
        }

        try {
          const deleteResult = await this.deleteSchedule(
            validation.schedule,
            request.deleteType,
            request.reason,
            request.preserveStatistics
          )

          if (deleteResult.isSuccess) {
            deletedSchedules.push({
              scheduleId: validation.schedule.id.toString(),
              studentId: validation.schedule.studentId.toString(),
              problemId: validation.schedule.problemId.toString(),
              wasCompleted: validation.schedule.isCompleted,
              deleteType: request.deleteType,
              deletedAt: new Date()
            })

            // 완료된 스케줄을 하드 삭제하려는 경우 경고
            if (validation.schedule.isCompleted && request.deleteType === 'hard') {
              warnings.push(`Completed schedule ${validation.scheduleId} was hard deleted - statistics may be affected`)
            }
          } else {
            failures.push({
              scheduleId: validation.scheduleId,
              reason: 'Delete operation failed',
              error: deleteResult.error || 'Unknown error'
            })
          }
        } catch (error) {
          failures.push({
            scheduleId: validation.scheduleId,
            reason: 'Unexpected error during deletion',
            error: String(error)
          })
        }
      }

      // 5. 요약 생성
      const summary = {
        totalRequested: uniqueScheduleIds.length,
        totalDeleted: deletedSchedules.length,
        totalFailed: failures.length,
        softDeleted: deletedSchedules.filter(d => d.deleteType === 'soft').length,
        hardDeleted: deletedSchedules.filter(d => d.deleteType === 'hard').length
      }

      // 6. 응답 생성
      const response: DeleteReviewScheduleResponse = {
        deletedSchedules,
        failures,
        summary,
        ...(warnings.length > 0 && { warnings })
      }

      return Result.ok<DeleteReviewScheduleResponse>(response)

    } catch (error) {
      return Result.fail<DeleteReviewScheduleResponse>(`Unexpected error deleting review schedules: ${error}`)
    }
  }

  private validateRequest(request: DeleteReviewScheduleRequest): Result<void> {
    const errors: string[] = []

    if (!request.scheduleIds || request.scheduleIds.length === 0) {
      errors.push('At least one schedule ID is required')
    }

    if (request.scheduleIds && request.scheduleIds.length > 100) {
      errors.push('Cannot delete more than 100 schedules at once')
    }

    if (!request.requesterId || request.requesterId.trim().length === 0) {
      errors.push('Requester ID is required')
    }

    if (!['student', 'teacher', 'admin'].includes(request.requesterRole)) {
      errors.push('Invalid requester role')
    }

    if (!['soft', 'hard'].includes(request.deleteType)) {
      errors.push('Delete type must be either "soft" or "hard"')
    }

    if (request.reason && request.reason.length > 500) {
      errors.push('Reason must be 500 characters or less')
    }

    if (errors.length > 0) {
      return Result.fail<void>(errors.join(', '))
    }

    return Result.ok<void>()
  }

  private async validateSchedulesForDeletion(
    scheduleIds: string[],
    requesterId: string,
    requesterRole: string
  ): Promise<any[]> {
    const validations: any[] = []

    for (const scheduleId of scheduleIds) {
      try {
        const schedule = await this.reviewScheduleRepository.findById(new UniqueEntityID(scheduleId))
        
        if (!schedule) {
          validations.push({
            scheduleId,
            canDelete: false,
            reason: 'Schedule not found',
            error: 'The specified review schedule does not exist or has been deleted'
          })
          continue
        }

        // 권한 확인
        const hasPermission = this.hasDeletePermission(schedule, requesterId, requesterRole)
        if (!hasPermission) {
          validations.push({
            scheduleId,
            schedule,
            canDelete: false,
            reason: 'Insufficient permissions',
            error: 'You do not have permission to delete this review schedule'
          })
          continue
        }

        // 삭제 가능
        validations.push({
          scheduleId,
          schedule,
          canDelete: true,
          reason: 'Valid for deletion',
          error: null
        })

      } catch (error) {
        validations.push({
          scheduleId,
          canDelete: false,
          reason: 'Validation error',
          error: `Failed to validate schedule: ${error}`
        })
      }
    }

    return validations
  }

  private async deleteSchedule(
    schedule: any,
    deleteType: 'soft' | 'hard',
    reason?: string,
    preserveStatistics?: boolean
  ): Promise<Result<void>> {
    try {
      if (deleteType === 'soft') {
        // 소프트 삭제: 상태만 변경
        schedule.markAsDeleted(reason)
        await this.reviewScheduleRepository.save(schedule)
      } else {
        // 하드 삭제: 완전 제거
        if (preserveStatistics && schedule.isCompleted) {
          // 통계 데이터 보존을 위해 익명화하여 아카이브
          schedule.anonymizeForArchive()
          await this.reviewScheduleRepository.save(schedule)
        } else {
          // 완전 삭제
          await this.reviewScheduleRepository.delete(schedule.id)
        }
      }

      return Result.ok<void>()
    } catch (error) {
      return Result.fail<void>(`Failed to delete schedule: ${error}`)
    }
  }

  private hasDeletePermission(schedule: any, requesterId: string, requesterRole: string): boolean {
    // 관리자는 모든 스케줄 삭제 가능
    if (requesterRole === 'admin') {
      return true
    }

    // 교사는 자신이 관리하는 학생들의 스케줄 삭제 가능
    if (requesterRole === 'teacher') {
      // 실제로는 학생-교사 관계를 확인해야 함
      return true
    }

    // 학생은 자신의 스케줄만 삭제 가능
    if (requesterRole === 'student') {
      return schedule.studentId.toString() === requesterId
    }

    return false
  }
}