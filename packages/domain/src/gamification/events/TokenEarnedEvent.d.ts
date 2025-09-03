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
export declare class TokenEarnedEvent extends BaseDomainEvent {
    readonly studentId: StudentId;
    readonly tokenId: UniqueEntityID;
    readonly amount: number;
    readonly reason: string;
    readonly newBalance: number;
    readonly newTotalEarned: number;
    readonly earnedAt: Date;
    readonly eventType = "TokenEarned";
    constructor(studentId: StudentId, tokenId: UniqueEntityID, amount: number, reason: string, newBalance: number, newTotalEarned: number, earnedAt: Date);
    /**
     * 대량 토큰 획득인지 확인 (50토큰 이상)
     */
    isLargeEarning(): boolean;
    /**
     * 첫 토큰 획득인지 확인
     */
    isFirstEarning(): boolean;
    /**
     * 토큰 획득 이정표 확인 (100, 500, 1000, 5000 토큰)
     */
    isSignificantMilestone(): {
        milestone: number;
        achieved: boolean;
    };
}
//# sourceMappingURL=TokenEarnedEvent.d.ts.map