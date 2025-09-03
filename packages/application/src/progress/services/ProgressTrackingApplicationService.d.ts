import { Result } from '@woodie/domain';
import { ProgressTrackingService } from '@woodie/domain';
import { IStudyStreakRepository, IStatisticsRepository } from '@woodie/domain';
import { StudentProgressDto, ClassProgressDto, UpdateProgressRequest, UpdateProgressResponse, StreakRankingDto, ProblemSetStatsSummaryDto } from '../dto/ProgressDto';
/**
 * 진도 추적 애플리케이션 서비스
 * 도메인 서비스를 활용하여 애플리케이션 레벨의 진도 추적 기능을 제공
 *
 * 주요 책임:
 * - StudyRecord 기반 자동 진도 업데이트
 * - 학생/교사 대시보드 데이터 제공
 * - 통계 및 순위 계산
 * - DTO 변환 처리
 */
export declare class ProgressTrackingApplicationService {
    private progressTrackingService;
    private studyStreakRepository;
    private statisticsRepository;
    constructor(progressTrackingService: ProgressTrackingService, studyStreakRepository: IStudyStreakRepository, statisticsRepository: IStatisticsRepository);
    /**
     * 학습 활동 기반 진도 업데이트
     * StudyRecord가 생성될 때 자동으로 호출되는 핵심 메서드
     */
    updateProgressFromStudyRecord(request: UpdateProgressRequest): Promise<Result<UpdateProgressResponse>>;
    /**
     * 학생의 전체 진도 현황 조회
     */
    getStudentProgress(studentId: string): Promise<Result<StudentProgressDto>>;
    /**
     * 클래스 전체 진도 현황 조회
     */
    getClassProgress(classId: string, problemSetId?: string): Promise<Result<ClassProgressDto>>;
    /**
     * 스트릭 순위 조회
     */
    getStreakRankings(limit?: number, studentId?: string): Promise<Result<StreakRankingDto>>;
    /**
     * 문제집별 통계 요약 조회
     */
    getProblemSetStatsSummary(problemSetId: string): Promise<Result<ProblemSetStatsSummaryDto>>;
    /**
     * StudyStreak 엔티티를 DTO로 변환
     */
    private toStudyStreakDto;
    /**
     * Statistics 엔티티를 DTO로 변환
     */
    private toStatisticsDto;
    /**
     * 스트릭 업데이트 정보 구성
     */
    private buildStreakUpdateInfo;
    /**
     * 통계 업데이트 정보 구성
     */
    private buildStatisticsUpdateInfo;
    /**
     * 학생의 전체 효율성 점수 계산
     */
    private calculateEfficiencyScore;
}
//# sourceMappingURL=ProgressTrackingApplicationService.d.ts.map