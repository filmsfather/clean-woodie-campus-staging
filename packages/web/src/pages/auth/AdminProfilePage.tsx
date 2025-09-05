import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FeatureGuard } from '../../components/auth/FeatureGuard';
import { ProfileContainer } from '../../containers/auth';

/**
 * AdminProfilePage - 관리자용 프로필 상세 페이지
 * 
 * 관리자가 다른 사용자의 프로필을 조회/수정할 수 있는 페이지
 * Clean Architecture 패턴으로 구현:
 * Page → Container → Hook → API Service → UseCase
 */
export const AdminProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();

  // 권한 체크
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const hasPermission = isAdmin || isTeacher;

  if (!hasPermission) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="text-gray-500">
          프로필 관리 권한이 없습니다.
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="text-gray-500">
          유효하지 않은 사용자 ID입니다.
        </div>
      </div>
    );
  }

  return (
    <FeatureGuard feature="adminProfile">
      <div className="max-w-4xl mx-auto p-6">
        <ProfileContainer
          userId={userId}
          showEditButton={true}
          showRoleManagement={isAdmin}
          showActions={isAdmin}
          onProfileUpdated={() => {
            console.log(`사용자 ${userId} 프로필 업데이트 완료`);
          }}
          onUserDeleted={() => {
            console.log(`사용자 ${userId} 삭제 완료`);
            // 사용자 목록 페이지로 리다이렉트
            window.location.href = '/admin/users';
          }}
        />
      </div>
    </FeatureGuard>
  );
};