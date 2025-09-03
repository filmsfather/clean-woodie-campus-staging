import { IProblemRepository, ProblemBankOptions } from '@woodie/domain/problems/repositories/IProblemRepository'
import { ICacheService, CacheKeyBuilder, CacheStrategies } from '../../common/interfaces/ICacheService'
import { CacheKeys, CacheTTL } from '../../common/constants/CacheConstants'
import { Problem } from '@woodie/domain/problems/entities/Problem'
import { UniqueEntityID } from '@woodie/domain/common/Identifier'
import { Result } from '@woodie/domain/common/Result'
import { ProblemType } from '@woodie/domain/problems/value-objects/ProblemType'
import { Difficulty } from '@woodie/domain/problems/value-objects/Difficulty'
import { Tag } from '@woodie/domain/problems/value-objects/Tag'

/**
 * 문제 서비스 인터페이스
 */
export interface IProblemService {
  getProblemById(id: UniqueEntityID): Promise<Result<Problem | null>>
  getProblemsByTeacher(teacherId: UniqueEntityID, filters?: ProblemFilters): Promise<Result<Problem[]>>
  searchProblems(query: string, filters?: ProblemFilters): Promise<Result<Problem[]>>
  getProblemsByTags(tags: Tag[], filters?: ProblemFilters): Promise<Result<Problem[]>>
  getPopularProblems(limit?: number): Promise<Result<Problem[]>>
  getProblemStatistics(problemId: UniqueEntityID): Promise<Result<ProblemStats>>
  createProblem(problemData: CreateProblemData): Promise<Result<Problem>>
  updateProblem(problemId: UniqueEntityID, updates: UpdateProblemData): Promise<Result<Problem>>
}

/**
 * 문제 필터링 옵션
 */
export interface ProblemFilters {
  type?: ProblemType
  difficulty?: Difficulty
  tags?: Tag[]
  isActive?: boolean
  createdAfter?: Date
  createdBefore?: Date
}

/**
 * 문제 생성 데이터
 */
export interface CreateProblemData {
  teacherId: UniqueEntityID
  content: any
  correctAnswer: any
  type: ProblemType
  difficulty: Difficulty
  tags?: Tag[]
}

/**
 * 문제 업데이트 데이터
 */
export interface UpdateProblemData {
  content?: any
  correctAnswer?: any
  difficulty?: Difficulty
  tags?: Tag[]
  isActive?: boolean
}

/**
 * 문제 통계
 */
export interface ProblemStats {
  totalAttempts: number
  correctAttempts: number
  accuracyRate: number
  avgResponseTime: number
  uniqueStudents: number
  popularityScore: number
  lastAttempted?: Date
}

/**
 * 캐싱이 적용된 문제 관리 서비스
 * 문제 조회, 검색, 통계에 대한 캐싱 전략을 구현
 */
export class CachedProblemService implements IProblemService {
  constructor(
    private readonly problemRepository: IProblemRepository,
    private readonly cacheService: ICacheService
  ) {}

  /**
   * ID로 문제 조회 (캐싱 적용)
   */
  async getProblemById(id: UniqueEntityID): Promise<Result<Problem | null>> {
    const cacheKey = CacheKeys.PROBLEM_DETAIL(id.toString())
    
    try {
      // 1. 캐시에서 먼저 조회
      const cachedProblem = await this.cacheService.get<any>(cacheKey)
      if (cachedProblem) {
        const reconstitutedResult = Problem.reconstitute(cachedProblem)
        if (reconstitutedResult.isFailure) {
          return Result.fail(reconstitutedResult.error)
        }
        return Result.ok(reconstitutedResult.value)
      }

      // 2. 캐시 미스 시 DB에서 조회
      const problemResult = await this.problemRepository.findById(id)
      if (problemResult.isFailure) {
        return Result.fail(problemResult.error)
      }

      const problem = problemResult.value

      // 3. 캐시에 저장 (1시간 유지 - 문제는 자주 변경되지 않음)
      if (problem) {
        await this.cacheService.set(cacheKey, problem, { ttl: CacheTTL.EXTRA_LONG })
      }
      
      return Result.ok(problem)

    } catch (error) {
      return Result.fail(`문제 조회 실패: ${error}`)
    }
  }

  /**
   * 교사별 문제 조회 (캐싱 적용)
   */
  async getProblemsByTeacher(
    teacherId: UniqueEntityID, 
    filters?: ProblemFilters
  ): Promise<Result<Problem[]>> {
    const cacheKey = CacheKeys.TEACHER_PROBLEMS(teacherId.toString(), this.serializeFilters(filters))
    
    try {
      // 1. 캐시에서 먼저 조회
      const cachedProblems = await this.cacheService.get<any[]>(cacheKey)
      if (cachedProblems) {
        const problems: Problem[] = []
        for (const data of cachedProblems) {
          const reconstitutedResult = Problem.reconstitute(data)
          if (reconstitutedResult.isSuccess) {
            problems.push(reconstitutedResult.value)
          }
        }
        return Result.ok(problems)
      }

      // 2. 캐시 미스 시 DB에서 조회
      // Convert filters to ProblemBankOptions if needed
      const options: ProblemBankOptions | undefined = filters ? {
        includeInactive: true,
        includeStatistics: false
      } : undefined
      const problemsResult = await this.problemRepository.findByTeacherId(teacherId.toString(), options)
      if (problemsResult.isFailure) {
        return Result.fail(problemsResult.error)
      }

      const problems = problemsResult.value

      // 3. 캐시에 저장 (30분 유지)
      await this.cacheService.set(cacheKey, problems, { ttl: CacheTTL.LONG })
      
      return Result.ok(problems)

    } catch (error) {
      return Result.fail(`교사별 문제 조회 실패: ${error}`)
    }
  }

  /**
   * 문제 검색 (캐싱 적용)
   */
  async searchProblems(query: string, filters?: ProblemFilters): Promise<Result<Problem[]>> {
    // 검색은 결과가 자주 변할 수 있으므로 짧은 캐시 시간 적용
    const cacheKey = CacheKeys.PROBLEM_SEARCH(query, this.serializeFilters(filters))
    
    try {
      // 1. 캐시에서 먼저 조회
      const cachedResults = await this.cacheService.get<any[]>(cacheKey)
      if (cachedResults) {
        const problems: Problem[] = []
        for (const data of cachedResults) {
          const reconstitutedResult = Problem.reconstitute(data)
          if (reconstitutedResult.isSuccess) {
            problems.push(reconstitutedResult.value)
          }
        }
        return Result.ok(problems)
      }

      // 2. 캐시 미스 시 DB에서 검색
      const searchResult = await this.problemRepository.search(query, filters)
      if (searchResult.isFailure) {
        return Result.fail(searchResult.error)
      }

      const problems = searchResult.value

      // 3. 캐시에 저장 (10분 유지 - 검색 결과는 상대적으로 짧게)
      await this.cacheService.set(cacheKey, problems, { ttl: 600 }) // 10분
      
      return Result.ok(problems)

    } catch (error) {
      return Result.fail(`문제 검색 실패: ${error}`)
    }
  }

  /**
   * 태그별 문제 조회 (캐싱 적용)
   */
  async getProblemsByTags(tags: Tag[], filters?: ProblemFilters): Promise<Result<Problem[]>> {
    const tagNames = tags.map(tag => tag.value).sort() // 정렬로 일관된 캐시 키 생성
    const cacheKey = CacheKeys.PROBLEMS_BY_TAGS(tagNames, this.serializeFilters(filters))
    
    try {
      // 1. 캐시에서 먼저 조회
      const cachedProblems = await this.cacheService.get<any[]>(cacheKey)
      if (cachedProblems) {
        const problems: Problem[] = []
        for (const data of cachedProblems) {
          const reconstitutedResult = Problem.reconstitute(data)
          if (reconstitutedResult.isSuccess) {
            problems.push(reconstitutedResult.value)
          }
        }
        return Result.ok(problems)
      }

      // 2. 캐시 미스 시 DB에서 조회
      const tagNames = tags.map(tag => tag.value)
      const problemsResult = await this.problemRepository.findByTags(tagNames, 'unknown')
      if (problemsResult.isFailure) {
        return Result.fail(problemsResult.error)
      }

      const problems = problemsResult.value

      // 3. 캐시에 저장 (20분 유지)
      await this.cacheService.set(cacheKey, problems, { ttl: 1200 }) // 20분
      
      return Result.ok(problems)

    } catch (error) {
      return Result.fail(`태그별 문제 조회 실패: ${error}`)
    }
  }

  /**
   * 인기 문제 조회 (캐싱 적용)
   */
  async getPopularProblems(limit: number = 20): Promise<Result<Problem[]>> {
    const cacheKey = CacheKeys.POPULAR_PROBLEMS(limit)
    
    try {
      // 1. 캐시에서 먼저 조회
      const cachedProblems = await this.cacheService.get<any[]>(cacheKey)
      if (cachedProblems) {
        const problems: Problem[] = []
        for (const data of cachedProblems) {
          const reconstitutedResult = Problem.reconstitute(data)
          if (reconstitutedResult.isSuccess) {
            problems.push(reconstitutedResult.value)
          }
        }
        return Result.ok(problems)
      }

      // 2. 캐시 미스 시 DB에서 조회 (집계 테이블 활용 가능)
      const popularResult = await this.problemRepository.findPopular(limit)
      if (popularResult.isFailure) {
        return Result.fail(popularResult.error)
      }

      const problems = popularResult.value

      // 3. 캐시에 저장 (15분 유지 - 인기도는 상대적으로 자주 변경)
      await this.cacheService.set(cacheKey, problems, { ttl: CacheTTL.MEDIUM })
      
      return Result.ok(problems)

    } catch (error) {
      return Result.fail(`인기 문제 조회 실패: ${error}`)
    }
  }

  /**
   * 문제 통계 조회 (캐싱 적용)
   */
  async getProblemStatistics(problemId: UniqueEntityID): Promise<Result<ProblemStats>> {
    const cacheKey = CacheKeys.PROBLEM_STATS(problemId.toString())
    
    try {
      // 1. 캐시에서 먼저 조회
      const cachedStats = await this.cacheService.get<ProblemStats>(cacheKey)
      if (cachedStats) {
        return Result.ok(cachedStats)
      }

      // 2. 캐시 미스 시 실제 통계 계산 (문제별 통계)
      // TODO: 실제 학습 기록을 기반으로 ProblemStats 계산하는 로직 구현 필요
      const stats: ProblemStats = {
        totalAttempts: 0,
        correctAttempts: 0,
        accuracyRate: 0,
        avgResponseTime: 0,
        uniqueStudents: 0,
        popularityScore: 0,
        lastAttempted: undefined
      }

      // 3. 캐시에 저장 (20분 유지)
      await this.cacheService.set(cacheKey, stats, { ttl: 1200 }) // 20분
      
      return Result.ok(stats)

    } catch (error) {
      return Result.fail(`문제 통계 조회 실패: ${error}`)
    }
  }

  /**
   * 문제 생성 (캐시 무효화)
   */
  async createProblem(problemData: CreateProblemData): Promise<Result<Problem>> {
    try {
      // 1. CreateProblemData를 Problem 엔티티로 변환
      const problemEntityResult = Problem.create({
        teacherId: problemData.teacherId.toString(),
        content: problemData.content,
        correctAnswer: problemData.correctAnswer,
        difficulty: problemData.difficulty,
        tags: problemData.tags || []
      })
      
      if (problemEntityResult.isFailure) {
        return Result.fail(problemEntityResult.error)
      }
      
      // 2. 문제 생성
      const problemResult = await this.problemRepository.create(problemEntityResult.value)
      if (problemResult.isFailure) {
        return Result.fail(problemResult.error)
      }

      const problem = problemResult.value

      // 2. 관련 캐시 무효화
      await this.invalidateTeacherProblemCaches(problemData.teacherId)
      await this.invalidateTagCaches(problemData.tags)

      return Result.ok(problem)

    } catch (error) {
      return Result.fail(`문제 생성 실패: ${error}`)
    }
  }

  /**
   * 문제 업데이트 (캐시 무효화)
   */
  async updateProblem(
    problemId: UniqueEntityID, 
    updates: UpdateProblemData
  ): Promise<Result<Problem>> {
    try {
      // 1. 기존 문제 조회 (캐시 무효화를 위해)
      const existingProblem = await this.problemRepository.findById(problemId)
      if (existingProblem.isFailure || !existingProblem.value) {
        return Result.fail('업데이트할 문제를 찾을 수 없습니다')
      }

      // 2. 문제 업데이트 - Problem 엔티티의 업데이트 메서드 사용
      const problemToUpdate = existingProblem.value
      
      // 각 필드를 적절한 도메인 메서드로 업데이트
      if (updates.content) {
        const contentUpdateResult = problemToUpdate.updateContent(updates.content)
        if (contentUpdateResult.isFailure) {
          return Result.fail(contentUpdateResult.error)
        }
      }
      
      if (updates.correctAnswer) {
        const answerUpdateResult = problemToUpdate.updateCorrectAnswer(updates.correctAnswer)
        if (answerUpdateResult.isFailure) {
          return Result.fail(answerUpdateResult.error)
        }
      }
      
      if (updates.difficulty) {
        const difficultyUpdateResult = problemToUpdate.changeDifficulty(updates.difficulty)
        if (difficultyUpdateResult.isFailure) {
          return Result.fail(difficultyUpdateResult.error)
        }
      }
      
      if (updates.isActive !== undefined) {
        const activeUpdateResult = updates.isActive 
          ? problemToUpdate.activate() 
          : problemToUpdate.deactivate()
        if (activeUpdateResult.isFailure) {
          return Result.fail(activeUpdateResult.error)
        }
      }
      
      const updateResult = await this.problemRepository.update(problemToUpdate)
      if (updateResult.isFailure) {
        return Result.fail(updateResult.error)
      }

      const updatedProblem = updateResult.value

      // 3. 관련 캐시 무효화
      await this.invalidateProblemCaches(problemId, existingProblem.value, updates)

      return Result.ok(updatedProblem)

    } catch (error) {
      return Result.fail(`문제 업데이트 실패: ${error}`)
    }
  }

  /**
   * 필터를 문자열로 직렬화 (캐시 키 생성용)
   */
  private serializeFilters(filters?: ProblemFilters): string {
    if (!filters) return 'no_filters'
    
    const filterEntries = Object.entries(filters)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}:${value.map(v => v.toString()).sort().join(',')}`
        }
        return `${key}:${value.toString()}`
      })
      .sort()
    
    return filterEntries.join('|') || 'empty_filters'
  }

  /**
   * 교사 관련 문제 캐시 무효화
   */
  private async invalidateTeacherProblemCaches(teacherId: UniqueEntityID): Promise<void> {
    const teacherIdStr = teacherId.toString()
    
    await Promise.all([
      this.cacheService.deleteByPattern(`problems:teacher:${teacherIdStr}:*`),
      this.cacheService.deleteByPattern('problems:popular:*'),
      this.cacheService.deleteByPattern('problems:search:*')
    ])
  }

  /**
   * 태그 관련 캐시 무효화
   */
  private async invalidateTagCaches(tags?: Tag[]): Promise<void> {
    if (!tags || tags.length === 0) return
    
    await Promise.all([
      this.cacheService.deleteByPattern('problems:tags:*'),
      this.cacheService.deleteByPattern('problems:search:*'),
      this.cacheService.deleteByPattern('problems:popular:*')
    ])
  }

  /**
   * 문제 관련 캐시 무효화
   */
  private async invalidateProblemCaches(
    problemId: UniqueEntityID, 
    originalProblem: Problem,
    updates: UpdateProblemData
  ): Promise<void> {
    const problemIdStr = problemId.toString()
    
    // 기본 문제 캐시 삭제
    await this.cacheService.delete(CacheKeys.PROBLEM_DETAIL(problemIdStr))
    await this.cacheService.delete(CacheKeys.PROBLEM_STATS(problemIdStr))
    
    // 교사 관련 캐시 무효화
    await this.invalidateTeacherProblemCaches(new UniqueEntityID(originalProblem.teacherId))
    
    // 태그가 변경된 경우 태그 관련 캐시 무효화
    if (updates.tags) {
      await this.invalidateTagCaches(updates.tags)
      await this.invalidateTagCaches(originalProblem.tags) // 기존 태그도 무효화
    }
    
    // 검색 결과 캐시 무효화
    await this.cacheService.deleteByPattern('problems:search:*')
    
    // 인기 문제 캐시 무효화 (통계 변경 가능성)
    await this.cacheService.deleteByPattern('problems:popular:*')
  }
}