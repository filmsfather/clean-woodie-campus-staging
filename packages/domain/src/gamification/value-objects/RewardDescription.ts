import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';

interface RewardDescriptionProps {
  value: string;
}

/**
 * 보상 설명 값 객체
 * 보상에 대한 상세 설명
 */
export class RewardDescription extends ValueObject<RewardDescriptionProps> {
  get value(): string {
    return this.props.value;
  }

  public static create(value: string): Result<RewardDescription> {
    const trimmed = value?.trim() || '';

    if (trimmed.length > 1000) {
      return Result.fail('Reward description cannot exceed 1000 characters');
    }

    return Result.ok(new RewardDescription({ value: trimmed }));
  }

  public equals(other: RewardDescription): boolean {
    return this.value === other.value;
  }

  public isEmpty(): boolean {
    return this.value.length === 0;
  }
}