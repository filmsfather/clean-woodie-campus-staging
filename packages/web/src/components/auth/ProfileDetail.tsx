import React from 'react';
import { ProfileDto, ProfileUIState } from '../../types/auth';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { AuthFeatureGuard } from './FeatureGuard';

interface ProfileDetailProps {
  profile: ProfileDto | null;
  state: ProfileUIState;
  onEdit?: () => void;
  canEdit?: boolean;
}

/**
 * ProfileDetail - GetProfileUseCase에 대응하는 프로필 상세 보기 컴포넌트
 * 
 * DTO-First: ProfileDto를 직접 사용하여 UI 상태 관리
 * Feature Flag: profileUpdate 기능으로 편집 버튼 제어
 */
export const ProfileDetail: React.FC<ProfileDetailProps> = ({
  profile,
  state,
  onEdit,
  canEdit = false
}) => {
  // Loading 상태
  if (state.isLoading) {
    return (
      <Card className="animate-pulse">
        <div className="flex items-start space-x-4 p-6">
          <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-gray-200 rounded w-48"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
        </div>
      </Card>
    );
  }

  // Error 상태
  if (state.error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <div className="p-6 text-center">
          <div className="text-red-600 text-sm mb-4">
            프로필을 불러오는 중 오류가 발생했습니다
          </div>
          <p className="text-red-500 text-xs">{state.error}</p>
        </div>
      </Card>
    );
  }

  // Empty 상태
  if (!profile) {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <div className="p-6 text-center text-gray-500">
          프로필 정보가 없습니다
        </div>
      </Card>
    );
  }

  // Success 상태 - 실제 프로필 데이터 표시
  return (
    <Card>
      <div className="p-6">
        {/* 프로필 헤더 */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start space-x-4">
            <Avatar
              src={profile.avatarUrl}
              alt={profile.displayName}
              size="lg"
              initials={profile.initials}
              hasAvatar={profile.hasAvatar}
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {profile.displayName}
              </h2>
              <p className="text-gray-600">{profile.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant={profile.role === 'admin' ? 'error' : 'default'}>
                  {profile.role === 'student' && '학생'}
                  {profile.role === 'teacher' && '교사'}
                  {profile.role === 'admin' && '관리자'}
                </Badge>
                {profile.gradeLevel && (
                  <Badge variant="outline">
                    {profile.gradeLevel}학년
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* 편집 버튼 - Feature Flag로 제어 */}
          {canEdit && (
            <AuthFeatureGuard.ProfileUpdate>
              <Button onClick={onEdit} variant="outline" size="sm">
                편집
              </Button>
            </AuthFeatureGuard.ProfileUpdate>
          )}
        </div>

        {/* 프로필 세부 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 기본 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">기본 정보</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">전체 이름</label>
                <p className="text-gray-900">{profile.fullName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">이메일</label>
                <p className="text-gray-900">{profile.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">역할</label>
                <p className="text-gray-900">
                  {profile.role === 'student' && '학생'}
                  {profile.role === 'teacher' && '교사'}
                  {profile.role === 'admin' && '관리자'}
                </p>
              </div>
              {profile.gradeLevel && (
                <div>
                  <label className="text-sm font-medium text-gray-500">학년</label>
                  <p className="text-gray-900">{profile.gradeLevel}학년</p>
                </div>
              )}
            </div>
          </div>

          {/* 설정 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">설정</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">테마</label>
                <p className="text-gray-900">
                  {profile.settings.theme === 'light' && '라이트'}
                  {profile.settings.theme === 'dark' && '다크'}
                  {profile.settings.theme === 'auto' && '자동'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">언어</label>
                <p className="text-gray-900">{profile.settings.language}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">알림</label>
                <div className="flex space-x-4">
                  <Badge variant={profile.settings.notifications.email ? 'default' : 'outline'}>
                    이메일
                  </Badge>
                  <Badge variant={profile.settings.notifications.push ? 'default' : 'outline'}>
                    푸시
                  </Badge>
                  <Badge variant={profile.settings.notifications.sms ? 'default' : 'outline'}>
                    SMS
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 계정 정보 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">계정 정보</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">가입일</label>
              <p className="text-gray-900">
                {new Date(profile.createdAt).toLocaleDateString('ko-KR')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">마지막 업데이트</label>
              <p className="text-gray-900">
                {new Date(profile.updatedAt).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProfileDetail;