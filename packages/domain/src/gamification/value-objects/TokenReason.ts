import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';

interface TokenReasonProps {
  value: string;
}

export class TokenReason extends ValueObject<TokenReasonProps> {
  get value(): string {
    return this.props.value;
  }

  public static create(value: string): Result<TokenReason> {
    if (!value || value.trim().length === 0) {
      return Result.fail('Token reason cannot be empty');
    }

    if (value.trim().length > 200) {
      return Result.fail('Token reason cannot exceed 200 characters');
    }

    return Result.ok(new TokenReason({ value: value.trim() }));
  }
}