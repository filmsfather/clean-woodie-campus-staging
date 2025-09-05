import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FeatureGuard } from '../../components/auth/FeatureGuard';
import { ProfileContainer } from '../../containers/auth';

/**
 * ProfilePage - 프로필 페이지
 * 
 * Clean Architecture 패턴으로 구현:
 * Page → Container → Hook → API Service → UseCase
 */
export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="text-gray-500">
          로그인이 필요합니다.
        </div>
      </div>
    );
  }

  return (
    <FeatureGuard feature="profile">
      <div className="max-w-4xl mx-auto p-6">
        <ProfileContainer
          userId={user.id}
          showEditButton={true}
          showRoleManagement={false}
          showActions={false}
          onProfileUpdated={() => {
            console.log('프로필 업데이트 완료');
          }}
        />
      </div>
    </FeatureGuard>
  );
};