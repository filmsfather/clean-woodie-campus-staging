import { ISrsService } from '@woodie/domain';
import { IReviewScheduleRepository } from '@woodie/domain/srs/repositories/IReviewScheduleRepository';
import { IStudyRecordRepository } from '@woodie/domain/srs/repositories/IStudyRecordRepository';
import { ICacheService } from '../../infrastructure/interfaces/ICacheService';
import { ReviewSchedule } from '@woodie/domain/srs/entities/ReviewSchedule';
import { UniqueEntityID } from '@woodie/domain/common/Identifier';
import { Result } from '@woodie/domain/common/Result';
import { ReviewFeedback } from '@woodie/domain/srs/value-objects/ReviewFeedback';
import { ISpacedRepetitionPolicy } from '@woodie/domain/srs/services/ISpacedRepetitionPolicy';
import { IClock } from '@woodie/domain/srs/services/IClock';
/**
 * 캐싱이 적용된 SRS 서비스
 * Cache-Aside 패턴을 사용하여 성능을 최적화한 SRS 서비스
 */
export declare class CachedSrsService implements ISrsService {
    private readonly reviewScheduleRepository;
    private readonly studyRecordRepository;
    private readonly cacheService;
    private readonly srsPolicy;
    private readonly clock;
    constructor(reviewScheduleRepository: IReviewScheduleRepository, studyRecordRepository: IStudyRecordRepository, cacheService: ICacheService, srsPolicy: ISpacedRepetitionPolicy, clock: IClock);
    /**
     * 학생의 오늘 복습 카드 조회 (캐싱 적용)
     */
    getTodayReviews(studentId: UniqueEntityID): Promise<Result<ReviewSchedule[]>>;
    /**
     * 학생의 지연된 복습 카드 조회 (캐싱 적용)
     */
    getOverdueReviews(studentId: UniqueEntityID): Promise<Result<ReviewSchedule[]>>;
    /**
     * 복습 완료 처리 (캐시 무효화 적용)
     */
    completeReview(reviewScheduleId: UniqueEntityID, feedback: ReviewFeedback, studyInfo?: {
        responseTime?: number;
        answerContent?: any;
    }): Promise<Result<void>>;
    /**
     * 학생의 복습 통계 조회 (캐싱 적용)
     */
    getStudentReviewStats(studentId: UniqueEntityID): Promise<Result<{
        totalCards: number;
        dueToday: number;
        overdue: number;
        completedToday: number;
        averageEaseFactor: number;
        longestStreak: number;
    }>>;
    /**
     * 문제별 복습 성과 조회 (캐싱 적용)
     */
    getProblemReviewPerformance(problemId: UniqueEntityID): Promise<Result<{
        totalReviews: number;
        averagePerformance: number;
        difficultyTrend: 'improving' | 'stable' | 'declining';
        averageInterval: number;
    }>>;
    /**
     * 새로운 복습 일정 생성 (캐시 무효화)
     */
    createReviewSchedule(studentId: UniqueEntityID, problemId: UniqueEntityID): Promise<Result<ReviewSchedule>>;
    /**
     * 학생의 SRS 관련 캐시 무효화
     */
    private invalidateStudentSrsCache;
    /**
     * 오늘의 학습 기록 조회 헬퍼
     */
    private getTodayStudyRecords;
}
//# sourceMappingURL=CachedSrsService.d.ts.map