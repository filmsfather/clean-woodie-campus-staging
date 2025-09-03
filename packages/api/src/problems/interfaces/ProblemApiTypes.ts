// API 레이어 요청/응답 타입 정의

import { Request } from 'express';
import {
  ProblemDto,
  ProblemDetailDto,
  ProblemSearchRequestDto,
  ProblemSearchResponseDto,
  ProblemBankSummaryDto,
  TagAnalyticsDto,
  TagRecommendationDto,
  ProblemCloneRequestDto,
  ProblemCloneResponseDto,
  BulkUpdateTagsRequestDto,
  BulkUpdateStatusRequestDto,
  BulkOperationResponseDto,
  ValidationResultDto,
  BulkPermissionCheckDto
} from '@woodie/application/problems/dto/ProblemDto';

// === 기본 CRUD API 요청/응답 ===

export interface CreateProblemRequest {
  type: string;
  content: {
    title: string;
    description?: string;
    instructions?: string;
    [key: string]: any; // 타입별 추가 콘텐츠
  };
  correctAnswer: {
    type: string;
    points: number;
    [key: string]: any; // 타입별 답안 구조
  };
  difficulty: number;
  tags?: string[];
  isActive?: boolean;
}

export interface CreateProblemResponse {
  problem: ProblemDetailDto;
  message: string;
}

export interface UpdateProblemRequest {
  content?: {
    title?: string;
    description?: string;
    instructions?: string;
    [key: string]: any;
  };
  correctAnswer?: {
    points?: number;
    [key: string]: any;
  };
  difficulty?: number;
  tags?: string[];
  isActive?: boolean;
}

export interface UpdateProblemResponse {
  problem: ProblemDetailDto;
  message: string;
}

// === 검색 API ===

export interface SearchProblemsQuery {
  // 필터링
  types?: string;           // comma-separated
  difficulties?: string;    // comma-separated numbers
  tags?: string;           // comma-separated
  isActive?: string;       // "true" | "false"
  searchQuery?: string;    // 전문 검색
  createdAfter?: string;   // ISO date
  createdBefore?: string;  // ISO date
  
  // 페이지네이션
  page?: string;
  limit?: string;
  strategy?: 'offset' | 'cursor';
  cursor?: string;         // cursor value
  cursorField?: 'id' | 'createdAt' | 'updatedAt';
  cursorDirection?: 'after' | 'before';
  
  // 정렬
  sortField?: 'createdAt' | 'updatedAt' | 'difficulty' | 'title';
  sortDirection?: 'ASC' | 'DESC';
}

export interface SearchProblemsResponse extends ProblemSearchResponseDto {
  query: {
    filter: any;
    pagination: any;
    sort: any;
  };
}

// === 통계 및 분석 API ===

export interface GetAnalyticsQuery {
  includeInactive?: string; // "true" | "false"
}

export interface ProblemAnalyticsResponse {
  summary: ProblemBankSummaryDto;
  tagAnalytics: TagAnalyticsDto;
  message: string;
}

// === 태그 관리 API ===

export interface TagRecommendationRequest {
  title: string;
  description: string;
  maxRecommendations?: number;
}

export interface TagRecommendationResponse {
  recommendation: TagRecommendationDto;
  message: string;
}

export interface SimilarTagsQuery {
  inputTag: string;
  maxSuggestions?: string;
}

export interface SimilarTagsResponse {
  similarTags: string[];
  inputTag: string;
  message: string;
}

export interface ValidateTagsRequest {
  tags: string[];
}

export interface ValidateTagsResponse {
  validTags: string[];
  invalidTags: string[];
  suggestions: string[];
  message: string;
}

// === 일괄 작업 API ===

export interface BulkUpdateStatusRequest extends BulkUpdateStatusRequestDto {}

export interface BulkUpdateTagsRequest extends BulkUpdateTagsRequestDto {}

export interface BulkCloneRequest extends ProblemCloneRequestDto {}

export interface BulkPermissionCheckQuery {
  problemIds: string; // comma-separated
}

// === 권한 관리 API ===

export interface PermissionCheckQuery {
  operation: 'read' | 'write' | 'delete';
}

export interface PermissionCheckResponse {
  allowed: boolean;
  reason?: string;
}

// === 공통 API 응답 래퍼 ===

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    stack?: string; // development 환경에서만
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

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
} as const;

// === API 경로 상수 ===

export const API_ROUTES = {
  // 기본 CRUD
  PROBLEMS: '/api/problems',
  PROBLEM_BY_ID: '/api/problems/:id',
  
  // 검색 및 조회
  SEARCH_PROBLEMS: '/api/problems/search',
  MY_PROBLEMS: '/api/problems/mine',
  
  // 통계 및 분석
  ANALYTICS: '/api/problems/analytics',
  ANALYTICS_SUMMARY: '/api/problems/analytics/summary',
  ANALYTICS_TAGS: '/api/problems/analytics/tags',
  ANALYTICS_DIFFICULTY: '/api/problems/analytics/difficulty',
  
  // 태그 관리
  TAG_RECOMMENDATIONS: '/api/problems/tags/recommend',
  SIMILAR_TAGS: '/api/problems/tags/similar',
  TAG_VALIDATION: '/api/problems/tags/validate',
  TAG_USAGE: '/api/problems/tags/usage',
  
  // 일괄 작업
  BULK_CLONE: '/api/problems/bulk/clone',
  BULK_UPDATE_STATUS: '/api/problems/bulk/status',
  BULK_UPDATE_TAGS: '/api/problems/bulk/tags',
  BULK_PERMISSIONS: '/api/problems/bulk/permissions',
  
  // 권한 확인
  PROBLEM_PERMISSIONS: '/api/problems/:id/permissions',
  
  // 내보내기/가져오기
  EXPORT_PROBLEMS: '/api/problems/export',
  IMPORT_PROBLEMS: '/api/problems/import'
} as const;

// === 미들웨어 관련 타입 ===

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'teacher' | 'admin';
    teacherId?: string;
  };
}

export interface RequestContext {
  requestId: string;
  correlationId: string;
  userId: string;
  teacherId: string;
  userRole: string;
  timestamp: Date;
}

// === 유효성 검증 스키마 타입 ===

export interface ValidationSchema {
  [key: string]: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: string[] | number[];
    custom?: (value: any) => boolean | string;
  };
}

// === Rate Limiting 설정 ===

export interface RateLimitConfig {
  windowMs: number;    // 시간 창 (밀리초)
  maxRequests: number; // 최대 요청 수
  message?: string;    // 제한 시 메시지
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// === API 메트릭 ===

export interface ApiMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  userId?: string;
  userAgent?: string;
  ip?: string;
  timestamp: Date;
}

// === OpenAPI/Swagger 메타데이터 ===

export interface ApiEndpointMetadata {
  summary: string;
  description: string;
  tags: string[];
  parameters?: Array<{
    name: string;
    in: 'query' | 'path' | 'header' | 'body';
    required: boolean;
    description: string;
    schema: any;
  }>;
  responses: {
    [statusCode: string]: {
      description: string;
      content?: {
        'application/json': {
          schema: any;
        };
      };
    };
  };
  security?: Array<{ [key: string]: string[] }>;
}