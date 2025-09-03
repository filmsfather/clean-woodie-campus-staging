import { UniqueEntityID } from '@domain/common/Identifier'
import { Result } from '@domain/common/Result'
import { 
  ReviewSchedule, 
  StudyRecord,
  IReviewScheduleRepository, 
  IStudyRecordRepository,
  ISpacedRepetitionPolicy,
  IClock,
  ReviewFeedback
} from '@domain/srs'

// 복습 큐 항목 DTO
export interface ReviewQueueItem {
  scheduleId: string
  studentId: string
  problemId: string
  nextReviewAt: Date
  currentInterval: number
  easeFactor: number
  reviewCount: number
  consecutiveFailures: number
  priority: 'high' | 'medium' | 'low'
  isOverdue: boolean
  minutesUntilDue: number
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
  retentionProbability: number
}

// 복습 통계 DTO
export interface ReviewStatistics {
  totalScheduled: number
  dueToday: number
  overdue: number
  completedToday: number
  streakDays: number
  averageRetention: number
  totalTimeSpent: number // 분 단위
}

// 복습 완료 결과 DTO
export interface ReviewCompletionResult {
  scheduleId: string
  previousInterval: number
  newInterval: number
  previousEaseFactor: number
  newEaseFactor: number
  nextReviewAt: Date
  reviewCount: number
}

/**
 * 복습 큐 관리 서비스 (Application Layer)
 * 의존성: Domain Layer만 의존 (Infrastructure 의존 제거)
 * 트랜잭션: Domain Event를 통한 원자성 보장
 */
export class ReviewQueueService {
  constructor(
    private reviewScheduleRepository: IReviewScheduleRepository, // Domain 인터페이스
    private studyRecordRepository: IStudyRecordRepository,       // Domain 인터페이스  
    private spacedRepetitionPolicy: ISpacedRepetitionPolicy,     // Domain 인터페이스
    private clock: IClock                                        // Domain 인터페이스
  ) {}

  /**
   * 오늘의 복습 항목 조회 (우선순위별 정렬)
   * 우선순위: 1) 연체된 항목 2) 마감일이 가까운 항목 3) 어려운 항목
   */
  async getTodayReviews(studentId: UniqueEntityID): Promise<Result<ReviewQueueItem[]>> {
    try {
      const currentDate = this.clock.now()
      
      // 오늘 복습해야 할 항목들 조회
      const schedules = await this.reviewScheduleRepository.findTodayReviews(
        studentId, 
        currentDate
      )

      // DTO로 변환하고 우선순위 계산
      const queueItems = schedules.map(schedule => this.toQueueItem(schedule))

      // 우선순위별 정렬
      const sortedItems = this.sortByPriority(queueItems)

      return Result.ok<ReviewQueueItem[]>(sortedItems)

    } catch (error) {
      return Result.fail<ReviewQueueItem[]>(`Failed to get today reviews: ${error}`)
    }
  }

  /**
   * 지연된 복습 항목 조회
   */
  async getOverdueReviews(studentId: UniqueEntityID): Promise<Result<ReviewQueueItem[]>> {
    try {
      const currentDate = this.clock.now()
      
      const schedules = await this.reviewScheduleRepository.findOverdueReviews(
        studentId,
        currentDate
      )

      const queueItems = schedules
        .map(schedule => this.toQueueItem(schedule))
        .filter(item => item.isOverdue)

      // 연체일이 긴 순서대로 정렬
      const sortedItems = queueItems.sort((a, b) => 
        a.nextReviewAt.getTime() - b.nextReviewAt.getTime()
      )

      return Result.ok<ReviewQueueItem[]>(sortedItems)

    } catch (error) {
      return Result.fail<ReviewQueueItem[]>(`Failed to get overdue reviews: ${error}`)
    }
  }

  /**
   * 복습 완료 처리 - 개선된 버전
   * 트랜잭션 경계: Domain Event를 통한 원자성 보장
   * 
   * 1. ReviewSchedule에 피드백 처리 (Domain Logic + Event 발행)
   * 2. ReviewSchedule 저장 (Event도 함께 저장)
   * 3. Event Handler에서 StudyRecord 생성 (별도 트랜잭션)
   */
  async markReviewCompleted(
    studentId: UniqueEntityID,
    scheduleId: UniqueEntityID,
    feedback: ReviewFeedback,
    responseTime?: number,
    answerContent?: any
  ): Promise<Result<ReviewCompletionResult>> {
    try {
      // 1. 복습 일정 조회
      const schedule = await this.reviewScheduleRepository.findById(scheduleId)
      if (!schedule) {
        return Result.fail<ReviewCompletionResult>('Review schedule not found')
      }

      // 권한 확인
      if (!schedule.studentId.equals(studentId)) {
        return Result.fail<ReviewCompletionResult>('Unauthorized access to review schedule')
      }

      // 2. 이전 상태 백업 (결과 DTO용)
      const previousInterval = schedule.currentInterval
      const previousEaseFactor = schedule.easeFactor

      // 3. 도메인 로직 실행 (이벤트 발행됨)
      const processingResult = schedule.processReviewFeedback(
        feedback,
        this.spacedRepetitionPolicy,
        this.clock,
        { responseTime, answerContent } // StudyRecord 생성 정보
      )

      if (processingResult.isFailure) {
        return Result.fail<ReviewCompletionResult>(processingResult.error)
      }

      // 4. 애그리게이트 저장 (이벤트도 함께 저장됨)
      // ⭐ 이 시점에서 ReviewCompletedEvent가 발행되어
      //    Event Handler가 StudyRecord를 생성할 것
      await this.reviewScheduleRepository.save(schedule)

      // 5. 결과 DTO 생성
      const result: ReviewCompletionResult = {
        scheduleId: scheduleId.toString(),
        previousInterval,
        newInterval: schedule.currentInterval,
        previousEaseFactor,
        newEaseFactor: schedule.easeFactor,
        nextReviewAt: schedule.nextReviewAt,
        reviewCount: schedule.reviewCount
      }

      return Result.ok<ReviewCompletionResult>(result)

    } catch (error) {
      return Result.fail<ReviewCompletionResult>(`Failed to complete review: ${error}`)
    }
  }

  /**
   * 복습 통계 조회
   */
  async getReviewStatistics(studentId: UniqueEntityID): Promise<Result<ReviewStatistics>> {
    try {
      const currentDate = this.clock.now()
      const startOfDay = new Date(currentDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(currentDate)
      endOfDay.setHours(23, 59, 59, 999)

      // 병렬로 통계 데이터 조회
      const [
        totalScheduled,
        dueToday,
        overdue,
        todayRecords,
        recentRecords
      ] = await Promise.all([
        this.reviewScheduleRepository.countByStudent(studentId),
        this.reviewScheduleRepository.countByStudentAndStatus(studentId, 'due'),
        this.reviewScheduleRepository.countByStudentAndStatus(studentId, 'overdue'),
        this.studyRecordRepository.findByDateRange(studentId, startOfDay, endOfDay),
        this.studyRecordRepository.findByStudent(studentId, 200)
      ])

      // 통계 계산
      const completedToday = todayRecords.length
      const streakDays = this.calculateStreakDays(recentRecords, currentDate)
      const averageRetention = this.calculateAverageRetention(recentRecords)
      const totalTimeSpent = this.calculateTotalTimeSpent(todayRecords)

      const statistics: ReviewStatistics = {
        totalScheduled,
        dueToday,
        overdue,
        completedToday,
        streakDays,
        averageRetention,
        totalTimeSpent
      }

      return Result.ok<ReviewStatistics>(statistics)

    } catch (error) {
      return Result.fail<ReviewStatistics>(`Failed to get review statistics: ${error}`)
    }
  }

  /**
   * ReviewSchedule를 ReviewQueueItem DTO로 변환
   */
  private toQueueItem(schedule: ReviewSchedule): ReviewQueueItem {
    const isOverdue = schedule.isOverdue(this.clock)
    const minutesUntilDue = schedule.minutesUntilDue(this.clock)
    const difficultyLevel = schedule.getDifficultyLevel()
    const retentionProbability = schedule.getRetentionProbability(this.clock)

    // 우선순위 계산
    let priority: 'high' | 'medium' | 'low' = 'medium'
    
    if (isOverdue || minutesUntilDue <= 0) {
      priority = 'high'
    } else if (schedule.consecutiveFailures > 0 || difficultyLevel === 'advanced') {
      priority = 'high'
    } else if (minutesUntilDue <= 60) { // 1시간 이내
      priority = 'medium'
    } else {
      priority = 'low'
    }

    return {
      scheduleId: schedule.id.toString(),
      studentId: schedule.studentId.toString(),
      problemId: schedule.problemId.toString(),
      nextReviewAt: schedule.nextReviewAt,
      currentInterval: schedule.currentInterval,
      easeFactor: schedule.easeFactor,
      reviewCount: schedule.reviewCount,
      consecutiveFailures: schedule.consecutiveFailures,
      priority,
      isOverdue,
      minutesUntilDue,
      difficultyLevel,
      retentionProbability
    }
  }

  /**
   * 우선순위별 정렬
   */
  private sortByPriority(items: ReviewQueueItem[]): ReviewQueueItem[] {
    return items.sort((a, b) => {
      // 1. 우선순위 비교
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff

      // 2. 연체 여부 비교
      if (a.isOverdue !== b.isOverdue) {
        return a.isOverdue ? -1 : 1
      }

      // 3. 마감시간 비교 (빠른 순)
      const timeDiff = a.nextReviewAt.getTime() - b.nextReviewAt.getTime()
      if (timeDiff !== 0) return timeDiff

      // 4. 난이도 비교 (어려운 순)
      return a.easeFactor - b.easeFactor
    })
  }

  /**
   * 연속 학습 일수 계산
   */
  private calculateStreakDays(records: StudyRecord[], currentDate: Date): number {
    if (records.length === 0) return 0

    // 날짜별로 그룹화
    const recordsByDate = new Map<string, StudyRecord[]>()
    records.forEach(record => {
      const dateKey = record.createdAt.toDateString()
      if (!recordsByDate.has(dateKey)) {
        recordsByDate.set(dateKey, [])
      }
      recordsByDate.get(dateKey)!.push(record)
    })

    let streakDays = 0
    let checkDate = new Date(currentDate)

    // 오늘부터 역순으로 확인
    while (true) {
      const dateKey = checkDate.toDateString()
      if (recordsByDate.has(dateKey)) {
        streakDays++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    return streakDays
  }

  /**
   * 평균 정답률 계산
   */
  private calculateAverageRetention(records: StudyRecord[]): number {
    if (records.length === 0) return 0

    const recentRecords = records.slice(0, 30) // 최근 30개
    const correctCount = recentRecords.filter(record => record.isCorrect).length
    
    return Math.round((correctCount / recentRecords.length) * 100)
  }

  /**
   * 총 학습 시간 계산 (분 단위)
   */
  private calculateTotalTimeSpent(records: StudyRecord[]): number {
    return records
      .filter(record => record.responseTime)
      .reduce((total, record) => total + (record.responseTime! / 60), 0)
  }
}