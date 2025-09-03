import { BaseDomainEvent } from '../../events/DomainEvent';
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
    studentId;
    tokenId;
    amount;
    reason;
    newBalance;
    newTotalEarned;
    earnedAt;
    eventType = 'TokenEarned';
    constructor(studentId, tokenId, amount, reason, newBalance, newTotalEarned, earnedAt) {
        super();
        this.studentId = studentId;
        this.tokenId = tokenId;
        this.amount = amount;
        this.reason = reason;
        this.newBalance = newBalance;
        this.newTotalEarned = newTotalEarned;
        this.earnedAt = earnedAt;
    }
    /**
     * 대량 토큰 획득인지 확인 (50토큰 이상)
     */
    isLargeEarning() {
        return this.amount >= 50;
    }
    /**
     * 첫 토큰 획득인지 확인
     */
    isFirstEarning() {
        return this.newTotalEarned === this.amount;
    }
    /**
     * 토큰 획득 이정표 확인 (100, 500, 1000, 5000 토큰)
     */
    isSignificantMilestone() {
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
//# sourceMappingURL=TokenEarnedEvent.js.map