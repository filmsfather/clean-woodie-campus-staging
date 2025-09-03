import { BaseUseCase } from '../../use-cases/UseCase'
import { Result } from '@woodie/domain'
import { ProgressTrackingApplicationService } from '../services/ProgressTrackingApplicationService'
import { StreakRankingDto } from '../dto/ProgressDto'

export interface GetStreakRankingsRequest {
  limit?: number // 기본값: 10
  studentId?: string // 내 순위 확인용
  requesterId?: string // 요청자 ID (권한 확인용)
  requesterRole?: 'student' | 'teacher' | 'admin'
  classId?: string // 특정 클래스 내 순위 (선택적)
}

export interface GetStreakRankingsResponse {
  rankings: StreakRankingDto
  filters: {
    limit: number
    isClassSpecific: boolean
    classId?: string
  }
}

/**
 * 스트릭 순위 조회 UseCase
 * 
 * 비즈니스 규칙:
 * - 전체 또는 클래스별 스트릭 순위 제공
 * - 본인 순위는 항상 포함하여 제공
 * - 개인정보 보호를 위해 학생명은 마스킹 처리
 * - 순위는 현재 스트릭 기준으로 정렬
 */
export class GetStreakRankingsUseCase extends BaseUseCase<GetStreakRankingsRequest, GetStreakRankingsResponse> {
  constructor(
    private progressService: ProgressTrackingApplicationService
  ) {
    super()
  }

  async execute(request: GetStreakRankingsRequest): Promise<Result<GetStreakRankingsResponse>> {
    try {
      // 1. 입력 유효성 검증
      const validationResult = this.validateRequest(request)
      if (validationResult.isFailure) {
        return Result.fail<GetStreakRankingsResponse>(validationResult.error)
      }

      // 2. 권한 확인
      const authResult = this.checkAuthorization(request)
      if (authResult.isFailure) {
        return Result.fail<GetStreakRankingsResponse>(authResult.error)
      }

      const limit = request.limit || 10

      // 3. 스트릭 순위 조회
      const rankingsResult = await this.progressService.getStreakRankings(limit, request.studentId)
      if (rankingsResult.isFailure) {
        return Result.fail<GetStreakRankingsResponse>(rankingsResult.error)
      }

      // 4. 클래스별 필터링 (필요시)
      let rankings = rankingsResult.value
      if (request.classId) {
        rankings = this.filterByClass(rankings, request.classId)
      }

      // 5. 응답 구성
      const response: GetStreakRankingsResponse = {
        rankings,
        filters: {
          limit,
          isClassSpecific: !!request.classId,
          classId: request.classId
        }
      }

      return Result.ok<GetStreakRankingsResponse>(response)
    } catch (error) {
      return Result.fail<GetStreakRankingsResponse>(`Failed to get streak rankings: ${error}`)
    }
  }

  private validateRequest(request: GetStreakRankingsRequest): Result<void> {
    if (request.limit !== undefined && (request.limit <= 0 || request.limit > 100)) {
      return Result.fail<void>('Limit must be between 1 and 100')
    }

    return Result.ok<void>()
  }

  private checkAuthorization(request: GetStreakRankingsRequest): Result<void> {
    // 모든 사용자가 순위 조회 가능 (개인정보는 마스킹 처리됨)
    // 관리자와 교사는 추가 정보 접근 가능
    return Result.ok<void>()
  }

  private filterByClass(rankings: StreakRankingDto, classId: string): StreakRankingDto {
    // TODO: 실제 구현에서는 클래스 멤버십 확인이 필요
    // 현재는 모든 학생을 포함하여 반환
    return rankings
  }
}