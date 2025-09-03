import { UseCase } from '../../use-cases/UseCase';
import { Result } from '../../../domain';
import { RewardRedemptionDto } from '../dto/RewardDto';
import { 
  RewardRedemptionService,
  StudentId,
  RewardCode
} from '../../../domain';

interface RedeemRewardRequest {
  studentId: string;
  rewardCode: string;
}

type RedeemRewardResponse = Result<RewardRedemptionDto>;

export class RedeemRewardUseCase implements UseCase<RedeemRewardRequest, RedeemRewardResponse> {
  constructor(
    private rewardRedemptionService: RewardRedemptionService
  ) {}

  async execute(request: RedeemRewardRequest): Promise<RedeemRewardResponse> {
    // 입력 검증
    const studentIdResult = StudentId.create(request.studentId);
    if (studentIdResult.isFailure) {
      return Result.fail(studentIdResult.getErrorValue());
    }

    const rewardCodeResult = RewardCode.create(request.rewardCode);
    if (rewardCodeResult.isFailure) {
      return Result.fail(rewardCodeResult.getErrorValue());
    }

    const studentId = studentIdResult.getValue();
    const rewardCode = rewardCodeResult.getValue();

    try {
      // 보상 교환 실행
      const redemptionResult = await this.rewardRedemptionService.redeemReward(
        studentId,
        rewardCode
      );

      if (redemptionResult.isFailure) {
        return Result.fail(redemptionResult.getErrorValue());
      }

      const result = redemptionResult.getValue();

      // DTO 변환
      const redemptionDto: RewardRedemptionDto = {
        id: result.redemption.id.toString(),
        studentId: result.redemption.studentId.value,
        rewardId: result.redemption.rewardId.toString(),
        reward: {
          id: result.reward.id.toString(),
          code: result.reward.code.value,
          name: result.reward.name.value,
          description: result.reward.description.value,
          category: result.reward.category,
          tokenCost: result.reward.tokenCost.value,
          maxRedemptions: result.reward.maxRedemptions,
          currentRedemptions: result.reward.currentRedemptions,
          remainingStock: result.reward.getRemainingStock(),
          isActive: result.reward.isActive,
          iconUrl: result.reward.iconUrl,
          expiresAt: result.reward.expiresAt?.toISOString(),
          createdAt: result.reward.createdAt.toISOString(),
          isAvailable: true,
          canAfford: true
        },
        tokenCost: result.redemption.tokenCost.value,
        status: result.redemption.status,
        redeemedAt: result.redemption.redeemedAt.toISOString(),
        completedAt: result.redemption.completedAt?.toISOString(),
        failureReason: result.redemption.failureReason,
        processingTimeMinutes: result.redemption.getProcessingTimeInMinutes()
      };

      return Result.ok(redemptionDto);

    } catch (error) {
      return Result.fail(`Failed to redeem reward: ${error}`);
    }
  }
}