import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';

interface AchievementCodeProps {
  value: string;
}

/**
 * 업적 코드 값 객체
 * 업적을 고유하게 식별하는 코드 (예: EARN_TOKENS_100, COMPLETE_QUIZ_10)
 */
export class AchievementCode extends ValueObject<AchievementCodeProps> {
  get value(): string {
    return this.props.value;
  }

  public static create(value: string): Result<AchievementCode> {
    if (!value || value.trim().length === 0) {
      return Result.fail('Achievement code cannot be empty');
    }

    const trimmed = value.trim().toUpperCase();

    if (trimmed.length > 50) {
      return Result.fail('Achievement code cannot exceed 50 characters');
    }

    // 업적 코드 형식: 영문자, 숫자, 언더스코어만 허용
    const validFormat = /^[A-Z0-9_]+$/.test(trimmed);
    if (!validFormat) {
      return Result.fail('Achievement code can only contain uppercase letters, numbers, and underscores');
    }

    return Result.ok(new AchievementCode({ value: trimmed }));
  }

  public equals(other: AchievementCode): boolean {
    return this.value === other.value;
  }
}