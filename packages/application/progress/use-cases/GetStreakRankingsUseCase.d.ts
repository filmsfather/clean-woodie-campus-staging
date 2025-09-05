import { BaseUseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
import { ProgressTrackingApplicationService } from '../services/ProgressTrackingApplicationService';
import { StreakRankingDto } from '../dto/ProgressDto';
export interface GetStreakRankingsRequest {
    limit?: number;
    studentId?: string;
    requesterId?: string;
    requesterRole?: 'student' | 'teacher' | 'admin';
    classId?: string;
}
export interface GetStreakRankingsResponse {
    rankings: StreakRankingDto;
    filters: {
        limit: number;
        isClassSpecific: boolean;
        classId?: string;
    };
}
/**
 * 스트릭 순위 조회 UseCase
 *
 * 비즈니스 규칙:
 * - 전체 또는 클래스별 스트릭 순위 제공
 * - 본인 순위는 항상 포함하여 제공
 * - 개인정보 보호를 위해 학생명은 마스킹 처리
 * - 순위는 현재 스트릭 기준으로 정렬
 */
export declare class GetStreakRankingsUseCase extends BaseUseCase<GetStreakRankingsRequest, GetStreakRankingsResponse> {
    private progressService;
    constructor(progressService: ProgressTrackingApplicationService);
    execute(request: GetStreakRankingsRequest): Promise<Result<GetStreakRankingsResponse>>;
    private validateRequest;
    private checkAuthorization;
    private filterByClass;
}
//# sourceMappingURL=GetStreakRankingsUseCase.d.ts.map