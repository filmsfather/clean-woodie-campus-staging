import httpClient from './httpClient';
import { 
  SignInFormState, 
  SignUpFormState, 
  AuthActionResult,
  ProfileDto
} from '../../types/auth';

/**
 * 인증 관련 API 서비스
 * 
 * Clean Architecture 원칙:
 * - Application Layer의 UseCase들과 1:1 대응
 * - DTO-First: Application Layer와 동일한 타입 사용
 * - UI Layer에서 직접 호출하지 않고 커스텀 훅을 통해 사용
 */

// Request/Response 타입 정의
export interface SignInRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  context?: {
    ip?: string;
    userAgent?: string;
    locale?: string;
    redirectUrl?: string;
  };
}

export interface SignInResponse {
  user: ProfileDto;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  };
}

export interface SignUpRequest {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  classId?: string;
  inviteToken?: string;
  context?: {
    ip?: string;
    userAgent?: string;
    locale?: string;
    redirectUrl?: string;
  };
}

export interface SignUpResponse {
  user: ProfileDto;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  };
  isActivationRequired: boolean;
  activationEmailSent?: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  user?: ProfileDto;
}

export interface ResetPasswordRequest {
  email: string;
  context?: {
    locale?: string;
    redirectUrl?: string;
  };
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  emailSent: boolean;
}

export interface ChangePasswordRequest {
  token?: string; // 비밀번호 재설정 토큰 (재설정 시)
  currentPassword?: string; // 현재 비밀번호 (변경 시)
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
  requiresRelogin: boolean;
}

export interface ValidateInviteTokenRequest {
  token: string;
}

export interface ValidateInviteTokenResponse {
  isValid: boolean;
  invite?: {
    id: string;
    email: string;
    role: string;
    organizationId: string;
    classId?: string;
    expiresAt: string;
  };
  errorMessage?: string;
}

/**
 * Auth API Service Class
 */
export class AuthApiService {
  /**
   * 로그인 - SignInUseCase에 대응
   */
  async signIn(data: SignInRequest): Promise<SignInResponse> {
    try {
      const response = await httpClient.post<SignInResponse>('/auth/signin', data);
      return response;
    } catch (error: any) {
      throw this.handleAuthError(error, '로그인');
    }
  }

  /**
   * 회원가입 - SignUpUseCase에 대응
   */
  async signUp(data: SignUpRequest): Promise<SignUpResponse> {
    try {
      const response = await httpClient.post<SignUpResponse>('/auth/signup', data);
      return response;
    } catch (error: any) {
      throw this.handleAuthError(error, '회원가입');
    }
  }

  /**
   * 로그아웃 - SignOutUseCase에 대응
   */
  async signOut(refreshToken?: string): Promise<void> {
    try {
      await httpClient.post('/auth/signout', { refreshToken });
    } catch (error: any) {
      // 로그아웃은 서버 에러가 발생해도 클라이언트에서는 성공으로 처리
      console.warn('Sign out request failed:', error.message);
    }
  }

  /**
   * 토큰 갱신 - RefreshTokenUseCase에 대응
   */
  async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    try {
      const response = await httpClient.post<RefreshTokenResponse>('/auth/refresh', data);
      return response;
    } catch (error: any) {
      throw this.handleAuthError(error, '토큰 갱신');
    }
  }

  /**
   * 비밀번호 재설정 요청 - RequestPasswordResetUseCase에 대응
   */
  async requestPasswordReset(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    try {
      const response = await httpClient.post<ResetPasswordResponse>('/auth/reset-password', data);
      return response;
    } catch (error: any) {
      throw this.handleAuthError(error, '비밀번호 재설정 요청');
    }
  }

  /**
   * 사용자 삭제 - DeleteUserUseCase에 대응
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      await httpClient.delete(`/auth/users/${userId}`);
    } catch (error: any) {
      throw this.handleAuthError(error, '사용자 삭제');
    }
  }

  /**
   * 이메일로 사용자 조회 - FindUserByEmailUseCase에 대응
   */
  async findUserByEmail(email: string): Promise<ProfileDto> {
    try {
      const response = await httpClient.get<ProfileDto>(`/auth/users/by-email?email=${encodeURIComponent(email)}`);
      return response;
    } catch (error: any) {
      throw this.handleAuthError(error, '이메일로 사용자 조회');
    }
  }

  /**
   * 초대 토큰으로 사용자 조회 - FindUserByInviteTokenUseCase에 대응
   */
  async findUserByInviteToken(token: string): Promise<ProfileDto> {
    try {
      const response = await httpClient.get<ProfileDto>(`/auth/users/by-invite-token?token=${token}`);
      return response;
    } catch (error: any) {
      throw this.handleAuthError(error, '초대 토큰으로 사용자 조회');
    }
  }

  /**
   * 인증 관련 에러 처리
   */
  private handleAuthError(error: any, operation: string): Error {
    if (error.isValidationError) {
      // 422 Validation 에러
      const details = error.details || {};
      const fieldErrors = Object.keys(details).map(field => `${field}: ${details[field]}`).join(', ');
      return new Error(fieldErrors || `${operation} 요청 데이터를 확인해주세요`);
    }

    if (error.isUnauthorized) {
      // 401 Unauthorized
      return new Error('인증이 필요합니다. 다시 로그인해주세요.');
    }

    if (error.isForbidden) {
      // 403 Forbidden
      return new Error('접근 권한이 없습니다.');
    }

    if (error.isNetworkError) {
      // Network 에러
      return new Error('네트워크 연결을 확인해주세요.');
    }

    if (error.isServerError) {
      // 5xx 서버 에러
      return new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }

    // 기본 에러 메시지
    return new Error(error.message || `${operation} 중 오류가 발생했습니다.`);
  }

  /**
   * 헬스체크
   */
  async healthCheck(): Promise<boolean> {
    try {
      await httpClient.get('/auth/health');
      return true;
    } catch (error) {
      console.warn('Auth API health check failed:', error);
      return false;
    }
  }
}

// 싱글톤 인스턴스
export const authApi = new AuthApiService();
export default authApi;