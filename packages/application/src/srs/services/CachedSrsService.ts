import { ISrsService } from '@woodie/domain/srs/services/ISrsService'
import { IReviewScheduleRepository } from '@woodie/domain/srs/repositories/IReviewScheduleRepository'
import { IStudyRecordRepository } from '@woodie/domain/srs/repositories/IStudyRecordRepository'
import { ICacheService } from '@woodie/infrastructure/cache/ICacheService'
import { CacheKeys, CacheTTL } from '@woodie/infrastructure/cache/CacheService'
import { ReviewSchedule } from '@woodie/domain/srs/entities/ReviewSchedule'
import { StudyRecord } from '@woodie/domain/srs/entities/StudyRecord'
import { UniqueEntityID } from '@woodie/domain/common/Identifier'
import { Result } from '@woodie/domain/common/Result'
import { ReviewFeedback } from '@woodie/domain/srs/value-objects/ReviewFeedback'
import { ISpacedRepetitionPolicy } from '@woodie/domain/srs/services/ISpacedRepetitionPolicy'
import { IClock } from '@woodie/domain/srs/services/IClock'

/**
 * 캐싱이 적용된 SRS 서비스
 * Cache-Aside 패턴을 사용하여 성능을 최적화한 SRS 서비스
 */
export class CachedSrsService implements ISrsService {
  constructor(
    private readonly reviewScheduleRepository: IReviewScheduleRepository,
    private readonly studyRecordRepository: IStudyRecordRepository,
    private readonly cacheService: ICacheService,
    private readonly srsPolicy: ISpacedRepetitionPolicy,
    private readonly clock: IClock
  ) {}

  /**
   * 학생의 오늘 복습 카드 조회 (캐싱 적용)
   */
  async getTodayReviews(studentId: UniqueEntityID): Promise<Result<ReviewSchedule[]>> {
    const cacheKey = CacheKeys.SRS_TODAY_REVIEWS(studentId.toString())
    
    try {
      // 1. 캐시에서 먼저 조회
      const cachedReviews = await this.cacheService.get<ReviewSchedule[]>(cacheKey)
      if (cachedReviews) {
        return Result.ok(cachedReviews.map(data => 
          ReviewSchedule.reconstitute(data as any, new UniqueEntityID(data.id))
        ))
      }

      // 2. 캐시 미스 시 DB에서 조회
      const currentDate = this.clock.now()
      const reviews = await this.reviewScheduleRepository.findTodayReviews(studentId, currentDate)
      
      // 3. 캐시에 저장 (5분간 유지)
      await this.cacheService.set(cacheKey, reviews, CacheTTL.SHORT)
      
      return Result.ok(reviews)

    } catch (error) {
      return Result.fail(`오늘 복습 카드 조회 실패: ${error}`)
    }
  }

  /**
   * 학생의 지연된 복습 카드 조회 (캐싱 적용)
   */
  async getOverdueReviews(studentId: UniqueEntityID): Promise<Result<ReviewSchedule[]>> {
    const cacheKey = CacheKeys.SRS_OVERDUE_REVIEWS(studentId.toString())
    
    try {
      // 1. 캐시에서 먼저 조회
      const cachedReviews = await this.cacheService.get<ReviewSchedule[]>(cacheKey)
      if (cachedReviews) {
        return Result.ok(cachedReviews.map(data => 
          ReviewSchedule.reconstitute(data as any, new UniqueEntityID(data.id))
        ))
      }

      // 2. 캐시 미스 시 DB에서 조회
      const currentDate = this.clock.now()
      const reviews = await this.reviewScheduleRepository.findOverdueReviews(studentId, currentDate)
      
      // 3. 캐시에 저장 (3분간 유지 - 지연 상태는 자주 변경될 수 있음)
      await this.cacheService.set(cacheKey, reviews, 180) // 3분
      
      return Result.ok(reviews)

    } catch (error) {
      return Result.fail(`지연된 복습 카드 조회 실패: ${error}`)
    }
  }

  /**
   * 복습 완료 처리 (캐시 무효화 적용)
   */
  async completeReview(
    reviewScheduleId: UniqueEntityID,
    feedback: ReviewFeedback,
    studyInfo?: {
      responseTime?: number
      answerContent?: any
    }
  ): Promise<Result<void>> {
    try {
      // 1. 복습 일정 조회
      const reviewSchedule = await this.reviewScheduleRepository.findById(reviewScheduleId)
      if (!reviewSchedule) {
        return Result.fail('복습 일정을 찾을 수 없습니다')
      }

      // 2. 복습 피드백 처리
      const processResult = reviewSchedule.processReviewFeedback(
        feedback,
        this.srsPolicy,
        this.clock,
        studyInfo
      )

      if (processResult.isFailure) {
        return Result.fail(`복습 피드백 처리 실패: ${processResult.error}`)
      }

      // 3. 복습 일정 저장
      await this.reviewScheduleRepository.save(reviewSchedule)

      // 4. 관련 캐시 무효화
      await this.invalidateStudentSrsCache(reviewSchedule.studentId)

      // 5. 통계 캐시도 무효화 (학생 대시보드 등)
      const dashboardCacheKey = CacheKeys.STUDENT_DASHBOARD(reviewSchedule.studentId.toString())
      await this.cacheService.del(dashboardCacheKey)

      return Result.ok()

    } catch (error) {
      return Result.fail(`복습 완료 처리 실패: ${error}`)
    }
  }

  /**
   * 학생의 복습 통계 조회 (캐싱 적용)
   */
  async getStudentReviewStats(studentId: UniqueEntityID): Promise<Result<{
    totalCards: number
    dueToday: number
    overdue: number
    completedToday: number
    averageEaseFactor: number
    longestStreak: number
  }>> {
    const cacheKey = CacheKeys.SRS_STUDENT_STATS(studentId.toString())
    
    try {
      // 1. 캐시에서 먼저 조회
      const cachedStats = await this.cacheService.get<any>(cacheKey)
      if (cachedStats) {
        return Result.ok(cachedStats)
      }

      // 2. 캐시 미스 시 DB에서 계산
      const [totalCards, dueCards, overdueCards, todayRecords] = await Promise.all([
        this.reviewScheduleRepository.countByStudent(studentId),
        this.reviewScheduleRepository.countByStudentAndStatus(studentId, 'due'),
        this.reviewScheduleRepository.countByStudentAndStatus(studentId, 'overdue'),
        this.getTodayStudyRecords(studentId)
      ])

      // 평균 ease factor 계산
      const allSchedules = await this.reviewScheduleRepository.findDueReviews(
        studentId, 
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1년 후까지 모든 카드
      )
      
      const averageEaseFactor = allSchedules.length > 0
        ? allSchedules.reduce((sum, schedule) => sum + schedule.easeFactor, 0) / allSchedules.length
        : 2.5

      const stats = {
        totalCards,
        dueToday: dueCards,
        overdue: overdueCards,
        completedToday: todayRecords.isSuccess ? todayRecords.value.length : 0,
        averageEaseFactor: Math.round(averageEaseFactor * 100) / 100,
        longestStreak: 0 // TODO: 스트릭 계산 로직 추가
      }

      // 3. 캐시에 저장 (10분간 유지)
      await this.cacheService.set(cacheKey, stats, CacheTTL.MEDIUM)
      
      return Result.ok(stats)

    } catch (error) {
      return Result.fail(`학생 복습 통계 조회 실패: ${error}`)
    }
  }

  /**
   * 문제별 복습 성과 조회 (캐싱 적용)
   */
  async getProblemReviewPerformance(problemId: UniqueEntityID): Promise<Result<{
    totalReviews: number
    averageEaseFactor: number
    averageInterval: number
    successRate: number
    avgResponseTime: number
  }>> {
    const cacheKey = CacheKeys.SRS_PROBLEM_PERFORMANCE(problemId.toString())
    
    try {
      // 1. 캐시에서 먼저 조회
      const cachedPerformance = await this.cacheService.get<any>(cacheKey)
      if (cachedPerformance) {
        return Result.ok(cachedPerformance)
      }

      // 2. 캐시 미스 시 DB에서 계산
      const studyRecords = await this.studyRecordRepository.findByProblem(problemId)
      
      if (studyRecords.length === 0) {
        const emptyStats = {
          totalReviews: 0,
          averageEaseFactor: 2.5,
          averageInterval: 1,
          successRate: 0,
          avgResponseTime: 0
        }
        
        // 빈 통계도 캐시에 저장 (30분간)
        await this.cacheService.set(cacheKey, emptyStats, CacheTTL.LONG)
        return Result.ok(emptyStats)
      }

      // 성공률 계산
      const successfulReviews = studyRecords.filter(record => record.isCorrect).length
      const successRate = (successfulReviews / studyRecords.length) * 100

      // 평균 응답 시간 계산
      const validResponseTimes = studyRecords
        .filter(record => record.responseTime && record.responseTime > 0)
        .map(record => record.responseTime!)
      
      const avgResponseTime = validResponseTimes.length > 0
        ? validResponseTimes.reduce((sum, time) => sum + time, 0) / validResponseTimes.length
        : 0

      // TODO: ease factor와 interval은 ReviewSchedule에서 가져와야 함
      const performance = {
        totalReviews: studyRecords.length,
        averageEaseFactor: 2.5, // 실제로는 해당 문제의 모든 ReviewSchedule에서 계산
        averageInterval: 1, // 실제로는 해당 문제의 모든 ReviewSchedule에서 계산
        successRate: Math.round(successRate * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100
      }

      // 3. 캐시에 저장 (30분간 유지)
      await this.cacheService.set(cacheKey, performance, CacheTTL.LONG)
      
      return Result.ok(performance)

    } catch (error) {
      return Result.fail(`문제 복습 성과 조회 실패: ${error}`)
    }
  }

  /**
   * 새로운 복습 일정 생성 (캐시 무효화)
   */
  async createReviewSchedule(
    studentId: UniqueEntityID,
    problemId: UniqueEntityID
  ): Promise<Result<ReviewSchedule>> {
    try {
      // ReviewSchedule 생성 로직은 기존과 동일
      // ... (생성 로직)
      
      // 생성 후 관련 캐시 무효화
      await this.invalidateStudentSrsCache(studentId)
      
      // 새로 생성된 일정 반환
      return Result.ok({} as ReviewSchedule) // 실제 구현에서는 생성된 ReviewSchedule 반환

    } catch (error) {
      return Result.fail(`복습 일정 생성 실패: ${error}`)
    }
  }

  /**
   * 학생의 SRS 관련 캐시 무효화
   */
  private async invalidateStudentSrsCache(studentId: UniqueEntityID): Promise<void> {
    const studentIdStr = studentId.toString()
    
    // 학생 관련 SRS 캐시들 삭제
    await Promise.all([
      this.cacheService.del(CacheKeys.SRS_TODAY_REVIEWS(studentIdStr)),
      this.cacheService.del(CacheKeys.SRS_OVERDUE_REVIEWS(studentIdStr)),
      this.cacheService.del(CacheKeys.SRS_STUDENT_STATS(studentIdStr)),
      this.cacheService.invalidatePattern(`srs:student:${studentIdStr}:*`)
    ])
  }

  /**
   * 오늘의 학습 기록 조회 헬퍼
   */
  private async getTodayStudyRecords(studentId: UniqueEntityID): Promise<Result<StudyRecord[]>> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      return await this.studyRecordRepository.findByStudentAndDateRange(
        studentId, 
        today, 
        tomorrow
      )
    } catch (error) {
      return Result.fail(`오늘 학습 기록 조회 실패: ${error}`)
    }
  }
}