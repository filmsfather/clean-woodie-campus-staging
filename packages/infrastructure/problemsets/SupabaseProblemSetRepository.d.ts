import { SupabaseClient } from '@supabase/supabase-js';
import { ProblemSet } from '@woodie/domain/problemSets/entities/ProblemSet';
import { IProblemSetRepository } from '@woodie/domain/problemSets/repositories/IProblemSetRepository';
import { Result } from '@woodie/domain/common/Result';
import { UniqueEntityID } from '@woodie/domain/common/Identifier';
export declare class SupabaseProblemSetRepository implements IProblemSetRepository {
    private supabase;
    constructor(supabase: SupabaseClient);
    save(problemSet: ProblemSet): Promise<Result<void>>;
    findById(id: UniqueEntityID): Promise<Result<ProblemSet>>;
    delete(id: UniqueEntityID): Promise<Result<void>>;
    findByTeacherId(teacherId: string): Promise<Result<ProblemSet[]>>;
    findProblemSetsByProblemId(problemId: UniqueEntityID): Promise<Result<ProblemSet[]>>;
    findProblemSetsByProblemIds(problemIds: UniqueEntityID[]): Promise<Result<ProblemSet[]>>;
    findByTeacherIdAndTitle(teacherId: string, title: string): Promise<Result<ProblemSet>>;
    exists(id: UniqueEntityID): Promise<Result<boolean>>;
    existsMany(ids: UniqueEntityID[]): Promise<Result<Array<{
        id: string;
        exists: boolean;
    }>>>;
    verifyOwnership(problemSetId: UniqueEntityID, teacherId: string): Promise<Result<boolean>>;
    bulkVerifyOwnership(problemSetIds: UniqueEntityID[], teacherId: string): Promise<Result<Array<{
        id: string;
        isOwner: boolean;
    }>>>;
    countByTeacherId(teacherId: string): Promise<Result<number>>;
    countProblemSetsByProblemId(problemId: UniqueEntityID): Promise<Result<number>>;
    findSharedProblemSets(): Promise<Result<ProblemSet[]>>;
    findPublicProblemSets(): Promise<Result<ProblemSet[]>>;
    findSharedProblemSetsExcludingTeacher(excludeTeacherId: string): Promise<Result<ProblemSet[]>>;
    private mapToDomain;
}
//# sourceMappingURL=SupabaseProblemSetRepository.d.ts.map