import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';
/**
 * 스트릭 잃음 이벤트
 * 학생의 스트릭이 끊어졌을 때 발생
 *
 * 사용 시나리오:
 * - 스트릭 끊어짐 알림 발송
 * - 재시작 동기부여 메시지
 * - 스트릭 복구 아이템 제공 (게임화)
 */
export declare class StreakLostEvent extends BaseDomainEvent {
    readonly studentId: UniqueEntityID;
    readonly lostStreak: number;
    readonly longestStreak: number;
    readonly lastStudyDate: Date;
    readonly daysSinceLastStudy: number;
    readonly eventType = "StreakLost";
    constructor(studentId: UniqueEntityID, lostStreak: number, longestStreak: number, lastStudyDate: Date, daysSinceLastStudy: number);
    /**
     * 긴 스트릭을 잃었는지 확인 (더 안타까운 상황)
     */
    wasLongStreak(): boolean;
    /**
     * 개인 최고 기록이었는지 확인
     */
    wasPersonalRecord(): boolean;
    /**
     * 스트릭 잃음의 심각도 (1-5)
     * 잃은 스트릭이 길수록, 더 오랫동안 안 했을수록 심각
     */
    getSeverity(): number;
}
//# sourceMappingURL=StreakLostEvent.d.ts.map