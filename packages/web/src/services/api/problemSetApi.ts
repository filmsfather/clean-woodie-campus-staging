/**
 * ProblemSet API Service
 * 
 * 문제집 관련 API 요청을 처리하는 서비스
 * Clean Architecture 원칙에 따라 Application Layer의 UseCase와 1:1 대응
 */

import httpClient from './httpClient';

// === ProblemSet 기본 타입들 ===
export interface ProblemSet {
  id: string;
  title: string;
  description?: string;
  teacherId: string;
  teacherName?: string;
  itemCount: number;
  totalPoints?: number;
  estimatedTimeMinutes?: number;
  isPublic: boolean;
  isShared: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProblemSetItem {
  id: string;
  problemId: string;
  problemTitle?: string;
  problemType?: string;
  orderIndex: number;
  points: number;
  settings?: Record<string, any>;
}

export interface DetailedProblemSet extends ProblemSet {
  items: ProblemSetItem[];
}

export interface ProblemSetPermissions {
  problemSetId: string;
  userId: string;
  userRole: 'student' | 'teacher' | 'admin';
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canShare: boolean;
  canClone: boolean;
  isOwner: boolean;
}

// === Create ProblemSet ===
export interface CreateProblemSetRequest {
  title: string;
  description?: string;
  isPublic?: boolean;
  isShared?: boolean;
  initialProblems?: Array<{
    problemId: string;
    orderIndex: number;
    points?: number;
  }>;
}

export interface CreateProblemSetResponse {
  problemSet: ProblemSet;
  validationWarnings?: string[];
}

// === Get ProblemSet ===
export interface GetProblemSetRequest {
  problemSetId: string;
  includeItems?: boolean;
}

export interface GetProblemSetResponse {
  problemSet: DetailedProblemSet;
  permissions: ProblemSetPermissions;
}

// === Update ProblemSet ===
export interface UpdateProblemSetRequest {
  problemSetId: string;
  updates: {
    title?: string;
    description?: string;
    isPublic?: boolean;
    isShared?: boolean;
  };
}

export interface UpdateProblemSetResponse {
  problemSet: ProblemSet;
  updatedFields: string[];
}

// === Delete ProblemSet ===
export interface DeleteProblemSetRequest {
  problemSetId: string;
  force?: boolean;
}

export interface DeleteProblemSetResponse {
  success: boolean;
  warnings?: string[];
}

// === List ProblemSets ===
export interface GetProblemSetListRequest {
  filters?: {
    teacherId?: string;
    isPublic?: boolean;
    isShared?: boolean;
    search?: string;
  };
  pagination?: {
    page: number;
    limit: number;
  };
  sorting?: {
    field: 'title' | 'createdAt' | 'updatedAt' | 'itemCount';
    order: 'asc' | 'desc';
  };
}

export interface GetProblemSetListResponse {
  problemSets: ProblemSet[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  filters: {
    applied: any;
    available: {
      teachers: string[];
      tags: string[];
    };
  };
}

// === Add Problem to ProblemSet ===
export interface AddProblemToProblemSetRequest {
  problemSetId: string;
  problemId: string;
  orderIndex?: number;
  points?: number;
}

export interface AddProblemToProblemSetResponse {
  problemSet: DetailedProblemSet;
  addedItem: ProblemSetItem;
}

// === Remove Problem from ProblemSet ===
export interface RemoveProblemFromProblemSetRequest {
  problemSetId: string;
  problemId: string;
}

export interface RemoveProblemFromProblemSetResponse {
  problemSet: DetailedProblemSet;
  removedItem: ProblemSetItem;
}

// === Reorder ProblemSet Items ===
export interface ReorderProblemSetItemsRequest {
  problemSetId: string;
  orderedProblemIds: string[];
}

export interface ReorderProblemSetItemsResponse {
  problemSet: DetailedProblemSet;
  reorderedItems: ProblemSetItem[];
}

// === Clone ProblemSet ===
export interface CloneProblemSetRequest {
  sourceProblemSetId: string;
  newTitle?: string;
  newDescription?: string;
  isPublic?: boolean;
  isShared?: boolean;
}

export interface CloneProblemSetResponse {
  clonedProblemSet: ProblemSet;
  originalProblemSet: Pick<ProblemSet, 'id' | 'title' | 'teacherName'>;
}

/**
 * ProblemSet API Service 클래스
 */
export class ProblemSetApiService {
  /**
   * 새로운 문제집 생성
   * POST /api/problemsets
   */
  async createProblemSet(request: CreateProblemSetRequest): Promise<CreateProblemSetResponse> {
    return httpClient.post<CreateProblemSetResponse>('/problemsets', request);
  }

  /**
   * 특정 문제집 조회
   * GET /api/problemsets/:id
   */
  async getProblemSet(request: GetProblemSetRequest): Promise<GetProblemSetResponse> {
    const { problemSetId, includeItems } = request;
    const params = new URLSearchParams();
    
    if (includeItems !== undefined) {
      params.append('includeItems', String(includeItems));
    }

    const url = `/problemsets/${problemSetId}${params.toString() ? `?${params.toString()}` : ''}`;
    return httpClient.get<GetProblemSetResponse>(url);
  }

  /**
   * 문제집 목록 조회 (필터링, 페이지네이션 포함)
   * GET /api/problemsets
   */
  async getProblemSetList(request: GetProblemSetListRequest = {}): Promise<GetProblemSetListResponse> {
    const params = new URLSearchParams();
    
    // 필터 파라미터 추가
    if (request.filters) {
      const { teacherId, isPublic, isShared, search } = request.filters;
      
      if (teacherId) params.append('teacherId', teacherId);
      if (isPublic !== undefined) params.append('isPublic', String(isPublic));
      if (isShared !== undefined) params.append('isShared', String(isShared));
      if (search) params.append('search', search);
    }
    
    // 페이지네이션 파라미터 추가
    if (request.pagination) {
      params.append('page', String(request.pagination.page));
      params.append('limit', String(request.pagination.limit));
    }
    
    // 정렬 파라미터 추가
    if (request.sorting) {
      params.append('sortBy', request.sorting.field);
      params.append('sortOrder', request.sorting.order);
    }

    const url = `/problemsets${params.toString() ? `?${params.toString()}` : ''}`;
    return httpClient.get<GetProblemSetListResponse>(url);
  }

  /**
   * 문제집 메타데이터 수정
   * PUT /api/problemsets/:id
   */
  async updateProblemSet(request: UpdateProblemSetRequest): Promise<UpdateProblemSetResponse> {
    const { problemSetId, updates } = request;
    return httpClient.put<UpdateProblemSetResponse>(`/problemsets/${problemSetId}`, updates);
  }

  /**
   * 문제집 삭제
   * DELETE /api/problemsets/:id
   */
  async deleteProblemSet(request: DeleteProblemSetRequest): Promise<DeleteProblemSetResponse> {
    const { problemSetId, force } = request;
    const params = new URLSearchParams();
    
    if (force !== undefined) {
      params.append('force', String(force));
    }

    const url = `/problemsets/${problemSetId}${params.toString() ? `?${params.toString()}` : ''}`;
    return httpClient.delete<DeleteProblemSetResponse>(url);
  }

  /**
   * 문제집에 문제 추가
   * POST /api/problemsets/:id/problems
   */
  async addProblemToProblemSet(request: AddProblemToProblemSetRequest): Promise<AddProblemToProblemSetResponse> {
    const { problemSetId, problemId, orderIndex, points } = request;
    
    const payload = {
      problemId,
      ...(orderIndex !== undefined && { orderIndex }),
      ...(points !== undefined && { points })
    };

    return httpClient.post<AddProblemToProblemSetResponse>(`/problemsets/${problemSetId}/problems`, payload);
  }

  /**
   * 문제집에서 문제 제거
   * DELETE /api/problemsets/:id/problems/:problemId
   */
  async removeProblemFromProblemSet(request: RemoveProblemFromProblemSetRequest): Promise<RemoveProblemFromProblemSetResponse> {
    const { problemSetId, problemId } = request;
    return httpClient.delete<RemoveProblemFromProblemSetResponse>(`/problemsets/${problemSetId}/problems/${problemId}`);
  }

  /**
   * 문제집 내 문제 순서 재정렬
   * PUT /api/problemsets/:id/reorder
   */
  async reorderProblemSetItems(request: ReorderProblemSetItemsRequest): Promise<ReorderProblemSetItemsResponse> {
    const { problemSetId, orderedProblemIds } = request;
    
    const payload = { orderedProblemIds };
    
    return httpClient.put<ReorderProblemSetItemsResponse>(`/problemsets/${problemSetId}/reorder`, payload);
  }

  /**
   * 문제집 복제
   * POST /api/problemsets/:id/clone
   */
  async cloneProblemSet(request: CloneProblemSetRequest): Promise<CloneProblemSetResponse> {
    const { sourceProblemSetId, ...cloneData } = request;
    return httpClient.post<CloneProblemSetResponse>(`/problemsets/${sourceProblemSetId}/clone`, cloneData);
  }

  /**
   * 헬스체크
   */
  async healthCheck(): Promise<boolean> {
    try {
      await httpClient.get('/problemsets?limit=1');
      return true;
    } catch (error) {
      console.warn('ProblemSet API health check failed:', error);
      return false;
    }
  }
}

// 싱글톤 인스턴스
const problemSetApiService = new ProblemSetApiService();
export default problemSetApiService;