import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
import { Guard } from '../../common/Guard';

interface PasswordProps {
  value: string;
}

export class Password extends ValueObject<PasswordProps> {
  private constructor(props: PasswordProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  public static createPlaintext(password: string): Result<Password> {
    const guardResult = Guard.againstNullOrUndefined(password, 'password');
    if (guardResult.isFailure) {
      return Result.fail<Password>(guardResult.error);
    }

    if (password.length < 8) {
      return Result.fail<Password>('Password must be at least 8 characters long');
    }

    if (password.length > 72) {
      return Result.fail<Password>('Password too long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return Result.fail<Password>('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return Result.fail<Password>('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      return Result.fail<Password>('Password must contain at least one number');
    }

    return Result.ok<Password>(new Password({ value: password }));
  }

  public static fromHash(hash: string): Result<Password> {
    const guardResult = Guard.againstNullOrUndefined(hash, 'hash');
    if (guardResult.isFailure) {
      return Result.fail<Password>(guardResult.error);
    }

    return Result.ok<Password>(new Password({ value: hash }));
  }
}