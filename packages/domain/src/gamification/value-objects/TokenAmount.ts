import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';

interface TokenAmountProps {
  value: number;
}

export class TokenAmount extends ValueObject<TokenAmountProps> {
  get value(): number {
    return this.props.value;
  }

  public static create(value: number): Result<TokenAmount> {
    if (value < 0) {
      return Result.fail('Token amount cannot be negative');
    }

    if (!Number.isInteger(value)) {
      return Result.fail('Token amount must be an integer');
    }

    if (value > 1000000) {
      return Result.fail('Token amount cannot exceed 1,000,000');
    }

    return Result.ok(new TokenAmount({ value }));
  }

  public add(other: TokenAmount): Result<TokenAmount> {
    const newValue = this.value + other.value;
    return TokenAmount.create(newValue);
  }

  public subtract(other: TokenAmount): Result<TokenAmount> {
    const newValue = this.value - other.value;
    return TokenAmount.create(newValue);
  }

  public isGreaterThan(other: TokenAmount): boolean {
    return this.value > other.value;
  }

  public isGreaterThanOrEqual(other: TokenAmount): boolean {
    return this.value >= other.value;
  }

  public equals(other: TokenAmount): boolean {
    return this.value === other.value;
  }
}