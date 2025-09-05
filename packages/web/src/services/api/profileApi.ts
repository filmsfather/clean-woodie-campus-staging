import httpClient from './httpClient';
import { 
  ProfileDto, 
  UpdateProfileFormState,
  UserListFilter,
  AuthActionResult 
} from '../../types/auth';

/**
 * 프로필 관리 관련 API 서비스
 * 
 * Application Layer UseCase 대응:
 * - GetProfileUseCase
 * - FindProfileByEmailUseCase
 * - FindProfilesByRoleUseCase
 * - FindProfilesBySchoolUseCase
 * - FindStudentsByGradeUseCase
 * - UpdateProfileUseCase
 * - DeleteProfileUseCase
 * - GetRoleStatisticsUseCase
 */

// Request/Response 타입 정의
export interface GetProfileRequest {
  userId: string;
}

export interface UpdateProfileRequest {
  userId: string;
  fullName?: string;
  gradeLevel?: number;
  avatarUrl?: string;
  settings?: {
    theme?: 'light' | 'dark' | 'auto';
    language?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
    };
    privacy?: {
      showEmail?: boolean;
      showActivity?: boolean;
    };
  };
}

export interface UpdateProfileResponse {
  profile: ProfileDto;
  updatedFields: string[];
}

export interface ProfileListRequest {
  role?: 'student' | 'teacher' | 'admin';
  schoolId?: string;
  gradeLevel?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'fullName' | 'email' | 'createdAt' | 'role';
  sortOrder?: 'asc' | 'desc';
  includeInactive?: boolean;
}

export interface ProfileListResponse {
  profiles: ProfileDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  summary: {
    students: number;
    teachers: number;
    admins: number;
    active: number;
    inactive: number;
  };
}

export interface ChangeUserRoleRequest {
  userId: string;
  targetUserId: string;
  newRole: 'student' | 'teacher' | 'admin';
  reason?: string;
}

export interface ChangeUserRoleResponse {
  success: boolean;
  updatedProfile: ProfileDto;
  notificationSent: boolean;
}

export interface UploadAvatarRequest {
  userId: string;
  file: File;
}

export interface UploadAvatarResponse {
  avatarUrl: string;
  thumbnailUrl?: string;
}

export interface UserActivityRequest {
  userId: string;
  startDate?: string;
  endDate?: string;
  activityType?: 'login' | 'problem_solve' | 'assignment' | 'all';
}

export interface UserActivityResponse {
  activities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }>;
  summary: {
    totalActivities: number;
    loginCount: number;
    problemsSolved: number;
    assignmentsCompleted: number;
  };
}

export interface BulkUserActionRequest {
  userIds: string[];
  action: 'activate' | 'deactivate' | 'delete' | 'change_role';
  params?: {
    newRole?: 'student' | 'teacher' | 'admin';
    reason?: string;
  };
}

export interface BulkUserActionResponse {
  successful: Array<{ userId: string; profile: ProfileDto }>;
  failed: Array<{ userId: string; error: string }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

/**
 * Profile API Service Class
 */
export class ProfileApiService {
  /**
   * 프로필 조회 - GetProfileUseCase에 대응
   */
  async getProfile(userId: string): Promise<ProfileDto> {
    try {
      const response = await httpClient.get<ProfileDto>(`/profiles/${userId}`);
      return response;
    } catch (error: any) {
      throw this.handleProfileError(error, '프로필 조회');
    }
  }

  /**
   * 이메일로 프로필 조회 - FindProfileByEmailUseCase에 대응
   */
  async getProfileByEmail(email: string): Promise<ProfileDto> {
    try {
      const response = await httpClient.get<ProfileDto>(`/profiles/email/${encodeURIComponent(email)}`);
      return response;
    } catch (error: any) {
      throw this.handleProfileError(error, '이메일로 프로필 조회');
    }
  }

  /**
   * 프로필 목록 조회 - FindProfilesByRoleUseCase, FindProfilesBySchoolUseCase 등에 대응
   */
  async getProfiles(params: ProfileListRequest = {}): Promise<ProfileListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await httpClient.get<ProfileListResponse>(
        `/profiles?${queryParams.toString()}`
      );
      return response;
    } catch (error: any) {
      throw this.handleProfileError(error, '프로필 목록 조회');
    }
  }

  /**
   * 학년별 학생 조회 - FindStudentsByGradeUseCase에 대응
   */
  async getStudentsByGrade(gradeLevel: number, schoolId?: string): Promise<ProfileDto[]> {
    try {
      const params = new URLSearchParams({ 
        role: 'student',
        gradeLevel: gradeLevel.toString()
      });
      
      if (schoolId) {
        params.append('schoolId', schoolId);
      }

      const response = await httpClient.get<ProfileListResponse>(`/profiles?${params.toString()}`);
      return response.profiles;
    } catch (error: any) {
      throw this.handleProfileError(error, '학년별 학생 조회');
    }
  }

  /**
   * 프로필 업데이트 - UpdateProfileUseCase에 대응
   */
  async updateProfile(userId: string, data: Omit<UpdateProfileRequest, 'userId'>): Promise<UpdateProfileResponse> {
    try {
      const response = await httpClient.put<UpdateProfileResponse>(`/profiles/${userId}`, data);
      return response;
    } catch (error: any) {
      throw this.handleProfileError(error, '프로필 업데이트');
    }
  }

  /**
   * 현재 사용자 프로필 업데이트
   */
  async updateMyProfile(data: Omit<UpdateProfileRequest, 'userId'>): Promise<UpdateProfileResponse> {
    try {
      const response = await httpClient.put<UpdateProfileResponse>('/profiles/me', data);
      return response;
    } catch (error: any) {
      throw this.handleProfileError(error, '내 프로필 업데이트');
    }
  }

  /**
   * 아바타 업로드 - UploadAvatarUseCase에 대응
   */
  async uploadAvatar(userId: string, file: File, onUploadProgress?: (progress: number) => void): Promise<UploadAvatarResponse> {
    try {
      const response = await httpClient.uploadFile<UploadAvatarResponse>(
        `/profiles/${userId}/avatar`,
        file,
        onUploadProgress ? (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(progress);
        } : undefined
      );
      return response;
    } catch (error: any) {
      throw this.handleProfileError(error, '아바타 업로드');
    }
  }

  /**
   * 현재 사용자 아바타 업로드
   */
  async uploadMyAvatar(file: File, onUploadProgress?: (progress: number) => void): Promise<UploadAvatarResponse> {
    try {
      const response = await httpClient.uploadFile<UploadAvatarResponse>(
        '/profiles/me/avatar',
        file,
        onUploadProgress ? (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(progress);
        } : undefined
      );
      return response;
    } catch (error: any) {
      throw this.handleProfileError(error, '내 아바타 업로드');
    }
  }

  /**
   * 아바타 삭제
   */
  async deleteAvatar(userId: string): Promise<void> {
    try {
      await httpClient.delete(`/profiles/${userId}/avatar`);
    } catch (error: any) {
      throw this.handleProfileError(error, '아바타 삭제');
    }
  }

  /**
   * 사용자 역할 변경 - ChangeUserRoleUseCase에 대응
   */
  async changeUserRole(data: ChangeUserRoleRequest): Promise<ChangeUserRoleResponse> {
    try {
      const response = await httpClient.post<ChangeUserRoleResponse>('/profiles/change-role', data);
      return response;
    } catch (error: any) {
      throw this.handleProfileError(error, '사용자 역할 변경');
    }
  }

  /**
   * 사용자 활동 내역 조회 - GetUserActivityUseCase에 대응
   */
  async getUserActivity(params: UserActivityRequest): Promise<UserActivityResponse> {
    try {
      const { userId, ...queryParams } = params;
      const searchParams = new URLSearchParams();
      
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });

      const response = await httpClient.get<UserActivityResponse>(
        `/profiles/${userId}/activity?${searchParams.toString()}`
      );
      return response;
    } catch (error: any) {
      throw this.handleProfileError(error, '사용자 활동 내역 조회');
    }
  }

  /**
   * 사용자 계정 비활성화 - DeactivateUserUseCase에 대응
   */
  async deactivateUser(userId: string, reason?: string): Promise<void> {
    try {
      await httpClient.post(`/profiles/${userId}/deactivate`, { reason });
    } catch (error: any) {
      throw this.handleProfileError(error, '사용자 계정 비활성화');
    }
  }

  /**
   * 사용자 계정 활성화 - ActivateUserUseCase에 대응
   */
  async activateUser(userId: string): Promise<void> {
    try {
      await httpClient.post(`/profiles/${userId}/activate`);
    } catch (error: any) {
      throw this.handleProfileError(error, '사용자 계정 활성화');
    }
  }

  /**
   * 사용자 삭제 - DeleteUserUseCase에 대응
   */
  async deleteUser(userId: string, reason?: string): Promise<void> {
    try {
      await httpClient.delete(`/profiles/${userId}`, { 
        data: { reason }
      });
    } catch (error: any) {
      throw this.handleProfileError(error, '사용자 삭제');
    }
  }

  /**
   * 대량 사용자 작업 - BulkUserActionUseCase에 대응
   */
  async bulkUserAction(data: BulkUserActionRequest): Promise<BulkUserActionResponse> {
    try {
      const response = await httpClient.post<BulkUserActionResponse>('/profiles/bulk-action', data);
      return response;
    } catch (error: any) {
      throw this.handleProfileError(error, '대량 사용자 작업');
    }
  }

  /**
   * 사용자 검색 - SearchUsersUseCase에 대응
   */
  async searchUsers(query: string, filters?: {
    role?: 'student' | 'teacher' | 'admin';
    schoolId?: string;
    limit?: number;
  }): Promise<ProfileDto[]> {
    try {
      const params = new URLSearchParams({ 
        search: query,
        limit: String(filters?.limit || 20)
      });
      
      if (filters?.role) {
        params.append('role', filters.role);
      }
      if (filters?.schoolId) {
        params.append('schoolId', filters.schoolId);
      }

      const response = await httpClient.get<ProfileListResponse>(`/profiles/search?${params.toString()}`);
      return response.profiles;
    } catch (error: any) {
      throw this.handleProfileError(error, '사용자 검색');
    }
  }

  /**
   * 프로필 관련 에러 처리
   */
  private handleProfileError(error: any, operation: string): Error {
    if (error.isValidationError) {
      const details = error.details || {};
      
      if (details.fullName) {
        return new Error(`이름: ${details.fullName}`);
      }
      if (details.gradeLevel) {
        return new Error(`학년: ${details.gradeLevel}`);
      }
      if (details.email) {
        return new Error(`이메일: ${details.email}`);
      }
      
      const fieldErrors = Object.keys(details).map(field => `${field}: ${details[field]}`).join(', ');
      return new Error(fieldErrors || `${operation} 요청 데이터를 확인해주세요`);
    }

    if (error.status === 404) {
      return new Error('요청한 사용자를 찾을 수 없습니다.');
    }

    if (error.status === 409) {
      return new Error(error.message || '중복된 데이터가 있습니다.');
    }

    if (error.isUnauthorized) {
      return new Error('프로필 접근 권한이 없습니다.');
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
export const profileApi = new ProfileApiService();
export default profileApi;