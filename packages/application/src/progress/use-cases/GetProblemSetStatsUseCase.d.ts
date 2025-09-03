import { BaseUseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
import { ProgressTrackingApplicationService } from '../services/ProgressTrackingApplicationService';
import { ProblemSetStatsSummaryDto } from '../dto/ProgressDto';
export interface GetProblemSetStatsRequest {
    problemSetId: string;
    requesterId?: string;
    requesterRole?: 'student' | 'teacher' | 'admin';
    includeIndividualStats?: boolean;
    sortBy?: 'completion' | 'accuracy' | 'efficiency';
    sortOrder?: 'asc' | 'desc';
}
export interface GetProblemSetStatsResponse {
    summary: ProblemSetStatsSummaryDto;
    insights: Array<{
        type: 'high_completion' | 'low_completion' | 'high_accuracy' | 'low_accuracy' | 'time_efficiency';
        message: string;
        value: number;
        threshold: number;
        recommendation?: string;
    }>;
    comparisons: {
        classAverage: {
            completionRate: number;
            accuracyRate: number;
            averageTime: number;
        };
        schoolAverage?: {
            completionRate: number;
            accuracyRate: number;
            averageTime: number;
        };
    };
}
/**
 * 문제집 통계 조회 UseCase
 *
 * 비즈니스 규칙:
 * - 교사는 자신이 관리하는 문제집 통계만 조회 가능
 * - 관리자는 모든 문제집 통계 조회 가능
 * - 학생은 자신이 참여한 문제집의 제한된 통계만 조회 가능
 * - 통계 분석 및 개선 인사이트 제공
 */
export declare class GetProblemSetStatsUseCase extends BaseUseCase<GetProblemSetStatsRequest, GetProblemSetStatsResponse> {
    private progressService;
    constructor(progressService: ProgressTrackingApplicationService);
    execute(request: GetProblemSetStatsRequest): Promise<Result<GetProblemSetStatsResponse>>;
    private validateRequest;
    private checkAuthorization;
    private generateInsights;
    private generateComparisons;
    private applySorting;
}
//# sourceMappingURL=GetProblemSetStatsUseCase.d.ts.map