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
            'overdue',
            'review',
            'summary',
            'milestone',
            'streak',
            'achievement'
        ];
        if (!validTypes.includes(type)) {
            return Result.fail(`Invalid notification type: ${type}`);
        }
        return Result.ok(new NotificationType({ value: type }));
    }
    /**
     * 기본 복습 알림 타입
     */
    static review() {
        return new NotificationType({ value: 'review' });
    }
    /**
     * 연체 복습 알림 타입
     */
    static overdue() {
        return new NotificationType({ value: 'overdue' });
    }
    /**
     * 일일 요약 알림 타입
     */
    static summary() {
        return new NotificationType({ value: 'summary' });
    }
    /**
     * 마일스톤 알림 타입
     */
    static milestone() {
        return new NotificationType({ value: 'milestone' });
    }
    /**
     * 연속 학습 알림 타입
     */
    static streak() {
        return new NotificationType({ value: 'streak' });
    }
    /**
     * 성취 알림 타입
     */
    static achievement() {
        return new NotificationType({ value: 'achievement' });
    }
    /**
     * 복습 관련 알림인지 확인
     */
    isReview() {
        return this.props.value === 'review';
    }
    /**
     * 연체 알림인지 확인
     */
    isOverdue() {
        return this.props.value === 'overdue';
    }
    /**
     * 연속 학습 알림인지 확인
     */
    isStreak() {
        return this.props.value === 'streak';
    }
    /**
     * 성취 알림인지 확인
     */
    isAchievement() {
        return this.props.value === 'achievement';
    }
    /**
     * 긴급도 확인 (연체 알림이 가장 긴급)
     */
    isUrgent() {
        return this.props.value === 'overdue';
    }
    /**
     * 알림 우선순위 (숫자가 낮을수록 우선순위 높음)
     */
    getPriority() {
        const priorityMap = {
            'overdue': 1, // 최고 우선순위
            'review': 2,
            'streak': 3,
            'achievement': 4,
            'milestone': 5,
            'summary': 6 // 최저 우선순위
        };
        return priorityMap[this.props.value];
    }
    /**
     * 알림 카테고리 반환 (UI 분류용)
     */
    getCategory() {
        return this.props.value;
    }
}
//# sourceMappingURL=NotificationType.js.map