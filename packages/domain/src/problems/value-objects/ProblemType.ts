import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';

// 타입 안정성 보강 - const assertion 사용
const PROBLEM_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  SHORT_ANSWER: 'short_answer',
  LONG_ANSWER: 'long_answer',
  TRUE_FALSE: 'true_false',
  MATCHING: 'matching',
  FILL_BLANK: 'fill_blank',
  ORDERING: 'ordering'
} as const;

export type ProblemTypeValue = typeof PROBLEM_TYPES[keyof typeof PROBLEM_TYPES];

interface ProblemTypeProps {
  value: ProblemTypeValue;
}

export class ProblemType extends ValueObject<ProblemTypeProps> {
  private constructor(props: ProblemTypeProps) {
    super(props);
  }

  get value(): ProblemTypeValue {
    return this.props.value;
  }

  // 타입 가드
  public static isProblemType(value: string): value is ProblemTypeValue {
    return Object.values(PROBLEM_TYPES).includes(value as ProblemTypeValue);
  }

  // 주 생성자 - 유효성 검증 포함
  public static create(value: string): Result<ProblemType> {
    if (!this.isProblemType(value)) {
      return Result.fail<ProblemType>(`Invalid problem type: ${value}. Valid types: ${Object.values(PROBLEM_TYPES).join(', ')}`);
    }

    return Result.ok<ProblemType>(new ProblemType({ value }));
  }

  // 안전한 내부 생성자 - 편의 메서드용
  private static createUnsafe(value: ProblemTypeValue): ProblemType {
    return new ProblemType({ value });
  }

  // 정적 생성자 일관성 - 모두 안전한 인스턴스 반환
  public static multipleChoice(): ProblemType {
    return this.createUnsafe(PROBLEM_TYPES.MULTIPLE_CHOICE);
  }

  public static shortAnswer(): ProblemType {
    return this.createUnsafe(PROBLEM_TYPES.SHORT_ANSWER);
  }

  public static longAnswer(): ProblemType {
    return this.createUnsafe(PROBLEM_TYPES.LONG_ANSWER);
  }

  public static trueFalse(): ProblemType {
    return this.createUnsafe(PROBLEM_TYPES.TRUE_FALSE);
  }

  public static matching(): ProblemType {
    return this.createUnsafe(PROBLEM_TYPES.MATCHING);
  }

  public static fillBlank(): ProblemType {
    return this.createUnsafe(PROBLEM_TYPES.FILL_BLANK);
  }

  public static ordering(): ProblemType {
    return this.createUnsafe(PROBLEM_TYPES.ORDERING);
  }

  // 직렬화/역직렬화 경로 확보
  public toJSON(): { type: 'ProblemType'; value: ProblemTypeValue } {
    return {
      type: 'ProblemType',
      value: this.props.value
    };
  }

  public toString(): string {
    return this.props.value;
  }

  public toPrimitive(): ProblemTypeValue {
    return this.props.value;
  }

  public static fromJSON(json: { value: ProblemTypeValue }): Result<ProblemType> {
    return this.create(json.value);
  }

  public static fromString(value: string): Result<ProblemType> {
    return this.create(value);
  }

  public static fromPrimitive(value: ProblemTypeValue): Result<ProblemType> {
    return this.create(value);
  }

  // 상수 접근을 위한 정적 속성
  public static readonly TYPES = PROBLEM_TYPES;
}