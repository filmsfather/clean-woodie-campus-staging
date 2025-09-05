import { Result, IClock } from '@woodie/domain';
import { IReviewScheduleRepository } from '@woodie/domain';
export interface GetOverdueReviewsRequest {
    studentId: string;
    limit?: number;
    offset?: number;
    sortBy?: 'overdue_duration' | 'difficulty' | 'priority' | 'next_review_date';
    sortOrder?: 'asc' | 'desc';
}
export interface OverdueReviewItem {
    scheduleId: string;
    problemId: string;
    nextReviewAt: Date;
    overdueHours: number;
    overdueDays: number;
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
    consecutiveFailures: number;
    easeFactor: number;
    currentInterval: number;
    retentionProbability: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
}
export interface GetOverdueReviewsResponse {
    studentId: string;
    retrievedAt: Date;
    items: OverdueReviewItem[];
    pagination: {
        total: number;
        offset: number;
        limit: number;
        hasMore: boolean;
    };
    summary: {
        totalOverdue: number;
        averageOverdueDays: number;
        criticalCount: number;
        highPriorityCount: number;
        longestOverdueDays: number;
    };
    urgentRecommendations: string[];
}
/**
 * 연체 복습 조회 Use Case
 *
 * 비즈니스 규칙:
 * - 복습 예정일이 지난 항목들만 조회
 * - 연체 기간, 난이도, 우선순위별 정렬 지원
 * - 긴급도에 따른 우선순위 분류
 * - 연체 기간이 길수록 높은 우선순위 부여
 */
export declare class GetOverdueReviewsUseCase {
    private reviewScheduleRepository;
    private clock;
    constructor(reviewScheduleRepository: IReviewScheduleRepository, clock: IClock);
    execute(request: GetOverdueReviewsRequest): Promise<Result<GetOverdueReviewsResponse>>;
    /**
     * 입력 요청 유효성 검증
     */
    private validateRequest;
    /**
     * 우선순위 계산
     */
    private calculatePriority;
    /**
     * 정렬 적용
     */
    private applySorting;
    /**
     * 요약 통계 계산
     */
    private calculateSummary;
    /**
     * 긴급 추천사항 생성
     */
    private generateUrgentRecommendations;
}
//# sourceMappingURL=GetOverdueReviewsUseCase.d.ts.map