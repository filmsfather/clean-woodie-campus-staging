import { UniqueEntityID } from '@woodie/domain/common/Identifier';
import { StudyRecord, IStudyRecordRepository } from '@woodie/domain/srs';
import { BaseRepository } from '../repositories/BaseRepository';
/**
 * Supabase 기반 StudyRecord 리포지토리 구현체
 * Domain 인터페이스를 Infrastructure에서 구현
 */
export declare class SupabaseStudyRecordRepository extends BaseRepository<StudyRecord> implements IStudyRecordRepository {
    protected client: any;
    private readonly tableName;
    private readonly schema;
    constructor(client: any);
    findById(id: UniqueEntityID): Promise<StudyRecord | null>;
    delete(id: UniqueEntityID): Promise<void>;
    save(record: StudyRecord): Promise<void>;
    findByStudent(studentId: UniqueEntityID, limit?: number): Promise<StudyRecord[]>;
    findByProblem(problemId: UniqueEntityID, limit?: number): Promise<StudyRecord[]>;
    findByStudentAndProblem(studentId: UniqueEntityID, problemId: UniqueEntityID): Promise<StudyRecord[]>;
    countByStudent(studentId: UniqueEntityID): Promise<number>;
    findByDateRange(studentId: UniqueEntityID, startDate: Date, endDate: Date): Promise<StudyRecord[]>;
    private toDomain;
    private toPersistence;
}
//# sourceMappingURL=SupabaseStudyRecordRepository.d.ts.map