import { Result } from '../../common/Result';
import { ProblemSet } from '../entities/ProblemSet';
import { ProblemSetSearchCriteria } from '../value-objects/ProblemSetSearchCriteria';

// 정렬 옵션 값 객체
export class ProblemSetSortOption {
  constructor(
    public readonly field: 'createdAt' | 'updatedAt' | 'title' | 'itemCount',
    public readonly direction: 'ASC' | 'DESC'
  ) {}

  public static byCreatedDate(ascending: boolean = false): ProblemSetSortOption {
    return new ProblemSetSortOption('createdAt', ascending ? 'ASC' : 'DESC');
  }

  public static byUpdatedDate(ascending: boolean = false): ProblemSetSortOption {
    return new ProblemSetSortOption('updatedAt', ascending ? 'ASC' : 'DESC');
  }

  public static byTitle(ascending: boolean = true): ProblemSetSortOption {
    return new ProblemSetSortOption('title', ascending ? 'ASC' : 'DESC');
  }

  public static byItemCount(ascending: boolean = false): ProblemSetSortOption {
    return new ProblemSetSortOption('itemCount', ascending ? 'ASC' : 'DESC');
  }
}

// 페이지네이션 옵션 값 객체
export class ProblemSetPaginationOption {
  constructor(
    public readonly limit: number,
    public readonly offset: number = 0
  ) {}

  public static create(limit: number, offset: number = 0): Result<ProblemSetPaginationOption> {
    if (limit <= 0) {
      return Result.fail<ProblemSetPaginationOption>('Limit must be greater than 0');
    }

    if (limit > 100) {
      return Result.fail<ProblemSetPaginationOption>('Limit cannot exceed 100');
    }

    if (offset < 0) {
      return Result.fail<ProblemSetPaginationOption>('Offset cannot be negative');
    }

    return Result.ok<ProblemSetPaginationOption>(new ProblemSetPaginationOption(limit, offset));
  }

  public static firstPage(limit: number): Result<ProblemSetPaginationOption> {
    return ProblemSetPaginationOption.create(limit, 0);
  }

  public nextPage(): ProblemSetPaginationOption {
    return new ProblemSetPaginationOption(this.limit, this.offset + this.limit);
  }

  public previousPage(): ProblemSetPaginationOption {
    const newOffset = Math.max(0, this.offset - this.limit);
    return new ProblemSetPaginationOption(this.limit, newOffset);
  }
}

// 검색 결과 메타데이터
export interface ProblemSetSearchMetadata {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// 검색 결과
export interface ProblemSetSearchResult {
  problemSets: ProblemSet[];
  metadata: ProblemSetSearchMetadata;
}

/**
 * ProblemSet 검색 도메인 서비스
 * 복잡한 검색 로직을 담당하며, Repository의 단순한 조회 메소드들을 조합하여 사용
 */
export interface IProblemSetSearchService {
  
  // 기본 검색 - 조건, 정렬, 페이지네이션 모두 지원
  search(
    criteria: ProblemSetSearchCriteria,
    sort?: ProblemSetSortOption,
    pagination?: ProblemSetPaginationOption
  ): Promise<Result<ProblemSetSearchResult>>;
  
  // 간단한 제목 검색
  searchByTitle(
    teacherId: string,
    titlePattern: string,
    caseSensitive?: boolean
  ): Promise<Result<ProblemSet[]>>;
  
  // 빈 문제집 찾기
  findEmptyProblemSets(teacherId: string): Promise<Result<ProblemSet[]>>;
  
  // 큰 문제집 찾기 (지정된 개수 이상)
  findLargeProblemSets(
    teacherId: string,
    minItemCount: number
  ): Promise<Result<ProblemSet[]>>;
  
  // 최근 생성된 문제집 찾기
  findRecentlyCreated(
    teacherId: string,
    days: number,
    limit?: number
  ): Promise<Result<ProblemSet[]>>;
  
  // 최근 업데이트된 문제집 찾기
  findRecentlyUpdated(
    teacherId: string,
    days: number,
    limit?: number
  ): Promise<Result<ProblemSet[]>>;
}