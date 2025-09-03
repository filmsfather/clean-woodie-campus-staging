import { Result } from '@domain/common/Result';
import { UniqueEntityID } from '@domain/common/Identifier';
import { StudyStreak, IStudyStreakRepository } from '@domain/progress';
import { SupabaseClient } from '@supabase/supabase-js';
/**
 * Supabase 기반 StudyStreak 리포지토리 구현체
 * Domain 인터페이스를 Infrastructure에서 구현
 */
export declare class SupabaseStudyStreakRepository implements IStudyStreakRepository {
    private readonly tableName;
    private readonly schema;
    private client;
    constructor(client: SupabaseClient);
    /**
     * 학생 ID로 스트릭 조회
     */
    findByStudentId(studentId: UniqueEntityID): Promise<Result<StudyStreak | null>>;
    /**
     * 스트릭 저장 (생성 또는 업데이트)
     */
    save(studyStreak: StudyStreak): Promise<Result<void>>;
    /**
     * 스트릭 삭제
     */
    delete(studyStreakId: UniqueEntityID): Promise<Result<void>>;
    /**
     * 활성 스트릭을 가진 학생들 조회
     */
    findActiveStreaks(daysThreshold?: number): Promise<Result<StudyStreak[]>>;
    /**
     * 위험 상태의 스트릭들 조회 (끊어질 위험이 있는)
     */
    findAtRiskStreaks(): Promise<Result<StudyStreak[]>>;
    /**
     * 최장 스트릭 순위 조회
     */
    findTopStreaks(limit?: number): Promise<Result<StudyStreak[]>>;
    /**
     * 클래스별 스트릭 통계 조회
     */
    findByClassId(classId: string): Promise<Result<StudyStreak[]>>;
    /**
     * 데이터베이스 행을 도메인 엔티티로 변환
     */
    private toDomain;
    /**
     * 도메인 엔티티를 데이터베이스 행으로 변환
     */
    private toPersistence;
}
//# sourceMappingURL=SupabaseStudyStreakRepository.d.ts.map