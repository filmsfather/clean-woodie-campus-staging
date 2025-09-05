import httpClient from './httpClient';
import { RoleStatistics } from '../../types/auth';

/**
 * 역할 및 통계 관련 API 서비스
 * 
 * Application Layer UseCase 대응:
 * - GetRoleStatisticsUseCase
 * - FindProfilesByRoleUseCase (role 필터링)
 * - ChangeUserRoleUseCase (역할 변경)
 */

// Request/Response 타입 정의
export interface RoleStatisticsRequest {
  organizationId?: string;
  schoolId?: string;
  period?: 'day' | 'week' | 'month' | 'year';
  includeInactive?: boolean;
}

export interface DetailedRoleStatistics extends RoleStatistics {
  trends: {
    studentGrowth: number;
    teacherGrowth: number;
    adminGrowth: number;
    totalGrowth: number;
  };
  distribution: {
    byGrade: Array<{
      grade: number;
      count: number;
    }>;
    bySchool: Array<{
      schoolId: string;
      schoolName: string;
      count: number;
    }>;
  };
  recentActivity: Array<{
    date: string;
    newUsers: number;
    deletedUsers: number;
    roleChanges: number;
  }>;
}

export interface RoleChangeHistoryRequest {
  userId?: string;
  targetUserId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface RoleChangeHistoryResponse {
  changes: Array<{
    id: string;
    userId: string; // 변경을 실행한 사용자
    targetUserId: string; // 역할이 변경된 사용자
    targetUserName: string;
    targetUserEmail: string;
    previousRole: 'student' | 'teacher' | 'admin';
    newRole: 'student' | 'teacher' | 'admin';
    reason?: string;
    timestamp: string;
  }>;
  total: number;
  page: number;
  hasMore: boolean;
}

export interface BulkRoleChangeRequest {
  userIds: string[];
  newRole: 'student' | 'teacher' | 'admin';
  reason?: string;
}

export interface BulkRoleChangeResponse {
  successful: Array<{
    userId: string;
    userName: string;
    previousRole: string;
    newRole: string;
  }>;
  failed: Array<{
    userId: string;
    userName: string;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export interface RolePermissionsResponse {
  role: 'student' | 'teacher' | 'admin';
  permissions: {
    users: {
      canView: boolean;
      canCreate: boolean;
      canUpdate: boolean;
      canDelete: boolean;
      canChangeRole: boolean;
    };
    invites: {
      canView: boolean;
      canCreate: boolean;
      canDelete: boolean;
      canResend: boolean;
    };
    profiles: {
      canViewOthers: boolean;
      canUpdateOthers: boolean;
      canViewStatistics: boolean;
    };
    problems: {
      canView: boolean;
      canCreate: boolean;
      canUpdate: boolean;
      canDelete: boolean;
      canManageCategories: boolean;
    };
  };
}

/**
 * Role API Service Class
 */
export class RoleApiService {
  /**
   * 역할별 통계 조회 - GetRoleStatisticsUseCase에 대응
   */
  async getRoleStatistics(params: RoleStatisticsRequest = {}): Promise<DetailedRoleStatistics> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await httpClient.get<DetailedRoleStatistics>(
        `/auth/profiles/statistics/roles?${queryParams.toString()}`
      );
      return response;
    } catch (error: any) {
      throw this.handleRoleError(error, '역할 통계 조회');
    }
  }

  /**
   * 기본 역할 통계 조회 (간단 버전)
   */
  async getBasicRoleStatistics(organizationId?: string): Promise<RoleStatistics> {
    try {
      const params = organizationId ? `?organizationId=${organizationId}` : '';
      const response = await httpClient.get<RoleStatistics>(`/auth/profiles/statistics/basic${params}`);
      return response;
    } catch (error: any) {
      throw this.handleRoleError(error, '기본 역할 통계 조회');
    }
  }

  /**
   * 역할 변경 이력 조회 - GetRoleChangeHistoryUseCase에 대응
   */
  async getRoleChangeHistory(params: RoleChangeHistoryRequest = {}): Promise<RoleChangeHistoryResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await httpClient.get<RoleChangeHistoryResponse>(
        `/auth/profiles/roles/history?${queryParams.toString()}`
      );
      return response;
    } catch (error: any) {
      throw this.handleRoleError(error, '역할 변경 이력 조회');
    }
  }

  /**
   * 대량 역할 변경 - BulkChangeRoleUseCase에 대응
   */
  async bulkChangeRole(data: BulkRoleChangeRequest): Promise<BulkRoleChangeResponse> {
    try {
      const response = await httpClient.post<BulkRoleChangeResponse>('/auth/profiles/roles/bulk-change', data);
      return response;
    } catch (error: any) {
      throw this.handleRoleError(error, '대량 역할 변경');
    }
  }

  /**
   * 역할별 권한 조회 - GetRolePermissionsUseCase에 대응
   */
  async getRolePermissions(role: 'student' | 'teacher' | 'admin'): Promise<RolePermissionsResponse> {
    try {
      const response = await httpClient.get<RolePermissionsResponse>(`/auth/profiles/roles/${role}/permissions`);
      return response;
    } catch (error: any) {
      throw this.handleRoleError(error, '역할 권한 조회');
    }
  }

  /**
   * 현재 사용자 권한 조회
   */
  async getMyPermissions(): Promise<RolePermissionsResponse> {
    try {
      const response = await httpClient.get<RolePermissionsResponse>('/auth/profiles/roles/me/permissions');
      return response;
    } catch (error: any) {
      throw this.handleRoleError(error, '내 권한 조회');
    }
  }

  /**
   * 역할 할당 가능 여부 확인 - CheckRoleAssignmentEligibilityUseCase에 대응
   */
  async checkRoleAssignmentEligibility(
    targetUserId: string, 
    newRole: 'student' | 'teacher' | 'admin'
  ): Promise<{
    isEligible: boolean;
    reason?: string;
    restrictions?: string[];
  }> {
    try {
      const response = await httpClient.post<{
        isEligible: boolean;
        reason?: string;
        restrictions?: string[];
      }>('/auth/profiles/roles/check-eligibility', {
        targetUserId,
        newRole
      });
      return response;
    } catch (error: any) {
      throw this.handleRoleError(error, '역할 할당 가능 여부 확인');
    }
  }

  /**
   * 역할 관련 에러 처리
   */
  private handleRoleError(error: any, operation: string): Error {
    if (error.isValidationError) {
      const details = error.details || {};
      
      if (details.role) {
        return new Error(`역할: ${details.role}`);
      }
      if (details.userId) {
        return new Error(`사용자 ID: ${details.userId}`);
      }
      
      const fieldErrors = Object.keys(details).map(field => `${field}: ${details[field]}`).join(', ');
      return new Error(fieldErrors || `${operation} 요청 데이터를 확인해주세요`);
    }

    if (error.status === 403) {
      return new Error('역할 관리 권한이 없습니다.');
    }

    if (error.status === 404) {
      return new Error('요청한 사용자 또는 역할을 찾을 수 없습니다.');
    }

    if (error.status === 409) {
      return new Error(error.message || '역할 변경이 불가능한 상태입니다.');
    }

    if (error.isUnauthorized) {
      return new Error('인증이 필요합니다.');
    }

    if (error.isNetworkError) {
      return new Error('네트워크 연결을 확인해주세요.');
    }

    if (error.isServerError) {
      return new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }

    return new Error(error.message || `${operation} 중 오류가 발생했습니다.`);
  }
}

// 싱글톤 인스턴스
export const roleApi = new RoleApiService();
export default roleApi;