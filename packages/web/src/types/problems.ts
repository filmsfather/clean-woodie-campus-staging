// Application 레이어의 DTO를 그대로 재사용 (DTO-First 원칙)
export type {
  ProblemDto,
  ProblemDetailDto,
  ProblemContentDto,
  ProblemSearchRequestDto,
  ProblemSearchResponseDto,
  PaginationRequestDto,
  SortRequestDto,
  SearchMetadataDto,
  ProblemTypeStatsDto,
  DifficultyStatsDto,
  TagUsageDto,
  RecentActivityDto,
  ProblemBankSummaryDto,
  TagDistributionDto,
  TagAnalyticsDto,
  TagRecommendationDto,
  ProblemCloneRequestDto,
  ProblemCloneResponseDto,
  BulkOperationRequestDto,
  BulkUpdateTagsRequestDto,
  BulkUpdateStatusRequestDto,
  BulkOperationResponseDto,
  PermissionCheckDto,
  BulkPermissionCheckDto,
  ValidationResultDto,
  ExportRequestDto,
  ExportResponseDto,
  ImportRequestDto,
  ImportResponseDto
} from '@woodie/application';

// UseCase Input/Output 타입들도 재사용
export type {
  CreateProblemInput,
  CreateProblemOutput,
  GetProblemInput,
  GetProblemListInput,
  GetProblemListOutput,
  SearchProblemsInput,
  SearchProblemsOutput,
  UpdateProblemContentInput,
  UpdateProblemAnswerInput,
  ChangeProblemDifficultyInput,
  ManageProblemTagsInput,
  ActivateProblemInput,
  DeactivateProblemInput,
  DeleteProblemInput,
  CloneProblemInput,
  ProblemOutput
} from '@woodie/application';

// UI 상태 관리용 추가 타입들
export interface ProblemListState {
  problems: ProblemDto[];
  totalCount: number;
  page: number;
  limit: number;
  hasNext: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ProblemSearchState {
  searchRequest: ProblemSearchRequestDto;
  results: ProblemSearchResponseDto | null;
  isLoading: boolean;
  error: string | null;
}

export interface ProblemFormState {
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
}

export interface ProblemDetailState {
  problem: ProblemDetailDto | null;
  isLoading: boolean;
  error: string | null;
}

// 액션 타입들 (Command UseCase 대응)
export interface ProblemActions {
  create: (input: CreateProblemInput) => Promise<void>;
  updateContent: (input: UpdateProblemContentInput) => Promise<void>;
  updateAnswer: (input: UpdateProblemAnswerInput) => Promise<void>;
  changeDifficulty: (input: ChangeProblemDifficultyInput) => Promise<void>;
  manageTags: (input: ManageProblemTagsInput) => Promise<void>;
  activate: (input: ActivateProblemInput) => Promise<void>;
  deactivate: (input: DeactivateProblemInput) => Promise<void>;
  delete: (input: DeleteProblemInput) => Promise<void>;
  clone: (input: CloneProblemInput) => Promise<void>;
}