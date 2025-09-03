import { AggregateRoot } from '../../aggregates/AggregateRoot';
import { Result } from '../../common/Result';
import { AchievementEarnedEvent } from '../events/AchievementEarnedEvent';
/**
 * 사용자 업적 엔티티
 * 특정 학생이 획득한 업적을 나타냅니다
 */
export class UserAchievement extends AggregateRoot {
    get studentId() {
        return this.props.studentId;
    }
    get achievementId() {
        return this.props.achievementId;
    }
    get earnedAt() {
        return this.props.earnedAt;
    }
    get notified() {
        return this.props.notified;
    }
    static create(props, id) {
        // 미래 날짜 검증
        if (props.earnedAt > new Date()) {
            return Result.fail('Achievement cannot be earned in the future');
        }
        const userAchievement = new UserAchievement(props, id);
        return Result.ok(userAchievement);
    }
    /**
     * 새 사용자 업적을 생성하고 이벤트를 발생시킵니다
     */
    static createAndNotify(studentId, achievementId, clock, id) {
        const props = {
            studentId,
            achievementId,
            earnedAt: clock.now(),
            notified: false
        };
        const userAchievementResult = UserAchievement.create(props, id);
        if (userAchievementResult.isFailure) {
            return Result.fail(userAchievementResult.getErrorValue());
        }
        const userAchievement = userAchievementResult.getValue();
        // 업적 획득 이벤트 발생
        const event = new AchievementEarnedEvent(studentId, achievementId, userAchievement.id, props.earnedAt);
        userAchievement.addDomainEvent(event);
        return Result.ok(userAchievement);
    }
    /**
     * 알림 처리 완료로 표시합니다
     */
    markAsNotified() {
        this.props.notified = true;
    }
    /**
     * 업적 획득 후 경과 시간을 계산합니다
     */
    getDaysEarned(currentDate = new Date()) {
        const timeDiff = currentDate.getTime() - this.props.earnedAt.getTime();
        return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    }
    /**
     * 최근에 획득한 업적인지 확인합니다 (7일 이내)
     */
    isRecentlyEarned(currentDate = new Date()) {
        return this.getDaysEarned(currentDate) <= 7;
    }
}
//# sourceMappingURL=UserAchievement.js.map