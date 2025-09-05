import { Result, IClock } from '@woodie/domain';
import { IReviewScheduleRepository } from '@woodie/domain';
export interface GetRetentionProbabilityRequest {
    studentId: string;
    problemId?: string;
    scheduleIds?: string[];
}
export interface RetentionProbabilityItem {
    scheduleId: string;
    problemId: string;
    currentProbability: number;
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
    daysSinceLastReview: number;
    intervalDays: number;
    nextReviewAt: Date;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
}
export interface GetRetentionProbabilityResponse {
    studentId: string;
    calculatedAt: Date;
    items: RetentionProbabilityItem[];
    summary: {
        averageProbability: number;
        highRiskCount: number;
        criticalRiskCount: number;
        totalItems: number;
    };
    recommendations: string[];
}
/**
 * 기억 보존 확률 조회 Use Case
 *
 * 비즈니스 규칙:
 * - 에빙하우스 망각곡선을 기반으로 기억 보존 확률을 계산함
 * - 학습자의 개별 성과와 난이도를 반영함
 * - 위험도별로 분류하여 우선순위를 제공함
 * - 개별 문제 또는 전체 문제에 대한 분석 지원
 */
export declare class GetRetentionProbabilityUseCase {
    private reviewScheduleRepository;
    private clock;
    constructor(reviewScheduleRepository: IReviewScheduleRepository, clock: IClock);
    execute(request: GetRetentionProbabilityRequest): Promise<Result<GetRetentionProbabilityResponse>>;
    /**
     * 입력 요청 유효성 검증
     */
    private validateRequest;
    /**
     * 위험도 계산
     */
    private calculateRiskLevel;
    /**
     * 요약 통계 계산
     */
    private calculateSummary;
    /**
     * 추천사항 생성
     */
    private generateRecommendations;
}
//# sourceMappingURL=GetRetentionProbabilityUseCase.d.ts.map