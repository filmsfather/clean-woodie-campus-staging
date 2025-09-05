import React from 'react';
import { InviteDto, InviteListFilter, InviteUIState } from '../../types/auth';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { InviteFeatureGuard } from './FeatureGuard';

interface InviteListProps {
  invites: InviteDto[];
  state: InviteUIState;
  filter: InviteListFilter;
  onFilterChange: (filter: InviteListFilter) => void;
  onDeleteInvite?: (inviteId: string) => void;
  onResendInvite?: (inviteId: string) => void;
  canManageInvites?: boolean;
}

/**
 * InviteList - FindInvitesByCreatorUseCase, FindInvitesByOrganizationUseCase에 대응
 * 
 * Clean Architecture 원칙:
 * - DTO-First: InviteDto 직접 사용으로 Application Layer와 일관성 유지
 * - UI 레이어는 순수하게 표현만 담당, 비즈니스 로직은 UseCase에 위임
 * - Feature Flag로 UI 노출 제어, 권한 검증은 서버 측에서 처리
 */
export const InviteList: React.FC<InviteListProps> = ({
  invites,
  state,
  filter,
  onFilterChange,
  onDeleteInvite,
  onResendInvite,
  canManageInvites = false
}) => {
  // 필터 변경 핸들러들 - 순수 함수로 구현
  const handleSearchChange = (search: string) => {
    onFilterChange({ ...filter, search, page: 1 });
  };

  const handleStatusChange = (status: string) => {
    onFilterChange({ 
      ...filter, 
      status: status as 'pending' | 'used' | 'expired' | undefined,
      page: 1 
    });
  };

  const handleRoleChange = (role: string) => {
    onFilterChange({ 
      ...filter, 
      role: role as 'student' | 'teacher' | 'admin' | undefined,
      page: 1 
    });
  };

  // 초대 상태 표시 헬퍼 함수
  const getInviteStatusBadge = (invite: InviteDto) => {
    if (invite.isUsed) {
      return <Badge variant="default">사용완료</Badge>;
    }
    if (invite.isExpired) {
      return <Badge variant="error">만료</Badge>;
    }
    if (invite.isValid) {
      return <Badge variant="outline">대기중</Badge>;
    }
    return <Badge variant="secondary">무효</Badge>;
  };

  // Loading 상태 - DDD 원칙: UI 상태는 명확하게 분리
  if (state.isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="p-4 space-y-3">
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-48"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-40"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Error 상태 - 사용자 친화적 에러 표시
  if (state.error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <div className="p-6 text-center">
          <div className="text-red-600 text-sm mb-4">
            초대 목록을 불러오는 중 오류가 발생했습니다
          </div>
          <p className="text-red-500 text-xs">{state.error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 필터링 UI - Feature Flag로 각 기능 제어 */}
      <Card>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 검색 필터 */}
            <Input
              type="text"
              placeholder="이메일로 검색..."
              value={filter.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
            />

            {/* 상태 필터 */}
            <Select
              value={filter.status || ''}
              onValueChange={handleStatusChange}
            >
              <option value="">모든 상태</option>
              <option value="pending">대기중</option>
              <option value="used">사용완료</option>
              <option value="expired">만료</option>
            </Select>

            {/* 역할 필터 */}
            <Select
              value={filter.role || ''}
              onValueChange={handleRoleChange}
            >
              <option value="">모든 역할</option>
              <option value="student">학생</option>
              <option value="teacher">교사</option>
              <option value="admin">관리자</option>
            </Select>
          </div>

          {/* 결과 통계 */}
          <div className="mt-4 text-sm text-gray-600">
            총 {state.totalCount}개의 초대
          </div>
        </div>
      </Card>

      {/* 초대 목록 */}
      <div className="space-y-3">
        {invites.length === 0 ? (
          <Card className="border-gray-200 bg-gray-50">
            <div className="p-6 text-center text-gray-500">
              조건에 맞는 초대가 없습니다
            </div>
          </Card>
        ) : (
          invites.map((invite) => (
            <Card key={invite.id} className="hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* 초대 기본 정보 */}
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-gray-900">
                        {invite.email}
                      </h3>
                      {getInviteStatusBadge(invite)}
                    </div>

                    {/* 초대 세부 정보 */}
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <span>
                          역할: {invite.role === 'student' ? '학생' : 
                                invite.role === 'teacher' ? '교사' : '관리자'}
                        </span>
                        {invite.classId && (
                          <span>클래스: {invite.classId}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <span>
                          생성일: {new Date(invite.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                        <span>
                          만료일: {new Date(invite.expiresAt).toLocaleDateString('ko-KR')}
                        </span>
                      </div>

                      {invite.usedAt && (
                        <div>
                          사용일: {new Date(invite.usedAt).toLocaleDateString('ko-KR')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 액션 버튼들 - Feature Flag와 권한으로 제어 */}
                  {canManageInvites && (
                    <div className="flex items-center space-x-2">
                      {/* 재발송 버튼 - 대기중 상태일 때만 */}
                      {invite.isValid && !invite.isUsed && onResendInvite && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onResendInvite(invite.id)}
                        >
                          재발송
                        </Button>
                      )}

                      {/* 삭제 버튼 - Feature Flag로 제어 */}
                      <InviteFeatureGuard.Deletion>
                        {onDeleteInvite && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDeleteInvite(invite.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            삭제
                          </Button>
                        )}
                      </InviteFeatureGuard.Deletion>
                    </div>
                  )}
                </div>

                {/* 토큰 정보 (개발 모드에서만 표시) */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500 font-mono">
                      토큰: {invite.token}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 페이지네이션 - 총 개수가 페이지 크기보다 클 때만 표시 */}
      {state.totalCount > filter.limit && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={filter.page === 1}
            onClick={() => onFilterChange({ ...filter, page: filter.page - 1 })}
          >
            이전
          </Button>
          <span className="flex items-center px-3 text-sm text-gray-600">
            {filter.page} / {Math.ceil(state.totalCount / filter.limit)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={filter.page >= Math.ceil(state.totalCount / filter.limit)}
            onClick={() => onFilterChange({ ...filter, page: filter.page + 1 })}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
};

export default InviteList;