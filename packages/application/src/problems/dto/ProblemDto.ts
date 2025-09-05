// 출력 경계 DTO들 (Application → API/Infrastructure)

export interface ProblemDto {
  id: string;
  teacherId: string;
  type: string;
  title: string;
  description?: string;
  difficulty: number;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProblemContentDto {
  type: string;
  title: string;
  description?: string;
  instructions?: string;
  // 타입별 추가 콘텐츠는 any로 처리 (유연성)
  [key: string]: any;
}

export interface ProblemDetailDto extends ProblemDto {
  content: ProblemContentDto;
  correctAnswer: {
    type: string;
    points: number;
    [key: string]: any;
  };
}

// 검색 관련 DTO
export interface ProblemSearchRequestDto {
  teacherId?: string;
  types?: string[];
  difficulties?: number[];
  tags?: string[];
  isActive?: boolean;
  searchQuery?: string;
  createdAfter?: string; // ISO string
  createdBefore?: string; // ISO string
}

export interface PaginationRequestDto {
  page?: number;
  limit: number;
  strategy: 'offset' | 'cursor';
  cursor?: {
    field: 'id' | 'createdAt' | 'updatedAt';
    value: string;
    direction: 'after' | 'before';
  };
}

export interface SortRequestDto {
  field: 'createdAt' | 'updatedAt' | 'difficulty' | 'title';
  direction: 'ASC' | 'DESC';
}

export interface SearchMetadataDto {
  totalCount?: number;
  currentPage?: number;
  totalPages?: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextCursor?: string;
  previousCursor?: string;
}

export interface ProblemSearchResponseDto {
  problems: ProblemDto[];
  totalCount: number;
  metadata: SearchMetadataDto;
}

// 통계 관련 DTO
export interface ProblemTypeStatsDto {
  type: string;
  count: number;
  percentage: number;
}

export interface DifficultyStatsDto {
  difficulty: number;
  count: number;
  percentage: number;
}

export interface TagUsageDto {
  tag: string;
  count: number;
  percentage: number;
}

export interface RecentActivityDto {
  createdThisWeek: number;
  createdThisMonth: number;
  updatedThisWeek: number;
}

export interface ProblemBankSummaryDto {
  teacherId: string;
  totalProblems: number;
  activeProblems: number;
  inactiveProblems: number;
  problemsByType: ProblemTypeStatsDto[];
  problemsByDifficulty: DifficultyStatsDto[];
  averageTagsPerProblem: number;
  mostUsedTags: TagUsageDto[];
  recentActivity: RecentActivityDto;
}

// 태그 분석 DTO
export interface TagDistributionDto {
  tagName: string;
  problemIds: string[];
  count: number;
}

export interface TagAnalyticsDto {
  totalUniqueTags: number;
  averageTagsPerProblem: number;
  distribution: TagDistributionDto[];
  mostUsedTags: TagUsageDto[];
  recentlyAddedTags: Array<{
    tag: string;
    addedAt: string;
    problemCount: number;
  }>;
}

export interface TagRecommendationDto {
  recommendedTags: string[];
  confidence: number;
  basedOn: 'content' | 'similarity' | 'usage_pattern';
  explanation?: string;
}

// 문제 관리 DTO
export interface ProblemCloneRequestDto {
  problemIds: string[];
  targetTeacherId: string;
  preserveTags?: boolean;
  preserveDifficulty?: boolean;
  markAsActive?: boolean;
}

export interface ProblemCloneResponseDto {
  clonedProblems: ProblemDto[];
  successCount: number;
  failedCount: number;
  errors: string[];
}

export interface BulkOperationRequestDto {
  problemIds: string[];
  teacherId: string;
}

export interface BulkUpdateTagsRequestDto extends BulkOperationRequestDto {
  tags: string[];
  operation: 'add' | 'remove' | 'replace';
}

export interface BulkUpdateStatusRequestDto extends BulkOperationRequestDto {
  isActive: boolean;
}

export interface BulkOperationResponseDto {
  successCount: number;
  failedCount: number;
  affectedProblemIds: string[];
  errors: Array<{
    problemId: string;
    error: string;
  }>;
}

// 권한 확인 DTO
export interface PermissionCheckDto {
  problemId: string;
  teacherId: string;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
}

export interface BulkPermissionCheckDto {
  permissions: PermissionCheckDto[];
  summary: {
    totalChecked: number;
    readableCount: number;
    writableCount: number;
    deletableCount: number;
  };
}

export interface ValidationResultDto {
  valid: boolean;
  errors: Array<{
    code: string;
    message: string;
    problemId?: string;
    field?: string;
  }>;
  warnings: Array<{
    code: string;
    message: string;
    problemId?: string;
  }>;
}

// 내보내기/가져오기 DTO
export interface ExportRequestDto {
  teacherId: string;
  filter?: ProblemSearchRequestDto;
  format: 'json' | 'csv';
  includeStatistics?: boolean;
}

export interface ExportResponseDto {
  data: string;
  format: string;
  exportedAt: string;
  problemCount: number;
  fileSize: number;
}

export interface ImportRequestDto {
  teacherId: string;
  data: string;
  format: 'json' | 'csv';
  options?: {
    skipDuplicates?: boolean;
    overwriteExisting?: boolean;
    preserveIds?: boolean;
  };
}

export interface ImportResponseDto {
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  totalProcessed: number;
  errors: Array<{
    line?: number;
    problemId?: string;
    error: string;
  }>;
  summary: {
    newProblems: number;
    updatedProblems: number;
    duplicatesSkipped: number;
  };
}