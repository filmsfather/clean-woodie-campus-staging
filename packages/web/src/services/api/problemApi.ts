import { httpClient, ApiError } from './httpClient';

// Use Case 인터페이스 정의 (백엔드와 매핑)
export interface CreateProblemRequest {
  title: string;
  description?: string;
  type: string;
  correctAnswerValue: string;
  difficultyLevel: number;
  tags?: string[];
}

export interface UpdateProblemContentRequest {
  title: string;
  description?: string;
}

export interface UpdateProblemAnswerRequest {
  correctAnswerValue: string;
}

export interface ChangeProblemDifficultyRequest {
  newDifficultyLevel: number;
}

export interface ManageProblemTagsRequest {
  tags: string[];
}

export interface CloneProblemRequest {
  newTeacherId?: string;
  preserveOriginalTags?: boolean;
}

export interface SearchProblemsRequest {
  searchTerm?: string;
  tags?: string[];
  difficultyLevel?: number;
  difficultyRange?: { min: number; max: number };
  isActive?: boolean;
  createdAfter?: string;
  createdBefore?: string;
  page?: number;
  limit?: number;
}

export interface GetProblemListRequest {
  includeInactive?: boolean;
  tags?: string[];
  difficultyRange?: { min: number; max: number };
  page?: number;
  limit?: number;
}

// Response 타입 정의
export interface Problem {
  id: string;
  teacherId: string;
  title: string;
  description: string;
  type: string;
  difficulty: number;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProblemListResponse {
  problems: Problem[];
  totalCount: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

export interface SearchProblemsResponse {
  problems: Problem[];
  totalCount: number;
  page: number;
  limit: number;
  hasNext: boolean;
  searchMetadata: {
    searchTerm?: string;
    appliedFilters: string[];
    searchDurationMs: number;
  };
}

export interface CreateProblemResponse {
  problem: Problem;
}

/**
 * 문제 관련 API 서비스
 * Problem UseCase API와 통신하는 클라이언트 서비스
 */
class ProblemApiService {
  private readonly basePath = '/problems/usecases';

  // === 문제 생성 ===
  async createProblem(request: CreateProblemRequest): Promise<CreateProblemResponse> {
    try {
      return await httpClient.post<CreateProblemResponse>(`${this.basePath}/create`, request);
    } catch (error) {
      throw this.handleError(error, '문제 생성에 실패했습니다');
    }
  }

  // === 문제 조회 ===
  async getProblem(problemId: string): Promise<Problem> {
    try {
      return await httpClient.get<Problem>(`${this.basePath}/${problemId}/details`);
    } catch (error) {
      throw this.handleError(error, '문제를 불러오는데 실패했습니다');
    }
  }

  async getProblemList(request: GetProblemListRequest = {}): Promise<ProblemListResponse> {
    try {
      const params = new URLSearchParams();
      
      if (request.includeInactive !== undefined) {
        params.append('includeInactive', String(request.includeInactive));
      }
      if (request.tags?.length) {
        params.append('tags', request.tags.join(','));
      }
      if (request.difficultyRange) {
        params.append('difficultyMin', String(request.difficultyRange.min));
        params.append('difficultyMax', String(request.difficultyRange.max));
      }
      if (request.page) {
        params.append('page', String(request.page));
      }
      if (request.limit) {
        params.append('limit', String(request.limit));
      }

      const queryString = params.toString();
      const url = queryString ? `${this.basePath}/list?${queryString}` : `${this.basePath}/list`;
      
      return await httpClient.get<ProblemListResponse>(url);
    } catch (error) {
      throw this.handleError(error, '문제 목록을 불러오는데 실패했습니다');
    }
  }

  async searchProblems(request: SearchProblemsRequest): Promise<SearchProblemsResponse> {
    try {
      const params = new URLSearchParams();
      
      if (request.searchTerm) {
        params.append('searchTerm', request.searchTerm);
      }
      if (request.tags?.length) {
        params.append('tags', request.tags.join(','));
      }
      if (request.difficultyLevel) {
        params.append('difficultyLevel', String(request.difficultyLevel));
      }
      if (request.difficultyRange) {
        params.append('difficultyMin', String(request.difficultyRange.min));
        params.append('difficultyMax', String(request.difficultyRange.max));
      }
      if (request.isActive !== undefined) {
        params.append('isActive', String(request.isActive));
      }
      if (request.createdAfter) {
        params.append('createdAfter', request.createdAfter);
      }
      if (request.createdBefore) {
        params.append('createdBefore', request.createdBefore);
      }
      if (request.page) {
        params.append('page', String(request.page));
      }
      if (request.limit) {
        params.append('limit', String(request.limit));
      }

      const url = `${this.basePath}/search?${params.toString()}`;
      return await httpClient.get<SearchProblemsResponse>(url);
    } catch (error) {
      throw this.handleError(error, '문제 검색에 실패했습니다');
    }
  }

  // === 문제 업데이트 ===
  async updateProblemContent(
    problemId: string, 
    request: UpdateProblemContentRequest
  ): Promise<Problem> {
    try {
      return await httpClient.put<Problem>(`${this.basePath}/${problemId}/content`, request);
    } catch (error) {
      throw this.handleError(error, '문제 내용 수정에 실패했습니다');
    }
  }

  async updateProblemAnswer(
    problemId: string, 
    request: UpdateProblemAnswerRequest
  ): Promise<Problem> {
    try {
      return await httpClient.put<Problem>(`${this.basePath}/${problemId}/answer`, request);
    } catch (error) {
      throw this.handleError(error, '문제 답안 수정에 실패했습니다');
    }
  }

  async changeProblemDifficulty(
    problemId: string, 
    request: ChangeProblemDifficultyRequest
  ): Promise<Problem> {
    try {
      return await httpClient.put<Problem>(`${this.basePath}/${problemId}/difficulty`, request);
    } catch (error) {
      throw this.handleError(error, '문제 난이도 변경에 실패했습니다');
    }
  }

  async manageProblemTags(
    problemId: string, 
    request: ManageProblemTagsRequest
  ): Promise<Problem> {
    try {
      return await httpClient.put<Problem>(`${this.basePath}/${problemId}/tags`, request);
    } catch (error) {
      throw this.handleError(error, '문제 태그 관리에 실패했습니다');
    }
  }

  // === 문제 상태 관리 ===
  async activateProblem(problemId: string): Promise<Problem> {
    try {
      return await httpClient.post<Problem>(`${this.basePath}/${problemId}/activate`);
    } catch (error) {
      throw this.handleError(error, '문제 활성화에 실패했습니다');
    }
  }

  async deactivateProblem(problemId: string): Promise<Problem> {
    try {
      return await httpClient.post<Problem>(`${this.basePath}/${problemId}/deactivate`);
    } catch (error) {
      throw this.handleError(error, '문제 비활성화에 실패했습니다');
    }
  }

  // === 문제 복제 ===
  async cloneProblem(problemId: string, request: CloneProblemRequest = {}): Promise<Problem> {
    try {
      return await httpClient.post<Problem>(`${this.basePath}/${problemId}/clone`, request);
    } catch (error) {
      throw this.handleError(error, '문제 복제에 실패했습니다');
    }
  }

  // === 문제 삭제 ===
  async deleteProblem(problemId: string): Promise<void> {
    try {
      await httpClient.delete<void>(`${this.basePath}/${problemId}`);
    } catch (error) {
      throw this.handleError(error, '문제 삭제에 실패했습니다');
    }
  }

  // === 헬스체크 ===
  async healthCheck(): Promise<any> {
    try {
      return await httpClient.get(`${this.basePath}/health`);
    } catch (error) {
      throw this.handleError(error, 'Problem API 상태 확인에 실패했습니다');
    }
  }

  /**
   * API 에러 처리 통합
   */
  private handleError(error: any, defaultMessage: string): never {
    if (error instanceof ApiError) {
      // API 에러를 그대로 재던짐
      throw error;
    }

    // 알 수 없는 에러의 경우 기본 메시지로 감싸서 던짐
    throw new ApiError(defaultMessage, 0, 'UNKNOWN_ERROR', error);
  }
}

// 싱글톤 인스턴스 export
export const problemApi = new ProblemApiService();
export default problemApi;