import React, { ReactNode } from 'react';
import { useFeature } from '../../config/features';
import type { FeatureFlags } from '../../config/features';

interface FeatureGuardProps {
  feature: keyof FeatureFlags;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * FeatureGuard - UseCase별 UI 표면 노출 제어 컴포넌트
 * 
 * 각 UseCase에 대응하는 UI 컴포넌트를 Feature Flag로 가드합니다.
 * 서버에서의 권한 체크와는 별개로 UI 레벨에서의 노출을 제어합니다.
 * 
 * @param feature - 체크할 Feature Flag 키
 * @param children - Feature가 활성화될 때 렌더링할 컴포넌트
 * @param fallback - Feature가 비활성화될 때 렌더링할 컴포넌트 (선택사항)
 */
export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  feature,
  children,
  fallback = null
}) => {
  const isEnabled = useFeature(feature);
  
  return isEnabled ? <>{children}</> : <>{fallback}</>;
};

// UseCase별 전용 가드 컴포넌트들
export const AuthFeatureGuard = {
  SignIn: ({ children, fallback }: Omit<FeatureGuardProps, 'feature'>) => (
    <FeatureGuard feature="signIn" fallback={fallback}>{children}</FeatureGuard>
  ),
  
  SignUp: ({ children, fallback }: Omit<FeatureGuardProps, 'feature'>) => (
    <FeatureGuard feature="signUp" fallback={fallback}>{children}</FeatureGuard>
  ),
  
  SignOut: ({ children, fallback }: Omit<FeatureGuardProps, 'feature'>) => (
    <FeatureGuard feature="signOut" fallback={fallback}>{children}</FeatureGuard>
  ),
  
  ProfileCreation: ({ children, fallback }: Omit<FeatureGuardProps, 'feature'>) => (
    <FeatureGuard feature="profileCreation" fallback={fallback}>{children}</FeatureGuard>
  ),
  
  ProfileUpdate: ({ children, fallback }: Omit<FeatureGuardProps, 'feature'>) => (
    <FeatureGuard feature="profileUpdate" fallback={fallback}>{children}</FeatureGuard>
  ),
  
  PasswordReset: ({ children, fallback }: Omit<FeatureGuardProps, 'feature'>) => (
    <FeatureGuard feature="passwordReset" fallback={fallback}>{children}</FeatureGuard>
  ),
};

export const InviteFeatureGuard = {
  Creation: ({ children, fallback }: Omit<FeatureGuardProps, 'feature'>) => (
    <FeatureGuard feature="inviteCreation" fallback={fallback}>{children}</FeatureGuard>
  ),
  
  Validation: ({ children, fallback }: Omit<FeatureGuardProps, 'feature'>) => (
    <FeatureGuard feature="inviteValidation" fallback={fallback}>{children}</FeatureGuard>
  ),
  
  ByCreator: ({ children, fallback }: Omit<FeatureGuardProps, 'feature'>) => (
    <FeatureGuard feature="invitesByCreator" fallback={fallback}>{children}</FeatureGuard>
  ),
  
  ByOrganization: ({ children, fallback }: Omit<FeatureGuardProps, 'feature'>) => (
    <FeatureGuard feature="invitesByOrganization" fallback={fallback}>{children}</FeatureGuard>
  ),
  
  Deletion: ({ children, fallback }: Omit<FeatureGuardProps, 'feature'>) => (
    <FeatureGuard feature="inviteDeletion" fallback={fallback}>{children}</FeatureGuard>
  ),
};

export const UserFeatureGuard = {
  Directory: ({ children, fallback }: Omit<FeatureGuardProps, 'feature'>) => (
    <FeatureGuard feature="userDirectory" fallback={fallback}>{children}</FeatureGuard>
  ),
  
  Search: ({ children, fallback }: Omit<FeatureGuardProps, 'feature'>) => (
    <FeatureGuard feature="userSearch" fallback={fallback}>{children}</FeatureGuard>
  ),
  
  Details: ({ children, fallback }: Omit<FeatureGuardProps, 'feature'>) => (
    <FeatureGuard feature="userDetails" fallback={fallback}>{children}</FeatureGuard>
  ),
  
  Deletion: ({ children, fallback }: Omit<FeatureGuardProps, 'feature'>) => (
    <FeatureGuard feature="userDeletion" fallback={fallback}>{children}</FeatureGuard>
  ),
};

export const ProfileFeatureGuard = {
  ByRole: ({ children, fallback }: Omit<FeatureGuardProps, 'feature'>) => (
    <FeatureGuard feature="profilesByRole" fallback={fallback}>{children}</FeatureGuard>
  ),
  
  BySchool: ({ children, fallback }: Omit<FeatureGuardProps, 'feature'>) => (
    <FeatureGuard feature="profilesBySchool" fallback={fallback}>{children}</FeatureGuard>
  ),
  
  StudentsByGrade: ({ children, fallback }: Omit<FeatureGuardProps, 'feature'>) => (
    <FeatureGuard feature="studentsByGrade" fallback={fallback}>{children}</FeatureGuard>
  ),
  
  Deletion: ({ children, fallback }: Omit<FeatureGuardProps, 'feature'>) => (
    <FeatureGuard feature="profileDeletion" fallback={fallback}>{children}</FeatureGuard>
  ),
};

export const RoleFeatureGuard = {
  Management: ({ children, fallback }: Omit<FeatureGuardProps, 'feature'>) => (
    <FeatureGuard feature="roleManagement" fallback={fallback}>{children}</FeatureGuard>
  ),
  
  Change: ({ children, fallback }: Omit<FeatureGuardProps, 'feature'>) => (
    <FeatureGuard feature="roleChange" fallback={fallback}>{children}</FeatureGuard>
  ),
  
  Statistics: ({ children, fallback }: Omit<FeatureGuardProps, 'feature'>) => (
    <FeatureGuard feature="roleStatistics" fallback={fallback}>{children}</FeatureGuard>
  ),
};

// 사용 예시:
// <AuthFeatureGuard.SignUp>
//   <SignUpForm />
// </AuthFeatureGuard.SignUp>
// 
// <InviteFeatureGuard.Creation fallback={<div>초대 기능이 비활성화되었습니다</div>}>
//   <CreateInviteButton />
// </InviteFeatureGuard.Creation>
// 
// <FeatureGuard feature="userDirectory">
//   <UserDirectoryPage />
// </FeatureGuard>