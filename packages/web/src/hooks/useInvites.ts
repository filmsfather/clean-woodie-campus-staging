import { useState, useEffect, useCallback } from 'react';
import { inviteApi } from '../services/api';
import { 
  InviteDto, 
  CreateInviteFormState, 
  InviteListFilter, 
  AuthActionResult,
  InviteUIState 
} from '../types/auth';

/**
 * useInvites - 초대 관리를 위한 커스텀 훅
 * 
 * CreateInviteForm, InviteList 컴포넌트와 연결
 * Clean Architecture: UI → Custom Hook → API Service → UseCase
 */

interface UseInvitesOptions {
  organizationId?: string;
  createdBy?: string;
  autoLoad?: boolean;
  defaultFilter?: Partial<InviteListFilter>;
}

interface UseInvitesReturn {
  // 상태
  invites: InviteDto[];
  state: InviteUIState;
  filter: InviteListFilter;
  
  // 액션
  loadInvites: (newFilter?: Partial<InviteListFilter>) => Promise<void>;
  createInvite: (formData: CreateInviteFormState) => Promise<AuthActionResult>;
  deleteInvite: (inviteId: string) => Promise<AuthActionResult>;
  resendInvite: (inviteId: string) => Promise<AuthActionResult>;
  bulkDeleteInvites: (inviteIds: string[]) => Promise<AuthActionResult>;
  deleteExpiredInvites: () => Promise<AuthActionResult>;
  updateFilter: (newFilter: Partial<InviteListFilter>) => void;
  refresh: () => Promise<void>;
  
  // 유틸리티
  getInviteById: (inviteId: string) => InviteDto | undefined;
  getInvitesByStatus: (status: 'pending' | 'used' | 'expired') => InviteDto[];
  getTotalCount: () => number;
  hasMore: boolean;
  
  // 통계
  getStatistics: () => {
    total: number;
    pending: number;
    used: number;
    expired: number;
  };
}

export const useInvites = (options: UseInvitesOptions = {}): UseInvitesReturn => {
  const {
    organizationId,
    createdBy,
    autoLoad = true,
    defaultFilter = {}
  } = options;

  // 상태
  const [invites, setInvites] = useState<InviteDto[]>([]);
  const [state, setState] = useState<InviteUIState>({
    invites: [],
    isLoading: false,
    error: null,
    totalCount: 0
  });
  
  const [filter, setFilter] = useState<InviteListFilter>({
    page: 1,
    limit: 20,
    ...defaultFilter
  });

  // 초대 목록 로드
  const loadInvites = useCallback(async (newFilter?: Partial<InviteListFilter>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const currentFilter = newFilter ? { ...filter, ...newFilter } : filter;
      
      const requestParams = {
        ...currentFilter,
        organizationId,
        createdBy
      };
      
      const response = await inviteApi.getInvites(requestParams);
      
      setInvites(response.invites);
      setState({
        invites: response.invites,
        isLoading: false,
        error: null,
        totalCount: response.total
      });
      
      if (newFilter) {
        setFilter(currentFilter);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '초대 목록을 불러오는데 실패했습니다.';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, [filter, organizationId, createdBy]);

  // 초대 생성
  const createInvite = useCallback(async (formData: CreateInviteFormState): Promise<AuthActionResult> => {
    try {
      if (!organizationId) {
        throw new Error('조직 ID가 필요합니다.');
      }
      
      const requestData = {
        email: formData.email,
        role: formData.role,
        organizationId,
        classId: formData.classId,
        expiryDays: formData.expiryDays,
        context: {
          locale: 'ko-KR'
        }
      };
      
      const response = await inviteApi.createInvite(requestData);
      
      // 새 초대를 목록에 추가
      setInvites(prev => [response.invite, ...prev]);
      setState(prev => ({
        ...prev,
        totalCount: prev.totalCount + 1
      }));
      
      return {
        success: true,
        message: `${formData.email}로 초대를 발송했습니다.`,
        data: response.invite
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '초대 생성에 실패했습니다.';
      return {
        success: false,
        message: errorMessage
      };
    }
  }, [organizationId]);

  // 초대 삭제
  const deleteInvite = useCallback(async (inviteId: string): Promise<AuthActionResult> => {
    try {
      await inviteApi.deleteInvite(inviteId);
      
      // 목록에서 제거
      setInvites(prev => prev.filter(invite => invite.id !== inviteId));
      setState(prev => ({
        ...prev,
        totalCount: prev.totalCount - 1
      }));
      
      return {
        success: true,
        message: '초대가 삭제되었습니다.'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '초대 삭제에 실패했습니다.';
      return {
        success: false,
        message: errorMessage
      };
    }
  }, []);

  // 초대 재발송
  const resendInvite = useCallback(async (inviteId: string): Promise<AuthActionResult> => {
    try {
      const response = await inviteApi.resendInvite({
        inviteId,
        context: {
          locale: 'ko-KR'
        }
      });
      
      if (response.emailSent) {
        return {
          success: true,
          message: '초대가 재발송되었습니다.'
        };
      } else {
        return {
          success: false,
          message: '이메일 발송에 실패했습니다.'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '초대 재발송에 실패했습니다.';
      return {
        success: false,
        message: errorMessage
      };
    }
  }, []);

  // 대량 초대 삭제
  const bulkDeleteInvites = useCallback(async (inviteIds: string[]): Promise<AuthActionResult> => {
    try {
      const response = await inviteApi.deleteBulkInvites(inviteIds);
      
      // 성공한 항목들을 목록에서 제거
      if (response.successful.length > 0) {
        setInvites(prev => prev.filter(invite => !response.successful.includes(invite.id)));
        setState(prev => ({
          ...prev,
          totalCount: prev.totalCount - response.successful.length
        }));
      }
      
      const message = response.failed.length > 0 
        ? `${response.successful.length}개 삭제 완료, ${response.failed.length}개 실패`
        : `${response.successful.length}개 초대가 삭제되었습니다.`;
      
      return {
        success: response.successful.length > 0,
        message,
        data: response
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '대량 삭제에 실패했습니다.';
      return {
        success: false,
        message: errorMessage
      };
    }
  }, []);

  // 만료된 초대 정리
  const deleteExpiredInvites = useCallback(async (): Promise<AuthActionResult> => {
    try {
      const response = await inviteApi.deleteExpiredInvites(organizationId);
      
      if (response.deletedCount > 0) {
        // 목록 새로고침
        await loadInvites();
        
        return {
          success: true,
          message: `${response.deletedCount}개의 만료된 초대가 정리되었습니다.`
        };
      } else {
        return {
          success: true,
          message: '정리할 만료된 초대가 없습니다.'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '만료된 초대 정리에 실패했습니다.';
      return {
        success: false,
        message: errorMessage
      };
    }
  }, [organizationId, loadInvites]);

  // 필터 업데이트
  const updateFilter = useCallback((newFilter: Partial<InviteListFilter>) => {
    const updatedFilter = { ...filter, ...newFilter };
    setFilter(updatedFilter);
    loadInvites({ ...newFilter });
  }, [filter, loadInvites]);

  // 새로고침
  const refresh = useCallback(async () => {
    await loadInvites();
  }, [loadInvites]);

  // 유틸리티 함수들
  const getInviteById = useCallback((inviteId: string) => {
    return invites.find(invite => invite.id === inviteId);
  }, [invites]);

  const getInvitesByStatus = useCallback((status: 'pending' | 'used' | 'expired') => {
    return invites.filter(invite => {
      switch (status) {
        case 'pending':
          return invite.isValid && !invite.isUsed && !invite.isExpired;
        case 'used':
          return invite.isUsed;
        case 'expired':
          return invite.isExpired;
        default:
          return false;
      }
    });
  }, [invites]);

  const getTotalCount = useCallback(() => state.totalCount, [state.totalCount]);

  const hasMore = state.totalCount > filter.page * filter.limit;

  // 통계 계산
  const getStatistics = useCallback(() => {
    const total = invites.length;
    const pending = getInvitesByStatus('pending').length;
    const used = getInvitesByStatus('used').length;
    const expired = getInvitesByStatus('expired').length;
    
    return { total, pending, used, expired };
  }, [invites, getInvitesByStatus]);

  // 자동 로드
  useEffect(() => {
    if (autoLoad) {
      loadInvites();
    }
  }, [autoLoad]); // loadInvites는 의도적으로 제외

  return {
    // 상태
    invites,
    state,
    filter,
    
    // 액션
    loadInvites,
    createInvite,
    deleteInvite,
    resendInvite,
    bulkDeleteInvites,
    deleteExpiredInvites,
    updateFilter,
    refresh,
    
    // 유틸리티
    getInviteById,
    getInvitesByStatus,
    getTotalCount,
    hasMore,
    
    // 통계
    getStatistics
  };
};