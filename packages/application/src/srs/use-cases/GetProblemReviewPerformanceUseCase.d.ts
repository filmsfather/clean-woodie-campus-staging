import { Result } from '@woodie/domain';
import { IReviewScheduleRepository, IStudyRecordRepository } from '@woodie/domain';
export interface GetProblemReviewPerformanceRequest {
    problemId: string;
    includeStudentBreakdown?: boolean;
    timeRangeInDays?: number;
}
export interface StudentPerformanceBreakdown {
    studentId: string;
    reviewCount: number;
    accuracy: number;
    averageResponseTime?: number;
    currentEaseFactor: number;
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
    lastReviewAt?: Date;
    performanceRating: 'excellent' | 'good' | 'average' | 'needs_improvement';
}
export interface GetProblemReviewPerformanceResponse {
    problemId: string;
    analysisDate: Date;
    timeRangeDays: number;
    totalReviews: number;
    averagePerformance: number;
    difficultyTrend: 'improving' | 'stable' | 'declining';
    averageInterval: number;
    performance: {
        totalStudents: number;
        averageAccuracy: number;
        averageResponseTime?: number;
        consistencyScore: number;
        retentionRate: number;
    };
    difficultyAnalysis: {
        currentLevel: 'easy' | 'medium' | 'hard' | 'very_hard';
        recommendedLevel: 'easy' | 'medium' | 'hard' | 'very_hard';
        reasonForRecommendation: string;
        adjustmentSuggestion?: string;
    };
    studentBreakdown?: StudentPerformanceBreakdown[];
    insights: {
        topPerformers: number;
        strugglingStudents: number;
        commonMistakePatterns: string[];
        optimizationSuggestions: string[];
    };
}
/**
 * 문제별 복습 성과 조회 Use Case
 *
 * 비즈니스 규칙:
 * - 특정 문제에 대한 전체 학습자의 성과를 분석
 * - 문제의 적정 난이도 평가 및 조정 제안
 * - 학습자별 성과 차이 분석
 * - 교육적 개선점 도출
 */
export declare class GetProblemReviewPerformanceUseCase {
    private reviewScheduleRepository;
    private studyRecordRepository;
    constructor(reviewScheduleRepository: IReviewScheduleRepository, studyRecordRepository: IStudyRecordRepository);
    execute(request: GetProblemReviewPerformanceRequest): Promise<Result<GetProblemReviewPerformanceResponse>>;
    /**
     * 입력 요청 유효성 검증
     */
    private validateRequest;
    /**
     * 기본 성과 지표 계산
     */
    private calculateBasicMetrics;
    /**
     * 난이도 분석
     */
    private analyzeDifficulty;
    /**
     * 학생별 성과 분석
     */
    private analyzeStudentPerformance;
    /**
     * 인사이트 생성
     */
    private generateInsights;
    private calculateDifficultyTrend;
    private calculatePerformanceVariance;
}
//# sourceMappingURL=GetProblemReviewPerformanceUseCase.d.ts.map