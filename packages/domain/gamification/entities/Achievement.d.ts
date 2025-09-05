import { Entity } from '../../entities/Entity';
import { UniqueEntityID } from '../../common/Identifier';
import { Result } from '../../common/Result';
import { AchievementCode } from '../value-objects/AchievementCode';
import { AchievementName } from '../value-objects/AchievementName';
import { AchievementDescription } from '../value-objects/AchievementDescription';
import { TokenAmount } from '../value-objects/TokenAmount';
export interface AchievementProps {
    code: AchievementCode;
    name: AchievementName;
    description: AchievementDescription;
    iconUrl?: string;
    tokenReward: TokenAmount;
    isActive: boolean;
    createdAt: Date;
}
/**
 * 업적 정의 엔티티
 * 시스템에서 제공하는 업적의 정의를 나타냅니다
 */
export declare class Achievement extends Entity<AchievementProps> {
    get code(): AchievementCode;
    get name(): AchievementName;
    get description(): AchievementDescription;
    get iconUrl(): string | undefined;
    get tokenReward(): TokenAmount;
    get isActive(): boolean;
    get createdAt(): Date;
    static create(props: AchievementProps, id?: UniqueEntityID): Result<Achievement>;
    /**
     * 업적을 비활성화합니다
     */
    deactivate(): void;
    /**
     * 업적을 활성화합니다
     */
    activate(): void;
    /**
     * 업적 정보를 업데이트합니다
     */
    update(updates: {
        name?: AchievementName;
        description?: AchievementDescription;
        iconUrl?: string;
        tokenReward?: TokenAmount;
    }): Result<void>;
    /**
     * 보상이 있는 업적인지 확인합니다
     */
    hasReward(): boolean;
}
//# sourceMappingURL=Achievement.d.ts.map