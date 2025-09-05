import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FeatureGuard } from '../../components/auth/FeatureGuard';
import { UserManagementContainer } from '../../containers/auth';

/**
 * UserManagementPage - 사용자 관리 페이지
 * 
 * Clean Architecture 패턴으로 구현:
 * Page → Container → Hook → API Service → UseCase
 */
export const UserManagementPage: React.FC = () => {
  const { user } = useAuth();

  // 권한 체크
  const hasPermission = user?.role === 'admin' || user?.role === 'teacher';

  if (!hasPermission) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <div className="text-gray-500">
          사용자 관리 권한이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <FeatureGuard feature="userManagement">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">사용자 관리</h1>
          <p className="mt-2 text-gray-600">
            등록된 사용자들을 조회하고 역할을 관리하세요
          </p>
        </div>

        <UserManagementContainer
          organizationId={user?.organizationId}
          showStatistics={true}
          showBulkActions={user?.role === 'admin'}
          defaultFilter={{
            role: undefined,
            schoolId: undefined,
            gradeLevel: undefined
          }}
        />
      </div>
    </FeatureGuard>
  );
};