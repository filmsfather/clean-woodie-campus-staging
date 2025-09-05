/**
 * Custom Hooks Index
 * 
 * Auth 관련 모든 커스텀 훅을 중앙에서 관리하고 export
 * Clean Architecture: UI → Custom Hook → API Service → UseCase
 */

// AuthContext에서 제공하는 기본 훅
export { useAuth } from './useAuth';

// Auth 관련 커스텀 훅들
export { useInvites } from './useInvites';
export { useProfile } from './useProfile';
export { useUserDirectory } from './useUserDirectory';
export { useRoleStats } from './useRoleStats';
export { useAuthForms } from './useAuthForms';

// Problem 관련 커스텀 훅들
export { useProblems } from './useProblems';
export { useProblemSearch } from './useProblemSearch';
export { useProblemDetail } from './useProblemDetail';

// ProblemSet 관련 커스텀 훅들
export { useProblemSets, useProblemSetDetail } from './useProblemSets';

// Assignment 관련 커스텀 훅들
export { 
  useAssignments, 
  useStudentAssignments, 
  useAssignmentDetail,
  useDueSoonAssignments,
  useOverdueAssignments
} from './useAssignments';

// SRS 관련 커스텀 훅들
export { useSRSReviews } from './useSRSReviews';
export { useSRSStatistics } from './useSRSStatistics';
export { useSRSNotifications } from './useSRSNotifications';

// 타입 정의들 re-export
export type {
  UseInvitesOptions,
  UseInvitesReturn
} from './useInvites';

export type {
  UseProfileOptions,
  UseProfileReturn
} from './useProfile';

export type {
  UseUserDirectoryOptions,
  UseUserDirectoryReturn,
  UseUserDirectoryState
} from './useUserDirectory';

export type {
  UseRoleStatsOptions,
  UseRoleStatsReturn,
  UseRoleStatsState
} from './useRoleStats';

export type {
  UseAuthFormsOptions,
  UseAuthFormsReturn,
  AuthFormState
} from './useAuthForms';

export type {
  UseProblemsOptions,
  UseProblemsReturn,
  UseProblemsState
} from './useProblems';

export type {
  UseProblemSearchOptions,
  UseProblemSearchReturn,
  UseProblemSearchState,
  ProblemSearchFilters
} from './useProblemSearch';

export type {
  UseProblemDetailOptions,
  UseProblemDetailReturn,
  UseProblemDetailState
} from './useProblemDetail';

export type {
  UseProblemSetsOptions,
  UseProblemSetsReturn,
  UseProblemSetsState,
  UseProblemSetDetailOptions,
  UseProblemSetDetailReturn,
  UseProblemSetDetailState
} from './useProblemSets';

export type {
  // SRS 훅 타입들
  UseSRSReviewsOptions,
  UseSRSReviewsReturn,
  UseSRSReviewsState
} from './useSRSReviews';

export type {
  UseSRSStatisticsOptions,
  UseSRSStatisticsReturn,
  UseSRSStatisticsState
} from './useSRSStatistics';

export type {
  UseSRSNotificationsOptions,
  UseSRSNotificationsReturn,
  UseSRSNotificationsState
} from './useSRSNotifications';

/**
 * 훅 사용 가이드
 * 
 * @example
 * // 초대 관리
 * const { invites, createInvite, deleteInvite, state } = useInvites({
 *   organizationId: 'org-123',
 *   autoLoad: true
 * });
 * 
 * @example
 * // 프로필 관리
 * const { profile, updateProfile, uploadAvatar, state } = useProfile({
 *   userId: 'user-123',
 *   autoLoad: true
 * });
 * 
 * @example
 * // 사용자 디렉토리
 * const { users, filterByRole, changeUserRole, state } = useUserDirectory({
 *   defaultFilter: { role: 'student' }
 * });
 * 
 * @example
 * // 역할 통계
 * const { basicStats, detailedStats, getRoleStatistics } = useRoleStats({
 *   organizationId: 'org-123',
 *   autoLoad: true,
 *   refreshInterval: 300000 // 5분마다 자동 새로고침
 * });
 * 
 * @example
 * // 인증 폼
 * const { 
 *   signInForm, setSignInForm, handleSignIn, signInState,
 *   signUpForm, setSignUpForm, handleSignUp, signUpState 
 * } = useAuthForms({
 *   redirectTo: '/dashboard',
 *   onSuccess: () => navigate('/dashboard')
 * });
 */