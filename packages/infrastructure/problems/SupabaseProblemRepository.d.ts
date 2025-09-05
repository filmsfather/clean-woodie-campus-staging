import { SupabaseClient } from '@supabase/supabase-js';
import { Problem } from '@woodie/domain/problems/entities/Problem';
import { IProblemRepository, ProblemSearchFilter, PaginationOptions, SortOptions, ProblemSearchResult, ProblemStatistics, ProblemBankOptions, ProblemCloneOptions, TagGroupResult, DifficultyDistribution } from '@woodie/domain/problems/repositories/IProblemRepository';
import { Result } from '@woodie/domain/common/Result';
import { UniqueEntityID } from '@woodie/domain/common/Identifier';
export declare class SupabaseProblemRepository implements IProblemRepository {
    private supabase;
    constructor(supabase: SupabaseClient);
    save(problem: Problem): Promise<Result<void>>;
    findById(id: UniqueEntityID): Promise<Result<Problem>>;
    delete(id: UniqueEntityID): Promise<Result<void>>;
    findByTeacherId(teacherId: string, options?: ProblemBankOptions): Promise<Result<Problem[]>>;
    searchProblems(filter: ProblemSearchFilter, pagination?: PaginationOptions, sort?: SortOptions): Promise<Result<ProblemSearchResult>>;
    getTeacherStatistics(teacherId: string): Promise<Result<ProblemStatistics>>;
    cloneProblem(problemId: UniqueEntityID, options: ProblemCloneOptions): Promise<Result<Problem>>;
    cloneProblems(problemIds: UniqueEntityID[], targetTeacherId: string, options?: Partial<ProblemCloneOptions>): Promise<Result<Problem[]>>;
    groupProblemsByTag(teacherId: string, tagNames?: string[]): Promise<Result<TagGroupResult[]>>;
    getDifficultyDistribution(teacherId: string): Promise<Result<DifficultyDistribution[]>>;
    verifyOwnership(problemId: UniqueEntityID, teacherId: string): Promise<Result<boolean>>;
    canAccess(problemId: UniqueEntityID, teacherId: string): Promise<Result<boolean>>;
    findProblemIdsByTeacher(teacherId: string, filter?: Pick<ProblemSearchFilter, 'typeValues' | 'difficultyLevels' | 'isActive'>): Promise<Result<UniqueEntityID[]>>;
    exists(id: UniqueEntityID): Promise<Result<boolean>>;
    existsMany(ids: UniqueEntityID[]): Promise<Result<Array<{
        id: string;
        exists: boolean;
    }>>>;
    findSimilarProblems(): Promise<Result<Problem[]>>;
    exportProblemBank(): Promise<Result<string>>;
    importProblemBank(): Promise<Result<{
        imported: number;
        skipped: number;
        errors: string[];
    }>>;
    bulkUpdateActiveStatus(): Promise<Result<void>>;
    bulkUpdateTags(): Promise<Result<void>>;
    private findProblemsByIds;
    private mapToDomain;
    private mapSortField;
    private buildSearchMetadata;
    private generateCursor;
    private calculateStatistics;
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
    bulkVerifyOwnership(problemIds: UniqueEntityID[], teacherId: string): Promise<Result<Array<{
        id: string;
        isOwner: boolean;
    }>>>;
    bulkCanAccess(problemIds: UniqueEntityID[], teacherId: string): Promise<Result<Array<{
        id: string;
        canAccess: boolean;
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
//# sourceMappingURL=SupabaseProblemRepository.d.ts.map