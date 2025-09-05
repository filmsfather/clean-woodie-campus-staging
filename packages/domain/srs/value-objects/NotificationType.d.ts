import { Result } from '../../common/Result';
import { ValueObject } from '../../value-objects/ValueObject';
export type NotificationTypeValue = 'overdue' | 'review' | 'summary' | 'milestone' | 'streak' | 'achievement';
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
    static review(): NotificationType;
    /**
     * 연체 복습 알림 타입
     */
    static overdue(): NotificationType;
    /**
     * 일일 요약 알림 타입
     */
    static summary(): NotificationType;
    /**
     * 마일스톤 알림 타입
     */
    static milestone(): NotificationType;
    /**
     * 연속 학습 알림 타입
     */
    static streak(): NotificationType;
    /**
     * 성취 알림 타입
     */
    static achievement(): NotificationType;
    /**
     * 복습 관련 알림인지 확인
     */
    isReview(): boolean;
    /**
     * 연체 알림인지 확인
     */
    isOverdue(): boolean;
    /**
     * 연속 학습 알림인지 확인
     */
    isStreak(): boolean;
    /**
     * 성취 알림인지 확인
     */
    isAchievement(): boolean;
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
    getCategory(): NotificationTypeValue;
}
export {};
//# sourceMappingURL=NotificationType.d.ts.map