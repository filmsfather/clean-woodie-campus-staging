/**
 * 캐싱이 적용된 대시보드 서비스
 * 애플리케이션 레이어에서 캐싱 전략을 구현
 * 도메인 서비스와 인프라 캐시 서비스를 조합
 */

import { Result, Logger } from '@woodie/domain'
import { CacheService, CacheKeys, CacheTTL } from '@woodie/infrastructure'

// 도메인 DTOs (캐시할 데이터 타입들)
export interface StudentDashboardDto {
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
  lastUpdated: string
}

export interface TeacherDashboardDto {
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
  lastUpdated: string
}

export interface StudentStatisticsDto {
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

/**
 * 학생 대시보드 캐싱 서비스
 */
export class CachedStudentDashboardService {
  constructor(
    private cacheService: CacheService,
    private logger: Logger
  ) {}

  /**
   * 학생 대시보드 데이터 조회 (캐시 우선)
   */
  async getStudentDashboard(
    studentId: string,
    forceRefresh: boolean = false
  ): Promise<Result<StudentDashboardDto>> {
    try {
      const cacheKey = CacheKeys.STUDENT_DASHBOARD(studentId)

      // 강제 새로고침이 아닌 경우 캐시 확인
      if (!forceRefresh) {
        const cachedData = await this.cacheService.get<StudentDashboardDto>(cacheKey)
        if (cachedData) {
          this.logger.debug('Student dashboard cache hit', { studentId })
          return Result.ok(cachedData)
        }
      }

      // 캐시 미스 - 실제 데이터 조회 필요
      this.logger.debug('Student dashboard cache miss', { studentId })
      return Result.fail('Cache miss - need to fetch from repository')
      
    } catch (error) {
      this.logger.error('Error getting student dashboard from cache', { studentId, error })
      return Result.fail('Cache error')
    }
  }

  /**
   * 학생 대시보드 데이터 캐싱
   */
  async cacheStudentDashboard(
    dashboard: StudentDashboardDto,
    ttlSeconds: number = CacheTTL.MEDIUM
  ): Promise<boolean> {
    try {
      const cacheKey = CacheKeys.STUDENT_DASHBOARD(dashboard.studentId)
      const success = await this.cacheService.set(cacheKey, dashboard, ttlSeconds)
      
      if (success) {
        this.logger.debug('Student dashboard cached', { 
          studentId: dashboard.studentId,
          ttl: ttlSeconds 
        })
      }
      
      return success
    } catch (error) {
      this.logger.error('Error caching student dashboard', { 
        studentId: dashboard.studentId, 
        error 
      })
      return false
    }
  }

  /**
   * 학생 대시보드 캐시 무효화
   */
  async invalidateStudentDashboard(studentId: string): Promise<boolean> {
    try {
      const cacheKey = CacheKeys.STUDENT_DASHBOARD(studentId)
      const success = await this.cacheService.del(cacheKey)
      
      if (success) {
        this.logger.debug('Student dashboard cache invalidated', { studentId })
      }
      
      return success
    } catch (error) {
      this.logger.error('Error invalidating student dashboard cache', { 
        studentId, 
        error 
      })
      return false
    }
  }
}

/**
 * 교사 대시보드 캐싱 서비스
 */
export class CachedTeacherDashboardService {
  constructor(
    private cacheService: CacheService,
    private logger: Logger
  ) {}

  /**
   * 교사 대시보드 데이터 조회 (캐시 우선)
   */
  async getTeacherDashboard(
    teacherId: string,
    forceRefresh: boolean = false
  ): Promise<Result<TeacherDashboardDto>> {
    try {
      const cacheKey = CacheKeys.TEACHER_DASHBOARD(teacherId)

      if (!forceRefresh) {
        const cachedData = await this.cacheService.get<TeacherDashboardDto>(cacheKey)
        if (cachedData) {
          this.logger.debug('Teacher dashboard cache hit', { teacherId })
          return Result.ok(cachedData)
        }
      }

      this.logger.debug('Teacher dashboard cache miss', { teacherId })
      return Result.fail('Cache miss - need to fetch from repository')
      
    } catch (error) {
      this.logger.error('Error getting teacher dashboard from cache', { teacherId, error })
      return Result.fail('Cache error')
    }
  }

  /**
   * 교사 대시보드 데이터 캐싱
   */
  async cacheTeacherDashboard(
    dashboard: TeacherDashboardDto,
    ttlSeconds: number = CacheTTL.MEDIUM
  ): Promise<boolean> {
    try {
      const cacheKey = CacheKeys.TEACHER_DASHBOARD(dashboard.teacherId)
      const success = await this.cacheService.set(cacheKey, dashboard, ttlSeconds)
      
      if (success) {
        this.logger.debug('Teacher dashboard cached', { 
          teacherId: dashboard.teacherId,
          ttl: ttlSeconds 
        })
      }
      
      return success
    } catch (error) {
      this.logger.error('Error caching teacher dashboard', { 
        teacherId: dashboard.teacherId, 
        error 
      })
      return false
    }
  }

  /**
   * 교사 대시보드 캐시 무효화
   */
  async invalidateTeacherDashboard(teacherId: string): Promise<boolean> {
    try {
      const cacheKey = CacheKeys.TEACHER_DASHBOARD(teacherId)
      const success = await this.cacheService.del(cacheKey)
      
      if (success) {
        this.logger.debug('Teacher dashboard cache invalidated', { teacherId })
      }
      
      return success
    } catch (error) {
      this.logger.error('Error invalidating teacher dashboard cache', { 
        teacherId, 
        error 
      })
      return false
    }
  }
}

/**
 * 통계 데이터 캐싱 서비스
 */
export class CachedStatisticsService {
  constructor(
    private cacheService: CacheService,
    private logger: Logger
  ) {}

  /**
   * 학생 통계 데이터 조회 (캐시 우선)
   */
  async getStudentStatistics(
    studentId: string,
    period: 'day' | 'week' | 'month',
    forceRefresh: boolean = false
  ): Promise<Result<StudentStatisticsDto>> {
    try {
      const cacheKey = CacheKeys.STUDENT_STATS(studentId, period)

      if (!forceRefresh) {
        const cachedData = await this.cacheService.get<StudentStatisticsDto>(cacheKey)
        if (cachedData) {
          this.logger.debug('Student statistics cache hit', { studentId, period })
          return Result.ok(cachedData)
        }
      }

      this.logger.debug('Student statistics cache miss', { studentId, period })
      return Result.fail('Cache miss - need to fetch from repository')
      
    } catch (error) {
      this.logger.error('Error getting student statistics from cache', { 
        studentId, 
        period, 
        error 
      })
      return Result.fail('Cache error')
    }
  }

  /**
   * 학생 통계 데이터 캐싱
   */
  async cacheStudentStatistics(
    statistics: StudentStatisticsDto,
    ttlSeconds: number = CacheTTL.LONG
  ): Promise<boolean> {
    try {
      const cacheKey = CacheKeys.STUDENT_STATS(statistics.studentId, statistics.period)
      const success = await this.cacheService.set(cacheKey, statistics, ttlSeconds)
      
      if (success) {
        this.logger.debug('Student statistics cached', { 
          studentId: statistics.studentId,
          period: statistics.period,
          ttl: ttlSeconds 
        })
      }
      
      return success
    } catch (error) {
      this.logger.error('Error caching student statistics', { 
        studentId: statistics.studentId,
        period: statistics.period,
        error 
      })
      return false
    }
  }

  /**
   * 학생 통계 캐시 무효화 (모든 기간)
   */
  async invalidateStudentStatistics(studentId: string): Promise<number> {
    try {
      const pattern = CacheKeys.STUDENT_STATS(studentId, '*')
      const deletedCount = await this.cacheService.invalidatePattern(pattern)
      
      this.logger.debug('Student statistics cache invalidated', { 
        studentId, 
        deletedKeys: deletedCount 
      })
      
      return deletedCount
    } catch (error) {
      this.logger.error('Error invalidating student statistics cache', { 
        studentId, 
        error 
      })
      return 0
    }
  }
}