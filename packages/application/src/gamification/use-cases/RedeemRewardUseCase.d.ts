import { UseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
import { RewardRedemptionDto } from '../dto/RewardDto';
import { RewardRedemptionService } from '@woodie/domain';
interface RedeemRewardRequest {
    studentId: string;
    rewardCode: string;
}
type RedeemRewardResponse = RewardRedemptionDto;
export declare class RedeemRewardUseCase implements UseCase<RedeemRewardRequest, RedeemRewardResponse> {
    private rewardRedemptionService;
    constructor(rewardRedemptionService: RewardRedemptionService);
    execute(request: RedeemRewardRequest): Promise<Result<RedeemRewardResponse>>;
}
export {};
//# sourceMappingURL=RedeemRewardUseCase.d.ts.map