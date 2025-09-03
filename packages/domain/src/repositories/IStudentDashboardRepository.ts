/**
 * 학생 대시보드 리포지토리 인터페이스
 * 도메인 레이어의 순수한 비즈니스 계약
 * 캐싱, 데이터베이스 등 기술적 세부사항은 전혀 모름
 */

import { Result } from '../common/Result'

// 도메인 엔티티/DTO 임포트가 필요하지만, 
// 현재는 애플리케이션 레이어에서 정의한 DTO를 사용
// 실제로는 도메인 모델을 사용해야 함

export interface StudentDashboardData {
  studentId: string
  todayTasks: Array<{
    problemId: string
    title: string
    difficulty: string
    estimatedTime: number
  }>
  reviewCount: number
  currentStreak: number
  longestStreak: number
  progressData: Array<{
    date: string
    problemsSolved: number
    timeSpent: number
  }>
  upcomingDeadlines: Array<{
    title: string
    dueDate: string
    type: 'assignment' | 'review'
  }>
}

/**
 * 학생 대시보드 데이터 조회를 위한 리포지토리 인터페이스
 * 구현체는 인프라스트럭처 레이어에서 제공
 * 캐싱 여부, 데이터베이스 종류 등은 알 필요 없음
 */
export interface IStudentDashboardRepository {
  /**
   * 학생의 대시보드 데이터 조회
   * @param studentId 학생 ID
   * @returns 학생 대시보드 데이터 또는 실패
   */
  getDashboardData(studentId: string): Promise<Result<StudentDashboardData>>

  /**
   * 교사의 대시보드 데이터 조회
   * @param teacherId 교사 ID
   * @returns 교사 대시보드 데이터 또는 실패
   */
  getTeacherDashboardData(teacherId: string): Promise<Result<TeacherDashboardData>>
}

export interface TeacherDashboardData {
  teacherId: string
  totalStudents: number
  activeStudents: number
  totalProblems: number
  recentActivity: Array<{
    studentName: string
    action: string
    timestamp: string
  }>
  problemSetStats: Array<{
    title: string
    completionRate: number
    averageScore: number
  }>
}

/**
 * 통계 데이터 조회를 위한 리포지토리 인터페이스
 */
export interface IStatisticsRepository {
  /**
   * 학생 통계 데이터 조회
   * @param studentId 학생 ID
   * @param period 조회 기간
   * @returns 학생 통계 데이터 또는 실패
   */
  getStudentStatistics(
    studentId: string, 
    period: 'day' | 'week' | 'month'
  ): Promise<Result<StudentStatisticsData>>
}

export interface StudentStatisticsData {
  studentId: string
  period: 'day' | 'week' | 'month'
  problemsAttempted: number
  problemsSolved: number
  totalTimeSpent: number
  averageAccuracy: number
  streakData: {
    current: number
    longest: number
    weeklyData: number[]
  }
  difficultyBreakdown: {
    easy: { attempted: number; solved: number }
    medium: { attempted: number; solved: number }
    hard: { attempted: number; solved: number }
  }
}