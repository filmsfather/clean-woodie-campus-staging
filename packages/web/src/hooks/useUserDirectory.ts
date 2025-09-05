import { useState, useEffect, useCallback } from 'react';
import { profileApi } from '../services/api';
import { 
  ProfileDto, 
  UserListFilter, 
  AuthActionResult
} from '../types/auth';

/**
 * useUserDirectory - 사용자 디렉토리 관리를 위한 커스텀 훅
 * 
 * UserDirectory 컴포넌트와 연결
 * FindProfilesByRoleUseCase, FindProfilesBySchoolUseCase, FindStudentsByGradeUseCase 등과 연동
 */

interface UseUserDirectoryOptions {
  autoLoad?: boolean;
  defaultFilter?: Partial<UserListFilter>;
}

interface UseUserDirectoryState {
  users: ProfileDto[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
}

interface UseUserDirectoryReturn {
  // 상태
  users: ProfileDto[];
  state: UseUserDirectoryState;
  filter: UserListFilter;
  
  // 액션
  loadUsers: (newFilter?: Partial<UserListFilter>) => Promise<void>;
  searchUsers: (query: string, filters?: { role?: 'student' | 'teacher' | 'admin'; schoolId?: string }) => Promise<ProfileDto[]>;
  changeUserRole: (userId: string, newRole: 'student' | 'teacher' | 'admin', reason?: string) => Promise<AuthActionResult>;
  bulkUserAction: (userIds: string[], action: 'activate' | 'deactivate' | 'delete' | 'change_role', params?: { newRole?: 'student' | 'teacher' | 'admin'; reason?: string }) => Promise<AuthActionResult>;
  updateFilter: (newFilter: Partial<UserListFilter>) => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  
  // 필터링 헬퍼
  filterByRole: (role: 'student' | 'teacher' | 'admin') => void;
  filterByGrade: (gradeLevel: number) => void;
  filterBySchool: (schoolId: string) => void;
  clearFilters: () => void;
  
  // 유틸리티
  getUserById: (userId: string) => ProfileDto | undefined;
  getUsersByRole: (role: 'student' | 'teacher' | 'admin') => ProfileDto[];
  getStudentsByGrade: (gradeLevel: number) => ProfileDto[];
  getTotalCount: () => number;
  
  // 통계
  getRoleStatistics: () => {
    students: number;
    teachers: number;
    admins: number;
    total: number;
  };
}

export const useUserDirectory = (options: UseUserDirectoryOptions = {}): UseUserDirectoryReturn => {
  const {
    autoLoad = true,
    defaultFilter = {}
  } = options;

  // 상태
  const [users, setUsers] = useState<ProfileDto[]>([]);
  const [state, setState] = useState<UseUserDirectoryState>({
    users: [],
    totalCount: 0,
    isLoading: false,
    error: null,
    hasMore: false
  });
  
  const [filter, setFilter] = useState<UserListFilter>({
    page: 1,
    limit: 20,
    ...defaultFilter
  });

  // 사용자 목록 로드
  const loadUsers = useCallback(async (newFilter?: Partial<UserListFilter>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const currentFilter = newFilter ? { ...filter, ...newFilter } : filter;
      const response = await profileApi.getProfiles(currentFilter);
      
      // 페이지네이션 처리
      const isFirstPage = currentFilter.page === 1;
      const updatedUsers = isFirstPage 
        ? response.profiles 
        : [...users, ...response.profiles];
      
      setUsers(updatedUsers);
      setState({
        users: updatedUsers,
        totalCount: response.total,
        isLoading: false,
        error: null,
        hasMore: response.hasMore
      });
      
      if (newFilter) {
        setFilter(currentFilter);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '사용자 목록을 불러오는데 실패했습니다.';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, [filter, users]);

  // 사용자 검색
  const searchUsers = useCallback(async (
    query: string, 
    searchFilters?: { role?: 'student' | 'teacher' | 'admin'; schoolId?: string }
  ): Promise<ProfileDto[]> => {
    try {
      const results = await profileApi.searchUsers(query, {
        ...searchFilters,
        limit: 50 // 검색 결과 제한
      });
      return results;
    } catch (error) {
      console.error('사용자 검색 실패:', error);
      return [];
    }
  }, []);

  // 사용자 역할 변경
  const changeUserRole = useCallback(async (
    userId: string, 
    newRole: 'student' | 'teacher' | 'admin', 
    reason?: string
  ): Promise<AuthActionResult> => {
    try {
      const response = await profileApi.changeUserRole({
        userId: 'current', // 실제로는 현재 사용자 ID
        targetUserId: userId,
        newRole,
        reason
      });
      
      // 사용자 목록에서 해당 사용자의 역할 업데이트
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, role: newRole }
          : user
      ));
      
      return {
        success: true,
        message: `사용자의 역할이 ${newRole === 'student' ? '학생' : newRole === 'teacher' ? '교사' : '관리자'}로 변경되었습니다.`,
        data: response
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '역할 변경에 실패했습니다.';
      return {
        success: false,
        message: errorMessage
      };
    }
  }, []);

  // 대량 사용자 작업
  const bulkUserAction = useCallback(async (
    userIds: string[], 
    action: 'activate' | 'deactivate' | 'delete' | 'change_role',
    params?: { newRole?: 'student' | 'teacher' | 'admin'; reason?: string }
  ): Promise<AuthActionResult> => {
    try {
      const response = await profileApi.bulkUserAction({
        userIds,
        action,
        params
      });
      
      // 성공한 작업에 따라 로컬 상태 업데이트
      if (action === 'delete') {
        // 삭제된 사용자들을 목록에서 제거
        const deletedUserIds = response.successful.map(item => item.userId);
        setUsers(prev => prev.filter(user => !deletedUserIds.includes(user.id)));
        setState(prev => ({
          ...prev,
          totalCount: prev.totalCount - deletedUserIds.length
        }));
      } else if (action === 'change_role' && params?.newRole) {
        // 역할이 변경된 사용자들 업데이트
        const changedUserIds = response.successful.map(item => item.userId);
        setUsers(prev => prev.map(user => 
          changedUserIds.includes(user.id)
            ? { ...user, role: params.newRole! }
            : user
        ));
      }
      
      const message = response.failed.length > 0 
        ? `${response.successful.length}명 처리 완료, ${response.failed.length}명 실패`
        : `${response.successful.length}명의 작업이 완료되었습니다.`;
      
      return {
        success: response.successful.length > 0,
        message,
        data: response
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '대량 작업에 실패했습니다.';
      return {
        success: false,
        message: errorMessage
      };
    }
  }, []);

  // 필터 업데이트
  const updateFilter = useCallback((newFilter: Partial<UserListFilter>) => {
    const updatedFilter = { ...filter, ...newFilter, page: 1 }; // 새 필터시 첫 페이지로
    setFilter(updatedFilter);
    loadUsers(updatedFilter);
  }, [filter, loadUsers]);

  // 더 많은 사용자 로드 (무한 스크롤)
  const loadMore = useCallback(async () => {
    if (!state.hasMore || state.isLoading) return;
    
    const nextPageFilter = { ...filter, page: filter.page + 1 };
    await loadUsers(nextPageFilter);
    setFilter(nextPageFilter);
  }, [state.hasMore, state.isLoading, filter, loadUsers]);

  // 새로고침
  const refresh = useCallback(async () => {
    await loadUsers({ ...filter, page: 1 });
  }, [loadUsers, filter]);

  // 필터링 헬퍼 함수들
  const filterByRole = useCallback((role: 'student' | 'teacher' | 'admin') => {
    updateFilter({ role });
  }, [updateFilter]);

  const filterByGrade = useCallback((gradeLevel: number) => {
    updateFilter({ gradeLevel, role: 'student' }); // 학년 필터는 학생에만 적용
  }, [updateFilter]);

  const filterBySchool = useCallback((schoolId: string) => {
    updateFilter({ schoolId });
  }, [updateFilter]);

  const clearFilters = useCallback(() => {
    updateFilter({
      role: undefined,
      schoolId: undefined,
      gradeLevel: undefined,
      search: undefined
    });
  }, [updateFilter]);

  // 유틸리티 함수들
  const getUserById = useCallback((userId: string) => {
    return users.find(user => user.id === userId);
  }, [users]);

  const getUsersByRole = useCallback((role: 'student' | 'teacher' | 'admin') => {
    return users.filter(user => user.role === role);
  }, [users]);

  const getStudentsByGrade = useCallback((gradeLevel: number) => {
    return users.filter(user => user.role === 'student' && user.gradeLevel === gradeLevel);
  }, [users]);

  const getTotalCount = useCallback(() => state.totalCount, [state.totalCount]);

  // 통계 계산
  const getRoleStatistics = useCallback(() => {
    const students = getUsersByRole('student').length;
    const teachers = getUsersByRole('teacher').length;
    const admins = getUsersByRole('admin').length;
    const total = users.length;
    
    return { students, teachers, admins, total };
  }, [users, getUsersByRole]);

  // 자동 로드
  useEffect(() => {
    if (autoLoad) {
      loadUsers();
    }
  }, [autoLoad]); // loadUsers는 의도적으로 제외

  return {
    // 상태
    users,
    state,
    filter,
    
    // 액션
    loadUsers,
    searchUsers,
    changeUserRole,
    bulkUserAction,
    updateFilter,
    loadMore,
    refresh,
    
    // 필터링 헬퍼
    filterByRole,
    filterByGrade,
    filterBySchool,
    clearFilters,
    
    // 유틸리티
    getUserById,
    getUsersByRole,
    getStudentsByGrade,
    getTotalCount,
    
    // 통계
    getRoleStatistics
  };
};