import { Result } from '../../common/Result';
import { RewardRedemption } from '../entities/RewardRedemption';
import { TokenReason } from '../value-objects/TokenReason';
export class RewardRedemptionService {
    rewardRepository;
    redemptionRepository;
    tokenRepository;
    clock;
    constructor(rewardRepository, redemptionRepository, tokenRepository, clock) {
        this.rewardRepository = rewardRepository;
        this.redemptionRepository = redemptionRepository;
        this.tokenRepository = tokenRepository;
        this.clock = clock;
    }
    /**
     * 보상을 교환합니다
     */
    async redeemReward(studentId, rewardCode) {
        // 1. 보상 조회
        const rewardResult = await this.rewardRepository.findByCode(rewardCode);
        if (rewardResult.isFailure) {
            return Result.fail(`Reward ${rewardCode.value} not found`);
        }
        const reward = rewardResult.getValue();
        // 2. 교환 가능 여부 확인
        const availabilityResult = reward.isAvailableForRedemption(this.clock.now());
        if (availabilityResult.isFailure) {
            return Result.fail(availabilityResult.getErrorValue());
        }
        if (!availabilityResult.getValue()) {
            return Result.fail('Reward is not available for redemption');
        }
        // 3. 학생의 토큰 잔액 확인
        const tokenResult = await this.tokenRepository.findByStudentId(studentId);
        if (tokenResult.isFailure) {
            return Result.fail('Token account not found');
        }
        const token = tokenResult.getValue();
        if (!token.canSpend(reward.tokenCost)) {
            return Result.fail('Insufficient token balance');
        }
        // 4. 교환 기록 생성
        const redemptionResult = RewardRedemption.createAndNotify(studentId, reward.id, reward.tokenCost, this.clock);
        if (redemptionResult.isFailure) {
            return Result.fail(redemptionResult.getErrorValue());
        }
        const redemption = redemptionResult.getValue();
        // 5. 토큰 차감
        const reasonResult = TokenReason.create(`Reward: ${reward.name.value}`);
        if (reasonResult.isFailure) {
            return Result.fail(reasonResult.getErrorValue());
        }
        const spendResult = token.spendTokens(reward.tokenCost, reasonResult.getValue(), this.clock);
        if (spendResult.isFailure) {
            return Result.fail(spendResult.getErrorValue());
        }
        // 6. 보상 교환 횟수 증가
        const incrementResult = reward.incrementRedemption();
        if (incrementResult.isFailure) {
            // 토큰 차감을 롤백해야 하지만, 여기서는 단순화
            return Result.fail(incrementResult.getErrorValue());
        }
        // 7. 데이터 저장
        const saveTokenResult = await this.tokenRepository.save(token);
        if (saveTokenResult.isFailure) {
            return Result.fail(saveTokenResult.getErrorValue());
        }
        const saveRewardResult = await this.rewardRepository.save(reward);
        if (saveRewardResult.isFailure) {
            return Result.fail(saveRewardResult.getErrorValue());
        }
        const saveRedemptionResult = await this.redemptionRepository.save(redemption);
        if (saveRedemptionResult.isFailure) {
            return Result.fail(saveRedemptionResult.getErrorValue());
        }
        return Result.ok({
            redemption,
            reward,
            success: true,
            message: 'Reward redeemed successfully'
        });
    }
    /**
     * 교환을 완료 처리합니다
     */
    async completeRedemption(redemptionId) {
        const redemptionResult = await this.redemptionRepository.findById(redemptionId);
        if (redemptionResult.isFailure) {
            return Result.fail('Redemption not found');
        }
        const redemption = redemptionResult.getValue();
        const completeResult = redemption.complete(this.clock);
        if (completeResult.isFailure) {
            return Result.fail(completeResult.getErrorValue());
        }
        const saveResult = await this.redemptionRepository.save(redemption);
        if (saveResult.isFailure) {
            return Result.fail(saveResult.getErrorValue());
        }
        return Result.ok();
    }
    /**
     * 교환을 실패 처리합니다
     */
    async failRedemption(redemptionId, reason) {
        const redemptionResult = await this.redemptionRepository.findById(redemptionId);
        if (redemptionResult.isFailure) {
            return Result.fail('Redemption not found');
        }
        const redemption = redemptionResult.getValue();
        const failResult = redemption.fail(reason, this.clock);
        if (failResult.isFailure) {
            return Result.fail(failResult.getErrorValue());
        }
        // 실패한 경우 토큰 환불 처리
        const refundResult = await this.refundTokens(redemption);
        if (refundResult.isFailure) {
            return Result.fail(refundResult.getErrorValue());
        }
        const saveResult = await this.redemptionRepository.save(redemption);
        if (saveResult.isFailure) {
            return Result.fail(saveResult.getErrorValue());
        }
        return Result.ok();
    }
    /**
     * 교환을 취소합니다
     */
    async cancelRedemption(redemptionId) {
        const redemptionResult = await this.redemptionRepository.findById(redemptionId);
        if (redemptionResult.isFailure) {
            return Result.fail('Redemption not found');
        }
        const redemption = redemptionResult.getValue();
        const cancelResult = redemption.cancel(this.clock);
        if (cancelResult.isFailure) {
            return Result.fail(cancelResult.getErrorValue());
        }
        // 취소한 경우 토큰 환불 처리
        const refundResult = await this.refundTokens(redemption);
        if (refundResult.isFailure) {
            return Result.fail(refundResult.getErrorValue());
        }
        const saveResult = await this.redemptionRepository.save(redemption);
        if (saveResult.isFailure) {
            return Result.fail(saveResult.getErrorValue());
        }
        return Result.ok();
    }
    /**
     * 학생의 교환 이력을 조회합니다
     */
    async getStudentRedemptionHistory(studentId, status, limit) {
        return await this.redemptionRepository.findByStudentId(studentId, status, limit);
    }
    /**
     * 사용 가능한 보상 목록을 조회합니다
     */
    async getAvailableRewards() {
        return await this.rewardRepository.findAvailableRewards(this.clock.now());
    }
    /**
     * 학생이 교환 가능한 보상들을 조회합니다 (토큰 잔액 고려)
     */
    async getAffordableRewards(studentId) {
        // 학생의 토큰 잔액 조회
        const tokenResult = await this.tokenRepository.findByStudentId(studentId);
        if (tokenResult.isFailure) {
            return Result.fail('Token account not found');
        }
        const token = tokenResult.getValue();
        const balance = token.balance.value;
        // 사용 가능한 보상들 조회
        const rewardsResult = await this.getAvailableRewards();
        if (rewardsResult.isFailure) {
            return Result.fail(rewardsResult.getErrorValue());
        }
        const allRewards = rewardsResult.getValue();
        const affordableRewards = allRewards.filter(reward => reward.tokenCost.value <= balance);
        return Result.ok(affordableRewards);
    }
    /**
     * 처리 대기 중인 교환들을 조회합니다
     */
    async getPendingRedemptions(limit) {
        return await this.redemptionRepository.findPendingRedemptions(limit);
    }
    /**
     * 교환 통계를 조회합니다
     */
    async getRedemptionStats(studentId, rewardId, startDate, endDate) {
        if (studentId) {
            return await this.redemptionRepository.getStudentRedemptionStats(studentId);
        }
        if (rewardId) {
            return await this.redemptionRepository.getRewardRedemptionStats(rewardId);
        }
        if (startDate && endDate) {
            return await this.redemptionRepository.getRedemptionStatsByPeriod(startDate, endDate);
        }
        return Result.fail('Invalid parameters for stats query');
    }
    /**
     * 토큰을 환불합니다 (private method)
     */
    async refundTokens(redemption) {
        const tokenResult = await this.tokenRepository.findByStudentId(redemption.studentId);
        if (tokenResult.isFailure) {
            return Result.fail('Token account not found for refund');
        }
        const token = tokenResult.getValue();
        const reasonResult = TokenReason.create('Refund for cancelled/failed reward redemption');
        if (reasonResult.isFailure) {
            return Result.fail(reasonResult.getErrorValue());
        }
        const addResult = token.addTokens(redemption.tokenCost, reasonResult.getValue(), this.clock);
        if (addResult.isFailure) {
            return Result.fail(addResult.getErrorValue());
        }
        const saveResult = await this.tokenRepository.save(token);
        if (saveResult.isFailure) {
            return Result.fail(saveResult.getErrorValue());
        }
        return Result.ok();
    }
}
//# sourceMappingURL=RewardRedemptionService.js.map