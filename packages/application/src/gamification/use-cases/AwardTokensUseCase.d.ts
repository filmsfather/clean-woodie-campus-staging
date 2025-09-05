import { UseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
import { TokenDto } from '../dto/TokenDto';
import { TokenService, AchievementService } from '@woodie/domain';
interface AwardTokensRequest {
    studentId: string;
    amount: number;
    reason: string;
    checkAchievements?: boolean;
}
type AwardTokensResponse = TokenDto;
export declare class AwardTokensUseCase implements UseCase<AwardTokensRequest, AwardTokensResponse> {
    private tokenService;
    private achievementService;
    constructor(tokenService: TokenService, achievementService: AchievementService);
    execute(request: AwardTokensRequest): Promise<Result<AwardTokensResponse>>;
}
export {};
//# sourceMappingURL=AwardTokensUseCase.d.ts.map