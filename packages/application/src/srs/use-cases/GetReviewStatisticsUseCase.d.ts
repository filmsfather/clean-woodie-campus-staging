import { Result } from '@woodie/domain';
import { ReviewQueueService } from '../services/ReviewQueueService';
import { NotificationManagementService, NotificationStatistics } from '../services/NotificationManagementService';
export interface GetReviewStatisticsRequest {
    studentId: string;
    period?: 'today' | 'week' | 'month' | 'all';
    includeNotifications?: boolean;
}
export interface GetReviewStatisticsResponse {
    period: string;
    review: {
        totalScheduled: number;
        dueToday: number;
        overdue: number;
        completedToday: number;
        streakDays: number;
        averageRetention: number;
        totalTimeSpent: number;
        completionRate: number;
        efficiency: number;
        avgSessionTime: number;
        productivity: 'excellent' | 'good' | 'fair' | 'needs_improvement';
    };
    notification?: NotificationStatistics;
    trends?: {
        retentionTrend: 'improving' | 'stable' | 'declining';
        speedTrend: 'improving' | 'stable' | 'declining';
        consistencyScore: number;
    };
    recommendations?: string[];
}
/**
 * 복습 통계 조회 Use Case
 *
 * 비즈니스 규칙:
 * - 인증된 사용자만 자신의 통계를 조회할 수 있음
 * - 기간별 통계 필터링 지원
 * - 학습 효율성 지표 계산
 * - 개선 제안 사항 포함
 * - 알림 통계 선택적 포함
 */
export declare class GetReviewStatisticsUseCase {
    private reviewQueueService;
    private notificationService;
    constructor(reviewQueueService: ReviewQueueService, notificationService: NotificationManagementService);
    execute(request: GetReviewStatisticsRequest): Promise<Result<GetReviewStatisticsResponse>>;
    /**
     * 계산된 지표들 생성
     */
    private calculateMetrics;
    /**
     * 트렌드 분석 (간단한 로직 - 실제로는 시계열 데이터 필요)
     */
    private analyzeTrends;
    /**
     * 개선 제안 생성
     */
    private generateRecommendations;
}
//# sourceMappingURL=GetReviewStatisticsUseCase.d.ts.map