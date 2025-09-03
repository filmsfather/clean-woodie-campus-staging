import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';

interface AchievementNameProps {
  value: string;
}

/**
 * 업적 이름 값 객체
 * 사용자에게 표시되는 업적의 이름
 */
export class AchievementName extends ValueObject<AchievementNameProps> {
  get value(): string {
    return this.props.value;
  }

  public static create(value: string): Result<AchievementName> {
    if (!value || value.trim().length === 0) {
      return Result.fail('Achievement name cannot be empty');
    }

    const trimmed = value.trim();

    if (trimmed.length > 100) {
      return Result.fail('Achievement name cannot exceed 100 characters');
    }

    if (trimmed.length < 2) {
      return Result.fail('Achievement name must be at least 2 characters');
    }

    return Result.ok(new AchievementName({ value: trimmed }));
  }

  public equals(other: AchievementName): boolean {
    return this.value === other.value;
  }
}