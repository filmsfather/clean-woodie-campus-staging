import { Result } from '@domain/common/Result';
import { UniqueEntityID } from '@domain/common/Identifier';
import { Statistics, IStatisticsRepository } from '@domain/progress';
import { SupabaseClient } from '@supabase/supabase-js';
/**
 * Supabase 기반 Statistics 리포지토리 구현체
 * Domain 인터페이스를 Infrastructure에서 구현
 */
export declare class SupabaseStatisticsRepository implements IStatisticsRepository {
    private readonly tableName;
    private readonly schema;
    private client;
    constructor(client: SupabaseClient);
    /**
     * 학생 ID와 문제집 ID로 통계 조회
     */
    findByStudentAndProblemSet(studentId: UniqueEntityID, problemSetId: UniqueEntityID): Promise<Result<Statistics | null>>;
    /**
     * 학생의 모든 문제집 통계 조회
     */
    findByStudentId(studentId: UniqueEntityID): Promise<Result<Statistics[]>>;
    /**
     * 문제집별 모든 학생 통계 조회
     */
    findByProblemSetId(problemSetId: UniqueEntityID): Promise<Result<Statistics[]>>;
    /**
     * 통계 저장 (생성 또는 업데이트)
     */
    save(statistics: Statistics): Promise<Result<void>>;
    /**
     * 통계 삭제
     */
    delete(statisticsId: UniqueEntityID): Promise<Result<void>>;
    /**
     * 클래스별 통계 조회
     */
    findByClassId(classId: string, problemSetId?: UniqueEntityID): Promise<Result<Statistics[]>>;
    /**
     * 완료율 기준 상위 학생 조회
     */
    findTopByCompletionRate(problemSetId: UniqueEntityID, limit?: number): Promise<Result<Statistics[]>>;
    /**
     * 정답률 기준 상위 학생 조회
     */
    findTopByAccuracyRate(problemSetId: UniqueEntityID, limit?: number): Promise<Result<Statistics[]>>;
    /**
     * 특정 기간 내 생성된 통계 조회
     */
    findByDateRange(startDate: Date, endDate: Date): Promise<Result<Statistics[]>>;
    /**
     * 문제집별 평균 통계 계산
     */
    calculateAverageStatistics(problemSetId: UniqueEntityID): Promise<Result<{
        averageCompletionRate: number;
        averageAccuracyRate: number;
        averageResponseTime: number;
        totalStudents: number;
    }>>;
    /**
     * 데이터베이스 행을 도메인 엔티티로 변환
     */
    private toDomain;
    /**
     * 도메인 엔티티를 데이터베이스 행으로 변환
     */
    private toPersistence;
}
//# sourceMappingURL=SupabaseStatisticsRepository.d.ts.map