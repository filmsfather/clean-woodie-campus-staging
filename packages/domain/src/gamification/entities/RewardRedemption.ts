import { AggregateRoot } from '../../aggregates/AggregateRoot';
import { UniqueEntityID } from '../../common/Identifier';
import { Result } from '../../common/Result';
import { StudentId } from '../../assignments/value-objects/StudentId';
import { TokenAmount } from '../value-objects/TokenAmount';
import { RewardRedeemedEvent } from '../events/RewardRedeemedEvent';
import { IClock } from '../../srs/services/IClock';

export enum RedemptionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
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
export class RewardRedemption extends AggregateRoot<RewardRedemptionProps> {
  get studentId(): StudentId {
    return this.props.studentId;
  }

  get rewardId(): UniqueEntityID {
    return this.props.rewardId;
  }

  get tokenCost(): TokenAmount {
    return this.props.tokenCost;
  }

  get status(): RedemptionStatus {
    return this.props.status;
  }

  get redeemedAt(): Date {
    return this.props.redeemedAt;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get failureReason(): string | undefined {
    return this.props.failureReason;
  }

  public static create(props: RewardRedemptionProps, id?: UniqueEntityID): Result<RewardRedemption> {
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
  public static createAndNotify(
    studentId: StudentId,
    rewardId: UniqueEntityID,
    tokenCost: TokenAmount,
    clock: IClock,
    id?: UniqueEntityID
  ): Result<RewardRedemption> {
    const props: RewardRedemptionProps = {
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
    const event = new RewardRedeemedEvent(
      studentId,
      rewardId,
      redemption.id,
      tokenCost.value,
      props.redeemedAt
    );
    redemption.addDomainEvent(event);

    return Result.ok(redemption);
  }

  /**
   * 교환을 완료 처리합니다
   */
  public complete(clock: IClock): Result<void> {
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
  public fail(reason: string, clock: IClock): Result<void> {
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
  public cancel(clock: IClock): Result<void> {
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
  public isPending(): boolean {
    return this.props.status === RedemptionStatus.PENDING;
  }

  /**
   * 성공적으로 완료되었는지 확인합니다
   */
  public isCompleted(): boolean {
    return this.props.status === RedemptionStatus.COMPLETED;
  }

  /**
   * 실패했는지 확인합니다
   */
  public isFailed(): boolean {
    return this.props.status === RedemptionStatus.FAILED;
  }

  /**
   * 취소되었는지 확인합니다
   */
  public isCancelled(): boolean {
    return this.props.status === RedemptionStatus.CANCELLED;
  }

  /**
   * 처리 완료되었는지 확인합니다 (완료, 실패, 취소 모두 포함)
   */
  public isFinished(): boolean {
    return this.props.status !== RedemptionStatus.PENDING;
  }

  /**
   * 교환 소요 시간을 계산합니다 (분 단위)
   */
  public getProcessingTimeInMinutes(): number | null {
    if (!this.props.completedAt) {
      return null;
    }

    const timeDiff = this.props.completedAt.getTime() - this.props.redeemedAt.getTime();
    return Math.round(timeDiff / (1000 * 60));
  }
}