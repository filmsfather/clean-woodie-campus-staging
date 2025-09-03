import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';
import { StudyRecord } from '../../srs/entities/StudyRecord';
import { StudyStreak } from '../entities/StudyStreak';
import { Statistics } from '../entities/Statistics';
import { IStudyStreakRepository } from '../repositories/IStudyStreakRepository';
import { IStatisticsRepository } from '../repositories/IStatisticsRepository';
/**
 * 진도 추적 도메인 서비스
 * StudyRecord를 기반으로 학습 스트릭과 통계를 자동으로 업데이트하는 핵심 서비스
 *
 * 주요 책임:
 * - StudyRecord로부터 학습 활동 기록 처리
 * - StudyStreak 자동 업데이트
 * - Statistics 실시간 갱신
 * - 트랜잭션 단위로 일관성 보장
 */
export declare class ProgressTrackingService {
    private studyStreakRepository;
    private statisticsRepository;
    constructor(studyStreakRepository: IStudyStreakRepository, statisticsRepository: IStatisticsRepository);
    /**
     * 학습 기록으로부터 진도 추적 정보 업데이트
     * StudyRecord가 생성될 때마다 호출되어 스트릭과 통계를 자동 갱신
     *
     * @param studyRecord 학습 기록
     * @param problemSetId 문제집 ID
     * @param totalProblemsInSet 문제집 내 총 문제 수
     * @returns 업데이트 결과
     */
    updateProgressFromStudyRecord(studyRecord: StudyRecord, problemSetId: UniqueEntityID, totalProblemsInSet: number): Promise<Result<void>>;
    /**
     * 학습 스트릭 업데이트
     * 학생의 스트릭을 조회하고 새로운 학습 활동을 반영
     *
     * @param studentId 학생 ID
     * @param studyDate 학습 날짜
     * @returns 업데이트 결과
     */
    private updateStudyStreak;
    /**
     * 학습 통계 업데이트
     * 문제집별 학습 통계를 조회하고 새로운 학습 결과를 반영
     *
     * @param studentId 학생 ID
     * @param problemSetId 문제집 ID
     * @param isCorrect 정답 여부
     * @param responseTime 응답 시간 (밀리초)
     * @param totalProblemsInSet 문제집 내 총 문제 수
     * @returns 업데이트 결과
     */
    private updateStatistics;
    /**
     * 학생의 전체 진도 현황 조회
     * 스트릭과 모든 문제집 통계를 종합적으로 제공
     *
     * @param studentId 학생 ID
     * @returns 진도 현황 정보
     */
    getStudentProgress(studentId: UniqueEntityID): Promise<Result<{
        studyStreak: StudyStreak | null;
        statistics: Statistics[];
        overallMetrics: {
            totalProblemSets: number;
            completedProblemSets: number;
            averageCompletionRate: number;
            averageAccuracyRate: number;
            totalStudyTime: number;
        };
    }>>;
    /**
     * 전체 지표 계산
     * 여러 문제집 통계를 종합하여 전체적인 학습 현황 계산
     *
     * @param statistics 문제집별 통계 리스트
     * @returns 전체 지표
     */
    private calculateOverallMetrics;
    /**
     * 클래스 전체 진도 현황 조회
     * 교사가 담당 클래스의 전체적인 학습 현황을 파악할 때 사용
     *
     * @param classId 클래스 ID
     * @param problemSetId 특정 문제집 ID (선택적)
     * @returns 클래스 진도 현황
     */
    getClassProgress(classId: string, problemSetId?: UniqueEntityID): Promise<Result<{
        streaks: StudyStreak[];
        statistics: Statistics[];
        classMetrics: {
            totalStudents: number;
            activeStreakCount: number;
            averageCurrentStreak: number;
            averageCompletionRate: number;
            averageAccuracyRate: number;
        };
    }>>;
    /**
     * 클래스 지표 계산
     * 클래스 내 모든 학생들의 스트릭과 통계를 종합하여 클래스 지표 계산
     */
    private calculateClassMetrics;
}
//# sourceMappingURL=ProgressTrackingService.d.ts.map