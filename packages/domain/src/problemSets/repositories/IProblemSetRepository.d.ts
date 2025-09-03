import { ProblemSet } from '../entities/ProblemSet';
import { UniqueEntityID } from '../../common/Identifier';
import { Result } from '../../common/Result';
/**
 * ProblemSet Repository Interface - 단순한 데이터 저장소 역할만 담당
 * 복잡한 검색, 통계, 복제 로직은 별도 Domain Service로 분리
 */
export interface IProblemSetRepository {
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
}
//# sourceMappingURL=IProblemSetRepository.d.ts.map