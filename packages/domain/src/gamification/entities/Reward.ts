import { Entity } from '../../entities/Entity';
import { UniqueEntityID } from '../../common/Identifier';
import { Result } from '../../common/Result';
import { RewardCode } from '../value-objects/RewardCode';
import { RewardName } from '../value-objects/RewardName';
import { RewardDescription } from '../value-objects/RewardDescription';
import { TokenAmount } from '../value-objects/TokenAmount';

export enum RewardCategory {
  DIGITAL_BADGE = 'digital_badge',
  FEATURE_UNLOCK = 'feature_unlock',
  VIRTUAL_ITEM = 'virtual_item',
  SPECIAL_PRIVILEGE = 'special_privilege',
  COSMETIC = 'cosmetic'
}

export interface RewardProps {
  code: RewardCode;
  name: RewardName;
  description: RewardDescription;
  category: RewardCategory;
  tokenCost: TokenAmount;
  maxRedemptions?: number; // undefined면 무제한
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
export class Reward extends Entity<RewardProps> {
  get code(): RewardCode {
    return this.props.code;
  }

  get name(): RewardName {
    return this.props.name;
  }

  get description(): RewardDescription {
    return this.props.description;
  }

  get category(): RewardCategory {
    return this.props.category;
  }

  get tokenCost(): TokenAmount {
    return this.props.tokenCost;
  }

  get maxRedemptions(): number | undefined {
    return this.props.maxRedemptions;
  }

  get currentRedemptions(): number {
    return this.props.currentRedemptions;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get iconUrl(): string | undefined {
    return this.props.iconUrl;
  }

  get expiresAt(): Date | undefined {
    return this.props.expiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  public static create(props: RewardProps, id?: UniqueEntityID): Result<Reward> {
    // 비즈니스 규칙 검증
    if (props.tokenCost.value <= 0) {
      return Result.fail('Token cost must be positive');
    }

    if (props.tokenCost.value > 100000) {
      return Result.fail('Token cost cannot exceed 100,000');
    }

    if (props.currentRedemptions < 0) {
      return Result.fail('Current redemptions cannot be negative');
    }

    if (props.maxRedemptions !== undefined) {
      if (props.maxRedemptions <= 0) {
        return Result.fail('Max redemptions must be positive if specified');
      }
      if (props.currentRedemptions > props.maxRedemptions) {
        return Result.fail('Current redemptions cannot exceed max redemptions');
      }
    }

    if (props.expiresAt && props.expiresAt <= props.createdAt) {
      return Result.fail('Expiration date must be after creation date');
    }

    if (props.iconUrl && props.iconUrl.trim().length > 500) {
      return Result.fail('Icon URL cannot exceed 500 characters');
    }

    if (!Object.values(RewardCategory).includes(props.category)) {
      return Result.fail('Invalid reward category');
    }

    const reward = new Reward(props, id);
    return Result.ok(reward);
  }

  /**
   * 보상이 교환 가능한지 확인합니다
   */
  public isAvailableForRedemption(currentDate: Date = new Date()): Result<boolean> {
    if (!this.props.isActive) {
      return Result.ok(false);
    }

    if (this.props.expiresAt && currentDate > this.props.expiresAt) {
      return Result.ok(false);
    }

    if (this.props.maxRedemptions !== undefined && 
        this.props.currentRedemptions >= this.props.maxRedemptions) {
      return Result.ok(false);
    }

    return Result.ok(true);
  }

  /**
   * 교환 횟수를 증가시킵니다
   */
  public incrementRedemption(): Result<void> {
    if (this.props.maxRedemptions !== undefined && 
        this.props.currentRedemptions >= this.props.maxRedemptions) {
      return Result.fail('Maximum redemptions reached');
    }

    this.props.currentRedemptions++;
    return Result.ok();
  }

  /**
   * 보상을 비활성화합니다
   */
  public deactivate(): void {
    this.props.isActive = false;
  }

  /**
   * 보상을 활성화합니다
   */
  public activate(): void {
    this.props.isActive = true;
  }

  /**
   * 보상 정보를 업데이트합니다
   */
  public update(updates: {
    name?: RewardName;
    description?: RewardDescription;
    tokenCost?: TokenAmount;
    maxRedemptions?: number;
    iconUrl?: string;
    expiresAt?: Date;
  }): Result<void> {
    if (updates.name) {
      this.props.name = updates.name;
    }

    if (updates.description) {
      this.props.description = updates.description;
    }

    if (updates.tokenCost) {
      if (updates.tokenCost.value <= 0 || updates.tokenCost.value > 100000) {
        return Result.fail('Token cost must be between 1 and 100,000');
      }
      this.props.tokenCost = updates.tokenCost;
    }

    if (updates.maxRedemptions !== undefined) {
      if (updates.maxRedemptions <= 0) {
        return Result.fail('Max redemptions must be positive if specified');
      }
      if (updates.maxRedemptions < this.props.currentRedemptions) {
        return Result.fail('Max redemptions cannot be less than current redemptions');
      }
      this.props.maxRedemptions = updates.maxRedemptions;
    }

    if (updates.iconUrl !== undefined) {
      if (updates.iconUrl.trim().length > 500) {
        return Result.fail('Icon URL cannot exceed 500 characters');
      }
      this.props.iconUrl = updates.iconUrl.trim() || undefined;
    }

    if (updates.expiresAt !== undefined) {
      if (updates.expiresAt <= this.props.createdAt) {
        return Result.fail('Expiration date must be after creation date');
      }
      this.props.expiresAt = updates.expiresAt;
    }

    return Result.ok();
  }

  /**
   * 남은 재고 수량을 계산합니다
   */
  public getRemainingStock(): number | null {
    if (this.props.maxRedemptions === undefined) {
      return null; // 무제한
    }
    return this.props.maxRedemptions - this.props.currentRedemptions;
  }

  /**
   * 재고가 부족한지 확인합니다
   */
  public isLowStock(threshold: number = 5): boolean {
    const remaining = this.getRemainingStock();
    return remaining !== null && remaining <= threshold;
  }

  /**
   * 품절 상태인지 확인합니다
   */
  public isOutOfStock(): boolean {
    const remaining = this.getRemainingStock();
    return remaining !== null && remaining <= 0;
  }
}