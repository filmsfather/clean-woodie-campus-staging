import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';

interface ClassIdProps {
  value: string;
}

// 반 식별자 값 객체
export class ClassId extends ValueObject<ClassIdProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: ClassIdProps) {
    super(props);
  }

  public static create(value: string): Result<ClassId> {
    if (!value || value.trim().length === 0) {
      return Result.fail<ClassId>('Class ID cannot be empty');
    }

    if (value.trim().length > 50) {
      return Result.fail<ClassId>('Class ID cannot exceed 50 characters');
    }

    // 기본적인 형식 검증 (영숫자, 하이픈, 언더스코어만 허용)
    const validFormat = /^[a-zA-Z0-9_-]+$/.test(value.trim());
    if (!validFormat) {
      return Result.fail<ClassId>('Class ID can only contain letters, numbers, hyphens, and underscores');
    }

    return Result.ok<ClassId>(new ClassId({ value: value.trim() }));
  }

  public equals(other: ClassId): boolean {
    if (!other || !other.props) {
      return false;
    }
    return this.props.value === other.props.value;
  }

  public toString(): string {
    return this.props.value;
  }
}