import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';
import { StudentId } from '../../assignments/value-objects/StudentId';

/**
 * 토큰 획득 이벤트
 * 학생이 토큰을 획득했을 때 발생하는 도메인 이벤트
 * 
 * 사용 시나리오:
 * - 업적 시스템 연동 (토큰 획득량 기반 업적)
 * - 리더보드 업데이트
 * - 알림 발송
 * - 통계 업데이트
 */
export class TokenEarnedEvent extends BaseDomainEvent {
  public readonly eventType = 'TokenEarned';

  constructor(
    public readonly studentId: StudentId,
    public readonly tokenId: UniqueEntityID,
    public readonly amount: number,
    public readonly reason: string,
    public readonly newBalance: number,
    public readonly newTotalEarned: number,
    public readonly earnedAt: Date
  ) {
    super();
  }

  /**
   * 대량 토큰 획득인지 확인 (50토큰 이상)
   */
  public isLargeEarning(): boolean {
    return this.amount >= 50;
  }

  /**
   * 첫 토큰 획득인지 확인
   */
  public isFirstEarning(): boolean {
    return this.newTotalEarned === this.amount;
  }

  /**
   * 토큰 획득 이정표 확인 (100, 500, 1000, 5000 토큰)
   */
  public isSignificantMilestone(): { milestone: number; achieved: boolean } {
    const milestones = [100, 500, 1000, 5000, 10000];
    const previousTotal = this.newTotalEarned - this.amount;
    
    for (const milestone of milestones) {
      if (previousTotal < milestone && this.newTotalEarned >= milestone) {
        return { milestone, achieved: true };
      }
    }
    
    return { milestone: 0, achieved: false };
  }
}