import { AggregateRoot } from '../../aggregates/AggregateRoot';
import { Result } from '../../common/Result';
import { RewardRedeemedEvent } from '../events/RewardRedeemedEvent';
export var RedemptionStatus;
(function (RedemptionStatus) {
    RedemptionStatus["PENDING"] = "pending";
    RedemptionStatus["COMPLETED"] = "completed";
    RedemptionStatus["FAILED"] = "failed";
    RedemptionStatus["CANCELLED"] = "cancelled";
})(RedemptionStatus || (RedemptionStatus = {}));
/**
 * 보상 교환 기록 엔티티
 * 학생의 보상 교환 내역을 나타냅니다
 */
export class RewardRedemption extends AggregateRoot {
    get studentId() {
        return this.props.studentId;
    }
    get rewardId() {
        return this.props.rewardId;
    }
    get tokenCost() {
        return this.props.tokenCost;
    }
    get status() {
        return this.props.status;
    }
    get redeemedAt() {
        return this.props.redeemedAt;
    }
    get completedAt() {
        return this.props.completedAt;
    }
    get failureReason() {
        return this.props.failureReason;
    }
    static create(props, id) {
        // 비즈니스 규칙 검증
        if (props.tokenCost.value <= 0) {
            return Result.fail('Token cost must be positive');
        }
        if (props.completedAt && props.completedAt < props.redeemedAt) {
            return Result.fail('Completion date cannot be before redemption date');
        }
        if (props.status === RedemptionStatus.FAILED && !props.failureReason) {
            return Result.fail('Failure reason is required for failed redemptions');
        }
        if (props.status === RedemptionStatus.COMPLETED && !props.completedAt) {
            return Result.fail('Completion date is required for completed redemptions');
        }
        if (!Object.values(RedemptionStatus).includes(props.status)) {
            return Result.fail('Invalid redemption status');
        }
        const redemption = new RewardRedemption(props, id);
        return Result.ok(redemption);
    }
    /**
     * 새 보상 교환을 생성하고 이벤트를 발생시킵니다
     */
    static createAndNotify(studentId, rewardId, tokenCost, clock, id) {
        const props = {
            studentId,
            rewardId,
            tokenCost,
            status: RedemptionStatus.PENDING,
            redeemedAt: clock.now()
        };
        const redemptionResult = RewardRedemption.create(props, id);
        if (redemptionResult.isFailure) {
            return Result.fail(redemptionResult.getErrorValue());
        }
        const redemption = redemptionResult.getValue();
        // 보상 교환 이벤트 발생
        const event = new RewardRedeemedEvent(studentId, rewardId, redemption.id, tokenCost.value, props.redeemedAt);
        redemption.addDomainEvent(event);
        return Result.ok(redemption);
    }
    /**
     * 교환을 완료 처리합니다
     */
    complete(clock) {
        if (this.props.status !== RedemptionStatus.PENDING) {
            return Result.fail('Only pending redemptions can be completed');
        }
        this.props.status = RedemptionStatus.COMPLETED;
        this.props.completedAt = clock.now();
        this.props.failureReason = undefined;
        return Result.ok();
    }
    /**
     * 교환을 실패 처리합니다
     */
    fail(reason, clock) {
        if (this.props.status !== RedemptionStatus.PENDING) {
            return Result.fail('Only pending redemptions can be failed');
        }
        if (!reason || reason.trim().length === 0) {
            return Result.fail('Failure reason cannot be empty');
        }
        this.props.status = RedemptionStatus.FAILED;
        this.props.failureReason = reason.trim();
        this.props.completedAt = clock.now();
        return Result.ok();
    }
    /**
     * 교환을 취소합니다
     */
    cancel(clock) {
        if (this.props.status !== RedemptionStatus.PENDING) {
            return Result.fail('Only pending redemptions can be cancelled');
        }
        this.props.status = RedemptionStatus.CANCELLED;
        this.props.completedAt = clock.now();
        this.props.failureReason = undefined;
        return Result.ok();
    }
    /**
     * 처리 중인지 확인합니다
     */
    isPending() {
        return this.props.status === RedemptionStatus.PENDING;
    }
    /**
     * 성공적으로 완료되었는지 확인합니다
     */
    isCompleted() {
        return this.props.status === RedemptionStatus.COMPLETED;
    }
    /**
     * 실패했는지 확인합니다
     */
    isFailed() {
        return this.props.status === RedemptionStatus.FAILED;
    }
    /**
     * 취소되었는지 확인합니다
     */
    isCancelled() {
        return this.props.status === RedemptionStatus.CANCELLED;
    }
    /**
     * 처리 완료되었는지 확인합니다 (완료, 실패, 취소 모두 포함)
     */
    isFinished() {
        return this.props.status !== RedemptionStatus.PENDING;
    }
    /**
     * 교환 소요 시간을 계산합니다 (분 단위)
     */
    getProcessingTimeInMinutes() {
        if (!this.props.completedAt) {
            return null;
        }
        const timeDiff = this.props.completedAt.getTime() - this.props.redeemedAt.getTime();
        return Math.round(timeDiff / (1000 * 60));
    }
}
//# sourceMappingURL=RewardRedemption.js.map