import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';

interface AchievementDescriptionProps {
  value: string;
}

/**
 * 업적 설명 값 객체
 * 업적 달성 조건이나 설명
 */
export class AchievementDescription extends ValueObject<AchievementDescriptionProps> {
  get value(): string {
    return this.props.value;
  }

  public static create(value: string): Result<AchievementDescription> {
    const trimmed = value?.trim() || '';

    if (trimmed.length > 500) {
      return Result.fail('Achievement description cannot exceed 500 characters');
    }

    return Result.ok(new AchievementDescription({ value: trimmed }));
  }

  public equals(other: AchievementDescription): boolean {
    return this.value === other.value;
  }

  public isEmpty(): boolean {
    return this.value.length === 0;
  }
}