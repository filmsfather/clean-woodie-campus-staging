import { Result } from '../../common/Result';
import { Reward } from '../entities/Reward';
import { RewardRedemption, RedemptionStatus } from '../entities/RewardRedemption';
import { RewardCode } from '../value-objects/RewardCode';
import { StudentId } from '../../assignments/value-objects/StudentId';
import { UniqueEntityID } from '../../common/Identifier';
import { IRewardRepository } from '../repositories/IRewardRepository';
import { IRewardRedemptionRepository } from '../repositories/IRewardRedemptionRepository';
import { ITokenRepository } from '../repositories/ITokenRepository';
import { IClock } from '../../srs/services/IClock';
export interface RedemptionResult {
    redemption: RewardRedemption;
    reward: Reward;
    success: boolean;
    message: string;
}
export declare class RewardRedemptionService {
    private rewardRepository;
    private redemptionRepository;
    private tokenRepository;
    private clock;
    constructor(rewardRepository: IRewardRepository, redemptionRepository: IRewardRedemptionRepository, tokenRepository: ITokenRepository, clock: IClock);
    /**
     * 보상을 교환합니다
     */
    redeemReward(studentId: StudentId, rewardCode: RewardCode): Promise<Result<RedemptionResult>>;
    /**
     * 교환을 완료 처리합니다
     */
    completeRedemption(redemptionId: UniqueEntityID): Promise<Result<void>>;
    /**
     * 교환을 실패 처리합니다
     */
    failRedemption(redemptionId: UniqueEntityID, reason: string): Promise<Result<void>>;
    /**
     * 교환을 취소합니다
     */
    cancelRedemption(redemptionId: UniqueEntityID): Promise<Result<void>>;
    /**
     * 학생의 교환 이력을 조회합니다
     */
    getStudentRedemptionHistory(studentId: StudentId, status?: RedemptionStatus, limit?: number): Promise<Result<RewardRedemption[]>>;
    /**
     * 사용 가능한 보상 목록을 조회합니다
     */
    getAvailableRewards(): Promise<Result<Reward[]>>;
    /**
     * 학생이 교환 가능한 보상들을 조회합니다 (토큰 잔액 고려)
     */
    getAffordableRewards(studentId: StudentId): Promise<Result<Reward[]>>;
    /**
     * 처리 대기 중인 교환들을 조회합니다
     */
    getPendingRedemptions(limit?: number): Promise<Result<RewardRedemption[]>>;
    /**
     * 교환 통계를 조회합니다
     */
    getRedemptionStats(studentId?: StudentId, rewardId?: UniqueEntityID, startDate?: Date, endDate?: Date): Promise<Result<any>>;
    /**
     * 토큰을 환불합니다 (private method)
     */
    private refundTokens;
}
//# sourceMappingURL=RewardRedemptionService.d.ts.map