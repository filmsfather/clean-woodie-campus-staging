import httpClient from './httpClient';
import { 
  InviteDto, 
  CreateInviteFormState,
  InviteListFilter,
  AuthActionResult 
} from '../../types/auth';

/**
 * 초대 관련 API 서비스
 * 
 * Application Layer UseCase 대응:
 * - CreateInviteUseCase
 * - FindInvitesByCreatorUseCase
 * - FindInvitesByOrganizationUseCase  
 * - FindInvitesByEmailUseCase
 * - FindPendingInvitesByEmailUseCase
 * - DeleteInviteUseCase
 * - DeleteExpiredInvitesUseCase
 * - CheckActivePendingInviteUseCase
 */

// Request/Response 타입 정의
export interface CreateInviteRequest {
  email: string;
  role: 'student' | 'teacher' | 'admin';
  organizationId: string;
  classId?: string;
  expiryDays?: number;
  context?: {
    locale?: string;
    customMessage?: string;
  };
}

export interface CreateInviteResponse {
  invite: InviteDto;
  inviteUrl: string;
  emailSent: boolean;
}

export interface InviteListRequest {
  organizationId?: string;
  createdBy?: string;
  email?: string;
  status?: 'pending' | 'used' | 'expired';
  role?: 'student' | 'teacher' | 'admin';
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'expiresAt' | 'email';
  sortOrder?: 'asc' | 'desc';
}

export interface InviteListResponse {
  invites: InviteDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  summary: {
    pending: number;
    used: number;
    expired: number;
  };
}

export interface ResendInviteRequest {
  inviteId: string;
  context?: {
    locale?: string;
    customMessage?: string;
  };
}

export interface ResendInviteResponse {
  success: boolean;
  emailSent: boolean;
  newExpiryDate?: string;
}

export interface BulkCreateInviteRequest {
  invites: Array<{
    email: string;
    role: 'student' | 'teacher' | 'admin';
    classId?: string;
  }>;
  organizationId: string;
  expiryDays?: number;
  context?: {
    locale?: string;
    customMessage?: string;
  };
}

export interface BulkCreateInviteResponse {
  successful: InviteDto[];
  failed: Array<{
    email: string;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    emailsSent: number;
  };
}

export interface CheckInviteAvailabilityRequest {
  email: string;
  organizationId: string;
}

export interface CheckInviteAvailabilityResponse {
  isAvailable: boolean;
  reason?: 'user_exists' | 'pending_invite' | 'email_invalid';
  existingInvite?: InviteDto;
}

/**
 * Invite API Service Class
 */
export class InviteApiService {
  /**
   * 초대 생성 - CreateInviteUseCase에 대응
   */
  async createInvite(data: CreateInviteRequest): Promise<CreateInviteResponse> {
    try {
      const response = await httpClient.post<CreateInviteResponse>('/auth/invites', data);
      return response;
    } catch (error: any) {
      throw this.handleInviteError(error, '초대 생성');
    }
  }

  /**
   * 대량 초대 생성 - BulkCreateInviteUseCase에 대응
   */
  async createBulkInvites(data: BulkCreateInviteRequest): Promise<BulkCreateInviteResponse> {
    try {
      const response = await httpClient.post<BulkCreateInviteResponse>('/auth/invites/bulk', data);
      return response;
    } catch (error: any) {
      throw this.handleInviteError(error, '대량 초대 생성');
    }
  }

  /**
   * 초대 목록 조회 - FindInvitesByOrganizationUseCase 등에 대응
   */
  async getInvites(params: InviteListRequest = {}): Promise<InviteListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await httpClient.get<InviteListResponse>(
        `/auth/invites?${queryParams.toString()}`
      );
      return response;
    } catch (error: any) {
      throw this.handleInviteError(error, '초대 목록 조회');
    }
  }

  /**
   * 특정 초대 조회 - GetInviteUseCase에 대응
   */
  async getInvite(inviteId: string): Promise<InviteDto> {
    try {
      const response = await httpClient.get<InviteDto>(`/auth/invites/${inviteId}`);
      return response;
    } catch (error: any) {
      throw this.handleInviteError(error, '초대 조회');
    }
  }

  /**
   * 토큰으로 초대 조회 - FindInviteByTokenUseCase에 대응
   */
  async getInviteByToken(token: string): Promise<InviteDto> {
    try {
      const response = await httpClient.get<InviteDto>(`/auth/invites/token/${token}`);
      return response;
    } catch (error: any) {
      throw this.handleInviteError(error, '초대 토큰 조회');
    }
  }

  /**
   * 초대 재발송 - ResendInviteUseCase에 대응
   */
  async resendInvite(data: ResendInviteRequest): Promise<ResendInviteResponse> {
    try {
      const response = await httpClient.post<ResendInviteResponse>(
        `/auth/invites/${data.inviteId}/resend`, 
        { context: data.context }
      );
      return response;
    } catch (error: any) {
      throw this.handleInviteError(error, '초대 재발송');
    }
  }

  /**
   * 초대 삭제 - DeleteInviteUseCase에 대응
   */
  async deleteInvite(inviteId: string): Promise<void> {
    try {
      await httpClient.delete(`/auth/invites/${inviteId}`);
    } catch (error: any) {
      throw this.handleInviteError(error, '초대 삭제');
    }
  }

  /**
   * 여러 초대 삭제 - BulkDeleteInviteUseCase에 대응
   */
  async deleteBulkInvites(inviteIds: string[]): Promise<{ successful: string[], failed: Array<{ id: string, error: string }> }> {
    try {
      const response = await httpClient.delete<{ successful: string[], failed: Array<{ id: string, error: string }> }>(
        '/auth/invites/bulk', 
        { data: { inviteIds } }
      );
      return response;
    } catch (error: any) {
      throw this.handleInviteError(error, '대량 초대 삭제');
    }
  }

  /**
   * 만료된 초대 정리 - DeleteExpiredInvitesUseCase에 대응
   */
  async deleteExpiredInvites(organizationId?: string): Promise<{ deletedCount: number }> {
    try {
      const params = organizationId ? `?organizationId=${organizationId}` : '';
      const response = await httpClient.delete<{ deletedCount: number }>(`/auth/invites/expired${params}`);
      return response;
    } catch (error: any) {
      throw this.handleInviteError(error, '만료된 초대 정리');
    }
  }

  /**
   * 초대 가능 여부 확인 - CheckInviteAvailabilityUseCase에 대응
   */
  async checkInviteAvailability(data: CheckInviteAvailabilityRequest): Promise<CheckInviteAvailabilityResponse> {
    try {
      const response = await httpClient.post<CheckInviteAvailabilityResponse>('/auth/invites/check-availability', data);
      return response;
    } catch (error: any) {
      throw this.handleInviteError(error, '초대 가능 여부 확인');
    }
  }

  /**
   * 이메일로 대기 중인 초대 조회 - FindPendingInvitesByEmailUseCase에 대응
   */
  async getPendingInvitesByEmail(email: string, organizationId?: string): Promise<InviteDto[]> {
    try {
      const params = new URLSearchParams({ email });
      if (organizationId) {
        params.append('organizationId', organizationId);
      }
      
      const response = await httpClient.get<InviteDto[]>(`/auth/invites/pending?${params.toString()}`);
      return response;
    } catch (error: any) {
      throw this.handleInviteError(error, '대기 중인 초대 조회');
    }
  }

  /**
   * 초대 사용 (회원가입 시) - UseInviteTokenUseCase에 대응
   */
  async useInvite(token: string, userId: string): Promise<void> {
    try {
      await httpClient.post(`/auth/invites/use`, { token, userId });
    } catch (error: any) {
      throw this.handleInviteError(error, '초대 사용');
    }
  }

  /**
   * 조직의 초대 통계 조회 - GetInviteStatisticsUseCase에 대응
   */
  async getInviteStatistics(organizationId: string, period?: 'day' | 'week' | 'month'): Promise<{
    total: number;
    pending: number;
    used: number;
    expired: number;
    recentActivity: Array<{
      date: string;
      created: number;
      used: number;
    }>;
  }> {
    try {
      const params = new URLSearchParams({ organizationId });
      if (period) {
        params.append('period', period);
      }
      
      const response = await httpClient.get(`/auth/invites/statistics?${params.toString()}`);
      return response;
    } catch (error: any) {
      throw this.handleInviteError(error, '초대 통계 조회');
    }
  }

  /**
   * 초대 관련 에러 처리
   */
  private handleInviteError(error: any, operation: string): Error {
    if (error.isValidationError) {
      const details = error.details || {};
      
      // 특정 필드 에러 메시지 처리
      if (details.email) {
        return new Error(`이메일: ${details.email}`);
      }
      if (details.role) {
        return new Error(`역할: ${details.role}`);
      }
      if (details.expiryDays) {
        return new Error(`만료일: ${details.expiryDays}`);
      }
      
      const fieldErrors = Object.keys(details).map(field => `${field}: ${details[field]}`).join(', ');
      return new Error(fieldErrors || `${operation} 요청 데이터를 확인해주세요`);
    }

    if (error.status === 409) {
      // Conflict - 중복된 초대나 이미 가입한 사용자 등
      return new Error(error.message || '이미 초대되었거나 가입한 사용자입니다.');
    }

    if (error.status === 404) {
      // Not Found
      return new Error('요청한 초대를 찾을 수 없습니다.');
    }

    if (error.isUnauthorized) {
      return new Error('초대 관리 권한이 없습니다.');
    }

    if (error.isForbidden) {
      return new Error('해당 작업에 대한 권한이 없습니다.');
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
export const inviteApi = new InviteApiService();
export default inviteApi;