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
export declare class AchievementEarnedEvent extends BaseDomainEvent {
    readonly studentId: StudentId;
    readonly achievementId: UniqueEntityID;
    readonly userAchievementId: UniqueEntityID;
    readonly earnedAt: Date;
    readonly eventType = "AchievementEarned";
    constructor(studentId: StudentId, achievementId: UniqueEntityID, userAchievementId: UniqueEntityID, earnedAt: Date);
    /**
     * 오늘 획득한 업적인지 확인
     */
    isEarnedToday(): boolean;
    /**
     * 최근에 획득한 업적인지 확인 (1시간 이내)
     */
    isRecentlyEarned(): boolean;
}
//# sourceMappingURL=AchievementEarnedEvent.d.ts.map