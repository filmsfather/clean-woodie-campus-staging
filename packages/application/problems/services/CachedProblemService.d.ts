import { IProblemRepository } from '@woodie/domain/problems/repositories/IProblemRepository';
import { ICacheService } from '../../common/interfaces/ICacheService';
import { Problem } from '@woodie/domain/problems/entities/Problem';
import { UniqueEntityID } from '@woodie/domain/common/Identifier';
import { Result } from '@woodie/domain/common/Result';
import { ProblemType } from '@woodie/domain/problems/value-objects/ProblemType';
import { Difficulty } from '@woodie/domain/problems/value-objects/Difficulty';
import { Tag } from '@woodie/domain/problems/value-objects/Tag';
/**
 * 문제 서비스 인터페이스
 */
export interface IProblemService {
    getProblemById(id: UniqueEntityID): Promise<Result<Problem | null>>;
    getProblemsByTeacher(teacherId: UniqueEntityID, filters?: ProblemFilters): Promise<Result<Problem[]>>;
    searchProblems(query: string, filters?: ProblemFilters): Promise<Result<Problem[]>>;
    getProblemsByTags(tags: Tag[], filters?: ProblemFilters): Promise<Result<Problem[]>>;
    getPopularProblems(limit?: number): Promise<Result<Problem[]>>;
    getProblemStatistics(problemId: UniqueEntityID): Promise<Result<ProblemStats>>;
    createProblem(problemData: CreateProblemData): Promise<Result<Problem>>;
    updateProblem(problemId: UniqueEntityID, updates: UpdateProblemData): Promise<Result<Problem>>;
}
/**
 * 문제 필터링 옵션
 */
export interface ProblemFilters {
    type?: ProblemType;
    difficulty?: Difficulty;
    tags?: Tag[];
    isActive?: boolean;
    createdAfter?: Date;
    createdBefore?: Date;
}
/**
 * 문제 생성 데이터
 */
export interface CreateProblemData {
    teacherId: UniqueEntityID;
    content: any;
    correctAnswer: any;
    type: ProblemType;
    difficulty: Difficulty;
    tags?: Tag[];
}
/**
 * 문제 업데이트 데이터
 */
export interface UpdateProblemData {
    content?: any;
    correctAnswer?: any;
    difficulty?: Difficulty;
    tags?: Tag[];
    isActive?: boolean;
}
/**
 * 문제 통계
 */
export interface ProblemStats {
    totalAttempts: number;
    correctAttempts: number;
    accuracyRate: number;
    avgResponseTime: number;
    uniqueStudents: number;
    popularityScore: number;
    lastAttempted?: Date;
}
/**
 * 캐싱이 적용된 문제 관리 서비스
 * 문제 조회, 검색, 통계에 대한 캐싱 전략을 구현
 */
export declare class CachedProblemService implements IProblemService {
    private readonly problemRepository;
    private readonly cacheService;
    constructor(problemRepository: IProblemRepository, cacheService: ICacheService);
    /**
     * ID로 문제 조회 (캐싱 적용)
     */
    getProblemById(id: UniqueEntityID): Promise<Result<Problem | null>>;
    /**
     * 교사별 문제 조회 (캐싱 적용)
     */
    getProblemsByTeacher(teacherId: UniqueEntityID, filters?: ProblemFilters): Promise<Result<Problem[]>>;
    /**
     * 문제 검색 (캐싱 적용)
     */
    searchProblems(query: string, filters?: ProblemFilters): Promise<Result<Problem[]>>;
    /**
     * 태그별 문제 조회 (캐싱 적용)
     */
    getProblemsByTags(tags: Tag[], filters?: ProblemFilters): Promise<Result<Problem[]>>;
    /**
     * 인기 문제 조회 (캐싱 적용)
     */
    getPopularProblems(limit?: number): Promise<Result<Problem[]>>;
    /**
     * 문제 통계 조회 (캐싱 적용)
     */
    getProblemStatistics(problemId: UniqueEntityID): Promise<Result<ProblemStats>>;
    /**
     * 문제 생성 (캐시 무효화)
     */
    createProblem(problemData: CreateProblemData): Promise<Result<Problem>>;
    /**
     * 문제 업데이트 (캐시 무효화)
     */
    updateProblem(problemId: UniqueEntityID, updates: UpdateProblemData): Promise<Result<Problem>>;
    /**
     * 필터를 문자열로 직렬화 (캐시 키 생성용)
     */
    private serializeFilters;
    /**
     * 교사 관련 문제 캐시 무효화
     */
    private invalidateTeacherProblemCaches;
    /**
     * 태그 관련 캐시 무효화
     */
    private invalidateTagCaches;
    /**
     * 문제 관련 캐시 무효화
     */
    private invalidateProblemCaches;
}
//# sourceMappingURL=CachedProblemService.d.ts.map