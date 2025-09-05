import React, { useState, useCallback } from 'react';
import { ProfileDto, UserListFilter } from '../../types/auth';
// import { InviteUIState } from '../../types/auth'; // Unused import
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { UserFeatureGuard, ProfileFeatureGuard, RoleFeatureGuard } from './FeatureGuard';

interface UserDirectoryProps {
  users: ProfileDto[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  filter: UserListFilter;
  onFilterChange: (filter: UserListFilter) => void;
  onUserSelect?: (user: ProfileDto) => void;
  onRoleChange?: (userId: string, newRole: 'student' | 'teacher' | 'admin') => void;
  canManageRoles?: boolean;
  // 대시보드 통합을 위한 새 props
  compact?: boolean;
  showFilters?: boolean;
  showActions?: ('profile' | 'performance' | 'role')[]; 
  limit?: number;
  embedded?: boolean;
}

/**
 * UserDirectory - FindProfilesByRoleUseCase, FindProfilesBySchoolUseCase, FindStudentsByGradeUseCase에 대응
 * 
 * 여러 Query UseCase를 통합한 사용자 디렉토리 컴포넌트
 * Feature Flag로 각 기능의 노출을 제어합니다.
 */
export const UserDirectory: React.FC<UserDirectoryProps> = ({
  users,
  totalCount,
  isLoading,
  error,
  filter,
  onFilterChange,
  onUserSelect,
  onRoleChange,
  canManageRoles = false,
  compact = false,
  showFilters = true,
  showActions = ['profile'],
  limit,
  embedded = false
}) => {
  const [searchTerm, setSearchTerm] = useState(filter.search || '');

  // 검색 디바운싱
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    // 실제 구현에서는 디바운싱 로직 추가
    onFilterChange({ ...filter, search: value, page: 1 });
  }, [filter, onFilterChange]);

  // 필터 변경 핸들러들
  const handleRoleFilterChange = (role: string) => {
    onFilterChange({ 
      ...filter, 
      role: role as 'student' | 'teacher' | 'admin' | undefined,
      page: 1 
    });
  };

  const handleGradeFilterChange = (gradeLevel: string) => {
    onFilterChange({ 
      ...filter, 
      gradeLevel: gradeLevel ? parseInt(gradeLevel) : undefined,
      page: 1 
    });
  };

  const handlePageChange = (page: number) => {
    onFilterChange({ ...filter, page });
  };

  // Loading 상태
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="p-4 flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-48"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Error 상태
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <div className="p-6 text-center">
          <div className="text-red-600 text-sm mb-4">
            사용자 목록을 불러오는 중 오류가 발생했습니다
          </div>
          <p className="text-red-500 text-xs">{error}</p>
        </div>
      </Card>
    );
  }

  // 표시할 사용자 수 제한
  const displayUsers = limit ? users.slice(0, limit) : users;
  
  // 컴팩트 모드일 때 간소화된 UI 반환
  if (compact) {
    return (
      <div className="space-y-3">
        {displayUsers.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            {isLoading ? '로딩 중...' : '사용자가 없습니다'}
          </div>
        ) : (
          displayUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors">
              <div className="flex items-center space-x-3">
                <Avatar
                  src={user.avatarUrl}
                  alt={user.displayName}
                  size="sm"
                  initials={user.initials}
                  hasAvatar={user.hasAvatar}
                />
                <div>
                  <div className="font-medium text-sm">{user.displayName}</div>
                  <div className="text-xs text-text-secondary">{user.email}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant={user.role === 'admin' ? 'error' : 'default'} size="sm">
                  {user.role === 'student' && '학생'}
                  {user.role === 'teacher' && '교사'}
                  {user.role === 'admin' && '관리자'}
                </Badge>
                
                {showActions.includes('profile') && (
                  <Button variant="ghost" size="sm" onClick={() => onUserSelect?.(user)}>
                    상세
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
        
        {limit && users.length > limit && (
          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={() => onUserSelect?.(users[0])}>
              +{users.length - limit}개 더 보기
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 필터링 UI */}
      {showFilters && (
      <Card>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 검색 - UserFeatureGuard.Search로 제어 */}
            <UserFeatureGuard.Search>
              <Input
                type="text"
                placeholder="사용자 검색..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </UserFeatureGuard.Search>

            {/* 역할 필터 - ProfileFeatureGuard.ByRole로 제어 */}
            <ProfileFeatureGuard.ByRole>
              <Select
                value={filter.role || ''}
                onValueChange={handleRoleFilterChange}
              >
                <option value="">모든 역할</option>
                <option value="student">학생</option>
                <option value="teacher">교사</option>
                <option value="admin">관리자</option>
              </Select>
            </ProfileFeatureGuard.ByRole>

            {/* 학년 필터 - ProfileFeatureGuard.StudentsByGrade로 제어 */}
            <ProfileFeatureGuard.StudentsByGrade>
              <Select
                value={filter.gradeLevel?.toString() || ''}
                onValueChange={handleGradeFilterChange}
              >
                <option value="">모든 학년</option>
                {[1, 2, 3, 4, 5, 6].map(grade => (
                  <option key={grade} value={grade.toString()}>
                    {grade}학년
                  </option>
                ))}
              </Select>
            </ProfileFeatureGuard.StudentsByGrade>

            {/* 학교 필터 - ProfileFeatureGuard.BySchool로 제어 */}
            <ProfileFeatureGuard.BySchool>
              <Select
                value={filter.schoolId || ''}
                onValueChange={(schoolId) => 
                  onFilterChange({ ...filter, schoolId: schoolId || undefined, page: 1 })
                }
              >
                <option value="">모든 학교</option>
                {/* 실제 구현시 학교 목록 API 호출 */}
              </Select>
            </ProfileFeatureGuard.BySchool>
          </div>

          {/* 결과 통계 */}
          <div className="mt-4 text-sm text-gray-600">
            총 {totalCount}명의 사용자
          </div>
        </div>
      </Card>
      )}

      {/* 사용자 목록 */}
      <div className="space-y-3">
        {displayUsers.length === 0 ? (
          <Card className="border-gray-200 bg-gray-50">
            <div className="p-6 text-center text-gray-500">
              검색 조건에 맞는 사용자가 없습니다
            </div>
          </Card>
        ) : (
          displayUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar
                      src={user.avatarUrl}
                      alt={user.displayName}
                      size="md"
                      initials={user.initials}
                      hasAvatar={user.hasAvatar}
                    />
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {user.displayName}
                      </h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={user.role === 'admin' ? 'error' : 'default'}>
                          {user.role === 'student' && '학생'}
                          {user.role === 'teacher' && '교사'}
                          {user.role === 'admin' && '관리자'}
                        </Badge>
                        {user.gradeLevel && (
                          <Badge variant="outline">
                            {user.gradeLevel}학년
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* 상세보기 버튼 - UserFeatureGuard.Details로 제어 */}
                    <UserFeatureGuard.Details>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUserSelect?.(user)}
                      >
                        상세보기
                      </Button>
                    </UserFeatureGuard.Details>

                    {/* 역할 변경 버튼 - RoleFeatureGuard.Change로 제어 */}
                    {canManageRoles && onRoleChange && (
                      <RoleFeatureGuard.Change>
                        <Select
                          value={user.role}
                          onValueChange={(newRole) => 
                            onRoleChange(user.id, newRole as 'student' | 'teacher' | 'admin')
                          }
                        >
                          <option value="student">학생</option>
                          <option value="teacher">교사</option>
                          <option value="admin">관리자</option>
                        </Select>
                      </RoleFeatureGuard.Change>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      {totalCount > filter.limit && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={filter.page === 1}
            onClick={() => handlePageChange(filter.page - 1)}
          >
            이전
          </Button>
          <span className="flex items-center px-3 text-sm text-gray-600">
            {filter.page} / {Math.ceil(totalCount / filter.limit)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={filter.page >= Math.ceil(totalCount / filter.limit)}
            onClick={() => handlePageChange(filter.page + 1)}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserDirectory;