import { Problem } from '../entities/Problem';
import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';
export interface ProblemSearchFilter {
    teacherId?: string;
    typeValues?: string[];
    difficultyLevels?: number[];
    tagNames?: string[];
    isActive?: boolean;
    searchQuery?: string;
    createdAfter?: Date;
    createdBefore?: Date;
    updatedAfter?: Date;
    updatedBefore?: Date;
}
export interface PaginationOptions {
    limit: number;
    page?: number;
    cursor?: {
        field: 'id' | 'createdAt' | 'updatedAt';
        value: string | Date;
        direction: 'after' | 'before';
    };
    strategy: 'offset' | 'cursor';
}
export interface SortOptions {
    field: 'createdAt' | 'updatedAt' | 'difficulty' | 'title';
    direction: 'ASC' | 'DESC';
}
export interface SearchResultMetadata {
    totalCount?: number;
    currentPage?: number;
    totalPages?: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor?: string;
    previousCursor?: string;
}
export interface ProblemSearchResult {
    problems: Problem[];
    metadata: SearchResultMetadata;
}
export interface TagGroupResult {
    tagName: string;
    problems: Problem[];
    count: number;
}
export interface DifficultyDistribution {
    difficulty: number;
    count: number;
    percentage: number;
}
export interface ProblemStatistics {
    totalProblems: number;
    problemsByType: Array<{
        type: string;
        count: number;
    }>;
    problemsByDifficulty: DifficultyDistribution[];
    activeProblems: number;
    inactiveProblems: number;
    averageTagsPerProblem: number;
    mostUsedTags: Array<{
        tag: string;
        count: number;
    }>;
    recentActivity: {
        createdThisWeek: number;
        createdThisMonth: number;
        updatedThisWeek: number;
    };
}
export interface ProblemBankOptions {
    includeInactive?: boolean;
    includeStatistics?: boolean;
    tagFilter?: string[];
    difficultyRange?: {
        min: number;
        max: number;
    };
}
export interface ProblemCloneOptions {
    newTeacherId?: string;
    preserveTags?: boolean;
    preserveDifficulty?: boolean;
    markAsActive?: boolean;
}
export interface IProblemRepository {
    save(problem: Problem): Promise<Result<void>>;
    findById(id: UniqueEntityID): Promise<Result<Problem>>;
    delete(id: UniqueEntityID): Promise<Result<void>>;
    findByTeacherId(teacherId: string, options?: ProblemBankOptions): Promise<Result<Problem[]>>;
    searchProblems(filter: ProblemSearchFilter, pagination?: PaginationOptions, sort?: SortOptions): Promise<Result<ProblemSearchResult>>;
    getTeacherStatistics(teacherId: string): Promise<Result<ProblemStatistics>>;
    cloneProblem(problemId: UniqueEntityID, options: ProblemCloneOptions): Promise<Result<Problem>>;
    cloneProblems(problemIds: UniqueEntityID[], targetTeacherId: string, options?: Partial<ProblemCloneOptions>): Promise<Result<Problem[]>>;
    bulkUpdateActiveStatus(problemIds: UniqueEntityID[], isActive: boolean, teacherId: string): Promise<Result<void>>;
    bulkUpdateTags(problemIds: UniqueEntityID[], tags: string[], // primitive 사용
    teacherId: string, operation: 'add' | 'remove' | 'replace'): Promise<Result<void>>;
    findSimilarProblems(problem: Problem, teacherId: string, limit?: number): Promise<Result<Problem[]>>;
    groupProblemsByTag(teacherId: string, tagNames?: string[]): Promise<Result<TagGroupResult[]>>;
    getDifficultyDistribution(teacherId: string): Promise<Result<DifficultyDistribution[]>>;
    getTeacherTagStatistics(teacherId: string): Promise<Result<Array<{
        tag: string;
        count: number;
        percentage: number;
    }>>>;
    getTeacherUniqueTags(teacherId: string): Promise<Result<string[]>>;
    getTeacherTypeDistribution(teacherId: string): Promise<Result<Array<{
        type: string;
        count: number;
        percentage: number;
    }>>>;
    exportProblemBank(teacherId: string, filter?: ProblemSearchFilter): Promise<Result<string>>;
    importProblemBank(teacherId: string, jsonData: string, options?: {
        skipDuplicates?: boolean;
        overwriteExisting?: boolean;
        preserveIds?: boolean;
    }): Promise<Result<{
        imported: number;
        skipped: number;
        errors: string[];
    }>>;
    verifyOwnership(problemId: UniqueEntityID, teacherId: string): Promise<Result<boolean>>;
    canAccess(problemId: UniqueEntityID, teacherId: string): Promise<Result<boolean>>;
    bulkVerifyOwnership(problemIds: UniqueEntityID[], teacherId: string): Promise<Result<Array<{
        id: string;
        isOwner: boolean;
    }>>>;
    bulkCanAccess(problemIds: UniqueEntityID[], teacherId: string): Promise<Result<Array<{
        id: string;
        canAccess: boolean;
    }>>>;
    findProblemIdsByTeacher(teacherId: string, filter?: Pick<ProblemSearchFilter, 'typeValues' | 'difficultyLevels' | 'isActive'>): Promise<Result<UniqueEntityID[]>>;
    exists(id: UniqueEntityID): Promise<Result<boolean>>;
    existsMany(ids: UniqueEntityID[]): Promise<Result<Array<{
        id: string;
        exists: boolean;
    }>>>;
    create(problem: Problem): Promise<Result<Problem>>;
    update(problem: Problem): Promise<Result<Problem>>;
    findByTeacher(teacherId: string, options?: ProblemBankOptions): Promise<Result<Problem[]>>;
    search(query: string, filter?: ProblemSearchFilter): Promise<Result<Problem[]>>;
    findByTags(tagNames: string[], teacherId?: string): Promise<Result<Problem[]>>;
    findPopular(limit?: number, teacherId?: string): Promise<Result<Problem[]>>;
    getStatistics(teacherId?: string): Promise<Result<ProblemStatistics>>;
    findMany(criteria: any, pagination?: {
        offset: number;
        limit: number;
    }): Promise<Result<Problem[]>>;
    count(criteria: any): Promise<Result<number>>;
}
//# sourceMappingURL=IProblemRepository.d.ts.map