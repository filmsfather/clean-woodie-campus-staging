import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
export declare class DateRange extends ValueObject<{
    from: Date;
    to: Date;
}> {
    get from(): Date;
    get to(): Date;
    static create(from: Date, to: Date): Result<DateRange>;
}
export declare class ItemCountRange extends ValueObject<{
    min: number;
    max: number;
}> {
    get min(): number;
    get max(): number;
    static create(min: number, max: number): Result<ItemCountRange>;
}
export declare class TitleFilter extends ValueObject<{
    pattern: string;
    caseSensitive: boolean;
}> {
    get pattern(): string;
    get caseSensitive(): boolean;
    static create(pattern: string, caseSensitive?: boolean): Result<TitleFilter>;
}
interface ProblemSetSearchCriteriaProps {
    teacherId: string;
    titleFilter?: TitleFilter;
    hasDescription?: boolean;
    itemCountRange?: ItemCountRange;
    createdDateRange?: DateRange;
    updatedDateRange?: DateRange;
}
export declare class ProblemSetSearchCriteria extends ValueObject<ProblemSetSearchCriteriaProps> {
    get teacherId(): string;
    get titleFilter(): TitleFilter | undefined;
    get hasDescription(): boolean | undefined;
    get itemCountRange(): ItemCountRange | undefined;
    get createdDateRange(): DateRange | undefined;
    get updatedDateRange(): DateRange | undefined;
    private constructor();
    static forTeacher(teacherId: string): Result<ProblemSetSearchCriteria>;
    withTitleFilter(titleFilter: TitleFilter): ProblemSetSearchCriteria;
    withDescriptionFilter(hasDescription: boolean): ProblemSetSearchCriteria;
    withItemCountRange(itemCountRange: ItemCountRange): ProblemSetSearchCriteria;
    withCreatedDateRange(createdDateRange: DateRange): ProblemSetSearchCriteria;
    withUpdatedDateRange(updatedDateRange: DateRange): ProblemSetSearchCriteria;
    hasAnyFilter(): boolean;
    isSimpleTeacherQuery(): boolean;
}
export {};
//# sourceMappingURL=ProblemSetSearchCriteria.d.ts.map