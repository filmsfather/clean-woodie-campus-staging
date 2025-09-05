import { AggregateRoot } from '../../aggregates/AggregateRoot';
import { UniqueEntityID } from '../../common/Identifier';
import { Result } from '../../common/Result';
import { StudentId } from '../../assignments/value-objects/StudentId';
import { TokenAmount } from '../value-objects/TokenAmount';
import { IClock } from '../../srs/services/IClock';
export declare enum RedemptionStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export interface RewardRedemptionProps {
    studentId: StudentId;
    rewardId: UniqueEntityID;
    tokenCost: TokenAmount;
    status: RedemptionStatus;
    redeemedAt: Date;
    completedAt?: Date;
    failureReason?: string;
}
/**
 * 보상 교환 기록 엔티티
 * 학생의 보상 교환 내역을 나타냅니다
 */
export declare class RewardRedemption extends AggregateRoot<RewardRedemptionProps> {
    get studentId(): StudentId;
    get rewardId(): UniqueEntityID;
    get tokenCost(): TokenAmount;
    get status(): RedemptionStatus;
    get redeemedAt(): Date;
    get completedAt(): Date | undefined;
    get failureReason(): string | undefined;
    static create(props: RewardRedemptionProps, id?: UniqueEntityID): Result<RewardRedemption>;
    /**
     * 새 보상 교환을 생성하고 이벤트를 발생시킵니다
     */
    static createAndNotify(studentId: StudentId, rewardId: UniqueEntityID, tokenCost: TokenAmount, clock: IClock, id?: UniqueEntityID): Result<RewardRedemption>;
    /**
     * 교환을 완료 처리합니다
     */
    complete(clock: IClock): Result<void>;
    /**
     * 교환을 실패 처리합니다
     */
    fail(reason: string, clock: IClock): Result<void>;
    /**
     * 교환을 취소합니다
     */
    cancel(clock: IClock): Result<void>;
    /**
     * 처리 중인지 확인합니다
     */
    isPending(): boolean;
    /**
     * 성공적으로 완료되었는지 확인합니다
     */
    isCompleted(): boolean;
    /**
     * 실패했는지 확인합니다
     */
    isFailed(): boolean;
    /**
     * 취소되었는지 확인합니다
     */
    isCancelled(): boolean;
    /**
     * 처리 완료되었는지 확인합니다 (완료, 실패, 취소 모두 포함)
     */
    isFinished(): boolean;
    /**
     * 교환 소요 시간을 계산합니다 (분 단위)
     */
    getProcessingTimeInMinutes(): number | null;
}
//# sourceMappingURL=RewardRedemption.d.ts.map