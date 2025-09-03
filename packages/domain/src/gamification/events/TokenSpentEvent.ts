import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';
import { StudentId } from '../../assignments/value-objects/StudentId';

/**
 * 토큰 사용 이벤트
 * 학생이 토큰을 사용했을 때 발생하는 도메인 이벤트
 * 
 * 사용 시나리오:
 * - 보상 교환 기록
 * - 소비 패턴 분석
 * - 잔액 부족 알림
 * - 통계 업데이트
 */
export class TokenSpentEvent extends BaseDomainEvent {
  public readonly eventType = 'TokenSpent';

  constructor(
    public readonly studentId: StudentId,
    public readonly tokenId: UniqueEntityID,
    public readonly amount: number,
    public readonly reason: string,
    public readonly newBalance: number,
    public readonly newTotalSpent: number,
    public readonly spentAt: Date
  ) {
    super();
  }

  /**
   * 대량 토큰 사용인지 확인 (100토큰 이상)
   */
  public isLargeSpending(): boolean {
    return this.amount >= 100;
  }

  /**
   * 잔액이 낮은 상태인지 확인 (50토큰 미만)
   */
  public isLowBalance(): boolean {
    return this.newBalance < 50;
  }

  /**
   * 잔액이 부족 위험 상태인지 확인 (20토큰 미만)
   */
  public isCriticalBalance(): boolean {
    return this.newBalance < 20;
  }

  /**
   * 첫 토큰 사용인지 확인
   */
  public isFirstSpending(): boolean {
    return this.newTotalSpent === this.amount;
  }

  /**
   * 토큰 사용 이정표 확인 (100, 500, 1000, 5000 토큰)
   */
  public isSpendingMilestone(): { milestone: number; achieved: boolean } {
    const milestones = [100, 500, 1000, 5000, 10000];
    const previousTotal = this.newTotalSpent - this.amount;
    
    for (const milestone of milestones) {
      if (previousTotal < milestone && this.newTotalSpent >= milestone) {
        return { milestone, achieved: true };
      }
    }
    
    return { milestone: 0, achieved: false };
  }
}