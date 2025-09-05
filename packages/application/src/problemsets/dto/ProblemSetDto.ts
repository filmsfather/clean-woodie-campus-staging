/**
 * ProblemSet 관련 DTO 정의
 * DDD: Application Layer의 DTO는 도메인 엔티티와 외부 인터페이스 간의 변환을 담당
 */

// 기본 문제집 DTO
export interface ProblemSetDto {
  id: string
  title: string
  description?: string
  teacherId: string
  teacherName?: string
  itemCount: number
  totalPoints?: number
  estimatedTimeMinutes?: number
  isPublic: boolean
  isShared: boolean
  createdAt: Date
  updatedAt: Date
}

// 문제집 아이템 DTO
export interface ProblemSetItemDto {
  id: string
  problemId: string
  problemTitle?: string
  problemType?: string
  orderIndex: number
  points: number
  settings?: Record<string, any>
}

// 상세 문제집 DTO (아이템 포함)
export interface DetailedProblemSetDto extends ProblemSetDto {
  items: ProblemSetItemDto[]
}

// === Create ProblemSet DTOs ===
export interface CreateProblemSetRequest {
  title: string
  description?: string
  teacherId: string
  isPublic?: boolean
  isShared?: boolean
  initialProblems?: Array<{
    problemId: string
    orderIndex: number
    points?: number
  }>
}

export interface CreateProblemSetResponse {
  problemSet: ProblemSetDto
  validationWarnings?: string[]
}

// === Get ProblemSet DTOs ===
export interface GetProblemSetRequest {
  problemSetId: string
  requesterId: string
  requesterRole: 'student' | 'teacher' | 'admin'
  includeItems?: boolean
}

export interface GetProblemSetResponse {
  problemSet: DetailedProblemSetDto
  permissions: ProblemSetPermissionsDto
}

// === Update ProblemSet DTOs ===
export interface UpdateProblemSetRequest {
  problemSetId: string
  requesterId: string
  updates: {
    title?: string
    description?: string
    isPublic?: boolean
    isShared?: boolean
  }
}

export interface UpdateProblemSetResponse {
  problemSet: ProblemSetDto
  updatedFields: string[]
}

// === Delete ProblemSet DTOs ===
export interface DeleteProblemSetRequest {
  problemSetId: string
  requesterId: string
  force?: boolean
}

export interface DeleteProblemSetResponse {
  success: boolean
  warnings?: string[]
}

// === List ProblemSets DTOs ===
export interface GetProblemSetListRequest {
  requesterId: string
  requesterRole: 'student' | 'teacher' | 'admin'
  filters?: {
    teacherId?: string
    isPublic?: boolean
    isShared?: boolean
    search?: string
  }
  pagination?: {
    page: number
    limit: number
  }
  sorting?: {
    field: 'title' | 'createdAt' | 'updatedAt' | 'itemCount'
    order: 'asc' | 'desc'
  }
}

export interface GetProblemSetListResponse {
  problemSets: ProblemSetDto[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNext: boolean
    hasPrevious: boolean
  }
  filters: {
    applied: any
    available: {
      teachers: string[]
      tags: string[]
    }
  }
}

// === Add Problem to ProblemSet DTOs ===
export interface AddProblemToProblemSetRequest {
  problemSetId: string
  problemId: string
  requesterId: string
  orderIndex?: number
  points?: number
}

export interface AddProblemToProblemSetResponse {
  problemSet: DetailedProblemSetDto
  addedItem: ProblemSetItemDto
}

// === Remove Problem from ProblemSet DTOs ===
export interface RemoveProblemFromProblemSetRequest {
  problemSetId: string
  problemId: string
  requesterId: string
}

export interface RemoveProblemFromProblemSetResponse {
  problemSet: DetailedProblemSetDto
  removedItem: ProblemSetItemDto
}

// === Reorder ProblemSet Items DTOs ===
export interface ReorderProblemSetItemsRequest {
  problemSetId: string
  requesterId: string
  orderedProblemIds: string[]
}

export interface ReorderProblemSetItemsResponse {
  problemSet: DetailedProblemSetDto
  reorderedItems: ProblemSetItemDto[]
}

// === Clone ProblemSet DTOs ===
export interface CloneProblemSetRequest {
  sourceProblemSetId: string
  targetTeacherId: string
  newTitle?: string
  newDescription?: string
  isPublic?: boolean
  isShared?: boolean
}

export interface CloneProblemSetResponse {
  clonedProblemSet: ProblemSetDto
  originalProblemSet: Pick<ProblemSetDto, 'id' | 'title' | 'teacherName'>
}

// === 권한 관련 DTOs ===
export interface ProblemSetPermissionsDto {
  problemSetId: string
  userId: string
  userRole: 'student' | 'teacher' | 'admin'
  canRead: boolean
  canWrite: boolean
  canDelete: boolean
  canShare: boolean
  canClone: boolean
  isOwner: boolean
}

// === 검증 관련 DTOs ===
export interface ProblemSetValidationResult {
  valid: boolean
  errors: Array<{
    field: string
    code: string
    message: string
  }>
  warnings: Array<{
    field: string
    code: string
    message: string
  }>
}