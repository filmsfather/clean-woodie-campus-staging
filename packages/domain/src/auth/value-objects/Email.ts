import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
import { Guard } from '../../common/Guard';

interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  private constructor(props: EmailProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  public static create(email: string): Result<Email> {
    const guardResult = Guard.againstNullOrUndefined(email, 'email');
    if (guardResult.isFailure) {
      return Result.fail<Email>(guardResult.error);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Result.fail<Email>('Invalid email format');
    }

    if (email.length > 320) {
      return Result.fail<Email>('Email is too long');
    }

    return Result.ok<Email>(new Email({ value: email.toLowerCase().trim().normalize('NFC') }));
  }
}