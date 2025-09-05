import React, { useState, useEffect } from 'react';
import { useUserDirectory, useRoleStats } from '../../hooks';
import { UserDirectory } from '../../components/auth/UserDirectory';
import { RoleStatisticsDashboard } from '../../components/auth/RoleStatisticsDashboard';
import { useAuth } from '../../contexts/AuthContext';
import type { UserListFilter } from '../../types/auth';

/**
 * UserManagementContainer - 사용자 관리 통합 컨테이너
 * 
 * Clean Architecture:
 * - Presentation Layer: UI Components (UserDirectory, RoleStatisticsDashboard)
 * - Application Layer: Custom Hooks (useUserDirectory, useRoleStats)
 * - Domain/Infrastructure: API Services → UseCases
 * 
 * 역할:
 * - UserDirectory와 RoleStatisticsDashboard 컴포넌트를 연결
 * - 사용자 검색, 필터링, 대량 작업 관리
 * - 역할 통계 및 분석 데이터 표시
 */

interface UserManagementContainerProps {
  organizationId?: string;
  className?: string;
  showStatistics?: boolean;
  showBulkActions?: boolean;
  defaultFilter?: Partial<UserListFilter>;
}

export const UserManagementContainer: React.FC<UserManagementContainerProps> = ({
  organizationId,
  className = '',
  showStatistics = true,
  showBulkActions = true,
  defaultFilter = {}
}) => {
  const { user: currentUser } = useAuth();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // useUserDirectory 훅 사용
  const {
    users,
    state: userState,
    filter,
    loadUsers,
    searchUsers,
    changeUserRole,
    bulkUserAction,
    updateFilter,
    loadMore,
    refresh: refreshUsers,
    filterByRole,
    filterByGrade,
    filterBySchool,
    clearFilters,
    getRoleStatistics: getUserRoleStats
  } = useUserDirectory({
    autoLoad: true,
    defaultFilter
  });

  // useRoleStats 훅 사용 (통계 표시용)
  const {
    basicStats,
    detailedStats,
    state: statsState,
    loadBasicStats,
    loadDetailedStats,
    refresh: refreshStats
  } = useRoleStats({
    organizationId,
    autoLoad: showStatistics,
    refreshInterval: 300000 // 5분마다 자동 새로고침
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

  // 사용자 선택 핸들러
  const handleUserSelect = (user: any) => {
    console.log('사용자 선택:', user);
    // 프로필 상세 보기 또는 다른 액션
  };

  // 역할 변경 핸들러
  const handleRoleChange = async (userId: string, newRole: 'student' | 'teacher' | 'admin') => {
    const reason = prompt('역할 변경 사유를 입력해주세요:');
    if (!reason) return;

    const result = await changeUserRole(userId, newRole, reason);
    
    if (result.success) {
      setShowSuccessMessage(result.message);
      // 통계 새로고침
      if (showStatistics) {
        refreshStats();
      }
    }
  };

  // 사용자 체크박스 선택/해제
  const handleUserCheck = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  // 전체 선택/해제
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  // 대량 역할 변경
  const handleBulkRoleChange = async (newRole: 'student' | 'teacher' | 'admin') => {
    if (selectedUsers.length === 0) return;

    const reason = prompt(`선택된 ${selectedUsers.length}명의 역할을 ${newRole === 'student' ? '학생' : newRole === 'teacher' ? '교사' : '관리자'}로 변경하는 이유를 입력해주세요:`);
    if (!reason) return;

    setBulkActionLoading(true);
    
    const result = await bulkUserAction(selectedUsers, 'change_role', { newRole, reason });
    
    setBulkActionLoading(false);
    
    if (result.success) {
      setShowSuccessMessage(result.message);
      setSelectedUsers([]);
      if (showStatistics) {
        refreshStats();
      }
    }
  };

  // 대량 비활성화
  const handleBulkDeactivate = async () => {
    if (selectedUsers.length === 0) return;

    const reason = prompt(`선택된 ${selectedUsers.length}명을 비활성화하는 이유를 입력해주세요:`);
    if (!reason) return;

    setBulkActionLoading(true);
    
    const result = await bulkUserAction(selectedUsers, 'deactivate', { reason });
    
    setBulkActionLoading(false);
    
    if (result.success) {
      setShowSuccessMessage(result.message);
      setSelectedUsers([]);
    }
  };

  // 대량 삭제
  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;

    const confirmed = window.confirm(`정말로 선택된 ${selectedUsers.length}명의 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`);
    if (!confirmed) return;

    const reason = prompt('삭제 사유를 입력해주세요:');
    if (!reason) return;

    setBulkActionLoading(true);
    
    const result = await bulkUserAction(selectedUsers, 'delete', { reason });
    
    setBulkActionLoading(false);
    
    if (result.success) {
      setShowSuccessMessage(result.message);
      setSelectedUsers([]);
      if (showStatistics) {
        refreshStats();
      }
    }
  };

  // 필터 변경 핸들러
  const handleFilterChange = (newFilter: UserListFilter) => {
    updateFilter(newFilter);
    setSelectedUsers([]); // 필터 변경시 선택 초기화
  };

  // 검색 핸들러
  const handleSearch = async (query: string) => {
    if (query.trim()) {
      const results = await searchUsers(query, {
        role: filter.role,
        schoolId: filter.schoolId
      });
      console.log('검색 결과:', results);
    }
  };

  // 전체 새로고침
  const handleRefreshAll = async () => {
    await Promise.all([
      refreshUsers(),
      showStatistics ? refreshStats() : Promise.resolve()
    ]);
    setShowSuccessMessage('데이터가 새로고침되었습니다.');
  };

  // 권한 체크
  const canManageUsers = currentUser?.role === 'admin' || currentUser?.role === 'teacher';
  const canManageRoles = currentUser?.role === 'admin';

  if (!canManageUsers) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="text-gray-500">
          사용자 관리 권한이 없습니다.
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

      {/* 통계 대시보드 */}
      {showStatistics && (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">사용자 통계</h2>
          </div>
          <div className="p-4">
            <RoleStatisticsDashboard
              statistics={basicStats}
              isLoading={statsState.isLoading}
              error={statsState.error}
            />
          </div>
        </div>
      )}

      {/* 필터 및 액션 바 */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">사용자 관리</h2>
            <div className="flex space-x-2">
              <button
                onClick={handleRefreshAll}
                disabled={userState.isLoading || statsState.isLoading}
                className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
              >
                새로고침
              </button>
            </div>
          </div>
        </div>

        {/* 빠른 필터 버튼 */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => clearFilters()}
              className={`px-3 py-1 text-sm rounded ${
                !filter.role && !filter.gradeLevel ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-50'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => filterByRole('student')}
              className={`px-3 py-1 text-sm rounded ${
                filter.role === 'student' ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-50'
              }`}
            >
              학생
            </button>
            <button
              onClick={() => filterByRole('teacher')}
              className={`px-3 py-1 text-sm rounded ${
                filter.role === 'teacher' ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-50'
              }`}
            >
              교사
            </button>
            <button
              onClick={() => filterByRole('admin')}
              className={`px-3 py-1 text-sm rounded ${
                filter.role === 'admin' ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-50'
              }`}
            >
              관리자
            </button>
          </div>

          {/* 학년 필터 (학생 선택시에만 표시) */}
          {filter.role === 'student' && (
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6].map(grade => (
                <button
                  key={grade}
                  onClick={() => filterByGrade(grade)}
                  className={`px-3 py-1 text-sm rounded ${
                    filter.gradeLevel === grade ? 'bg-green-600 text-white' : 'bg-white border hover:bg-gray-50'
                  }`}
                >
                  {grade}학년
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 대량 작업 바 */}
        {showBulkActions && selectedUsers.length > 0 && (
          <div className="p-4 border-b bg-blue-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-800">
                {selectedUsers.length}명의 사용자가 선택됨
              </div>
              <div className="flex space-x-2">
                {canManageRoles && (
                  <>
                    <select
                      onChange={(e) => {
                        const newRole = e.target.value as 'student' | 'teacher' | 'admin';
                        if (newRole) {
                          handleBulkRoleChange(newRole);
                          e.target.value = '';
                        }
                      }}
                      disabled={bulkActionLoading}
                      className="px-3 py-1 text-sm border rounded"
                    >
                      <option value="">역할 변경</option>
                      <option value="student">→ 학생</option>
                      <option value="teacher">→ 교사</option>
                      <option value="admin">→ 관리자</option>
                    </select>
                  </>
                )}
                <button
                  onClick={handleBulkDeactivate}
                  disabled={bulkActionLoading}
                  className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                >
                  비활성화
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkActionLoading}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  삭제
                </button>
                <button
                  onClick={() => setSelectedUsers([])}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  선택 해제
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 전체 선택 체크박스 */}
        {users.length > 0 && (
          <div className="p-4 border-b">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedUsers.length === users.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-600">
                전체 선택 ({users.length}명)
              </span>
            </label>
          </div>
        )}

        {/* 사용자 디렉토리 */}
        <div className="relative">
          {bulkActionLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">작업 중...</span>
              </div>
            </div>
          )}
          
          <UserDirectory
            users={users}
            totalCount={userState.totalCount}
            isLoading={userState.isLoading}
            error={userState.error}
            filter={filter}
            onFilterChange={handleFilterChange}
            onUserSelect={handleUserSelect}
            onRoleChange={canManageRoles ? handleRoleChange : undefined}
            canManageRoles={canManageRoles}
          />
        </div>

        {/* 더 보기 버튼 */}
        {userState.hasMore && (
          <div className="p-4 text-center border-t">
            <button
              onClick={loadMore}
              disabled={userState.isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {userState.isLoading ? '로딩 중...' : '더 보기'}
            </button>
          </div>
        )}
      </div>

      {/* 개별 사용자 선택 체크박스 (숨겨진 기능) */}
      <style jsx>{`
        .user-checkbox {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
        }
      `}</style>
    </div>
  );
};

export default UserManagementContainer;