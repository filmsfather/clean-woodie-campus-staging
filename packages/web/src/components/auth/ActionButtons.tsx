import React from 'react';
import { Button } from '../ui/Button';
import { AuthFeatureGuard, InviteFeatureGuard, RoleFeatureGuard, UserFeatureGuard, ProfileFeatureGuard } from './FeatureGuard';
import { AuthActionResult } from '../../types/auth';

interface ActionButtonsProps {
  // 공통 props
  isLoading?: boolean;
  disabled?: boolean;
}

// SignOut 액션 버튼 - SignOutUseCase에 대응
interface SignOutButtonProps extends ActionButtonsProps {
  onSignOut: () => Promise<AuthActionResult>;
}

export const SignOutButton: React.FC<SignOutButtonProps> = ({
  onSignOut,
  isLoading = false,
  disabled = false
}) => (
  <AuthFeatureGuard.SignOut>
    <Button
      onClick={onSignOut}
      variant="outline"
      disabled={disabled || isLoading}
      loading={isLoading}
    >
      {isLoading ? '로그아웃 중...' : '로그아웃'}
    </Button>
  </AuthFeatureGuard.SignOut>
);

// UseInviteToken 액션 버튼 - UseInviteTokenUseCase에 대응
interface UseInviteButtonProps extends ActionButtonsProps {
  onUseInvite: (token: string) => Promise<AuthActionResult>;
  token: string;
  isValid: boolean;
}

export const UseInviteButton: React.FC<UseInviteButtonProps> = ({
  onUseInvite,
  token,
  isValid,
  isLoading = false,
  disabled = false
}) => (
  <InviteFeatureGuard.Validation>
    <Button
      onClick={() => onUseInvite(token)}
      disabled={disabled || isLoading || !isValid}
      loading={isLoading}
      className="w-full"
    >
      {isLoading ? '초대 수락 중...' : '초대 수락하기'}
    </Button>
  </InviteFeatureGuard.Validation>
);

// ChangeRole 액션 버튼 - ChangeRoleUseCase에 대응
interface ChangeRoleButtonProps extends ActionButtonsProps {
  onRoleChange: (userId: string, newRole: 'student' | 'teacher' | 'admin') => Promise<AuthActionResult>;
  userId: string;
  currentRole: string;
  targetRole: 'student' | 'teacher' | 'admin';
}

export const ChangeRoleButton: React.FC<ChangeRoleButtonProps> = ({
  onRoleChange,
  userId,
  currentRole,
  targetRole,
  isLoading = false,
  disabled = false
}) => {
  const getRoleText = (role: string) => {
    switch (role) {
      case 'student': return '학생';
      case 'teacher': return '교사';
      case 'admin': return '관리자';
      default: return role;
    }
  };

  const isCurrentRole = currentRole === targetRole;

  return (
    <RoleFeatureGuard.Change>
      <Button
        onClick={() => onRoleChange(userId, targetRole)}
        variant={isCurrentRole ? 'default' : 'outline'}
        size="sm"
        disabled={disabled || isLoading || isCurrentRole}
        loading={isLoading && !isCurrentRole}
      >
        {getRoleText(targetRole)}
      </Button>
    </RoleFeatureGuard.Change>
  );
};

// DeleteInvite 액션 버튼 - DeleteInviteUseCase에 대응
interface DeleteInviteButtonProps extends ActionButtonsProps {
  onDeleteInvite: (inviteId: string) => Promise<AuthActionResult>;
  inviteId: string;
  confirmationRequired?: boolean;
}

export const DeleteInviteButton: React.FC<DeleteInviteButtonProps> = ({
  onDeleteInvite,
  inviteId,
  confirmationRequired = true,
  isLoading = false,
  disabled = false
}) => {
  const handleDelete = async () => {
    if (confirmationRequired) {
      if (!window.confirm('이 초대를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        return;
      }
    }
    await onDeleteInvite(inviteId);
  };

  return (
    <InviteFeatureGuard.Deletion>
      <Button
        onClick={handleDelete}
        variant="outline"
        size="sm"
        disabled={disabled || isLoading}
        loading={isLoading}
        className="text-red-600 hover:text-red-700 hover:border-red-300"
      >
        {isLoading ? '삭제 중...' : '삭제'}
      </Button>
    </InviteFeatureGuard.Deletion>
  );
};

// DeleteUser/Profile 액션 버튼 - DeleteUserUseCase, DeleteProfileUseCase에 대응
interface DeleteUserButtonProps extends ActionButtonsProps {
  onDeleteUser: (userId: string) => Promise<AuthActionResult>;
  userId: string;
  userName: string;
  confirmationRequired?: boolean;
}

export const DeleteUserButton: React.FC<DeleteUserButtonProps> = ({
  onDeleteUser,
  userId,
  userName,
  confirmationRequired = true,
  isLoading = false,
  disabled = false
}) => {
  const handleDelete = async () => {
    if (confirmationRequired) {
      const confirmMessage = `사용자 "${userName}"를 삭제하시겠습니까?\n\n이 작업은 다음을 포함합니다:\n- 사용자 계정 완전 삭제\n- 모든 학습 데이터 삭제\n- 관련된 모든 기록 삭제\n\n이 작업은 되돌릴 수 없습니다.`;
      
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }
    await onDeleteUser(userId);
  };

  return (
    <UserFeatureGuard.Deletion>
      <Button
        onClick={handleDelete}
        variant="destructive"
        size="sm"
        disabled={disabled || isLoading}
        loading={isLoading}
      >
        {isLoading ? '삭제 중...' : '사용자 삭제'}
      </Button>
    </UserFeatureGuard.Deletion>
  );
};

// 프로필 삭제 버튼 (사용자 삭제와 구분)
interface DeleteProfileButtonProps extends ActionButtonsProps {
  onDeleteProfile: (userId: string) => Promise<AuthActionResult>;
  userId: string;
  profileName: string;
  confirmationRequired?: boolean;
}

export const DeleteProfileButton: React.FC<DeleteProfileButtonProps> = ({
  onDeleteProfile,
  userId,
  profileName,
  confirmationRequired = true,
  isLoading = false,
  disabled = false
}) => {
  const handleDelete = async () => {
    if (confirmationRequired) {
      const confirmMessage = `프로필 "${profileName}"을 삭제하시겠습니까?\n\n이 작업은 프로필 정보만 삭제하며, 계정은 유지됩니다.\n계정을 완전히 삭제하려면 사용자 삭제를 사용하세요.`;
      
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }
    await onDeleteProfile(userId);
  };

  return (
    <ProfileFeatureGuard.Deletion>
      <Button
        onClick={handleDelete}
        variant="outline"
        size="sm"
        disabled={disabled || isLoading}
        loading={isLoading}
        className="text-red-600 hover:text-red-700 hover:border-red-300"
      >
        {isLoading ? '프로필 삭제 중...' : '프로필 삭제'}
      </Button>
    </ProfileFeatureGuard.Deletion>
  );
};

// DeleteExpiredInvites 액션 버튼 - DeleteExpiredInvitesUseCase에 대응 (배치 작업)
interface CleanupExpiredInvitesButtonProps extends ActionButtonsProps {
  onCleanupExpiredInvites: () => Promise<AuthActionResult>;
  expiredCount: number;
}

export const CleanupExpiredInvitesButton: React.FC<CleanupExpiredInvitesButtonProps> = ({
  onCleanupExpiredInvites,
  expiredCount,
  isLoading = false,
  disabled = false
}) => {
  const handleCleanup = async () => {
    if (expiredCount === 0) return;
    
    if (!window.confirm(`${expiredCount}개의 만료된 초대를 정리하시겠습니까?\n\n만료된 초대는 더 이상 사용할 수 없으며, 정리하면 시스템 성능이 향상됩니다.`)) {
      return;
    }
    
    await onCleanupExpiredInvites();
  };

  if (expiredCount === 0) return null;

  return (
    <InviteFeatureGuard.Deletion>
      <Button
        onClick={handleCleanup}
        variant="outline"
        disabled={disabled || isLoading}
        loading={isLoading}
        className="text-orange-600 hover:text-orange-700"
      >
        {isLoading ? '정리 중...' : `만료된 초대 정리 (${expiredCount}개)`}
      </Button>
    </InviteFeatureGuard.Deletion>
  );
};

// 복합 액션 버튼 그룹 컴포넌트
interface UserActionGroupProps {
  userId: string;
  userName: string;
  currentRole: string;
  onRoleChange?: (userId: string, newRole: 'student' | 'teacher' | 'admin') => Promise<AuthActionResult>;
  onDeleteUser?: (userId: string) => Promise<AuthActionResult>;
  onDeleteProfile?: (userId: string) => Promise<AuthActionResult>;
  canChangeRole?: boolean;
  canDeleteUser?: boolean;
  canDeleteProfile?: boolean;
  isLoading?: boolean;
}

export const UserActionGroup: React.FC<UserActionGroupProps> = ({
  userId,
  userName,
  currentRole,
  onRoleChange,
  onDeleteUser,
  onDeleteProfile,
  canChangeRole = false,
  canDeleteUser = false,
  canDeleteProfile = false,
  isLoading = false
}) => (
  <div className="flex items-center space-x-2">
    {/* 역할 변경 버튼들 */}
    {canChangeRole && onRoleChange && (
      <div className="flex space-x-1">
        <ChangeRoleButton
          onRoleChange={onRoleChange}
          userId={userId}
          currentRole={currentRole}
          targetRole="student"
          isLoading={isLoading}
        />
        <ChangeRoleButton
          onRoleChange={onRoleChange}
          userId={userId}
          currentRole={currentRole}
          targetRole="teacher"
          isLoading={isLoading}
        />
        <ChangeRoleButton
          onRoleChange={onRoleChange}
          userId={userId}
          currentRole={currentRole}
          targetRole="admin"
          isLoading={isLoading}
        />
      </div>
    )}

    {/* 프로필 삭제 */}
    {canDeleteProfile && onDeleteProfile && (
      <DeleteProfileButton
        onDeleteProfile={onDeleteProfile}
        userId={userId}
        profileName={userName}
        isLoading={isLoading}
      />
    )}

    {/* 사용자 완전 삭제 */}
    {canDeleteUser && onDeleteUser && (
      <DeleteUserButton
        onDeleteUser={onDeleteUser}
        userId={userId}
        userName={userName}
        isLoading={isLoading}
      />
    )}
  </div>
);

const ActionButtons = {
  SignOutButton,
  UseInviteButton,
  ChangeRoleButton,
  DeleteInviteButton,
  DeleteUserButton,
  DeleteProfileButton,
  CleanupExpiredInvitesButton,
  UserActionGroup
};

export { ActionButtons };
export default ActionButtons;