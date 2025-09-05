import { Result } from '../../common/Result';
import { ProblemSet } from '../entities/ProblemSet';
import { ProblemSetSearchCriteria } from '../value-objects/ProblemSetSearchCriteria';
export declare class ProblemSetSortOption {
    readonly field: 'createdAt' | 'updatedAt' | 'title' | 'itemCount';
    readonly direction: 'ASC' | 'DESC';
    constructor(field: 'createdAt' | 'updatedAt' | 'title' | 'itemCount', direction: 'ASC' | 'DESC');
    static byCreatedDate(ascending?: boolean): ProblemSetSortOption;
    static byUpdatedDate(ascending?: boolean): ProblemSetSortOption;
    static byTitle(ascending?: boolean): ProblemSetSortOption;
    static byItemCount(ascending?: boolean): ProblemSetSortOption;
}
export declare class ProblemSetPaginationOption {
    readonly limit: number;
    readonly offset: number;
    constructor(limit: number, offset?: number);
    static create(limit: number, offset?: number): Result<ProblemSetPaginationOption>;
    static firstPage(limit: number): Result<ProblemSetPaginationOption>;
    nextPage(): ProblemSetPaginationOption;
    previousPage(): ProblemSetPaginationOption;
}
export interface ProblemSetSearchMetadata {
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}
export interface ProblemSetSearchResult {
    problemSets: ProblemSet[];
    metadata: ProblemSetSearchMetadata;
}
/**
 * ProblemSet 검색 도메인 서비스
 * 복잡한 검색 로직을 담당하며, Repository의 단순한 조회 메소드들을 조합하여 사용
 */
export interface IProblemSetSearchService {
    search(criteria: ProblemSetSearchCriteria, sort?: ProblemSetSortOption, pagination?: ProblemSetPaginationOption): Promise<Result<ProblemSetSearchResult>>;
    searchByTitle(teacherId: string, titlePattern: string, caseSensitive?: boolean): Promise<Result<ProblemSet[]>>;
    findEmptyProblemSets(teacherId: string): Promise<Result<ProblemSet[]>>;
    findLargeProblemSets(teacherId: string, minItemCount: number): Promise<Result<ProblemSet[]>>;
    findRecentlyCreated(teacherId: string, days: number, limit?: number): Promise<Result<ProblemSet[]>>;
    findRecentlyUpdated(teacherId: string, days: number, limit?: number): Promise<Result<ProblemSet[]>>;
}
//# sourceMappingURL=IProblemSetSearchService.d.ts.map