import React, { useState, useEffect } from 'react';
import { useInvites } from '../../hooks';
import { CreateInviteForm } from '../../components/auth/CreateInviteForm';
import { InviteList } from '../../components/auth/InviteList';
import { useAuth } from '../../contexts/AuthContext';
import type { CreateInviteFormState, InviteListFilter } from '../../types/auth';

/**
 * InviteManagementContainer - 초대 관리 통합 컨테이너
 * 
 * Clean Architecture:
 * - Presentation Layer: UI Components (CreateInviteForm, InviteList)
 * - Application Layer: Custom Hook (useInvites)
 * - Domain/Infrastructure: API Services → UseCases
 * 
 * 역할:
 * - CreateInviteForm과 InviteList 컴포넌트를 연결
 * - 비즈니스 로직은 useInvites 훅에서 처리
 * - UI 상태 관리 및 사용자 피드백
 */

interface InviteManagementContainerProps {
  organizationId: string;
  className?: string;
  showCreateForm?: boolean;
  showBulkActions?: boolean;
  defaultFilter?: Partial<InviteListFilter>;
}

export const InviteManagementContainer: React.FC<InviteManagementContainerProps> = ({
  organizationId,
  className = '',
  showCreateForm = true,
  showBulkActions = true,
  defaultFilter = {}
}) => {
  const { user } = useAuth();
  const [selectedInvites, setSelectedInvites] = useState<string[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);

  // useInvites 훅 사용
  const {
    invites,
    state,
    filter,
    createInvite,
    deleteInvite,
    resendInvite,
    bulkDeleteInvites,
    deleteExpiredInvites,
    updateFilter,
    refresh,
    getStatistics
  } = useInvites({
    organizationId,
    createdBy: user?.id,
    autoLoad: true,
    defaultFilter
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

  // 초대 생성 핸들러
  const handleCreateInvite = async (formData: CreateInviteFormState) => {
    const result = await createInvite(formData);
    
    if (result.success) {
      setShowSuccessMessage(result.message);
    }
    
    return result;
  };

  // 초대 삭제 핸들러
  const handleDeleteInvite = async (inviteId: string) => {
    const result = await deleteInvite(inviteId);
    
    if (result.success) {
      setShowSuccessMessage(result.message);
      // 선택된 목록에서도 제거
      setSelectedInvites(prev => prev.filter(id => id !== inviteId));
    }
    
    return result;
  };

  // 초대 재발송 핸들러
  const handleResendInvite = async (inviteId: string) => {
    const result = await resendInvite(inviteId);
    
    if (result.success) {
      setShowSuccessMessage(result.message);
    }
    
    return result;
  };

  // 대량 삭제 핸들러
  const handleBulkDelete = async () => {
    if (selectedInvites.length === 0) return;
    
    const result = await bulkDeleteInvites(selectedInvites);
    
    if (result.success) {
      setShowSuccessMessage(result.message);
      setSelectedInvites([]);
    }
  };

  // 만료된 초대 정리 핸들러
  const handleDeleteExpired = async () => {
    const result = await deleteExpiredInvites();
    
    if (result.success) {
      setShowSuccessMessage(result.message);
      setSelectedInvites([]);
    }
  };

  // 초대 선택 핸들러
  const handleInviteSelect = (inviteId: string, selected: boolean) => {
    if (selected) {
      setSelectedInvites(prev => [...prev, inviteId]);
    } else {
      setSelectedInvites(prev => prev.filter(id => id !== inviteId));
    }
  };

  // 전체 선택/해제
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedInvites(invites.map(invite => invite.id));
    } else {
      setSelectedInvites([]);
    }
  };

  // 필터 변경 핸들러
  const handleFilterChange = (newFilter: InviteListFilter) => {
    updateFilter(newFilter);
    setSelectedInvites([]); // 필터 변경시 선택 초기화
  };

  // 통계 데이터
  const statistics = getStatistics();

  // 권한 체크 - 실제로는 더 정교한 권한 체크 필요
  const canManageInvites = user?.role === 'admin' || user?.role === 'teacher';

  if (!canManageInvites) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="text-gray-500">
          초대 관리 권한이 없습니다.
        </div>
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

      {/* 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">{statistics.total}</div>
          <div className="text-sm text-gray-600">전체 초대</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-orange-600">{statistics.pending}</div>
          <div className="text-sm text-gray-600">대기중</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{statistics.used}</div>
          <div className="text-sm text-gray-600">사용완료</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-red-600">{statistics.expired}</div>
          <div className="text-sm text-gray-600">만료</div>
        </div>
      </div>

      {/* 초대 생성 폼 */}
      {showCreateForm && (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">새 초대 만들기</h2>
          </div>
          <div className="p-4">
            <CreateInviteForm
              onSubmit={handleCreateInvite}
              isLoading={state.isLoading}
              error={state.error}
              organizationId={organizationId}
              createdBy={user?.id || ''}
              availableClasses={[]} // 실제로는 클래스 목록을 가져와야 함
            />
          </div>
        </div>
      )}

      {/* 대량 작업 버튼들 */}
      {showBulkActions && selectedInvites.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-800">
              {selectedInvites.length}개 초대가 선택됨
            </div>
            <div className="space-x-2">
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                선택된 항목 삭제
              </button>
              <button
                onClick={() => setSelectedInvites([])}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                선택 해제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 유틸리티 버튼들 */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={refresh}
            disabled={state.isLoading}
            className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
          >
            {state.isLoading ? '새로고침 중...' : '새로고침'}
          </button>
          
          {statistics.expired > 0 && (
            <button
              onClick={handleDeleteExpired}
              className="px-4 py-2 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              만료된 초대 정리 ({statistics.expired}개)
            </button>
          )}
        </div>
      </div>

      {/* 초대 목록 */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">초대 목록</h2>
            {invites.length > 0 && (
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedInvites.length === invites.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-600">전체 선택</span>
              </label>
            )}
          </div>
        </div>
        
        <InviteList
          invites={invites}
          state={state}
          filter={filter}
          onFilterChange={handleFilterChange}
          onDeleteInvite={handleDeleteInvite}
          onResendInvite={handleResendInvite}
          canManageInvites={canManageInvites}
        />
      </div>
    </div>
  );
};

export default InviteManagementContainer;