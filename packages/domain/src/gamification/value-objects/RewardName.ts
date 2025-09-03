import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';

interface RewardNameProps {
  value: string;
}

/**
 * 보상 이름 값 객체
 * 사용자에게 표시되는 보상의 이름
 */
export class RewardName extends ValueObject<RewardNameProps> {
  get value(): string {
    return this.props.value;
  }

  public static create(value: string): Result<RewardName> {
    if (!value || value.trim().length === 0) {
      return Result.fail('Reward name cannot be empty');
    }

    const trimmed = value.trim();

    if (trimmed.length > 100) {
      return Result.fail('Reward name cannot exceed 100 characters');
    }

    if (trimmed.length < 2) {
      return Result.fail('Reward name must be at least 2 characters');
    }

    return Result.ok(new RewardName({ value: trimmed }));
  }

  public equals(other: RewardName): boolean {
    return this.value === other.value;
  }
}