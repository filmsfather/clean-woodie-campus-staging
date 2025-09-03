import { Result } from '../../common/Result';
import { ValueObject } from '../../value-objects/ValueObject';
export type NotificationTypeValue = 'review_due' | 'review_overdue' | 'daily_summary' | 'milestone';
interface NotificationTypeProps {
    value: NotificationTypeValue;
}
/**
 * 알림 타입 값 객체
 * 도메인에서 지원하는 알림 타입들을 정의
 */
export declare class NotificationType extends ValueObject<NotificationTypeProps> {
    private constructor();
    get value(): NotificationTypeValue;
    /**
     * 알림 타입 생성
     */
    static create(type: NotificationTypeValue): Result<NotificationType>;
    /**
     * 기본 복습 알림 타입
     */
    static reviewDue(): NotificationType;
    /**
     * 연체 복습 알림 타입
     */
    static reviewOverdue(): NotificationType;
    /**
     * 일일 요약 알림 타입
     */
    static dailySummary(): NotificationType;
    /**
     * 마일스톤 알림 타입
     */
    static milestone(): NotificationType;
    /**
     * 긴급도 확인 (연체 알림이 가장 긴급)
     */
    isUrgent(): boolean;
    /**
     * 알림 우선순위 (숫자가 낮을수록 우선순위 높음)
     */
    getPriority(): number;
    /**
     * 알림 카테고리 반환 (UI 분류용)
     */
    getCategory(): 'review' | 'summary' | 'achievement';
}
export {};
//# sourceMappingURL=NotificationType.d.ts.map