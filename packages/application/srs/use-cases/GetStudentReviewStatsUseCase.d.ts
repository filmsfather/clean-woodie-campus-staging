import { Result } from '@woodie/domain';
import { IReviewScheduleRepository, IStudyRecordRepository } from '@woodie/domain';
export interface GetStudentReviewStatsRequest {
    studentId: string;
    includeTrends?: boolean;
    includePerformanceMetrics?: boolean;
}
export interface StudentReviewStats {
    totalCards: number;
    dueToday: number;
    overdue: number;
    completedToday: number;
    averageEaseFactor: number;
    longestStreak: number;
}
export interface GetStudentReviewStatsResponse {
    studentId: string;
    calculatedAt: Date;
    basicStats: StudentReviewStats;
    performanceMetrics?: {
        totalReviewsSinceStart: number;
        averageAccuracy: number;
        averageResponseTime?: number;
        strongestDifficultyLevel: 'beginner' | 'intermediate' | 'advanced';
        weakestDifficultyLevel: 'beginner' | 'intermediate' | 'advanced';
        mostCommonPattern: 'quick_correct' | 'slow_correct' | 'quick_incorrect' | 'slow_incorrect';
        consistencyScore: number;
    };
    trends?: {
        weeklyProgress: {
            week: string;
            completedReviews: number;
            accuracy: number;
            averageEaseFactor: number;
        }[];
        monthlyProgress: {
            month: string;
            completedReviews: number;
            accuracy: number;
            newCards: number;
        }[];
        improvementTrend: 'improving' | 'stable' | 'declining';
        streakTrend: 'increasing' | 'stable' | 'decreasing';
    };
    insights: {
        strengths: string[];
        areas_for_improvement: string[];
        next_milestones: string[];
    };
}
/**
 * 학생 복습 통계 조회 Use Case
 *
 * 비즈니스 규칙:
 * - ISrsService 인터페이스 구현에 해당하는 상세한 통계 제공
 * - 기본 통계 + 성과 분석 + 트렌드 분석 통합 제공
 * - 학습자의 강점과 약점을 식별하여 개선점 제시
 * - 다음 목표와 마일스톤 제안
 */
export declare class GetStudentReviewStatsUseCase {
    private reviewScheduleRepository;
    private studyRecordRepository;
    constructor(reviewScheduleRepository: IReviewScheduleRepository, studyRecordRepository: IStudyRecordRepository);
    execute(request: GetStudentReviewStatsRequest): Promise<Result<GetStudentReviewStatsResponse>>;
    /**
     * 기본 통계 조회
     */
    private getBasicStats;
    /**
     * 성과 지표 조회
     */
    private getPerformanceMetrics;
    /**
     * 트렌드 분석
     */
    private getTrends;
    /**
     * 인사이트 생성
     */
    private generateInsights;
    private calculateLongestStreak;
    private analyzeDifficultyPerformance;
    private calculateWeeklyProgress;
    private calculateMonthlyProgress;
    private calculateImprovementTrend;
}
//# sourceMappingURL=GetStudentReviewStatsUseCase.d.ts.map