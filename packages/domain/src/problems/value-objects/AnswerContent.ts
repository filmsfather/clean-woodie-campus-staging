import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
import { ProblemTypeValue } from './ProblemType';

// 도메인 순수성 유지 - 순수 데이터 구조만 정의

// 기본 답안 인터페이스
export interface BaseAnswerContent {
  type: ProblemTypeValue;
  explanation?: string;
  points: number;
}

// 타입/이름 일관성 - 네임스페이스로 그룹화
export namespace AnswerContent {
  // 객관식 답안
  export interface MultipleChoice extends BaseAnswerContent {
    type: 'multiple_choice';
    correctChoices: string[];
  }

  // 단답형 답안
  export interface ShortAnswer extends BaseAnswerContent {
    type: 'short_answer';
    acceptedAnswers: string[];
    caseSensitive?: boolean;
    trimWhitespace?: boolean;
  }

  // 서술형 답안
  export interface LongAnswer extends BaseAnswerContent {
    type: 'long_answer';
    sampleAnswer?: string;
    keywords?: string[];
    rubric?: {
      criteria: string;
      points: number;
      description: string;
    }[];
  }

  // 참/거짓 답안
  export interface TrueFalse extends BaseAnswerContent {
    type: 'true_false';
    isTrue: boolean;
  }

  // 매칭 답안
  export interface Matching extends BaseAnswerContent {
    type: 'matching';
    correctMatches: {
      leftId: string;
      rightId: string;
    }[];
    allowsPartialCredit?: boolean;
  }

  // 빈칸 채우기 답안
  export interface FillBlank extends BaseAnswerContent {
    type: 'fill_blank';
    blanks: {
      id: string;
      acceptedAnswers: string[];
      caseSensitive?: boolean;
    }[];
    allowsPartialCredit?: boolean;
  }

  // 순서 배열 답안
  export interface Ordering extends BaseAnswerContent {
    type: 'ordering';
    correctOrder: string[];
    allowsPartialCredit?: boolean;
  }
}

// 모든 답안 타입 유니온
export type AnswerContentData = 
  | AnswerContent.MultipleChoice
  | AnswerContent.ShortAnswer
  | AnswerContent.LongAnswer
  | AnswerContent.TrueFalse
  | AnswerContent.Matching
  | AnswerContent.FillBlank
  | AnswerContent.Ordering;

interface AnswerContentProps {
  data: AnswerContentData;
}

export class AnswerContent extends ValueObject<AnswerContentProps> {
  private constructor(props: AnswerContentProps) {
    super(props);
  }

  // 순수한 데이터 접근만 제공 - 비즈니스 로직 제거
  get data(): AnswerContentData {
    return this.props.data;
  }

  get type(): ProblemTypeValue {
    return this.props.data.type;
  }

  get explanation(): string | undefined {
    return this.props.data.explanation;
  }

  get points(): number {
    return this.props.data.points;
  }

  // 부분 점수 허용 여부 (타입 안전한 방식)
  get allowsPartialCredit(): boolean {
    const data = this.props.data;
    if ('allowsPartialCredit' in data) {
      return data.allowsPartialCredit || false;
    }
    return false;
  }

  // 정답 데이터 접근 (채점 서비스에서 사용)
  public getCorrectAnswers(): any {
    const data = this.props.data;
    switch (data.type) {
      case 'multiple_choice':
        return data.correctChoices;
      case 'short_answer':
        return data.acceptedAnswers;
      case 'true_false':
        return data.isTrue;
      case 'matching':
        return data.correctMatches;
      case 'fill_blank':
        return data.blanks;
      case 'ordering':
        return data.correctOrder;
      case 'long_answer':
        return data.sampleAnswer;
      default:
        return null;
    }
  }

  // 옵션 접근자들 (채점 정책에서 사용)
  public getCaseSensitive(): boolean | undefined {
    const data = this.props.data;
    if ('caseSensitive' in data) {
      return data.caseSensitive;
    }
    return undefined;
  }

  public getTrimWhitespace(): boolean | undefined {
    const data = this.props.data;
    if ('trimWhitespace' in data) {
      return data.trimWhitespace;
    }
    return undefined;
  }

  // 주 생성자 - 검증만 담당
  public static create(data: AnswerContentData): Result<AnswerContent> {
    const validationResult = this.validateAnswerData(data);
    if (validationResult.isFailure) {
      return Result.fail<AnswerContent>(validationResult.error);
    }

    return Result.ok<AnswerContent>(new AnswerContent({ data }));
  }

  // 중복/공백 검증 보강 - 통일된 검증 로직
  private static validateAnswerData(data: AnswerContentData): Result<void> {
    // 점수 정책 일관화 - 별도 정책 클래스 사용
    const pointsValidation = this.validatePoints(data.points);
    if (pointsValidation.isFailure) {
      return pointsValidation;
    }

    // 타입별 검증
    switch (data.type) {
      case 'multiple_choice':
        return this.validateMultipleChoice(data as AnswerContent.MultipleChoice);
      case 'short_answer':
        return this.validateShortAnswer(data as AnswerContent.ShortAnswer);
      case 'long_answer':
        return this.validateLongAnswer(data as AnswerContent.LongAnswer);
      case 'true_false':
        return this.validateTrueFalse(data as AnswerContent.TrueFalse);
      case 'matching':
        return this.validateMatching(data as AnswerContent.Matching);
      case 'fill_blank':
        return this.validateFillBlank(data as AnswerContent.FillBlank);
      case 'ordering':
        return this.validateOrdering(data as AnswerContent.Ordering);
      default:
        return Result.fail<void>(`Unsupported answer type: ${(data as any).type}`);
    }
  }

  // 점수 정책 일관화
  private static validatePoints(points: number): Result<void> {
    if (typeof points !== 'number' || !Number.isFinite(points)) {
      return Result.fail<void>('Points must be a finite number');
    }
    
    if (points < 0) {
      return Result.fail<void>('Points cannot be negative');
    }
    
    if (points > 1000) {
      return Result.fail<void>('Points cannot exceed 1000');
    }
    
    return Result.ok<void>();
  }

  // 중복 검증 보강 - 공통 유틸리티 사용
  private static validateUniqueness<T>(
    items: T[], 
    getKey: (item: T) => string, 
    errorMessage: string
  ): Result<void> {
    const keys = items.map(getKey);
    const uniqueKeys = new Set(keys);
    
    if (uniqueKeys.size !== keys.length) {
      return Result.fail<void>(errorMessage);
    }
    
    return Result.ok<void>();
  }

  private static validateNonEmptyArray<T>(
    items: T[] | undefined, 
    minLength: number,
    errorMessage: string
  ): Result<void> {
    if (!items || !Array.isArray(items) || items.length < minLength) {
      return Result.fail<void>(errorMessage);
    }
    
    return Result.ok<void>();
  }

  private static validateMultipleChoice(data: AnswerContent.MultipleChoice): Result<void> {
    const arrayValidation = this.validateNonEmptyArray(
      data.correctChoices, 
      1, 
      'Multiple choice must have at least one correct answer'
    );
    if (arrayValidation.isFailure) return arrayValidation;

    return this.validateUniqueness(
      data.correctChoices,
      choice => choice,
      'Correct choices must be unique'
    );
  }

  private static validateShortAnswer(data: AnswerContent.ShortAnswer): Result<void> {
    const arrayValidation = this.validateNonEmptyArray(
      data.acceptedAnswers,
      1,
      'Short answer must have at least one accepted answer'
    );
    if (arrayValidation.isFailure) return arrayValidation;

    // 빈 답안 검증 보강
    const hasEmptyAnswer = data.acceptedAnswers.some(answer => 
      !answer || typeof answer !== 'string' || answer.trim().length === 0
    );
    
    if (hasEmptyAnswer) {
      return Result.fail<void>('Accepted answers cannot be empty');
    }

    return Result.ok<void>();
  }

  private static validateLongAnswer(data: AnswerContent.LongAnswer): Result<void> {
    // 서술형은 특별한 검증 없음 (모든 필드가 선택사항)
    return Result.ok<void>();
  }

  private static validateTrueFalse(data: AnswerContent.TrueFalse): Result<void> {
    if (typeof data.isTrue !== 'boolean') {
      return Result.fail<void>('True/false answer must be boolean');
    }
    return Result.ok<void>();
  }

  private static validateMatching(data: AnswerContent.Matching): Result<void> {
    const arrayValidation = this.validateNonEmptyArray(
      data.correctMatches,
      1,
      'Matching must have at least one correct match'
    );
    if (arrayValidation.isFailure) return arrayValidation;

    return this.validateUniqueness(
      data.correctMatches,
      match => match.leftId,
      'Each left item can only match once'
    );
  }

  private static validateFillBlank(data: AnswerContent.FillBlank): Result<void> {
    const arrayValidation = this.validateNonEmptyArray(
      data.blanks,
      1,
      'Fill blank must have at least one blank answer'
    );
    if (arrayValidation.isFailure) return arrayValidation;

    // 각 빈칸 검증
    for (const blank of data.blanks) {
      if (!blank.id || blank.id.trim().length === 0) {
        return Result.fail<void>('Each blank must have a valid ID');
      }

      const blankAnswerValidation = this.validateNonEmptyArray(
        blank.acceptedAnswers,
        1,
        `Blank ${blank.id} must have at least one accepted answer`
      );
      if (blankAnswerValidation.isFailure) return blankAnswerValidation;
    }

    // 빈칸 ID 중복 검증
    return this.validateUniqueness(
      data.blanks,
      blank => blank.id,
      'Blank IDs must be unique'
    );
  }

  private static validateOrdering(data: AnswerContent.Ordering): Result<void> {
    const arrayValidation = this.validateNonEmptyArray(
      data.correctOrder,
      2,
      'Ordering must have at least 2 items'
    );
    if (arrayValidation.isFailure) return arrayValidation;

    return this.validateUniqueness(
      data.correctOrder,
      item => item,
      'Order items must be unique'
    );
  }

  // 직렬화/역직렬화
  public toJSON(): { type: 'AnswerContent'; data: AnswerContentData } {
    return {
      type: 'AnswerContent',
      data: this.props.data
    };
  }

  public toPrimitive(): AnswerContentData {
    return this.props.data;
  }

  public static fromJSON(json: { data: AnswerContentData }): Result<AnswerContent> {
    return this.create(json.data);
  }

  public static fromPrimitive(data: AnswerContentData): Result<AnswerContent> {
    return this.create(data);
  }
}