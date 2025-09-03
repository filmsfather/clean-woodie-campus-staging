import { Result } from '../../common/Result';
import { Token } from '../entities/Token';
import { TokenAmount } from '../value-objects/TokenAmount';
export class TokenService {
    tokenRepository;
    clock;
    constructor(tokenRepository, clock) {
        this.tokenRepository = tokenRepository;
        this.clock = clock;
    }
    /**
     * 학생에게 토큰을 지급합니다
     */
    async awardTokens(studentId, amount, reason) {
        // 기존 토큰 정보 조회
        const existingTokenResult = await this.tokenRepository.findByStudentId(studentId);
        let token;
        if (existingTokenResult.isFailure) {
            // 새 토큰 계정 생성
            const zeroAmount = TokenAmount.create(0);
            if (zeroAmount.isFailure) {
                return Result.fail(zeroAmount.getErrorValue());
            }
            const tokenResult = Token.create({
                studentId,
                balance: zeroAmount.getValue(),
                totalEarned: zeroAmount.getValue(),
                totalSpent: zeroAmount.getValue(),
                updatedAt: this.clock.now()
            });
            if (tokenResult.isFailure) {
                return Result.fail(tokenResult.getErrorValue());
            }
            token = tokenResult.getValue();
        }
        else {
            token = existingTokenResult.getValue();
        }
        // 토큰 지급
        const addResult = token.addTokens(amount, reason, this.clock);
        if (addResult.isFailure) {
            return Result.fail(addResult.getErrorValue());
        }
        // 저장
        const saveResult = await this.tokenRepository.save(token);
        if (saveResult.isFailure) {
            return Result.fail(saveResult.getErrorValue());
        }
        return Result.ok(token);
    }
    /**
     * 학생의 토큰을 차감합니다
     */
    async spendTokens(studentId, amount, reason) {
        // 토큰 정보 조회
        const tokenResult = await this.tokenRepository.findByStudentId(studentId);
        if (tokenResult.isFailure) {
            return Result.fail('Token account not found');
        }
        const token = tokenResult.getValue();
        // 잔액 확인
        if (!token.canSpend(amount)) {
            return Result.fail('Insufficient token balance');
        }
        // 토큰 차감
        const spendResult = token.spendTokens(amount, reason, this.clock);
        if (spendResult.isFailure) {
            return Result.fail(spendResult.getErrorValue());
        }
        // 저장
        const saveResult = await this.tokenRepository.save(token);
        if (saveResult.isFailure) {
            return Result.fail(saveResult.getErrorValue());
        }
        return Result.ok(token);
    }
    /**
     * 학생의 토큰 정보를 조회합니다
     */
    async getTokenInfo(studentId) {
        return await this.tokenRepository.findByStudentId(studentId);
    }
    /**
     * 토큰 잔액을 확인합니다
     */
    async checkBalance(studentId, requiredAmount) {
        const tokenResult = await this.tokenRepository.findByStudentId(studentId);
        if (tokenResult.isFailure) {
            return Result.ok(false);
        }
        const token = tokenResult.getValue();
        return Result.ok(token.canSpend(requiredAmount));
    }
    /**
     * 리더보드를 조회합니다
     */
    async getLeaderboard(type, limit = 10) {
        if (type === 'balance') {
            return await this.tokenRepository.getLeaderboardByBalance(limit);
        }
        else {
            return await this.tokenRepository.getLeaderboardByTotalEarned(limit);
        }
    }
}
//# sourceMappingURL=TokenService.js.map