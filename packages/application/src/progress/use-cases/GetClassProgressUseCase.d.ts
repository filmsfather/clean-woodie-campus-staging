import { BaseUseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
import { ProgressTrackingApplicationService } from '../services/ProgressTrackingApplicationService';
import { ClassProgressDto } from '../dto/ProgressDto';
export interface GetClassProgressRequest {
    classId: string;
    problemSetId?: string;
    teacherId?: string;
    includeDetails?: boolean;
    sortBy?: 'name' | 'streak' | 'completion' | 'accuracy';
    sortOrder?: 'asc' | 'desc';
}
export interface GetClassProgressResponse {
    classProgress: ClassProgressDto;
    insights: Array<{
        type: 'high_performer' | 'needs_attention' | 'streak_leader' | 'improvement_needed';
        studentId: string;
        message: string;
        priority: 'low' | 'medium' | 'high';
        suggestions?: string[];
    }>;
    summary: {
        totalStudents: number;
        engagementLevel: 'high' | 'medium' | 'low';
        averagePerformance: {
            completionRate: number;
            accuracyRate: number;
            currentStreak: number;
        };
        recommendations: Array<{
            action: string;
            reason: string;
            targetStudents?: string[];
        }>;
    };
}
/**
 * 클래스 진도 현황 조회 UseCase
 *
 * 비즈니스 규칙:
 * - 교사는 자신이 담당하는 클래스만 조회 가능
 * - 관리자는 모든 클래스 조회 가능
 * - 학생 개인정보는 적절히 마스킹하여 제공
 * - 성과 분석과 인사이트를 함께 제공
 */
export declare class GetClassProgressUseCase extends BaseUseCase<GetClassProgressRequest, GetClassProgressResponse> {
    private progressService;
    constructor(progressService: ProgressTrackingApplicationService);
    execute(request: GetClassProgressRequest): Promise<Result<GetClassProgressResponse>>;
    private validateRequest;
    private checkAuthorization;
    private applySorting;
    private generateInsights;
    private generateSummary;
}
//# sourceMappingURL=GetClassProgressUseCase.d.ts.map