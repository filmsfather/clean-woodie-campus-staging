import { AggregateRoot } from '../../aggregates/AggregateRoot';
import { UniqueEntityID } from '../../common/Identifier';
import { Result } from '../../common/Result';
import { StudentId } from '../../assignments/value-objects/StudentId';
import { IClock } from '../../srs/services/IClock';
export interface UserAchievementProps {
    studentId: StudentId;
    achievementId: UniqueEntityID;
    earnedAt: Date;
    notified: boolean;
}
/**
 * 사용자 업적 엔티티
 * 특정 학생이 획득한 업적을 나타냅니다
 */
export declare class UserAchievement extends AggregateRoot<UserAchievementProps> {
    get studentId(): StudentId;
    get achievementId(): UniqueEntityID;
    get earnedAt(): Date;
    get notified(): boolean;
    static create(props: UserAchievementProps, id?: UniqueEntityID): Result<UserAchievement>;
    /**
     * 새 사용자 업적을 생성하고 이벤트를 발생시킵니다
     */
    static createAndNotify(studentId: StudentId, achievementId: UniqueEntityID, clock: IClock, id?: UniqueEntityID): Result<UserAchievement>;
    /**
     * 알림 처리 완료로 표시합니다
     */
    markAsNotified(): void;
    /**
     * 업적 획득 후 경과 시간을 계산합니다
     */
    getDaysEarned(currentDate?: Date): number;
    /**
     * 최근에 획득한 업적인지 확인합니다 (7일 이내)
     */
    isRecentlyEarned(currentDate?: Date): boolean;
}
//# sourceMappingURL=UserAchievement.d.ts.map