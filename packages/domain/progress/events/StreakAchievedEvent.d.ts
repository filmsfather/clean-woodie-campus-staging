import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';
/**
 * 스트릭 달성 이벤트
 * 학생이 새로운 스트릭 기록을 달성했을 때 발생
 *
 * 사용 시나리오:
 * - 개인 기록 달성 시 알림 발송
 * - 배지/업적 시스템 연동
 * - 게임화 포인트 지급
 */
export declare class StreakAchievedEvent extends BaseDomainEvent {
    readonly studentId: UniqueEntityID;
    readonly previousStreak: number;
    readonly currentStreak: number;
    readonly isPersonalRecord: boolean;
    readonly streakMilestone?: number | undefined;
    readonly eventType = "StreakAchieved";
    constructor(studentId: UniqueEntityID, previousStreak: number, currentStreak: number, isPersonalRecord: boolean, streakMilestone?: number | undefined);
    /**
     * 중요한 이정표인지 확인 (축하 메시지나 특별 보상 대상)
     */
    isSignificantMilestone(): boolean;
    /**
     * 스트릭 증가량
     */
    getStreakIncrease(): number;
}
//# sourceMappingURL=StreakAchievedEvent.d.ts.map