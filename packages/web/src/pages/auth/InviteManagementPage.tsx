import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FeatureGuard } from '../../components/auth/FeatureGuard';
import { InviteManagementContainer } from '../../containers/auth';

/**
 * InviteManagementPage - 초대 관리 페이지
 * 
 * Clean Architecture 패턴으로 구현:
 * Page → Container → Hook → API Service → UseCase
 */
export const InviteManagementPage: React.FC = () => {
  const { user } = useAuth();

  // 권한 체크
  const hasPermission = user?.role === 'admin' || user?.role === 'teacher';

  if (!hasPermission) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <div className="text-gray-500">
          초대 관리 권한이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <FeatureGuard feature="inviteManagement">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">초대 관리</h1>
          <p className="mt-2 text-gray-600">
            새로운 사용자를 초대하고 초대 현황을 관리하세요
          </p>
        </div>

        <InviteManagementContainer
          organizationId={user?.organizationId || 'default-org'}
          showCreateForm={true}
          showBulkActions={true}
          defaultFilter={{
            status: undefined,
            role: undefined
          }}
        />
      </div>
    </FeatureGuard>
  );
};