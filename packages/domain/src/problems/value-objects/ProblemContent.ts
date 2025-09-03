import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
import { ProblemType, ProblemTypeValue } from './ProblemType';

// JSONB 기반 유연한 콘텐츠 구조 - 각 문제 유형별 스키마 정의

// 기본 문제 콘텐츠 인터페이스
export interface BaseProblemContent {
  type: ProblemTypeValue;
  title: string;
  description?: string;
  instructions?: string;
  attachments?: string[]; // 파일 URL 배열
}

// 객관식 문제 콘텐츠
export interface MultipleChoiceContent extends BaseProblemContent {
  type: 'multiple_choice';
  choices: {
    id: string;
    text: string;
    explanation?: string;
  }[];
  allowMultiple?: boolean; // 복수 선택 허용 여부
}

// 단답형 문제 콘텐츠
export interface ShortAnswerContent extends BaseProblemContent {
  type: 'short_answer';
  placeholder?: string;
  maxLength?: number;
  caseSensitive?: boolean;
}

// 서술형 문제 콘텐츠
export interface LongAnswerContent extends BaseProblemContent {
  type: 'long_answer';
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  rubric?: {
    criteria: string;
    description: string;
    points: number;
  }[];
}

// 참/거짓 문제 콘텐츠
export interface TrueFalseContent extends BaseProblemContent {
  type: 'true_false';
  statement: string;
}

// 매칭 문제 콘텐츠
export interface MatchingContent extends BaseProblemContent {
  type: 'matching';
  leftItems: {
    id: string;
    text: string;
  }[];
  rightItems: {
    id: string;
    text: string;
  }[];
}

// 빈칸 채우기 문제 콘텐츠
export interface FillBlankContent extends BaseProblemContent {
  type: 'fill_blank';
  text: string; // __blank__ 형태로 빈칸 표시
  blanks: {
    id: string;
    placeholder?: string;
    maxLength?: number;
  }[];
}

// 순서 배열 문제 콘텐츠
export interface OrderingContent extends BaseProblemContent {
  type: 'ordering';
  items: {
    id: string;
    text: string;
  }[];
  instructions?: string;
}

// 모든 문제 콘텐츠 타입 유니온
export type ProblemContentData = 
  | MultipleChoiceContent
  | ShortAnswerContent
  | LongAnswerContent
  | TrueFalseContent
  | MatchingContent
  | FillBlankContent
  | OrderingContent;

interface ProblemContentProps {
  data: ProblemContentData;
}

export class ProblemContent extends ValueObject<ProblemContentProps> {
  private constructor(props: ProblemContentProps) {
    super(props);
  }

  get data(): ProblemContentData {
    return this.props.data;
  }

  get type(): ProblemType {
    return ProblemType.fromString(this.props.data.type).value; // 이미 검증된 값이므로 안전
  }

  get title(): string {
    return this.props.data.title;
  }

  get description(): string | undefined {
    return this.props.data.description;
  }

  get instructions(): string | undefined {
    return this.props.data.instructions;
  }

  get attachments(): string[] {
    return this.props.data.attachments || [];
  }

  // 주 생성자
  public static create(data: ProblemContentData): Result<ProblemContent> {
    const validationResult = this.validateContent(data);
    if (validationResult.isFailure) {
      return Result.fail<ProblemContent>(validationResult.error);
    }

    return Result.ok<ProblemContent>(new ProblemContent({ data }));
  }

  // 콘텐츠 유효성 검증
  private static validateContent(data: ProblemContentData): Result<void> {
    // 기본 필드 검증
    if (!data.title || data.title.trim().length === 0) {
      return Result.fail<void>('Problem title is required');
    }

    if (data.title.trim().length > 200) {
      return Result.fail<void>('Problem title cannot exceed 200 characters');
    }

    // 타입별 특화 검증
    switch (data.type) {
      case 'multiple_choice':
        return this.validateMultipleChoice(data as MultipleChoiceContent);
      case 'short_answer':
        return this.validateShortAnswer(data as ShortAnswerContent);
      case 'long_answer':
        return this.validateLongAnswer(data as LongAnswerContent);
      case 'true_false':
        return this.validateTrueFalse(data as TrueFalseContent);
      case 'matching':
        return this.validateMatching(data as MatchingContent);
      case 'fill_blank':
        return this.validateFillBlank(data as FillBlankContent);
      case 'ordering':
        return this.validateOrdering(data as OrderingContent);
      default:
        return Result.fail<void>(`Unsupported problem type: ${(data as any).type}`);
    }
  }

  private static validateMultipleChoice(data: MultipleChoiceContent): Result<void> {
    if (!data.choices || data.choices.length < 2) {
      return Result.fail<void>('Multiple choice must have at least 2 choices');
    }

    if (data.choices.length > 10) {
      return Result.fail<void>('Multiple choice cannot have more than 10 choices');
    }

    // 선택지 중복 검증
    const choiceTexts = data.choices.map(c => c.text.trim());
    const uniqueTexts = new Set(choiceTexts);
    if (uniqueTexts.size !== choiceTexts.length) {
      return Result.fail<void>('Choice options must be unique');
    }

    return Result.ok<void>();
  }

  private static validateShortAnswer(data: ShortAnswerContent): Result<void> {
    if (data.maxLength && data.maxLength > 1000) {
      return Result.fail<void>('Short answer max length cannot exceed 1000 characters');
    }
    return Result.ok<void>();
  }

  private static validateLongAnswer(data: LongAnswerContent): Result<void> {
    if (data.minLength && data.maxLength && data.minLength > data.maxLength) {
      return Result.fail<void>('Long answer min length cannot be greater than max length');
    }
    return Result.ok<void>();
  }

  private static validateTrueFalse(data: TrueFalseContent): Result<void> {
    if (!data.statement || data.statement.trim().length === 0) {
      return Result.fail<void>('True/false statement is required');
    }
    return Result.ok<void>();
  }

  private static validateMatching(data: MatchingContent): Result<void> {
    if (!data.leftItems || data.leftItems.length < 2) {
      return Result.fail<void>('Matching must have at least 2 left items');
    }
    if (!data.rightItems || data.rightItems.length < 2) {
      return Result.fail<void>('Matching must have at least 2 right items');
    }
    return Result.ok<void>();
  }

  private static validateFillBlank(data: FillBlankContent): Result<void> {
    if (!data.text || data.text.trim().length === 0) {
      return Result.fail<void>('Fill blank text is required');
    }
    
    // 빈칸이 하나 이상 있는지 확인
    const blankCount = (data.text.match(/__blank__/g) || []).length;
    if (blankCount === 0) {
      return Result.fail<void>('Fill blank must contain at least one __blank__ placeholder');
    }

    if (!data.blanks || data.blanks.length !== blankCount) {
      return Result.fail<void>('Number of blanks must match blank placeholders in text');
    }

    return Result.ok<void>();
  }

  private static validateOrdering(data: OrderingContent): Result<void> {
    if (!data.items || data.items.length < 2) {
      return Result.fail<void>('Ordering must have at least 2 items');
    }
    return Result.ok<void>();
  }

  // 직렬화/역직렬화
  public toJSON(): { type: 'ProblemContent'; data: ProblemContentData } {
    return {
      type: 'ProblemContent',
      data: this.props.data
    };
  }

  public toPrimitive(): ProblemContentData {
    return this.props.data;
  }

  public static fromJSON(json: { data: ProblemContentData }): Result<ProblemContent> {
    return this.create(json.data);
  }

  public static fromPrimitive(data: ProblemContentData): Result<ProblemContent> {
    return this.create(data);
  }

  // 콘텐츠 업데이트
  public updateTitle(title: string): Result<ProblemContent> {
    const updatedData = { ...this.props.data, title };
    return ProblemContent.create(updatedData);
  }

  public updateDescription(description: string): Result<ProblemContent> {
    const updatedData = { ...this.props.data, description };
    return ProblemContent.create(updatedData);
  }
}