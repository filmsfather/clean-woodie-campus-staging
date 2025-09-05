import { UniqueEntityID } from '@woodie/domain/common/Identifier';
import { StudyRecord, IStudyRecordRepository } from '@woodie/domain/srs';
import { SupabaseClient } from '@supabase/supabase-js';
/**
 * Supabase 기반 StudyRecord 리포지토리 구현체
 * Domain 인터페이스를 Infrastructure에서 구현
 */
export declare class SupabaseStudyRecordRepository implements IStudyRecordRepository {
    private client;
    private readonly tableName;
    private readonly schema;
    constructor(client: SupabaseClient);
    save(record: StudyRecord): Promise<void>;
    findByStudentId(studentId: UniqueEntityID, limit?: number): Promise<StudyRecord[]>;
    findByProblemId(problemId: UniqueEntityID, limit?: number): Promise<StudyRecord[]>;
    countByStudent(studentId: UniqueEntityID): Promise<number>;
    countByStudentId(studentId: UniqueEntityID): Promise<number>;
    findByDateRange(studentId: UniqueEntityID, startDate: Date, endDate: Date): Promise<StudyRecord[]>;
    findByStudent(studentId: UniqueEntityID, limit?: number): Promise<StudyRecord[]>;
    findByProblem(problemId: UniqueEntityID, limit?: number): Promise<StudyRecord[]>;
    findByStudentAndProblem(studentId: UniqueEntityID, problemId: UniqueEntityID): Promise<StudyRecord[]>;
    private toDomain;
    private toPersistence;
}
//# sourceMappingURL=SupabaseStudyRecordRepository.d.ts.map