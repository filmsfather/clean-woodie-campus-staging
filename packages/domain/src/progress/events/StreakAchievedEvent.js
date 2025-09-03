import { BaseDomainEvent } from '../../events/DomainEvent';
/**
 * 스트릭 달성 이벤트
 * 학생이 새로운 스트릭 기록을 달성했을 때 발생
 *
 * 사용 시나리오:
 * - 개인 기록 달성 시 알림 발송
 * - 배지/업적 시스템 연동
 * - 게임화 포인트 지급
 */
export class StreakAchievedEvent extends BaseDomainEvent {
    studentId;
    previousStreak;
    currentStreak;
    isPersonalRecord;
    streakMilestone;
    eventType = 'StreakAchieved';
    constructor(studentId, previousStreak, currentStreak, isPersonalRecord, streakMilestone // 10일, 30일, 100일 등 특별한 이정표
    ) {
        super();
        this.studentId = studentId;
        this.previousStreak = previousStreak;
        this.currentStreak = currentStreak;
        this.isPersonalRecord = isPersonalRecord;
        this.streakMilestone = streakMilestone;
    }
    /**
     * 중요한 이정표인지 확인 (축하 메시지나 특별 보상 대상)
     */
    isSignificantMilestone() {
        const significantMilestones = [7, 14, 30, 50, 100, 200, 365];
        return significantMilestones.includes(this.currentStreak);
    }
    /**
     * 스트릭 증가량
     */
    getStreakIncrease() {
        return this.currentStreak - this.previousStreak;
    }
}
//# sourceMappingURL=StreakAchievedEvent.js.map