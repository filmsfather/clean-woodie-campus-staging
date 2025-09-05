import { useState, useEffect, useCallback } from 'react';
import { profileApi } from '../services/api';
import { 
  ProfileDto, 
  UpdateProfileFormState, 
  AuthActionResult,
  ProfileUIState 
} from '../types/auth';

/**
 * useProfile - 프로필 관리를 위한 커스텀 훅
 * 
 * ProfileDetail, ProfileUpdateForm 컴포넌트와 연결
 * Clean Architecture: UI → Custom Hook → API Service → UseCase
 */

interface UseProfileOptions {
  userId?: string;
  autoLoad?: boolean;
}

interface UseProfileReturn {
  // 상태
  profile: ProfileDto | null;
  state: ProfileUIState;
  isCurrentUser: boolean;
  
  // 액션
  loadProfile: (userId?: string) => Promise<void>;
  updateProfile: (formData: UpdateProfileFormState) => Promise<AuthActionResult>;
  uploadAvatar: (file: File, onProgress?: (progress: number) => void) => Promise<AuthActionResult>;
  deleteAvatar: () => Promise<AuthActionResult>;
  changeRole: (newRole: 'student' | 'teacher' | 'admin', reason?: string) => Promise<AuthActionResult>;
  deactivateUser: (reason?: string) => Promise<AuthActionResult>;
  activateUser: () => Promise<AuthActionResult>;
  deleteUser: (reason?: string) => Promise<AuthActionResult>;
  refresh: () => Promise<void>;
  
  // 유틸리티
  getDisplayName: () => string;
  getInitials: () => string;
  getRoleName: () => string;
  isActive: () => boolean;
  hasAvatar: () => boolean;
}

export const useProfile = (options: UseProfileOptions = {}): UseProfileReturn => {
  const {
    userId,
    autoLoad = true
  } = options;

  // 상태
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [state, setState] = useState<ProfileUIState>({
    profile: null,
    isLoading: false,
    error: null
  });

  // 현재 사용자인지 확인 (실제로는 AuthContext에서 가져와야 함)
  const isCurrentUser = !userId || userId === 'me';

  // 프로필 로드
  const loadProfile = useCallback(async (targetUserId?: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const userIdToLoad = targetUserId || userId;
      let profileData: ProfileDto;
      
      if (!userIdToLoad || userIdToLoad === 'me') {
        // 현재 사용자 프로필 조회 - 실제로는 AuthContext에서 가져와야 함
        // 임시로 API 호출
        profileData = await profileApi.getProfile('me');
      } else {
        profileData = await profileApi.getProfile(userIdToLoad);
      }
      
      setProfile(profileData);
      setState({
        profile: profileData,
        isLoading: false,
        error: null
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '프로필을 불러오는데 실패했습니다.';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, [userId]);

  // 프로필 업데이트
  const updateProfile = useCallback(async (formData: UpdateProfileFormState): Promise<AuthActionResult> => {
    try {
      if (!profile) {
        throw new Error('프로필이 로드되지 않았습니다.');
      }

      const updateData = {
        fullName: formData.fullName,
        gradeLevel: formData.gradeLevel,
        avatarUrl: formData.avatarUrl,
        settings: formData.settings
      };

      let response;
      if (isCurrentUser) {
        response = await profileApi.updateMyProfile(updateData);
      } else {
        response = await profileApi.updateProfile(profile.id, updateData);
      }
      
      // 프로필 상태 업데이트
      setProfile(response.profile);
      setState(prev => ({ ...prev, profile: response.profile }));
      
      return {
        success: true,
        message: '프로필이 성공적으로 업데이트되었습니다.',
        data: response
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '프로필 업데이트에 실패했습니다.';
      return {
        success: false,
        message: errorMessage
      };
    }
  }, [profile, isCurrentUser]);

  // 아바타 업로드
  const uploadAvatar = useCallback(async (
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<AuthActionResult> => {
    try {
      if (!profile) {
        throw new Error('프로필이 로드되지 않았습니다.');
      }

      let response;
      if (isCurrentUser) {
        response = await profileApi.uploadMyAvatar(file, onProgress);
      } else {
        response = await profileApi.uploadAvatar(profile.id, file, onProgress);
      }
      
      // 프로필의 아바타 URL 업데이트
      const updatedProfile = {
        ...profile,
        avatarUrl: response.avatarUrl,
        hasAvatar: true
      };
      setProfile(updatedProfile);
      setState(prev => ({ ...prev, profile: updatedProfile }));
      
      return {
        success: true,
        message: '프로필 사진이 성공적으로 업데이트되었습니다.',
        data: response
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '프로필 사진 업로드에 실패했습니다.';
      return {
        success: false,
        message: errorMessage
      };
    }
  }, [profile, isCurrentUser]);

  // 아바타 삭제
  const deleteAvatar = useCallback(async (): Promise<AuthActionResult> => {
    try {
      if (!profile) {
        throw new Error('프로필이 로드되지 않았습니다.');
      }

      await profileApi.deleteAvatar(profile.id);
      
      // 프로필의 아바타 정보 제거
      const updatedProfile = {
        ...profile,
        avatarUrl: undefined,
        hasAvatar: false
      };
      setProfile(updatedProfile);
      setState(prev => ({ ...prev, profile: updatedProfile }));
      
      return {
        success: true,
        message: '프로필 사진이 삭제되었습니다.'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '프로필 사진 삭제에 실패했습니다.';
      return {
        success: false,
        message: errorMessage
      };
    }
  }, [profile]);

  // 역할 변경
  const changeRole = useCallback(async (
    newRole: 'student' | 'teacher' | 'admin', 
    reason?: string
  ): Promise<AuthActionResult> => {
    try {
      if (!profile) {
        throw new Error('프로필이 로드되지 않았습니다.');
      }

      const response = await profileApi.changeUserRole({
        userId: 'current', // 실제로는 현재 사용자 ID
        targetUserId: profile.id,
        newRole,
        reason
      });
      
      // 프로필의 역할 업데이트
      const updatedProfile = {
        ...profile,
        role: newRole
      };
      setProfile(updatedProfile);
      setState(prev => ({ ...prev, profile: updatedProfile }));
      
      return {
        success: true,
        message: `역할이 ${newRole === 'student' ? '학생' : newRole === 'teacher' ? '교사' : '관리자'}로 변경되었습니다.`,
        data: response
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '역할 변경에 실패했습니다.';
      return {
        success: false,
        message: errorMessage
      };
    }
  }, [profile]);

  // 사용자 비활성화
  const deactivateUser = useCallback(async (reason?: string): Promise<AuthActionResult> => {
    try {
      if (!profile) {
        throw new Error('프로필이 로드되지 않았습니다.');
      }

      await profileApi.deactivateUser(profile.id, reason);
      
      return {
        success: true,
        message: '사용자가 비활성화되었습니다.'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '사용자 비활성화에 실패했습니다.';
      return {
        success: false,
        message: errorMessage
      };
    }
  }, [profile]);

  // 사용자 활성화
  const activateUser = useCallback(async (): Promise<AuthActionResult> => {
    try {
      if (!profile) {
        throw new Error('프로필이 로드되지 않았습니다.');
      }

      await profileApi.activateUser(profile.id);
      
      return {
        success: true,
        message: '사용자가 활성화되었습니다.'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '사용자 활성화에 실패했습니다.';
      return {
        success: false,
        message: errorMessage
      };
    }
  }, [profile]);

  // 사용자 삭제
  const deleteUser = useCallback(async (reason?: string): Promise<AuthActionResult> => {
    try {
      if (!profile) {
        throw new Error('프로필이 로드되지 않았습니다.');
      }

      await profileApi.deleteUser(profile.id, reason);
      
      // 프로필 상태 초기화
      setProfile(null);
      setState({
        profile: null,
        isLoading: false,
        error: null
      });
      
      return {
        success: true,
        message: '사용자가 삭제되었습니다.'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '사용자 삭제에 실패했습니다.';
      return {
        success: false,
        message: errorMessage
      };
    }
  }, [profile]);

  // 새로고침
  const refresh = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  // 유틸리티 함수들
  const getDisplayName = useCallback(() => {
    return profile?.displayName || profile?.fullName || '사용자';
  }, [profile]);

  const getInitials = useCallback(() => {
    if (profile?.initials) {
      return profile.initials;
    }
    
    const name = profile?.fullName || profile?.displayName;
    if (name) {
      return name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    
    return '사용자'.charAt(0);
  }, [profile]);

  const getRoleName = useCallback(() => {
    if (!profile) return '없음';
    
    switch (profile.role) {
      case 'student':
        return '학생';
      case 'teacher':
        return '교사';
      case 'admin':
        return '관리자';
      default:
        return profile.role;
    }
  }, [profile]);

  const isActive = useCallback(() => {
    // ProfileDto에 isActive 필드가 있다고 가정
    return true; // 임시값
  }, []);

  const hasAvatar = useCallback(() => {
    return profile?.hasAvatar || false;
  }, [profile]);

  // 자동 로드
  useEffect(() => {
    if (autoLoad) {
      loadProfile();
    }
  }, [autoLoad]); // loadProfile은 의도적으로 제외

  return {
    // 상태
    profile,
    state,
    isCurrentUser,
    
    // 액션
    loadProfile,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    changeRole,
    deactivateUser,
    activateUser,
    deleteUser,
    refresh,
    
    // 유틸리티
    getDisplayName,
    getInitials,
    getRoleName,
    isActive,
    hasAvatar
  };
};