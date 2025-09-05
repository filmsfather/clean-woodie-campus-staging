import { UseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
import { LeaderboardSummaryDto } from '../dto/LeaderboardDto';
import { LeaderboardService } from '@woodie/domain';
interface GetLeaderboardsRequest {
    studentId?: string;
    limit?: number;
}
type GetLeaderboardsResponse = LeaderboardSummaryDto;
export declare class GetLeaderboardsUseCase implements UseCase<GetLeaderboardsRequest, GetLeaderboardsResponse> {
    private leaderboardService;
    constructor(leaderboardService: LeaderboardService);
    execute(request: GetLeaderboardsRequest): Promise<Result<GetLeaderboardsResponse>>;
    private getUserRankings;
}
export {};
//# sourceMappingURL=GetLeaderboardsUseCase.d.ts.map