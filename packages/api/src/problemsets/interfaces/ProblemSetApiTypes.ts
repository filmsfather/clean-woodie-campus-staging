// ProblemSet API 레이어 요청/응답 타입 정의

import { Request } from 'express'
import {
  ProblemSetDto,
  DetailedProblemSetDto,
  ProblemSetItemDto,
  ProblemSetPermissionsDto,
  CreateProblemSetRequest as CreateProblemSetUseCaseRequest,
  CreateProblemSetResponse as CreateProblemSetUseCaseResponse,
  GetProblemSetRequest as GetProblemSetUseCaseRequest,
  GetProblemSetResponse as GetProblemSetUseCaseResponse,
  GetProblemSetListRequest as GetProblemSetListUseCaseRequest,
  GetProblemSetListResponse as GetProblemSetListUseCaseResponse,
  UpdateProblemSetRequest as UpdateProblemSetUseCaseRequest,
  UpdateProblemSetResponse as UpdateProblemSetUseCaseResponse,
  DeleteProblemSetRequest as DeleteProblemSetUseCaseRequest,
  DeleteProblemSetResponse as DeleteProblemSetUseCaseResponse,
  AddProblemToProblemSetRequest as AddProblemToProblemSetUseCaseRequest,
  AddProblemToProblemSetResponse as AddProblemToProblemSetUseCaseResponse,
  RemoveProblemFromProblemSetRequest as RemoveProblemFromProblemSetUseCaseRequest,
  RemoveProblemFromProblemSetResponse as RemoveProblemFromProblemSetUseCaseResponse,
  ReorderProblemSetItemsRequest as ReorderProblemSetItemsUseCaseRequest,
  ReorderProblemSetItemsResponse as ReorderProblemSetItemsUseCaseResponse
} from '@woodie/application'

// === 기본 CRUD API 요청/응답 ===

export interface CreateProblemSetApiRequest {
  title: string
  description?: string
  isPublic?: boolean
  isShared?: boolean
  initialProblems?: Array<{
    problemId: string
    orderIndex: number
    points?: number
  }>
}

export interface CreateProblemSetApiResponse {
  problemSet: ProblemSetDto
  validationWarnings?: string[]
  message: string
}

export interface UpdateProblemSetApiRequest {
  title?: string
  description?: string
  isPublic?: boolean
  isShared?: boolean
}

export interface UpdateProblemSetApiResponse {
  problemSet: ProblemSetDto
  updatedFields: string[]
  message: string
}

export interface DeleteProblemSetApiResponse {
  success: boolean
  warnings?: string[]
  message: string
}

// === 문제집 조회 API ===

export interface GetProblemSetQuery {
  includeItems?: 'true' | 'false'
}

export interface GetProblemSetApiResponse {
  problemSet: DetailedProblemSetDto
  permissions: ProblemSetPermissionsDto
  message: string
}

export interface GetProblemSetListQuery {
  // 필터링
  teacherId?: string
  isPublic?: 'true' | 'false'
  isShared?: 'true' | 'false' 
  search?: string

  // 페이지네이션
  page?: string
  limit?: string

  // 정렬
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'itemCount'
  sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc'

  // 기타 옵션
  includeItems?: 'true' | 'false'
}

export interface GetProblemSetListApiResponse {
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
  message: string
}

// === 문제집 내 문제 관리 API ===

export interface AddProblemToProblemSetApiRequest {
  problemId: string
  orderIndex?: number
  points?: number
}

export interface AddProblemToProblemSetApiResponse {
  problemSet: DetailedProblemSetDto
  addedItem: ProblemSetItemDto
  message: string
}

export interface RemoveProblemFromProblemSetApiResponse {
  problemSet: DetailedProblemSetDto
  removedItem: ProblemSetItemDto
  message: string
}

export interface ReorderProblemSetItemsApiRequest {
  orderedProblemIds: string[]
}

export interface ReorderProblemSetItemsApiResponse {
  problemSet: DetailedProblemSetDto
  reorderedItems: ProblemSetItemDto[]
  message: string
}

// === 권한 관리 API ===

export interface ProblemSetPermissionCheckQuery {
  operation?: 'read' | 'write' | 'delete' | 'share' | 'clone'
}

export interface ProblemSetPermissionCheckApiResponse {
  problemSetId: string
  userId: string
  permissions: ProblemSetPermissionsDto
  message: string
}

// === 공유 및 복제 API (향후 확장) ===

export interface CloneProblemSetApiRequest {
  newTitle?: string
  newDescription?: string
  isPublic?: boolean
  isShared?: boolean
}

export interface CloneProblemSetApiResponse {
  clonedProblemSet: ProblemSetDto
  originalProblemSet: Pick<ProblemSetDto, 'id' | 'title' | 'teacherId'>
  message: string
}

export interface UpdateSharingSettingsApiRequest {
  isPublic?: boolean
  isShared?: boolean
}

export interface UpdateSharingSettingsApiResponse {
  problemSet: ProblemSetDto
  updatedSettings: {
    isPublic: boolean
    isShared: boolean
  }
  message: string
}

// === 분석 및 통계 API (향후 확장) ===

export interface ProblemSetAnalyticsQuery {
  includeEmpty?: 'true' | 'false'
  period?: 'day' | 'week' | 'month' | 'year'
  dateFrom?: string // ISO date
  dateTo?: string   // ISO date
}

export interface ProblemSetAnalyticsApiResponse {
  totalSets: number
  publicSets: number
  sharedSets: number
  averageProblemsPerSet: number
  topTags: Array<{
    tag: string
    count: number
  }>
  difficultyDistribution: {
    [key: number]: number
  }
  creationTrend: Array<{
    date: string
    count: number
  }>
  message: string
}

// === 공통 API 응답 래퍼 ===

export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  message?: string
  meta?: {
    timestamp: string
    requestId: string
    version: string
  }
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
    stack?: string // development 환경에서만
  }
  meta?: {
    timestamp: string
    requestId: string
    version: string
  }
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

// === HTTP 상태 코드 매핑 ===

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const

// === API 경로 상수 ===

export const PROBLEMSET_API_ROUTES = {
  // 기본 CRUD
  PROBLEMSETS: '/api/problemsets',
  PROBLEMSET_BY_ID: '/api/problemsets/:id',
  
  // 문제 관리
  ADD_PROBLEM: '/api/problemsets/:id/problems',
  REMOVE_PROBLEM: '/api/problemsets/:id/problems/:problemId',
  REORDER_PROBLEMS: '/api/problemsets/:id/reorder',
  
  // 권한 및 공유
  PERMISSIONS: '/api/problemsets/:id/permissions',
  CLONE: '/api/problemsets/:id/clone',
  SHARING: '/api/problemsets/:id/sharing',
  
  // 조회 및 목록
  SHARED_PROBLEMSETS: '/api/problemsets/shared',
  PUBLIC_PROBLEMSETS: '/api/problemsets/public',
  
  // 분석 및 통계
  ANALYTICS: '/api/problemsets/analytics',
  MY_STATS: '/api/problemsets/analytics/my-stats',
  
  // 메타 정보
  HEALTH: '/api/problemsets/health',
  INFO: '/api/problemsets/info'
} as const

// === 미들웨어 관련 타입 ===

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role: 'student' | 'teacher' | 'admin'
    teacherId?: string
  }
}

export interface RequestContext {
  requestId: string
  correlationId: string
  userId: string
  teacherId?: string
  userRole: 'student' | 'teacher' | 'admin'
  timestamp: Date
}

// === 유효성 검증 관련 타입 ===

export interface ValidationRule {
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object'
  min?: number
  max?: number
  pattern?: RegExp
  enum?: string[] | number[]
  custom?: (value: any) => boolean | string
}

export interface ValidationSchema {
  [key: string]: ValidationRule
}

// === Rate Limiting 설정 ===

export interface RateLimitConfig {
  windowMs: number    // 시간 창 (밀리초)
  maxRequests: number // 최대 요청 수
  message?: string    // 제한 시 메시지
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

// === API 메트릭 ===

export interface ApiMetrics {
  endpoint: string
  method: string
  statusCode: number
  responseTime: number
  userId?: string
  userAgent?: string
  ip?: string
  timestamp: Date
}

// === ProblemSet 특화 에러 코드 ===

export const PROBLEMSET_ERROR_CODES = {
  PROBLEMSET_NOT_FOUND: 'PROBLEMSET_NOT_FOUND',
  PROBLEMSET_ACCESS_DENIED: 'PROBLEMSET_ACCESS_DENIED',
  PROBLEMSET_TITLE_DUPLICATE: 'PROBLEMSET_TITLE_DUPLICATE',
  PROBLEMSET_MAX_PROBLEMS_EXCEEDED: 'PROBLEMSET_MAX_PROBLEMS_EXCEEDED',
  PROBLEMSET_MIN_PROBLEMS_REQUIRED: 'PROBLEMSET_MIN_PROBLEMS_REQUIRED',
  PROBLEM_ALREADY_IN_SET: 'PROBLEM_ALREADY_IN_SET',
  PROBLEM_NOT_IN_SET: 'PROBLEM_NOT_IN_SET',
  PROBLEM_NOT_FOUND: 'PROBLEM_NOT_FOUND',
  INVALID_PROBLEM_ORDER: 'INVALID_PROBLEM_ORDER',
  PROBLEMSET_IN_USE_BY_ASSIGNMENT: 'PROBLEMSET_IN_USE_BY_ASSIGNMENT',
  SHARING_NOT_ALLOWED: 'SHARING_NOT_ALLOWED',
  CLONE_FAILED: 'CLONE_FAILED',
  VALIDATION_FAILED: 'VALIDATION_FAILED'
} as const

// === OpenAPI/Swagger 메타데이터 ===

export interface ApiEndpointMetadata {
  summary: string
  description: string
  tags: string[]
  parameters?: Array<{
    name: string
    in: 'query' | 'path' | 'header' | 'body'
    required: boolean
    description: string
    schema: any
  }>
  responses: {
    [statusCode: string]: {
      description: string
      content?: {
        'application/json': {
          schema: any
        }
      }
    }
  }
  security?: Array<{ [key: string]: string[] }>
}

// === 비즈니스 로직 관련 상수 ===

export const PROBLEMSET_LIMITS = {
  MAX_TITLE_LENGTH: 255,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_PROBLEMS_PER_SET: 50,
  MIN_PROBLEMS_PER_SET: 1,
  MAX_SEARCH_RESULTS: 1000,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MAX_INITIAL_PROBLEMS: 50
} as const

export const PROBLEMSET_PERMISSIONS = {
  CREATE: ['teacher', 'admin'],
  READ: ['student', 'teacher', 'admin'],
  UPDATE: ['owner', 'admin'],
  DELETE: ['owner', 'admin'],
  SHARE: ['owner', 'admin'],
  CLONE: ['teacher', 'admin']
} as const