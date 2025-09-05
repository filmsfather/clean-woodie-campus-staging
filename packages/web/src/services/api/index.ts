/**
 * API Services Index
 * 
 * 모든 API 서비스를 중앙에서 관리하고 export
 * 클린 아키텍처 원칙에 따라 Application Layer UseCase들과 1:1 대응
 */

// HTTP 클라이언트
export { default as httpClient, ApiError } from './httpClient';

// 개별 API 서비스들
import assignmentApiService from './assignmentApi';
import authApiService from './authApi';
import inviteApiService from './inviteApi';
import profileApiService from './profileApi';
import roleApiService from './roleApi';
import problemApiService from './problemApi';
import problemSetApiService from './problemSetApi';
import { srsApi } from './srsApi';

export { AssignmentApiService } from './assignmentApi';
export { AuthApiService } from './authApi';
export { InviteApiService } from './inviteApi';
export { ProfileApiService } from './profileApi';
export { RoleApiService } from './roleApi';
export { ProblemSetApiService } from './problemSetApi';

export const assignmentApi = assignmentApiService;
export const authApi = authApiService;
export const inviteApi = inviteApiService;
export const profileApi = profileApiService;
export const roleApi = roleApiService;
export const problemApi = problemApiService;
export const problemSetApi = problemSetApiService;
export { srsApi };

// 타입 정의들 re-export
export type {
  // Assignment API 타입들
  Assignment,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  AssignToClassRequest,
  AssignToStudentRequest,
  ExtendDueDateRequest,
  ChangeDueDateRequest,
  TeacherAssignmentSummary,
  GetTeacherAssignmentsResponse,
  StudentAssignmentSummary,
  GetStudentAssignmentsResponse,
  GetTeacherAssignmentsParams,
  GetStudentAssignmentsParams
} from './assignmentApi';

export type {
  // Auth API 타입들
  SignInRequest,
  SignInResponse,
  SignUpRequest,
  SignUpResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  ValidateInviteTokenRequest,
  ValidateInviteTokenResponse
} from './authApi';

export type {
  // Invite API 타입들
  CreateInviteRequest,
  CreateInviteResponse,
  InviteListRequest,
  InviteListResponse,
  ResendInviteRequest,
  ResendInviteResponse,
  BulkCreateInviteRequest,
  BulkCreateInviteResponse,
  CheckInviteAvailabilityRequest,
  CheckInviteAvailabilityResponse
} from './inviteApi';

export type {
  // Profile API 타입들
  GetProfileRequest,
  UpdateProfileRequest,
  UpdateProfileResponse,
  ProfileListRequest,
  ProfileListResponse,
  ChangeUserRoleRequest,
  ChangeUserRoleResponse,
  UploadAvatarRequest,
  UploadAvatarResponse,
  UserActivityRequest,
  UserActivityResponse,
  BulkUserActionRequest,
  BulkUserActionResponse
} from './profileApi';

export type {
  // Role API 타입들
  RoleStatisticsRequest,
  DetailedRoleStatistics,
  RoleChangeHistoryRequest,
  RoleChangeHistoryResponse,
  BulkRoleChangeRequest,
  BulkRoleChangeResponse,
  RolePermissionsResponse
} from './roleApi';

export type {
  // Problem API 타입들
  CreateProblemRequest,
  UpdateProblemContentRequest,
  UpdateProblemAnswerRequest,
  ChangeProblemDifficultyRequest,
  ManageProblemTagsRequest,
  CloneProblemRequest,
  SearchProblemsRequest,
  GetProblemListRequest,
  Problem,
  ProblemListResponse,
  SearchProblemsResponse,
  CreateProblemResponse
} from './problemApi';

export type {
  // ProblemSet API 타입들
  ProblemSet,
  ProblemSetItem,
  DetailedProblemSet,
  ProblemSetPermissions,
  CreateProblemSetRequest,
  CreateProblemSetResponse,
  GetProblemSetRequest,
  GetProblemSetResponse,
  UpdateProblemSetRequest,
  UpdateProblemSetResponse,
  DeleteProblemSetRequest,
  DeleteProblemSetResponse,
  GetProblemSetListRequest,
  GetProblemSetListResponse,
  AddProblemToProblemSetRequest,
  AddProblemToProblemSetResponse,
  RemoveProblemFromProblemSetRequest,
  RemoveProblemFromProblemSetResponse,
  ReorderProblemSetItemsRequest,
  ReorderProblemSetItemsResponse,
  CloneProblemSetRequest,
  CloneProblemSetResponse
} from './problemSetApi';

export type {
  // SRS API 타입들
  ReviewQueueItem,
  ReviewFeedback,
  ReviewCompletionResult,
  ReviewStatistics,
  StudyPatterns,
  NotificationSettings,
  NotificationStatus,
  GetTodayReviewsResponse,
  SubmitReviewFeedbackResponse,
  GetReviewStatisticsRequest,
  GetReviewStatisticsResponse,
  StudyPatternsAnalysisRequest,
  StudyPatternsAnalysisResponse,
  CreateReviewScheduleRequest,
  CreateReviewScheduleResponse,
  GetOverdueReviewsResponse
} from './srsApi';

/**
 * 통합 API 클라이언트 클래스
 * 
 * 모든 API 서비스를 하나로 묶어서 사용할 수 있도록 제공
 * DI Container나 Service Locator 패턴 대신 간단한 통합 인터페이스 제공
 */
export class ApiClient {
  public readonly assignment = assignmentApi;
  public readonly auth = authApi;
  public readonly invite = inviteApi;
  public readonly profile = profileApi;
  public readonly role = roleApi;
  public readonly problem = problemApi;
  public readonly problemSet = problemSetApi;
  public readonly srs = srsApi;
  
  constructor() {
    // 필요시 초기화 로직 추가
  }
  
  /**
   * API 클라이언트 상태 확인
   */
  get isReady(): boolean {
    return !!(this.assignment && this.auth && this.invite && this.profile && this.role && this.problem && this.problemSet && this.srs);
  }
  
  /**
   * 모든 API 서비스 헬스체크
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: {
      assignment: boolean;
      auth: boolean;
      invite: boolean;
      profile: boolean;
      role: boolean;
      problem: boolean;
      problemSet: boolean;
    };
  }> {
    const results = {
      assignment: false,
      auth: false,
      invite: false,
      profile: false,
      role: false,
      problem: false,
      problemSet: false
    };
    
    try {
      // 각 서비스의 간단한 헬스체크 수행
      // 실제 구현에서는 /health 엔드포인트 등을 호출
      await Promise.allSettled([
        // assignment service에는 healthCheck가 없으므로 기본 체크로 대체
        Promise.resolve().then(() => results.assignment = true).catch(() => {}),
        this.auth.healthCheck().then(() => results.auth = true).catch(() => {}),
        this.invite.healthCheck().then(() => results.invite = true).catch(() => {}),
        this.profile.healthCheck().then(() => results.profile = true).catch(() => {}),
        this.role.healthCheck().then(() => results.role = true).catch(() => {}),
        this.problem.healthCheck().then(() => results.problem = true).catch(() => {}),
        this.problemSet.healthCheck().then(() => results.problemSet = true).catch(() => {})
      ]);
    } catch (error) {
      console.warn('Health check failed:', error);
    }
    
    const healthyServices = Object.values(results).filter(Boolean).length;
    const totalServices = Object.keys(results).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyServices === totalServices) {
      status = 'healthy';
    } else if (healthyServices > 0) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }
    
    return { status, services: results };
  }
}

// 싱글톤 인스턴스
export const apiClient = new ApiClient();
export default apiClient;