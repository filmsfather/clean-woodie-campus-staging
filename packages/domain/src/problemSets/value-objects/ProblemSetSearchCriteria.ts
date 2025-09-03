import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
import { Guard } from '../../common/Guard';

// 날짜 범위 값 객체
export class DateRange extends ValueObject<{ from: Date; to: Date }> {
  get from(): Date {
    return this.props.from;
  }

  get to(): Date {
    return this.props.to;
  }

  public static create(from: Date, to: Date): Result<DateRange> {
    if (from > to) {
      return Result.fail<DateRange>('From date must be before or equal to to date');
    }

    return Result.ok<DateRange>(new DateRange({ from, to }));
  }
}

// 아이템 개수 범위 값 객체
export class ItemCountRange extends ValueObject<{ min: number; max: number }> {
  get min(): number {
    return this.props.min;
  }

  get max(): number {
    return this.props.max;
  }

  public static create(min: number, max: number): Result<ItemCountRange> {
    if (min < 0) {
      return Result.fail<ItemCountRange>('Minimum count cannot be negative');
    }

    if (max < min) {
      return Result.fail<ItemCountRange>('Maximum count must be greater than or equal to minimum count');
    }

    return Result.ok<ItemCountRange>(new ItemCountRange({ min, max }));
  }
}

// 제목 필터 값 객체
export class TitleFilter extends ValueObject<{ pattern: string; caseSensitive: boolean }> {
  get pattern(): string {
    return this.props.pattern;
  }

  get caseSensitive(): boolean {
    return this.props.caseSensitive;
  }

  public static create(pattern: string, caseSensitive: boolean = false): Result<TitleFilter> {
    const guardResult = Guard.againstNullOrUndefined(pattern, 'pattern');
    if (guardResult.isFailure) {
      return Result.fail<TitleFilter>(guardResult.error);
    }

    const trimmedPattern = pattern.trim();
    if (trimmedPattern.length === 0) {
      return Result.fail<TitleFilter>('Title filter pattern cannot be empty');
    }

    if (trimmedPattern.length > 100) {
      return Result.fail<TitleFilter>('Title filter pattern cannot exceed 100 characters');
    }

    return Result.ok<TitleFilter>(new TitleFilter({ pattern: trimmedPattern, caseSensitive }));
  }
}

// 검색 조건 값 객체
interface ProblemSetSearchCriteriaProps {
  teacherId: string;
  titleFilter?: TitleFilter;
  hasDescription?: boolean;
  itemCountRange?: ItemCountRange;
  createdDateRange?: DateRange;
  updatedDateRange?: DateRange;
}

export class ProblemSetSearchCriteria extends ValueObject<ProblemSetSearchCriteriaProps> {
  get teacherId(): string {
    return this.props.teacherId;
  }

  get titleFilter(): TitleFilter | undefined {
    return this.props.titleFilter;
  }

  get hasDescription(): boolean | undefined {
    return this.props.hasDescription;
  }

  get itemCountRange(): ItemCountRange | undefined {
    return this.props.itemCountRange;
  }

  get createdDateRange(): DateRange | undefined {
    return this.props.createdDateRange;
  }

  get updatedDateRange(): DateRange | undefined {
    return this.props.updatedDateRange;
  }

  private constructor(props: ProblemSetSearchCriteriaProps) {
    super(props);
  }

  // Factory Methods
  public static forTeacher(teacherId: string): Result<ProblemSetSearchCriteria> {
    const guardResult = Guard.againstNullOrUndefined(teacherId, 'teacherId');
    if (guardResult.isFailure) {
      return Result.fail<ProblemSetSearchCriteria>(guardResult.error);
    }

    const trimmedTeacherId = teacherId.trim();
    if (trimmedTeacherId.length === 0) {
      return Result.fail<ProblemSetSearchCriteria>('Teacher ID cannot be empty');
    }

    return Result.ok<ProblemSetSearchCriteria>(
      new ProblemSetSearchCriteria({ teacherId: trimmedTeacherId })
    );
  }

  // Builder-style methods for composing criteria
  public withTitleFilter(titleFilter: TitleFilter): ProblemSetSearchCriteria {
    return new ProblemSetSearchCriteria({
      ...this.props,
      titleFilter
    });
  }

  public withDescriptionFilter(hasDescription: boolean): ProblemSetSearchCriteria {
    return new ProblemSetSearchCriteria({
      ...this.props,
      hasDescription
    });
  }

  public withItemCountRange(itemCountRange: ItemCountRange): ProblemSetSearchCriteria {
    return new ProblemSetSearchCriteria({
      ...this.props,
      itemCountRange
    });
  }

  public withCreatedDateRange(createdDateRange: DateRange): ProblemSetSearchCriteria {
    return new ProblemSetSearchCriteria({
      ...this.props,
      createdDateRange
    });
  }

  public withUpdatedDateRange(updatedDateRange: DateRange): ProblemSetSearchCriteria {
    return new ProblemSetSearchCriteria({
      ...this.props,
      updatedDateRange
    });
  }

  public hasAnyFilter(): boolean {
    return !!(
      this.props.titleFilter ||
      this.props.hasDescription !== undefined ||
      this.props.itemCountRange ||
      this.props.createdDateRange ||
      this.props.updatedDateRange
    );
  }

  public isSimpleTeacherQuery(): boolean {
    return !this.hasAnyFilter();
  }
}