import { Result } from '@woodie/domain';
import { StudentId, TokenAmount, TokenReason } from '@woodie/domain';
export class AwardTokensUseCase {
    tokenService;
    achievementService;
    constructor(tokenService, achievementService) {
        this.tokenService = tokenService;
        this.achievementService = achievementService;
    }
    async execute(request) {
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
                await this.achievementService.checkTokenAchievements(studentId, token.totalEarned.value);
            }
            // DTO 변환
            const tokenDto = {
                id: token.id.toString(),
                studentId: token.studentId.value,
                balance: token.balance.value,
                totalEarned: token.totalEarned.value,
                totalSpent: token.totalSpent.value,
                updatedAt: token.updatedAt.toISOString()
            };
            return Result.ok(tokenDto);
        }
        catch (error) {
            return Result.fail(`Failed to award tokens: ${error}`);
        }
    }
}
//# sourceMappingURL=AwardTokensUseCase.js.map