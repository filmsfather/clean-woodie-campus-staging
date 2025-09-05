/**
 * Auth Containers Index
 * 
 * 모든 Auth 관련 컨테이너 컴포넌트를 중앙에서 관리하고 export
 * Clean Architecture: Container → Hook → API Service → UseCase
 */

export { default as AuthContainer } from './AuthContainer';
export { default as InviteManagementContainer } from './InviteManagementContainer';
export { default as ProfileContainer } from './ProfileContainer';
export { default as UserManagementContainer } from './UserManagementContainer';

// 타입 정의들 re-export
export type { AuthContainerProps } from './AuthContainer';
export type { InviteManagementContainerProps } from './InviteManagementContainer';
export type { ProfileContainerProps } from './ProfileContainer';
export type { UserManagementContainerProps } from './UserManagementContainer';

/**
 * 컨테이너 사용 가이드
 * 
 * @example
 * // 인증 페이지
 * <AuthContainer 
 *   mode="signin" 
 *   redirectTo="/dashboard"
 *   showToggle={true}
 * />
 * 
 * @example
 * // 초대 관리 페이지
 * <InviteManagementContainer 
 *   organizationId="org-123"
 *   showCreateForm={true}
 *   showBulkActions={true}
 * />
 * 
 * @example
 * // 프로필 페이지
 * <ProfileContainer 
 *   userId="user-123" // undefined면 현재 사용자
 *   showEditButton={true}
 *   showRoleManagement={true}
 * />
 * 
 * @example
 * // 사용자 관리 페이지
 * <UserManagementContainer 
 *   organizationId="org-123"
 *   showStatistics={true}
 *   showBulkActions={true}
 * />
 */