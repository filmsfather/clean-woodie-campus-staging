import { Result } from '../../common/Result'
import { UniqueEntityID } from '../../common/Identifier'
import { BatchJob, BatchJobType } from '../entities/BatchJob'

/**
 * 배치 작업 스케줄링 옵션
 */
export interface BatchJobScheduleOptions {
  name: string
  type: BatchJobType
  scheduledAt: Date
  retryAttempts?: number
  timeoutMs?: number
  parameters?: Record<string, any>
}

/**
 * 반복 스케줄링 설정
 */
export interface RecurringScheduleOptions {
  pattern: 'daily' | 'weekly' | 'monthly' | 'hourly' | 'custom'
  interval?: number // custom 패턴용 (분 단위)
  startTime?: { hour: number; minute: number } // 일별/주별용
  dayOfWeek?: number // 주별용 (0=일요일, 6=토요일)
  dayOfMonth?: number // 월별용
  enabled: boolean
}

/**
 * 배치 작업 스케줄러 서비스 인터페이스
 * 배치 작업의 스케줄링과 실행 관리를 담당
 */
export interface IBatchJobScheduler {
  /**
   * 일회성 배치 작업 스케줄링
   * @param options 스케줄링 옵션
   * @returns 생성된 배치 작업
   */
  scheduleJob(options: BatchJobScheduleOptions): Promise<Result<BatchJob>>

  /**
   * 반복 배치 작업 스케줄링
   * @param jobOptions 작업 옵션
   * @param scheduleOptions 반복 설정
   * @returns 스케줄링 결과
   */
  scheduleRecurringJob(
    jobOptions: Omit<BatchJobScheduleOptions, 'scheduledAt'>,
    scheduleOptions: RecurringScheduleOptions
  ): Promise<Result<void>>

  /**
   * 즉시 실행할 배치 작업 스케줄링
   * @param options 스케줄링 옵션 (scheduledAt은 무시됨)
   * @returns 생성된 배치 작업
   */
  scheduleImmediateJob(
    options: Omit<BatchJobScheduleOptions, 'scheduledAt'>
  ): Promise<Result<BatchJob>>

  /**
   * 스케줄된 작업 취소
   * @param jobId 취소할 작업 ID
   * @returns 취소 결과
   */
  cancelJob(jobId: UniqueEntityID): Promise<Result<void>>

  /**
   * 반복 작업 스케줄 비활성화
   * @param type 작업 타입
   * @returns 비활성화 결과
   */
  disableRecurringJob(type: BatchJobType): Promise<Result<void>>

  /**
   * 반복 작업 스케줄 활성화
   * @param type 작업 타입
   * @returns 활성화 결과
   */
  enableRecurringJob(type: BatchJobType): Promise<Result<void>>

  /**
   * 다음 실행 예정인 배치 작업들 조회
   * @param limit 조회할 개수
   * @returns 다음 실행 예정 작업 목록
   */
  getUpcomingJobs(limit?: number): Promise<Result<BatchJob[]>>

  /**
   * 특정 타입의 마지막 실행 시간 조회
   * @param type 작업 타입
   * @returns 마지막 실행 시간 (없으면 null)
   */
  getLastExecutionTime(type: BatchJobType): Promise<Result<Date | null>>

  /**
   * 배치 작업 실행 상태 조회
   * @param jobId 작업 ID
   * @returns 실행 상태 정보
   */
  getJobStatus(jobId: UniqueEntityID): Promise<Result<{
    status: string
    progress?: number
    estimatedTimeRemaining?: number
    message?: string
  }>>

  /**
   * 실행 중인 모든 작업 상태 조회
   * @returns 실행 중인 작업들의 상태 정보
   */
  getRunningJobsStatus(): Promise<Result<Array<{
    jobId: string
    name: string
    type: BatchJobType
    startedAt: Date
    progress?: number
    estimatedTimeRemaining?: number
  }>>>

  /**
   * 시스템 통계용 기본 작업들 자동 스케줄링
   * 애플리케이션 시작 시 호출하여 필수 배치 작업들을 스케줄링
   */
  initializeDefaultSchedules(): Promise<Result<void>>
}