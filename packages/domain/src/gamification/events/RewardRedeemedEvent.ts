import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';
import { StudentId } from '../../assignments/value-objects/StudentId';

/**
 * 보상 교환 이벤트
 * 학생이 보상을 교환했을 때 발생하는 도메인 이벤트
 * 
 * 사용 시나리오:
 * - 토큰 차감 처리
 * - 보상 재고 관리
 * - 알림 발송
 * - 통계 업데이트
 * - 교환 기록 추적
 */
export class RewardRedeemedEvent extends BaseDomainEvent {
  public readonly eventType = 'RewardRedeemed';

  constructor(
    public readonly studentId: StudentId,
    public readonly rewardId: UniqueEntityID,
    public readonly redemptionId: UniqueEntityID,
    public readonly tokenCost: number,
    public readonly redeemedAt: Date
  ) {
    super(redemptionId);
  }

  /**
   * 고액 보상 교환인지 확인 (1000토큰 이상)
   */
  public isHighValueRedemption(): boolean {
    return this.tokenCost >= 1000;
  }

  /**
   * 오늘 교환한 보상인지 확인
   */
  public isRedeemedToday(): boolean {
    const today = new Date();
    const redeemedDate = this.redeemedAt;
    
    return today.getFullYear() === redeemedDate.getFullYear() &&
           today.getMonth() === redeemedDate.getMonth() &&
           today.getDate() === redeemedDate.getDate();
  }

  /**
   * 최근에 교환한 보상인지 확인 (1시간 이내)
   */
  public isRecentRedemption(): boolean {
    const now = new Date();
    const timeDiff = now.getTime() - this.redeemedAt.getTime();
    return timeDiff <= 60 * 60 * 1000; // 1시간
  }
}