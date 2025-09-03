import { Result } from '../../common/Result';
import { ValueObject } from '../../value-objects/ValueObject';
/**
 * 알림 타입 값 객체
 * 도메인에서 지원하는 알림 타입들을 정의
 */
export class NotificationType extends ValueObject {
    constructor(props) {
        super(props);
    }
    get value() {
        return this.props.value;
    }
    /**
     * 알림 타입 생성
     */
    static create(type) {
        const validTypes = [
            'review_due',
            'review_overdue',
            'daily_summary',
            'milestone'
        ];
        if (!validTypes.includes(type)) {
            return Result.fail(`Invalid notification type: ${type}`);
        }
        return Result.ok(new NotificationType({ value: type }));
    }
    /**
     * 기본 복습 알림 타입
     */
    static reviewDue() {
        return new NotificationType({ value: 'review_due' });
    }
    /**
     * 연체 복습 알림 타입
     */
    static reviewOverdue() {
        return new NotificationType({ value: 'review_overdue' });
    }
    /**
     * 일일 요약 알림 타입
     */
    static dailySummary() {
        return new NotificationType({ value: 'daily_summary' });
    }
    /**
     * 마일스톤 알림 타입
     */
    static milestone() {
        return new NotificationType({ value: 'milestone' });
    }
    /**
     * 긴급도 확인 (연체 알림이 가장 긴급)
     */
    isUrgent() {
        return this.props.value === 'review_overdue';
    }
    /**
     * 알림 우선순위 (숫자가 낮을수록 우선순위 높음)
     */
    getPriority() {
        const priorityMap = {
            'review_overdue': 1, // 최고 우선순위
            'review_due': 2,
            'milestone': 3,
            'daily_summary': 4 // 최저 우선순위
        };
        return priorityMap[this.props.value];
    }
    /**
     * 알림 카테고리 반환 (UI 분류용)
     */
    getCategory() {
        switch (this.props.value) {
            case 'review_due':
            case 'review_overdue':
                return 'review';
            case 'daily_summary':
                return 'summary';
            case 'milestone':
                return 'achievement';
            default:
                return 'review';
        }
    }
}
//# sourceMappingURL=NotificationType.js.map