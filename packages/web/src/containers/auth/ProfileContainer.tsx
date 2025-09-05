import React, { useState, useEffect } from 'react';
import { useProfile } from '../../hooks';
import { ProfileDetail } from '../../components/auth/ProfileDetail';
import { ProfileUpdateForm } from '../../components/auth/ProfileUpdateForm';
import { useAuth } from '../../contexts/AuthContext';
import type { UpdateProfileFormState } from '../../types/auth';

/**
 * ProfileContainer - 프로필 관리 통합 컨테이너
 * 
 * Clean Architecture:
 * - Presentation Layer: UI Components (ProfileDetail, ProfileUpdateForm)
 * - Application Layer: Custom Hook (useProfile)
 * - Domain/Infrastructure: API Services → UseCases
 * 
 * 역할:
 * - ProfileDetail과 ProfileUpdateForm 컴포넌트를 연결
 * - 편집 모드 상태 관리
 * - 권한 기반 UI 제어
 */

interface ProfileContainerProps {
  userId?: string; // undefined면 현재 사용자
  className?: string;
  showEditButton?: boolean;
  showRoleManagement?: boolean;
  showActions?: boolean;
  onProfileUpdated?: () => void;
  onUserDeleted?: () => void;
}

export const ProfileContainer: React.FC<ProfileContainerProps> = ({
  userId,
  className = '',
  showEditButton = true,
  showRoleManagement = false,
  showActions = false,
  onProfileUpdated,
  onUserDeleted
}) => {
  const { user: currentUser } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // useProfile 훅 사용
  const {
    profile,
    state,
    isCurrentUser,
    loadProfile,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    changeRole,
    deactivateUser,
    activateUser,
    deleteUser,
    refresh,
    getDisplayName,
    getRoleName,
    hasAvatar
  } = useProfile({
    userId,
    autoLoad: true
  });

  // 성공 메시지 자동 숨김
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  // 프로필 업데이트 핸들러
  const handleProfileUpdate = async (formData: UpdateProfileFormState) => {
    const result = await updateProfile(formData);
    
    if (result.success) {
      setIsEditMode(false);
      setShowSuccessMessage(result.message);
      onProfileUpdated?.();
    }
    
    return result;
  };

  // 아바타 업로드 핸들러
  const handleAvatarUpload = async (file: File) => {
    setUploadProgress(0);
    
    const result = await uploadAvatar(file, (progress) => {
      setUploadProgress(progress);
    });
    
    setUploadProgress(null);
    
    if (result.success) {
      setShowSuccessMessage(result.message);
    }
    
    return result;
  };

  // 아바타 삭제 핸들러
  const handleAvatarDelete = async () => {
    const result = await deleteAvatar();
    
    if (result.success) {
      setShowSuccessMessage(result.message);
    }
    
    return result;
  };

  // 역할 변경 핸들러
  const handleRoleChange = async (newRole: 'student' | 'teacher' | 'admin', reason?: string) => {
    const result = await changeRole(newRole, reason);
    
    if (result.success) {
      setShowSuccessMessage(result.message);
    }
    
    return result;
  };

  // 사용자 비활성화 핸들러
  const handleUserDeactivate = async (reason?: string) => {
    const result = await deactivateUser(reason);
    
    if (result.success) {
      setShowSuccessMessage(result.message);
    }
    
    return result;
  };

  // 사용자 활성화 핸들러
  const handleUserActivate = async () => {
    const result = await activateUser();
    
    if (result.success) {
      setShowSuccessMessage(result.message);
    }
    
    return result;
  };

  // 사용자 삭제 핸들러
  const handleUserDelete = async (reason?: string) => {
    const result = await deleteUser(reason);
    
    if (result.success) {
      setShowSuccessMessage(result.message);
      setShowDeleteConfirm(false);
      onUserDeleted?.();
    }
    
    return result;
  };

  // 편집 취소 핸들러
  const handleEditCancel = () => {
    setIsEditMode(false);
  };

  // 권한 체크
  const canEditProfile = isCurrentUser || currentUser?.role === 'admin';
  const canManageRole = currentUser?.role === 'admin' && !isCurrentUser;
  const canDeleteUser = currentUser?.role === 'admin' && !isCurrentUser;

  // 로딩 상태
  if (state.isLoading && !profile) {
    return (
      <div className={`flex justify-center items-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">프로필을 불러오는 중...</span>
      </div>
    );
  }

  // 에러 상태
  if (state.error) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="text-red-600 mb-4">
          프로필을 불러올 수 없습니다
        </div>
        <p className="text-gray-600 text-sm mb-4">{state.error}</p>
        <button
          onClick={() => loadProfile()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 성공 메시지 */}
      {showSuccessMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <div className="text-green-800 text-sm">
              ✓ {showSuccessMessage}
            </div>
            <button
              onClick={() => setShowSuccessMessage(null)}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 업로드 진행률 */}
      {uploadProgress !== null && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-800">프로필 사진 업로드 중...</span>
            <span className="text-sm text-blue-600">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* 프로필 헤더 */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">
              {isCurrentUser ? '내 프로필' : `${getDisplayName()}님의 프로필`}
            </h1>
            
            <div className="flex space-x-2">
              {/* 새로고침 버튼 */}
              <button
                onClick={refresh}
                disabled={state.isLoading}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
              >
                새로고침
              </button>
              
              {/* 편집 버튼 */}
              {showEditButton && canEditProfile && !isEditMode && (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  편집
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 프로필 내용 */}
        <div className="p-6">
          {isEditMode ? (
            // 편집 모드
            <ProfileUpdateForm
              currentProfile={profile!}
              onSubmit={handleProfileUpdate}
              onCancel={handleEditCancel}
              isLoading={state.isLoading}
              error={state.error}
              canUploadAvatar={true}
            />
          ) : (
            // 보기 모드
            <ProfileDetail
              profile={profile}
              state={state}
              onEdit={canEditProfile ? () => setIsEditMode(true) : undefined}
              canEdit={canEditProfile}
            />
          )}
        </div>
      </div>

      {/* 역할 관리 */}
      {showRoleManagement && canManageRole && profile && (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">역할 관리</h2>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  현재 역할: <span className="text-blue-600">{getRoleName()}</span>
                </label>
                <div className="flex space-x-2">
                  <select
                    className="px-3 py-2 border border-gray-300 rounded"
                    defaultValue={profile.role}
                    onChange={(e) => {
                      const newRole = e.target.value as 'student' | 'teacher' | 'admin';
                      if (newRole !== profile.role) {
                        const reason = prompt('역할 변경 사유를 입력해주세요:');
                        if (reason) {
                          handleRoleChange(newRole, reason);
                        }
                      }
                    }}
                  >
                    <option value="student">학생</option>
                    <option value="teacher">교사</option>
                    <option value="admin">관리자</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 관리자 액션 */}
      {showActions && canDeleteUser && (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-red-600">위험한 작업</h2>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {/* 사용자 비활성화/활성화 */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">사용자 비활성화</h3>
                  <p className="text-sm text-gray-600">사용자의 로그인을 차단합니다</p>
                </div>
                <button
                  onClick={() => {
                    const reason = prompt('비활성화 사유를 입력해주세요:');
                    if (reason) {
                      handleUserDeactivate(reason);
                    }
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  비활성화
                </button>
              </div>

              {/* 사용자 삭제 */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <h3 className="font-medium text-red-600">사용자 삭제</h3>
                  <p className="text-sm text-gray-600">이 작업은 되돌릴 수 없습니다</p>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">사용자 삭제 확인</h3>
            <p className="text-gray-600 mb-6">
              정말로 <strong>{getDisplayName()}</strong>님을 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              >
                취소
              </button>
              <button
                onClick={() => {
                  const reason = prompt('삭제 사유를 입력해주세요:');
                  if (reason) {
                    handleUserDelete(reason);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileContainer;