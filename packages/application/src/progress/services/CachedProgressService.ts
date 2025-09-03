import { IStudyStreakRepository } from '@woodie/domain/progress/repositories/IStudyStreakRepository'
import { IStatisticsRepository } from '@woodie/domain/progress/repositories/IStatisticsRepository'
import { ICacheService } from '@woodie/infrastructure/cache/ICacheService'
import { CacheKeys, CacheTTL } from '@woodie/infrastructure/cache/CacheService'
import { StudyStreak } from '@woodie/domain/progress/entities/StudyStreak'
import { Statistics } from '@woodie/domain/progress/entities/Statistics'
import { UniqueEntityID } from '@woodie/domain/common/Identifier'
import { Result } from '@woodie/domain/common/Result'

/**
 * 진도 추적 서비스 인터페이스
 */
export interface IProgressService {
  getStudentStreak(studentId: UniqueEntityID): Promise<Result<StudyStreak | null>>
  getStudentStatistics(studentId: UniqueEntityID, problemSetId?: UniqueEntityID): Promise<Result<Statistics[]>>
  getTopStreaks(limit?: number): Promise<Result<StudyStreak[]>>
  getAtRiskStudents(): Promise<Result<StudyStreak[]>>
  recordStudyActivity(studentId: UniqueEntityID, studyDate?: Date): Promise<Result<void>>
  getClassProgress(classId: string): Promise<Result<any>>
}

/**
 * 캐싱이 적용된 진도 추적 서비스
 * 학습 스트릭과 통계 정보에 대한 캐싱 전략을 구현
 */
export class CachedProgressService implements IProgressService {
  constructor(
    private readonly studyStreakRepository: IStudyStreakRepository,
    private readonly statisticsRepository: IStatisticsRepository,
    private readonly cacheService: ICacheService
  ) {}

  /**
   * 학생의 학습 스트릭 조회 (캐싱 적용)
   */
  async getStudentStreak(studentId: UniqueEntityID): Promise<Result<StudyStreak | null>> {
    const cacheKey = CacheKeys.STUDENT_STREAK(studentId.toString())
    
    try {
      // 1. 캐시에서 먼저 조회
      const cachedStreak = await this.cacheService.get<any>(cacheKey)
      if (cachedStreak) {
        return Result.ok(
          StudyStreak.reconstitute(cachedStreak, new UniqueEntityID(cachedStreak.id))
        )
      }

      // 2. 캐시 미스 시 DB에서 조회
      const streakResult = await this.studyStreakRepository.findByStudentId(studentId)
      if (streakResult.isFailure) {
        return Result.fail(streakResult.error)
      }

      const streak = streakResult.value

      // 3. 캐시에 저장 (15분간 유지 - 스트릭은 자주 변경됨)
      if (streak) {
        await this.cacheService.set(cacheKey, streak, CacheTTL.MEDIUM)
      }
      
      return Result.ok(streak)

    } catch (error) {
      return Result.fail(`학생 스트릭 조회 실패: ${error}`)
    }
  }

  /**
   * 학생의 학습 통계 조회 (캐싱 적용)
   */
  async getStudentStatistics(
    studentId: UniqueEntityID, 
    problemSetId?: UniqueEntityID
  ): Promise<Result<Statistics[]>> {
    const cacheKey = problemSetId 
      ? CacheKeys.STUDENT_PROBLEM_SET_STATS(studentId.toString(), problemSetId.toString())
      : CacheKeys.STUDENT_ALL_STATS(studentId.toString())
    
    try {
      // 1. 캐시에서 먼저 조회
      const cachedStats = await this.cacheService.get<any[]>(cacheKey)
      if (cachedStats) {
        return Result.ok(
          cachedStats.map(data => 
            Statistics.reconstitute(data, new UniqueEntityID(data.id))
          )
        )
      }

      // 2. 캐시 미스 시 DB에서 조회
      const statsResult = problemSetId
        ? await this.statisticsRepository.findByStudentAndProblemSet(studentId, problemSetId)
        : await this.statisticsRepository.findByStudent(studentId)

      if (statsResult.isFailure) {
        return Result.fail(statsResult.error)
      }

      const statistics = statsResult.value

      // 3. 캐시에 저장 (30분간 유지 - 통계는 상대적으로 안정적)
      await this.cacheService.set(cacheKey, statistics, CacheTTL.LONG)
      
      return Result.ok(statistics)

    } catch (error) {
      return Result.fail(`학생 통계 조회 실패: ${error}`)
    }
  }

  /**
   * 상위 스트릭 순위 조회 (캐싱 적용)
   */
  async getTopStreaks(limit: number = 10): Promise<Result<StudyStreak[]>> {
    const cacheKey = CacheKeys.TOP_STREAKS(limit)
    
    try {
      // 1. 캐시에서 먼저 조회
      const cachedStreaks = await this.cacheService.get<any[]>(cacheKey)
      if (cachedStreaks) {
        return Result.ok(
          cachedStreaks.map(data => 
            StudyStreak.reconstitute(data, new UniqueEntityID(data.id))
          )
        )
      }

      // 2. 캐시 미스 시 DB에서 조회
      const streaksResult = await this.studyStreakRepository.findTopStreaks(limit)
      if (streaksResult.isFailure) {
        return Result.fail(streaksResult.error)
      }

      const streaks = streaksResult.value

      // 3. 캐시에 저장 (10분간 유지 - 순위는 자주 변경될 수 있음)
      await this.cacheService.set(cacheKey, streaks, 600) // 10분
      
      return Result.ok(streaks)

    } catch (error) {
      return Result.fail(`상위 스트릭 조회 실패: ${error}`)
    }
  }

  /**
   * 스트릭이 위험한 학생들 조회 (캐싱 적용)
   */
  async getAtRiskStudents(): Promise<Result<StudyStreak[]>> {
    const cacheKey = CacheKeys.AT_RISK_STUDENTS()
    
    try {
      // 1. 캐시에서 먼저 조회
      const cachedAtRisk = await this.cacheService.get<any[]>(cacheKey)
      if (cachedAtRisk) {
        return Result.ok(
          cachedAtRisk.map(data => 
            StudyStreak.reconstitute(data, new UniqueEntityID(data.id))
          )
        )
      }

      // 2. 캐시 미스 시 DB에서 조회
      const atRiskResult = await this.studyStreakRepository.findAtRiskStreaks()
      if (atRiskResult.isFailure) {
        return Result.fail(atRiskResult.error)
      }

      const atRiskStudents = atRiskResult.value

      // 3. 캐시에 저장 (5분간 유지 - 위험 상태는 시간에 민감)
      await this.cacheService.set(cacheKey, atRiskStudents, CacheTTL.SHORT)
      
      return Result.ok(atRiskStudents)

    } catch (error) {
      return Result.fail(`위험 학생 조회 실패: ${error}`)
    }
  }

  /**
   * 학습 활동 기록 (캐시 무효화 적용)
   */
  async recordStudyActivity(studentId: UniqueEntityID, studyDate?: Date): Promise<Result<void>> {
    try {
      // 1. 기존 스트릭 조회
      const streakResult = await this.studyStreakRepository.findByStudentId(studentId)
      if (streakResult.isFailure) {
        return Result.fail(`스트릭 조회 실패: ${streakResult.error}`)
      }

      let streak = streakResult.value
      const date = studyDate || new Date()

      // 2. 스트릭이 없으면 새로 생성
      if (!streak) {
        const createResult = StudyStreak.create({
          studentId,
          currentStreak: 0,
          longestStreak: 0,
          lastStudyDate: date
        })

        if (createResult.isFailure) {
          return Result.fail(`스트릭 생성 실패: ${createResult.error}`)
        }

        streak = createResult.value
      }

      // 3. 학습 활동 기록
      streak.recordStudy(date)

      // 4. 스트릭 저장
      const saveResult = await this.studyStreakRepository.save(streak)
      if (saveResult.isFailure) {
        return Result.fail(`스트릭 저장 실패: ${saveResult.error}`)
      }

      // 5. 관련 캐시 무효화
      await this.invalidateProgressCache(studentId)

      return Result.ok()

    } catch (error) {
      return Result.fail(`학습 활동 기록 실패: ${error}`)
    }
  }

  /**
   * 클래스 진도 현황 조회 (캐싱 적용)
   */
  async getClassProgress(classId: string): Promise<Result<any>> {
    const cacheKey = CacheKeys.CLASS_PROGRESS(classId)
    
    try {
      // 1. 캐시에서 먼저 조회
      const cachedProgress = await this.cacheService.get<any>(cacheKey)
      if (cachedProgress) {
        return Result.ok(cachedProgress)
      }

      // 2. 캐시 미스 시 DB에서 조회 (집계 테이블 활용)
      const classStreaksResult = await this.studyStreakRepository.findByClassId(classId)
      if (classStreaksResult.isFailure) {
        return Result.fail(classStreaksResult.error)
      }

      const classStreaks = classStreaksResult.value

      // 클래스 진도 요약 계산
      const totalStudents = classStreaks.length
      const activeStreaks = classStreaks.filter(streak => streak.isActiveStreak()).length
      const atRiskStudents = classStreaks.filter(streak => streak.isAtRisk()).length
      const avgCurrentStreak = totalStudents > 0
        ? classStreaks.reduce((sum, streak) => sum + streak.currentStreak, 0) / totalStudents
        : 0
      const maxCurrentStreak = Math.max(...classStreaks.map(streak => streak.currentStreak), 0)

      const progress = {
        classId,
        totalStudents,
        studentsWithActiveStreak: activeStreaks,
        studentsAtRisk: atRiskStudents,
        avgCurrentStreak: Math.round(avgCurrentStreak * 100) / 100,
        maxCurrentStreak,
        streakDistribution: {
          noStreak: classStreaks.filter(s => s.currentStreak === 0).length,
          shortStreak: classStreaks.filter(s => s.currentStreak >= 1 && s.currentStreak <= 6).length,
          weeklyStreak: classStreaks.filter(s => s.currentStreak >= 7 && s.currentStreak <= 13).length,
          longStreak: classStreaks.filter(s => s.currentStreak >= 14).length
        },
        lastUpdated: new Date().toISOString()
      }

      // 3. 캐시에 저장 (20분간 유지)
      await this.cacheService.set(cacheKey, progress, 1200) // 20분
      
      return Result.ok(progress)

    } catch (error) {
      return Result.fail(`클래스 진도 조회 실패: ${error}`)
    }
  }

  /**
   * 학생의 진도 관련 캐시 무효화
   */
  private async invalidateProgressCache(studentId: UniqueEntityID): Promise<void> {
    const studentIdStr = studentId.toString()
    
    // 학생 관련 진도 캐시들 삭제
    await Promise.all([
      this.cacheService.del(CacheKeys.STUDENT_STREAK(studentIdStr)),
      this.cacheService.del(CacheKeys.STUDENT_ALL_STATS(studentIdStr)),
      this.cacheService.invalidatePattern(`progress:student:${studentIdStr}:*`),
      // 전체 순위와 위험 학생 목록도 무효화 (해당 학생의 변경이 영향을 줄 수 있음)
      this.cacheService.invalidatePattern('progress:top_streaks:*'),
      this.cacheService.del(CacheKeys.AT_RISK_STUDENTS()),
      // 학생 대시보드도 무효화
      this.cacheService.del(CacheKeys.STUDENT_DASHBOARD(studentIdStr))
    ])
  }

  /**
   * 전체 진도 통계 조회 (집계 테이블 활용)
   */
  async getSystemProgressStats(): Promise<Result<{
    totalActiveStudents: number
    totalStreaks: number
    avgStreakLength: number
    studentsStudiedToday: number
    studentsAtRisk: number
  }>> {
    const cacheKey = 'progress:system_stats'
    
    try {
      // 1. 캐시에서 먼저 조회
      const cachedStats = await this.cacheService.get<any>(cacheKey)
      if (cachedStats) {
        return Result.ok(cachedStats)
      }

      // 2. 집계 테이블에서 조회 (오늘 날짜 기준)
      // 실제로는 aggregates.system_stats 테이블에서 조회
      const activeStreaksResult = await this.studyStreakRepository.findActiveStreaks()
      if (activeStreaksResult.isFailure) {
        return Result.fail(activeStreaksResult.error)
      }

      const activeStreaks = activeStreaksResult.value
      const atRiskResult = await this.getAtRiskStudents()
      if (atRiskResult.isFailure) {
        return Result.fail(atRiskResult.error)
      }

      const atRiskStudents = atRiskResult.value

      // 오늘 학습한 학생 수 계산
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const studentsStudiedToday = activeStreaks.filter(streak => {
        const lastStudyDate = new Date(streak.lastStudyDate)
        lastStudyDate.setHours(0, 0, 0, 0)
        return lastStudyDate.getTime() === today.getTime()
      }).length

      const stats = {
        totalActiveStudents: activeStreaks.length,
        totalStreaks: activeStreaks.filter(streak => streak.currentStreak > 0).length,
        avgStreakLength: activeStreaks.length > 0
          ? activeStreaks.reduce((sum, streak) => sum + streak.currentStreak, 0) / activeStreaks.length
          : 0,
        studentsStudiedToday,
        studentsAtRisk: atRiskStudents.length
      }

      // 3. 캐시에 저장 (15분간 유지)
      await this.cacheService.set(cacheKey, stats, CacheTTL.MEDIUM)
      
      return Result.ok(stats)

    } catch (error) {
      return Result.fail(`시스템 진도 통계 조회 실패: ${error}`)
    }
  }
}