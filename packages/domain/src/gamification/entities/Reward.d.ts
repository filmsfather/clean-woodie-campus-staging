import { Entity } from '../../entities/Entity';
import { UniqueEntityID } from '../../common/Identifier';
import { Result } from '../../common/Result';
import { RewardCode } from '../value-objects/RewardCode';
import { RewardName } from '../value-objects/RewardName';
import { RewardDescription } from '../value-objects/RewardDescription';
import { TokenAmount } from '../value-objects/TokenAmount';
export declare enum RewardCategory {
    DIGITAL_BADGE = "digital_badge",
    FEATURE_UNLOCK = "feature_unlock",
    VIRTUAL_ITEM = "virtual_item",
    SPECIAL_PRIVILEGE = "special_privilege",
    COSMETIC = "cosmetic"
}
export interface RewardProps {
    code: RewardCode;
    name: RewardName;
    description: RewardDescription;
    category: RewardCategory;
    tokenCost: TokenAmount;
    maxRedemptions?: number;
    currentRedemptions: number;
    isActive: boolean;
    iconUrl?: string;
    expiresAt?: Date;
    createdAt: Date;
}
/**
 * 보상 정의 엔티티
 * 토큰으로 교환할 수 있는 보상의 정의를 나타냅니다
 */
export declare class Reward extends Entity<RewardProps> {
    get code(): RewardCode;
    get name(): RewardName;
    get description(): RewardDescription;
    get category(): RewardCategory;
    get tokenCost(): TokenAmount;
    get maxRedemptions(): number | undefined;
    get currentRedemptions(): number;
    get isActive(): boolean;
    get iconUrl(): string | undefined;
    get expiresAt(): Date | undefined;
    get createdAt(): Date;
    static create(props: RewardProps, id?: UniqueEntityID): Result<Reward>;
    /**
     * 보상이 교환 가능한지 확인합니다
     */
    isAvailableForRedemption(currentDate?: Date): Result<boolean>;
    /**
     * 교환 횟수를 증가시킵니다
     */
    incrementRedemption(): Result<void>;
    /**
     * 보상을 비활성화합니다
     */
    deactivate(): void;
    /**
     * 보상을 활성화합니다
     */
    activate(): void;
    /**
     * 보상 정보를 업데이트합니다
     */
    update(updates: {
        name?: RewardName;
        description?: RewardDescription;
        tokenCost?: TokenAmount;
        maxRedemptions?: number;
        iconUrl?: string;
        expiresAt?: Date;
    }): Result<void>;
    /**
     * 남은 재고 수량을 계산합니다
     */
    getRemainingStock(): number | null;
    /**
     * 재고가 부족한지 확인합니다
     */
    isLowStock(threshold?: number): boolean;
    /**
     * 품절 상태인지 확인합니다
     */
    isOutOfStock(): boolean;
}
//# sourceMappingURL=Reward.d.ts.map