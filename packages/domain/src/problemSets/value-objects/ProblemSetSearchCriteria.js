import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
import { Guard } from '../../common/Guard';
// 날짜 범위 값 객체
export class DateRange extends ValueObject {
    get from() {
        return this.props.from;
    }
    get to() {
        return this.props.to;
    }
    static create(from, to) {
        if (from > to) {
            return Result.fail('From date must be before or equal to to date');
        }
        return Result.ok(new DateRange({ from, to }));
    }
}
// 아이템 개수 범위 값 객체
export class ItemCountRange extends ValueObject {
    get min() {
        return this.props.min;
    }
    get max() {
        return this.props.max;
    }
    static create(min, max) {
        if (min < 0) {
            return Result.fail('Minimum count cannot be negative');
        }
        if (max < min) {
            return Result.fail('Maximum count must be greater than or equal to minimum count');
        }
        return Result.ok(new ItemCountRange({ min, max }));
    }
}
// 제목 필터 값 객체
export class TitleFilter extends ValueObject {
    get pattern() {
        return this.props.pattern;
    }
    get caseSensitive() {
        return this.props.caseSensitive;
    }
    static create(pattern, caseSensitive = false) {
        const guardResult = Guard.againstNullOrUndefined(pattern, 'pattern');
        if (guardResult.isFailure) {
            return Result.fail(guardResult.error);
        }
        const trimmedPattern = pattern.trim();
        if (trimmedPattern.length === 0) {
            return Result.fail('Title filter pattern cannot be empty');
        }
        if (trimmedPattern.length > 100) {
            return Result.fail('Title filter pattern cannot exceed 100 characters');
        }
        return Result.ok(new TitleFilter({ pattern: trimmedPattern, caseSensitive }));
    }
}
export class ProblemSetSearchCriteria extends ValueObject {
    get teacherId() {
        return this.props.teacherId;
    }
    get titleFilter() {
        return this.props.titleFilter;
    }
    get hasDescription() {
        return this.props.hasDescription;
    }
    get itemCountRange() {
        return this.props.itemCountRange;
    }
    get createdDateRange() {
        return this.props.createdDateRange;
    }
    get updatedDateRange() {
        return this.props.updatedDateRange;
    }
    constructor(props) {
        super(props);
    }
    // Factory Methods
    static forTeacher(teacherId) {
        const guardResult = Guard.againstNullOrUndefined(teacherId, 'teacherId');
        if (guardResult.isFailure) {
            return Result.fail(guardResult.error);
        }
        const trimmedTeacherId = teacherId.trim();
        if (trimmedTeacherId.length === 0) {
            return Result.fail('Teacher ID cannot be empty');
        }
        return Result.ok(new ProblemSetSearchCriteria({ teacherId: trimmedTeacherId }));
    }
    // Builder-style methods for composing criteria
    withTitleFilter(titleFilter) {
        return new ProblemSetSearchCriteria({
            ...this.props,
            titleFilter
        });
    }
    withDescriptionFilter(hasDescription) {
        return new ProblemSetSearchCriteria({
            ...this.props,
            hasDescription
        });
    }
    withItemCountRange(itemCountRange) {
        return new ProblemSetSearchCriteria({
            ...this.props,
            itemCountRange
        });
    }
    withCreatedDateRange(createdDateRange) {
        return new ProblemSetSearchCriteria({
            ...this.props,
            createdDateRange
        });
    }
    withUpdatedDateRange(updatedDateRange) {
        return new ProblemSetSearchCriteria({
            ...this.props,
            updatedDateRange
        });
    }
    hasAnyFilter() {
        return !!(this.props.titleFilter ||
            this.props.hasDescription !== undefined ||
            this.props.itemCountRange ||
            this.props.createdDateRange ||
            this.props.updatedDateRange);
    }
    isSimpleTeacherQuery() {
        return !this.hasAnyFilter();
    }
}
//# sourceMappingURL=ProblemSetSearchCriteria.js.map