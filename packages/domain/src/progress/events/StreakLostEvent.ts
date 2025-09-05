import { BaseDomainEvent } from '../../events/DomainEvent'
import { UniqueEntityID } from '../../common/Identifier'

/**
 * 스트릭 잃음 이벤트
 * 학생의 스트릭이 끊어졌을 때 발생
 * 
 * 사용 시나리오:
 * - 스트릭 끊어짐 알림 발송
 * - 재시작 동기부여 메시지
 * - 스트릭 복구 아이템 제공 (게임화)
 */
export class StreakLostEvent extends BaseDomainEvent {
  public readonly eventType = 'StreakLost'

  constructor(
    public readonly studentId: UniqueEntityID,
    public readonly lostStreak: number,
    public readonly longestStreak: number,
    public readonly lastStudyDate: Date,
    public readonly daysSinceLastStudy: number
  ) {
    super(studentId)
  }

  /**
   * 긴 스트릭을 잃었는지 확인 (더 안타까운 상황)
   */
  public wasLongStreak(): boolean {
    return this.lostStreak >= 30
  }

  /**
   * 개인 최고 기록이었는지 확인
   */
  public wasPersonalRecord(): boolean {
    return this.lostStreak === this.longestStreak
  }

  /**
   * 스트릭 잃음의 심각도 (1-5)
   * 잃은 스트릭이 길수록, 더 오랫동안 안 했을수록 심각
   */
  public getSeverity(): number {
    let severity = 1

    if (this.lostStreak >= 100) severity = 5
    else if (this.lostStreak >= 30) severity = 4
    else if (this.lostStreak >= 14) severity = 3
    else if (this.lostStreak >= 7) severity = 2

    // 오랫동안 안 한 경우 심각도 증가
    if (this.daysSinceLastStudy >= 7) severity = Math.min(5, severity + 1)

    return severity
  }
}