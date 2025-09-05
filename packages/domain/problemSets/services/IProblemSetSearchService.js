import { Result } from '../../common/Result';
// 정렬 옵션 값 객체
export class ProblemSetSortOption {
    field;
    direction;
    constructor(field, direction) {
        this.field = field;
        this.direction = direction;
    }
    static byCreatedDate(ascending = false) {
        return new ProblemSetSortOption('createdAt', ascending ? 'ASC' : 'DESC');
    }
    static byUpdatedDate(ascending = false) {
        return new ProblemSetSortOption('updatedAt', ascending ? 'ASC' : 'DESC');
    }
    static byTitle(ascending = true) {
        return new ProblemSetSortOption('title', ascending ? 'ASC' : 'DESC');
    }
    static byItemCount(ascending = false) {
        return new ProblemSetSortOption('itemCount', ascending ? 'ASC' : 'DESC');
    }
}
// 페이지네이션 옵션 값 객체
export class ProblemSetPaginationOption {
    limit;
    offset;
    constructor(limit, offset = 0) {
        this.limit = limit;
        this.offset = offset;
    }
    static create(limit, offset = 0) {
        if (limit <= 0) {
            return Result.fail('Limit must be greater than 0');
        }
        if (limit > 100) {
            return Result.fail('Limit cannot exceed 100');
        }
        if (offset < 0) {
            return Result.fail('Offset cannot be negative');
        }
        return Result.ok(new ProblemSetPaginationOption(limit, offset));
    }
    static firstPage(limit) {
        return ProblemSetPaginationOption.create(limit, 0);
    }
    nextPage() {
        return new ProblemSetPaginationOption(this.limit, this.offset + this.limit);
    }
    previousPage() {
        const newOffset = Math.max(0, this.offset - this.limit);
        return new ProblemSetPaginationOption(this.limit, newOffset);
    }
}
//# sourceMappingURL=IProblemSetSearchService.js.map