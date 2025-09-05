import { BaseUseCase } from '../../use-cases/UseCase';
import { Result, IProblemSetRepository } from '@woodie/domain';
/**
 * 문제집 통계 조회 UseCase
 *
 * 비즈니스 규칙:
 * - 교사는 자신의 문제집 통계를 조회할 수 있음
 * - 관리자는 모든 문제집 통계를 조회할 수 있음
 * - 학생은 접근 권한이 없음
 * - 통계에는 사용 현황, 성능 지표, 문제별 분석 포함
 * - 기간별 필터링 지원
 */
export interface GetProblemSetStatisticsRequest {
    problemSetId: string;
    requesterId: string;
    requesterRole: 'teacher' | 'admin';
    dateRange?: {
        startDate: Date;
        endDate: Date;
    };
    includeDetailedAnalysis?: boolean;
    includeProblemBreakdown?: boolean;
}
export interface GetProblemSetStatisticsResponse {
    problemSet: {
        id: string;
        title: string;
        teacherId: string;
        teacherName?: string;
        itemCount: number;
        totalPoints: number;
        createdAt: Date;
        lastModified: Date;
    };
    usageStatistics: {
        totalAssignments: number;
        activeAssignments: number;
        completedAssignments: number;
        totalStudentsAssigned: number;
        uniqueStudentsAttempted: number;
        totalAttempts: number;
        completionRate: number;
        averageScore: number;
        averageTimeSpent: number;
    };
    performanceMetrics: {
        difficultyRating: number;
        studentFeedbackScore: number;
        teacherRating: number;
        retryRate: number;
        dropoutRate: number;
        timeEfficiency: number;
    };
    problemAnalysis?: Array<{
        problemId: string;
        problemTitle: string;
        orderIndex: number;
        attempts: number;
        correctAttempts: number;
        accuracyRate: number;
        averageTimeSpent: number;
        difficultyPerception: 'easy' | 'medium' | 'hard';
        commonMistakes: string[];
        skipRate: number;
    }>;
    trendData: {
        dailyUsage: Array<{
            date: string;
            attempts: number;
            completions: number;
            averageScore: number;
        }>;
        monthlyProgress: Array<{
            month: string;
            totalStudents: number;
            completionRate: number;
            averageScore: number;
        }>;
    };
    comparativeAnalysis?: {
        similarProblemSets: Array<{
            id: string;
            title: string;
            completionRate: number;
            averageScore: number;
            difficulty: number;
        }>;
        teacherAverage: {
            completionRate: number;
            averageScore: number;
            studentSatisfaction: number;
        };
        schoolAverage?: {
            completionRate: number;
            averageScore: number;
            studentSatisfaction: number;
        };
    };
    recommendations: Array<{
        type: 'difficulty' | 'content' | 'structure' | 'timing';
        priority: 'high' | 'medium' | 'low';
        message: string;
        actionSuggestion?: string;
    }>;
}
export declare class GetProblemSetStatisticsUseCase extends BaseUseCase<GetProblemSetStatisticsRequest, GetProblemSetStatisticsResponse> {
    private problemSetRepository;
    constructor(problemSetRepository: IProblemSetRepository);
    execute(request: GetProblemSetStatisticsRequest): Promise<Result<GetProblemSetStatisticsResponse>>;
    private validateRequest;
    private hasAccessPermission;
    private collectUsageStatistics;
    private calculatePerformanceMetrics;
    private analyzeProblemPerformance;
    private generateTrendData;
    private performComparativeAnalysis;
    private generateRecommendations;
    private calculateTotalPoints;
}
//# sourceMappingURL=GetProblemSetStatisticsUseCase.d.ts.map