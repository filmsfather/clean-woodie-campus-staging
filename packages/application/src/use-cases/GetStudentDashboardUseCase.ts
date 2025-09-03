/**
 * 학생 대시보드 조회 Use Case
 * 캐시를 우선 확인하고, 캐시 미스 시 리포지토리에서 조회하여 캐싱하는 로직 구현
 */

import { Result, IUseCase, Logger } from '@woodie/domain'
import { CachedStudentDashboardService, StudentDashboardDto } from '../services/CachedDashboardService'

// Use Case 입력/출력 타입 정의
export interface GetStudentDashboardRequest {
  studentId: string
  forceRefresh?: boolean
}

export interface GetStudentDashboardResponse {
  dashboard: StudentDashboardDto
  fromCache: boolean
}

/**
 * 실제 데이터 조회를 담당하는 리포지토리 인터페이스
 * 도메인 레이어에서 정의되어야 함 (순수한 비즈니스 인터페이스)
 */
export interface IStudentDashboardRepository {
  getDashboardData(studentId: string): Promise<Result<StudentDashboardDto>>
}

/**
 * 학생 대시보드 조회 Use Case 구현
 * 캐싱 전략: Cache-Aside 패턴
 * 1. 캐시 확인
 * 2. 캐시 미스 시 리포지토리에서 조회
 * 3. 조회 결과를 캐시에 저장
 */
export class GetStudentDashboardUseCase 
  implements IUseCase<GetStudentDashboardRequest, GetStudentDashboardResponse> {
  
  constructor(
    private dashboardRepository: IStudentDashboardRepository,
    private cachedDashboardService: CachedStudentDashboardService,
    private logger: Logger
  ) {}

  async execute(request: GetStudentDashboardRequest): Promise<Result<GetStudentDashboardResponse>> {
    try {
      const { studentId, forceRefresh = false } = request

      this.logger.info('Getting student dashboard', { studentId, forceRefresh })

      // 1. 캐시에서 먼저 확인 (강제 새로고침이 아닌 경우)
      if (!forceRefresh) {
        const cacheResult = await this.cachedDashboardService.getStudentDashboard(
          studentId, 
          forceRefresh
        )
        
        if (cacheResult.isSuccess) {
          const dashboard = cacheResult.getValue()
          this.logger.info('Student dashboard retrieved from cache', { studentId })
          
          return Result.ok({
            dashboard,
            fromCache: true
          })
        }
      }

      // 2. 캐시 미스 또는 강제 새로고침 - 리포지토리에서 조회
      this.logger.debug('Fetching student dashboard from repository', { studentId })
      
      const repositoryResult = await this.dashboardRepository.getDashboardData(studentId)
      if (repositoryResult.isFailure) {
        this.logger.error('Failed to get dashboard from repository', { 
          studentId, 
          error: repositoryResult.error 
        })
        return Result.fail(repositoryResult.error)
      }

      const dashboard = repositoryResult.getValue()

      // 3. 조회 결과를 캐시에 저장
      const cacheSuccess = await this.cachedDashboardService.cacheStudentDashboard(dashboard)
      if (!cacheSuccess) {
        this.logger.warn('Failed to cache student dashboard', { studentId })
        // 캐싱 실패해도 데이터는 반환
      }

      this.logger.info('Student dashboard retrieved from repository and cached', { 
        studentId,
        cached: cacheSuccess 
      })

      return Result.ok({
        dashboard,
        fromCache: false
      })

    } catch (error) {
      this.logger.error('Error in GetStudentDashboardUseCase', { 
        studentId: request.studentId, 
        error 
      })
      return Result.fail('Failed to get student dashboard')
    }
  }
}