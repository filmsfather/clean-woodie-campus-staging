import { BaseDomainEvent } from '../../events/DomainEvent';
import { UniqueEntityID } from '../../common/Identifier';
import { StudentId } from '../../assignments/value-objects/StudentId';
/**
 * 보상 교환 이벤트
 * 학생이 보상을 교환했을 때 발생하는 도메인 이벤트
 *
 * 사용 시나리오:
 * - 토큰 차감 처리
 * - 보상 재고 관리
 * - 알림 발송
 * - 통계 업데이트
 * - 교환 기록 추적
 */
export declare class RewardRedeemedEvent extends BaseDomainEvent {
    readonly studentId: StudentId;
    readonly rewardId: UniqueEntityID;
    readonly redemptionId: UniqueEntityID;
    readonly tokenCost: number;
    readonly redeemedAt: Date;
    readonly eventType = "RewardRedeemed";
    constructor(studentId: StudentId, rewardId: UniqueEntityID, redemptionId: UniqueEntityID, tokenCost: number, redeemedAt: Date);
    /**
     * 고액 보상 교환인지 확인 (1000토큰 이상)
     */
    isHighValueRedemption(): boolean;
    /**
     * 오늘 교환한 보상인지 확인
     */
    isRedeemedToday(): boolean;
    /**
     * 최근에 교환한 보상인지 확인 (1시간 이내)
     */
    isRecentRedemption(): boolean;
}
//# sourceMappingURL=RewardRedeemedEvent.d.ts.map