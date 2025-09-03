import { Problem } from '../entities/Problem';
import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';

// 문제 검색 필터 인터페이스 (Primitive 중심)
export interface ProblemSearchFilter {
  teacherId?: string;
  typeValues?: string[];        // 'multiple_choice', 'short_answer' 등
  difficultyLevels?: number[];  // 1, 2, 3, 4, 5
  tagNames?: string[];          // 태그 이름 배열
  isActive?: boolean;
  searchQuery?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
}

// 하이브리드 페이징 옵션 (Offset + Cursor 지원)
export interface PaginationOptions {
  limit: number;
  
  // Offset 기반 (기존 방식)
  page?: number;
  
  // Cursor 기반 (성능 최적화)
  cursor?: {
    field: 'id' | 'createdAt' | 'updatedAt';
    value: string | Date;
    direction: 'after' | 'before';
  };
  
  // 페이지네이션 전략 선택
  strategy: 'offset' | 'cursor';
}

// 정렬 옵션 (기존 유지)
export interface SortOptions {
  field: 'createdAt' | 'updatedAt' | 'difficulty' | 'title';
  direction: 'ASC' | 'DESC';
}

// 검색 결과 메타데이터 (하이브리드 지원)
export interface SearchResultMetadata {
  // Offset 기반 메타데이터
  totalCount?: number;
  currentPage?: number;
  totalPages?: number;
  
  // 공통 메타데이터
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  
  // Cursor 기반 메타데이터
  nextCursor?: string;
  previousCursor?: string;
}

// 검색 결과 래퍼
export interface ProblemSearchResult {
  problems: Problem[];
  metadata: SearchResultMetadata;
}

// 태그 그룹 결과 (Map 대신 배열 구조 사용)
export interface TagGroupResult {
  tagName: string;
  problems: Problem[];
  count: number;
}

// 난이도 분포 결과 (Map 대신 배열 구조 사용)
export interface DifficultyDistribution {
  difficulty: number;
  count: number;
  percentage: number;
}

// 문제 통계 정보
export interface ProblemStatistics {
  totalProblems: number;
  problemsByType: Array<{ type: string; count: number }>;
  problemsByDifficulty: DifficultyDistribution[];
  activeProblems: number;
  inactiveProblems: number;
  averageTagsPerProblem: number;
  mostUsedTags: Array<{ tag: string; count: number }>;
  recentActivity: {
    createdThisWeek: number;
    createdThisMonth: number;
    updatedThisWeek: number;
  };
}

// 문제 뱅크 관리 옵션
export interface ProblemBankOptions {
  includeInactive?: boolean;
  includeStatistics?: boolean;
  tagFilter?: string[];
  difficultyRange?: { min: number; max: number };
}

// 문제 복제 옵션
export interface ProblemCloneOptions {
  newTeacherId?: string;
  preserveTags?: boolean;
  preserveDifficulty?: boolean;
  markAsActive?: boolean;
}

// 교사별 문제 뱅크 Repository 인터페이스
export interface IProblemRepository {
  
  // === 기본 CRUD 작업 ===
  
  // 문제 저장 (생성 또는 업데이트)
  save(problem: Problem): Promise<Result<void>>;
  
  // ID로 문제 조회
  findById(id: UniqueEntityID): Promise<Result<Problem>>;
  
  // 문제 삭제 (물리적 삭제)
  delete(id: UniqueEntityID): Promise<Result<void>>;
  
  // === 교사별 문제 뱅크 작업 ===
  
  // 교사의 모든 문제 조회
  findByTeacherId(
    teacherId: string, 
    options?: ProblemBankOptions
  ): Promise<Result<Problem[]>>;
  
  // 교사의 문제 검색 (필터링, 페이징, 정렬)
  searchProblems(
    filter: ProblemSearchFilter,
    pagination?: PaginationOptions,
    sort?: SortOptions
  ): Promise<Result<ProblemSearchResult>>;
  
  // 교사의 문제 통계 조회
  getTeacherStatistics(teacherId: string): Promise<Result<ProblemStatistics>>;
  
  // === 문제 뱅크 관리 ===
  
  // 문제 복제 (같은 교사 또는 다른 교사에게)
  cloneProblem(
    problemId: UniqueEntityID,
    options: ProblemCloneOptions
  ): Promise<Result<Problem>>;
  
  // 문제 일괄 복제
  cloneProblems(
    problemIds: UniqueEntityID[],
    targetTeacherId: string,
    options?: Partial<ProblemCloneOptions>
  ): Promise<Result<Problem[]>>;
  
  // 문제 일괄 활성화/비활성화
  bulkUpdateActiveStatus(
    problemIds: UniqueEntityID[],
    isActive: boolean,
    teacherId: string
  ): Promise<Result<void>>;
  
  // 문제 일괄 태그 업데이트
  bulkUpdateTags(
    problemIds: UniqueEntityID[],
    tags: string[], // primitive 사용
    teacherId: string,
    operation: 'add' | 'remove' | 'replace'
  ): Promise<Result<void>>;
  
  // === 고급 검색 및 분석 ===
  
  // 유사한 문제 찾기 (내용 기반)
  findSimilarProblems(
    problem: Problem,
    teacherId: string,
    limit?: number
  ): Promise<Result<Problem[]>>;
  
  // 태그별 문제 그룹화 (배열 구조 반환)
  groupProblemsByTag(
    teacherId: string,
    tagNames?: string[]
  ): Promise<Result<TagGroupResult[]>>;
  
  // 난이도별 문제 분포 (배열 구조 반환)
  getDifficultyDistribution(
    teacherId: string
  ): Promise<Result<DifficultyDistribution[]>>;
  
  // === 집계 쿼리 (성능 최적화) ===
  
  // 교사의 태그 통계 (DB 레벨 집계)
  getTeacherTagStatistics(
    teacherId: string
  ): Promise<Result<Array<{ tag: string; count: number; percentage: number }>>>;
  
  // 교사의 모든 태그 목록 (중복 제거됨)
  getTeacherUniqueTags(
    teacherId: string
  ): Promise<Result<string[]>>;
  
  // 교사의 문제 유형 분포 (집계 쿼리)
  getTeacherTypeDistribution(
    teacherId: string
  ): Promise<Result<Array<{ type: string; count: number; percentage: number }>>>;
  
  // === 문제 뱅크 내보내기/가져오기 ===
  
  // 문제 뱅크 내보내기 (JSON 포맷)
  exportProblemBank(
    teacherId: string,
    filter?: ProblemSearchFilter
  ): Promise<Result<string>>; // JSON string
  
  // 문제 뱅크 가져오기 (JSON에서 복원)
  importProblemBank(
    teacherId: string,
    jsonData: string,
    options?: {
      skipDuplicates?: boolean;
      overwriteExisting?: boolean;
      preserveIds?: boolean;
    }
  ): Promise<Result<{ imported: number; skipped: number; errors: string[] }>>;
  
  // === 권한 및 접근 제어 ===
  
  // 교사의 문제 소유권 확인
  verifyOwnership(
    problemId: UniqueEntityID,
    teacherId: string
  ): Promise<Result<boolean>>;
  
  // 교사가 문제에 접근할 수 있는지 확인
  canAccess(
    problemId: UniqueEntityID,
    teacherId: string
  ): Promise<Result<boolean>>;
  
  // 일괄 소유권 확인 (N+1 방지)
  bulkVerifyOwnership(
    problemIds: UniqueEntityID[],
    teacherId: string
  ): Promise<Result<Array<{ id: string; isOwner: boolean }>>>;
  
  // 일괄 접근 권한 확인 (N+1 방지)  
  bulkCanAccess(
    problemIds: UniqueEntityID[],
    teacherId: string
  ): Promise<Result<Array<{ id: string; canAccess: boolean }>>>;
  
  // === 성능 최적화 ===
  
  // 교사의 문제 ID 목록만 조회 (가벼운 조회)
  findProblemIdsByTeacher(
    teacherId: string,
    filter?: Pick<ProblemSearchFilter, 'typeValues' | 'difficultyLevels' | 'isActive'>
  ): Promise<Result<UniqueEntityID[]>>;
  
  // 문제 존재 여부 확인
  exists(id: UniqueEntityID): Promise<Result<boolean>>;
  
  // 여러 문제 존재 여부 일괄 확인
  existsMany(ids: UniqueEntityID[]): Promise<Result<Array<{ id: string; exists: boolean }>>>;

  // === Additional methods used by CachedProblemService ===
  
  // Create new problem
  create(problem: Problem): Promise<Result<Problem>>;
  
  // Update existing problem  
  update(problem: Problem): Promise<Result<Problem>>;
  
  // Find by teacher (alias for findByTeacherId)
  findByTeacher(teacherId: string, options?: ProblemBankOptions): Promise<Result<Problem[]>>;
  
  // Search problems with text query
  search(query: string, filter?: ProblemSearchFilter): Promise<Result<Problem[]>>;
  
  // Find problems by tag names
  findByTags(tagNames: string[], teacherId?: string): Promise<Result<Problem[]>>;
  
  // Find popular problems
  findPopular(limit?: number, teacherId?: string): Promise<Result<Problem[]>>;
  
  // Get statistics for problems
  getStatistics(teacherId?: string): Promise<Result<ProblemStatistics>>;
}