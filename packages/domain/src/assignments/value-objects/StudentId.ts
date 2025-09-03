import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';

interface StudentIdProps {
  value: string;
}

// 학생 식별자 값 객체
export class StudentId extends ValueObject<StudentIdProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: StudentIdProps) {
    super(props);
  }

  public static create(value: string): Result<StudentId> {
    if (!value || value.trim().length === 0) {
      return Result.fail<StudentId>('Student ID cannot be empty');
    }

    if (value.trim().length > 50) {
      return Result.fail<StudentId>('Student ID cannot exceed 50 characters');
    }

    // UUID 또는 기본적인 형식 검증
    const validFormat = /^[a-zA-Z0-9_-]+$/.test(value.trim());
    if (!validFormat) {
      return Result.fail<StudentId>('Student ID can only contain letters, numbers, hyphens, and underscores');
    }

    return Result.ok<StudentId>(new StudentId({ value: value.trim() }));
  }

  public equals(other: StudentId): boolean {
    if (!other || !other.props) {
      return false;
    }
    return this.props.value === other.props.value;
  }

  public toString(): string {
    return this.props.value;
  }
}