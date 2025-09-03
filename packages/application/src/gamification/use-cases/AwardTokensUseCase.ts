import { UseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
import { TokenDto } from '../dto/TokenDto';
import { 
  TokenService,
  AchievementService,
  StudentId,
  TokenAmount,
  TokenReason
} from '@woodie/domain';

interface AwardTokensRequest {
  studentId: string;
  amount: number;
  reason: string;
  checkAchievements?: boolean;
}

type AwardTokensResponse = TokenDto;

export class AwardTokensUseCase implements UseCase<AwardTokensRequest, AwardTokensResponse> {
  constructor(
    private tokenService: TokenService,
    private achievementService: AchievementService
  ) {}

  async execute(request: AwardTokensRequest): Promise<Result<AwardTokensResponse>> {
    // 입력 검증
    const studentIdResult = StudentId.create(request.studentId);
    if (studentIdResult.isFailure) {
      return Result.fail(studentIdResult.getErrorValue());
    }

    const tokenAmountResult = TokenAmount.create(request.amount);
    if (tokenAmountResult.isFailure) {
      return Result.fail(tokenAmountResult.getErrorValue());
    }

    const tokenReasonResult = TokenReason.create(request.reason);
    if (tokenReasonResult.isFailure) {
      return Result.fail(tokenReasonResult.getErrorValue());
    }

    const studentId = studentIdResult.getValue();
    const amount = tokenAmountResult.getValue();
    const reason = tokenReasonResult.getValue();

    try {
      // 토큰 지급
      const tokenResult = await this.tokenService.awardTokens(studentId, amount, reason);
      if (tokenResult.isFailure) {
        return Result.fail(tokenResult.getErrorValue());
      }

      const token = tokenResult.getValue();

      // 토큰 관련 업적 확인 (옵션)
      if (request.checkAchievements !== false) {
        await this.achievementService.checkTokenAchievements(
          studentId, 
          token.totalEarned.value
        );
      }

      // DTO 변환
      const tokenDto: TokenDto = {
        id: token.id.toString(),
        studentId: token.studentId.value,
        balance: token.balance.value,
        totalEarned: token.totalEarned.value,
        totalSpent: token.totalSpent.value,
        updatedAt: token.updatedAt.toISOString()
      };

      return Result.ok(tokenDto);

    } catch (error) {
      return Result.fail(`Failed to award tokens: ${error}`);
    }
  }
}