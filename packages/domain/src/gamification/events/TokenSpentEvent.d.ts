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
export declare class TokenSpentEvent extends BaseDomainEvent {
    readonly studentId: StudentId;
    readonly tokenId: UniqueEntityID;
    readonly amount: number;
    readonly reason: string;
    readonly newBalance: number;
    readonly newTotalSpent: number;
    readonly spentAt: Date;
    readonly eventType = "TokenSpent";
    constructor(studentId: StudentId, tokenId: UniqueEntityID, amount: number, reason: string, newBalance: number, newTotalSpent: number, spentAt: Date);
    /**
     * 대량 토큰 사용인지 확인 (100토큰 이상)
     */
    isLargeSpending(): boolean;
    /**
     * 잔액이 낮은 상태인지 확인 (50토큰 미만)
     */
    isLowBalance(): boolean;
    /**
     * 잔액이 부족 위험 상태인지 확인 (20토큰 미만)
     */
    isCriticalBalance(): boolean;
    /**
     * 첫 토큰 사용인지 확인
     */
    isFirstSpending(): boolean;
    /**
     * 토큰 사용 이정표 확인 (100, 500, 1000, 5000 토큰)
     */
    isSpendingMilestone(): {
        milestone: number;
        achieved: boolean;
    };
}
//# sourceMappingURL=TokenSpentEvent.d.ts.map