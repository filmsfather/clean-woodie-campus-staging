import { UniqueEntityID } from '../../common/Identifier'
import { Result } from '../../common/Result'
import { ReviewSchedule } from '../entities/ReviewSchedule'

/**
 * SRS (Spaced Repetition System) 도메인 서비스 인터페이스
 */
export interface ISrsService {
  /**
   * 학생의 오늘 복습할 카드들 조회
   */
  getTodayReviews(studentId: UniqueEntityID): Promise<Result<ReviewSchedule[]>>

  /**
   * 학생의 지연된 복습 카드들 조회
   */
  getOverdueReviews(studentId: UniqueEntityID): Promise<Result<ReviewSchedule[]>>

  /**
   * 학생의 복습 통계 조회
   */
  getStudentReviewStats(studentId: UniqueEntityID): Promise<Result<{
    totalCards: number
    dueToday: number
    overdue: number
    completedToday: number
    averageEaseFactor: number
    longestStreak: number
  }>>

  /**
   * 문제별 복습 성과 조회
   */
  getProblemReviewPerformance(problemId: UniqueEntityID): Promise<Result<{
    totalReviews: number
    averagePerformance: number
    difficultyTrend: 'improving' | 'stable' | 'declining'
    averageInterval: number
  }>>
}