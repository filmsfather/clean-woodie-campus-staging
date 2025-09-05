import { useState, useEffect, useCallback } from 'react';
import { problemSetApi } from '../services/api';
import type { 
  ProblemSet, 
  DetailedProblemSet,
  ProblemSetItem,
  ProblemSetPermissions,
  GetProblemSetListResponse,
  GetProblemSetResponse,
  GetProblemSetListRequest,
  CreateProblemSetRequest,
  UpdateProblemSetRequest,
  AddProblemToProblemSetRequest,
  RemoveProblemFromProblemSetRequest,
  ReorderProblemSetItemsRequest,
  CloneProblemSetRequest
} from '../services/api';

// Hook Options
export interface UseProblemSetsOptions {
  autoLoad?: boolean;
  initialFilter?: GetProblemSetListRequest;
  refreshInterval?: number;
}

// Hook State
export interface UseProblemSetsState {
  loading: boolean;
  error: string | null;
  problemSets: ProblemSet[];
  totalCount: number;
  currentPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Hook Return Type
export interface UseProblemSetsReturn {
  // State
  state: UseProblemSetsState;
  problemSets: ProblemSet[];
  
  // Actions - CRUD
  loadProblemSets: (filter?: GetProblemSetListRequest) => Promise<void>;
  createProblemSet: (data: CreateProblemSetRequest) => Promise<ProblemSet | null>;
  updateProblemSet: (id: string, data: UpdateProblemSetRequest['updates']) => Promise<ProblemSet | null>;
  deleteProblemSet: (id: string, force?: boolean) => Promise<boolean>;
  cloneProblemSet: (id: string, data?: Omit<CloneProblemSetRequest, 'sourceProblemSetId'>) => Promise<ProblemSet | null>;
  
  // Utilities
  refresh: () => Promise<void>;
  clearError: () => void;
  setPagination: (page: number) => void;
}

/**
 * 문제집 관리 커스텀 훅
 * 
 * @param options - 훅 설정 옵션
 * @returns 문제집 관리 관련 상태와 액션들
 */
export const useProblemSets = (options: UseProblemSetsOptions = {}): UseProblemSetsReturn => {
  const { autoLoad = false, initialFilter = {}, refreshInterval } = options;

  // State
  const [state, setState] = useState<UseProblemSetsState>({
    loading: false,
    error: null,
    problemSets: [],
    totalCount: 0,
    currentPage: 1,
    hasNext: false,
    hasPrevious: false
  });

  const [currentFilter, setCurrentFilter] = useState<GetProblemSetListRequest>(initialFilter);

  // Load problem sets
  const loadProblemSets = useCallback(async (filter: GetProblemSetListRequest = currentFilter) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response: GetProblemSetListResponse = await problemSetApi.getProblemSetList(filter);
      
      setState(prev => ({
        ...prev,
        loading: false,
        problemSets: response.problemSets,
        totalCount: response.pagination.totalCount,
        currentPage: response.pagination.currentPage,
        hasNext: response.pagination.hasNext,
        hasPrevious: response.pagination.hasPrevious
      }));
      
      setCurrentFilter(filter);
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || '문제집 목록을 불러오는데 실패했습니다'
      }));
    }
  }, [currentFilter]);

  // Create problem set
  const createProblemSet = useCallback(async (data: CreateProblemSetRequest): Promise<ProblemSet | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await problemSetApi.createProblemSet(data);
      const newProblemSet = response.problemSet;
      
      setState(prev => ({
        ...prev,
        loading: false,
        problemSets: [newProblemSet, ...prev.problemSets],
        totalCount: prev.totalCount + 1
      }));
      
      return newProblemSet;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || '문제집 생성에 실패했습니다'
      }));
      return null;
    }
  }, []);

  // Update problem set
  const updateProblemSet = useCallback(async (
    id: string, 
    data: UpdateProblemSetRequest['updates']
  ): Promise<ProblemSet | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await problemSetApi.updateProblemSet({
        problemSetId: id,
        updates: data
      });
      const updatedProblemSet = response.problemSet;
      
      setState(prev => ({
        ...prev,
        loading: false,
        problemSets: prev.problemSets.map(ps => ps.id === id ? updatedProblemSet : ps)
      }));
      
      return updatedProblemSet;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || '문제집 수정에 실패했습니다'
      }));
      return null;
    }
  }, []);

  // Delete problem set
  const deleteProblemSet = useCallback(async (id: string, force: boolean = false): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await problemSetApi.deleteProblemSet({
        problemSetId: id,
        force
      });
      
      setState(prev => ({
        ...prev,
        loading: false,
        problemSets: prev.problemSets.filter(ps => ps.id !== id),
        totalCount: prev.totalCount - 1
      }));
      
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || '문제집 삭제에 실패했습니다'
      }));
      return false;
    }
  }, []);

  // Clone problem set
  const cloneProblemSet = useCallback(async (
    id: string, 
    data: Omit<CloneProblemSetRequest, 'sourceProblemSetId'> = {}
  ): Promise<ProblemSet | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await problemSetApi.cloneProblemSet({
        sourceProblemSetId: id,
        ...data
      });
      const clonedProblemSet = response.clonedProblemSet;
      
      setState(prev => ({
        ...prev,
        loading: false,
        problemSets: [clonedProblemSet, ...prev.problemSets],
        totalCount: prev.totalCount + 1
      }));
      
      return clonedProblemSet;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || '문제집 복제에 실패했습니다'
      }));
      return null;
    }
  }, []);

  // Refresh
  const refresh = useCallback(async () => {
    await loadProblemSets(currentFilter);
  }, [loadProblemSets, currentFilter]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Set pagination
  const setPagination = useCallback((page: number) => {
    const newFilter = { 
      ...currentFilter, 
      pagination: { 
        ...currentFilter.pagination, 
        page 
      } 
    };
    loadProblemSets(newFilter);
  }, [currentFilter, loadProblemSets]);

  // Auto load effect
  useEffect(() => {
    if (autoLoad) {
      loadProblemSets(initialFilter);
    }
  }, [autoLoad]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto refresh effect
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refresh, refreshInterval]);

  return {
    state,
    problemSets: state.problemSets,
    loadProblemSets,
    createProblemSet,
    updateProblemSet,
    deleteProblemSet,
    cloneProblemSet,
    refresh,
    clearError,
    setPagination
  };
};

// Hook Options for detailed problem set
export interface UseProblemSetDetailOptions {
  problemSetId: string;
  autoLoad?: boolean;
  includeItems?: boolean;
  refreshInterval?: number;
}

// Hook State for detailed problem set
export interface UseProblemSetDetailState {
  loading: boolean;
  error: string | null;
  problemSet: DetailedProblemSet | null;
  permissions: ProblemSetPermissions | null;
}

// Hook Return Type for detailed problem set
export interface UseProblemSetDetailReturn {
  // State
  state: UseProblemSetDetailState;
  problemSet: DetailedProblemSet | null;
  permissions: ProblemSetPermissions | null;
  
  // Actions
  loadProblemSet: (includeItems?: boolean) => Promise<void>;
  addProblem: (data: Omit<AddProblemToProblemSetRequest, 'problemSetId'>) => Promise<ProblemSetItem | null>;
  removeProblem: (problemId: string) => Promise<boolean>;
  reorderProblems: (orderedProblemIds: string[]) => Promise<ProblemSetItem[] | null>;
  
  // Utilities
  refresh: () => Promise<void>;
  clearError: () => void;
}

/**
 * 개별 문제집 상세 관리 커스텀 훅
 * 
 * @param options - 훅 설정 옵션
 * @returns 문제집 상세 관리 관련 상태와 액션들
 */
export const useProblemSetDetail = (options: UseProblemSetDetailOptions): UseProblemSetDetailReturn => {
  const { problemSetId, autoLoad = false, includeItems = true, refreshInterval } = options;

  // State
  const [state, setState] = useState<UseProblemSetDetailState>({
    loading: false,
    error: null,
    problemSet: null,
    permissions: null
  });

  // Load problem set detail
  const loadProblemSet = useCallback(async (shouldIncludeItems: boolean = includeItems) => {
    if (!problemSetId) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response: GetProblemSetResponse = await problemSetApi.getProblemSet({
        problemSetId,
        includeItems: shouldIncludeItems
      });
      
      setState(prev => ({
        ...prev,
        loading: false,
        problemSet: response.problemSet,
        permissions: response.permissions
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || '문제집을 불러오는데 실패했습니다'
      }));
    }
  }, [problemSetId, includeItems]);

  // Add problem to problem set
  const addProblem = useCallback(async (
    data: Omit<AddProblemToProblemSetRequest, 'problemSetId'>
  ): Promise<ProblemSetItem | null> => {
    if (!problemSetId) return null;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await problemSetApi.addProblemToProblemSet({
        problemSetId,
        ...data
      });
      
      setState(prev => ({
        ...prev,
        loading: false,
        problemSet: response.problemSet
      }));
      
      return response.addedItem;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || '문제 추가에 실패했습니다'
      }));
      return null;
    }
  }, [problemSetId]);

  // Remove problem from problem set
  const removeProblem = useCallback(async (problemId: string): Promise<boolean> => {
    if (!problemSetId) return false;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await problemSetApi.removeProblemFromProblemSet({
        problemSetId,
        problemId
      });
      
      setState(prev => ({
        ...prev,
        loading: false,
        problemSet: response.problemSet
      }));
      
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || '문제 제거에 실패했습니다'
      }));
      return false;
    }
  }, [problemSetId]);

  // Reorder problems in problem set
  const reorderProblems = useCallback(async (
    orderedProblemIds: string[]
  ): Promise<ProblemSetItem[] | null> => {
    if (!problemSetId) return null;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await problemSetApi.reorderProblemSetItems({
        problemSetId,
        orderedProblemIds
      });
      
      setState(prev => ({
        ...prev,
        loading: false,
        problemSet: response.problemSet
      }));
      
      return response.reorderedItems;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || '문제 순서 변경에 실패했습니다'
      }));
      return null;
    }
  }, [problemSetId]);

  // Refresh
  const refresh = useCallback(async () => {
    await loadProblemSet();
  }, [loadProblemSet]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto load effect
  useEffect(() => {
    if (autoLoad && problemSetId) {
      loadProblemSet();
    }
  }, [autoLoad, problemSetId, loadProblemSet]);

  // Auto refresh effect
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refresh, refreshInterval]);

  return {
    state,
    problemSet: state.problemSet,
    permissions: state.permissions,
    loadProblemSet,
    addProblem,
    removeProblem,
    reorderProblems,
    refresh,
    clearError
  };
};