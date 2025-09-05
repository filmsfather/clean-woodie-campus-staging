import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';
import { StudentId } from '../../assignments/value-objects/StudentId';

/**
 * 업적 획득 이벤트
 * 학생이 업적을 획득했을 때 발생하는 도메인 이벤트
 * 
 * 사용 시나리오:
 * - 토큰 보상 지급
 * - 알림 발송
 * - 통계 업데이트
 * - 리더보드 업데이트
 * - 추가 업적 조건 확인
 */
export class AchievementEarnedEvent extends BaseDomainEvent {
  public readonly eventType = 'AchievementEarned';

  constructor(
    public readonly studentId: StudentId,
    public readonly achievementId: UniqueEntityID,
    public readonly userAchievementId: UniqueEntityID,
    public readonly earnedAt: Date
  ) {
    super(userAchievementId);
  }

  /**
   * 오늘 획득한 업적인지 확인
   */
  public isEarnedToday(): boolean {
    const today = new Date();
    const earnedDate = this.earnedAt;
    
    return today.getFullYear() === earnedDate.getFullYear() &&
           today.getMonth() === earnedDate.getMonth() &&
           today.getDate() === earnedDate.getDate();
  }

  /**
   * 최근에 획득한 업적인지 확인 (1시간 이내)
   */
  public isRecentlyEarned(): boolean {
    const now = new Date();
    const timeDiff = now.getTime() - this.earnedAt.getTime();
    return timeDiff <= 60 * 60 * 1000; // 1시간
  }
}