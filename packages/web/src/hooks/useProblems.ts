import { useState, useEffect, useCallback } from 'react';
import { problemApi } from '../services/api';
import type { 
  Problem, 
  ProblemListResponse, 
  SearchProblemsResponse,
  GetProblemListRequest, 
  SearchProblemsRequest,
  CreateProblemRequest,
  UpdateProblemContentRequest,
  UpdateProblemAnswerRequest,
  ChangeProblemDifficultyRequest,
  ManageProblemTagsRequest,
  CloneProblemRequest
} from '../services/api';

// Hook Options
export interface UseProblemsOptions {
  autoLoad?: boolean;
  initialFilter?: GetProblemListRequest;
  refreshInterval?: number;
}

// Hook State
export interface UseProblemsState {
  loading: boolean;
  error: string | null;
  problems: Problem[];
  totalCount: number;
  currentPage: number;
  hasNext: boolean;
}

// Hook Return Type
export interface UseProblemsReturn {
  // State
  state: UseProblemsState;
  problems: Problem[];
  
  // Actions - CRUD
  loadProblems: (filter?: GetProblemListRequest) => Promise<void>;
  createProblem: (data: CreateProblemRequest) => Promise<Problem | null>;
  updateProblemContent: (id: string, data: UpdateProblemContentRequest) => Promise<Problem | null>;
  updateProblemAnswer: (id: string, data: UpdateProblemAnswerRequest) => Promise<Problem | null>;
  changeProblemDifficulty: (id: string, data: ChangeProblemDifficultyRequest) => Promise<Problem | null>;
  manageProblemTags: (id: string, data: ManageProblemTagsRequest) => Promise<Problem | null>;
  activateProblem: (id: string) => Promise<Problem | null>;
  deactivateProblem: (id: string) => Promise<Problem | null>;
  deleteProblem: (id: string) => Promise<boolean>;
  cloneProblem: (id: string, data?: CloneProblemRequest) => Promise<Problem | null>;
  
  // Utilities
  refresh: () => Promise<void>;
  clearError: () => void;
  setPagination: (page: number) => void;
}

/**
 * 문제 관리 커스텀 훅
 * 
 * @param options - 훅 설정 옵션
 * @returns 문제 관리 관련 상태와 액션들
 */
export const useProblems = (options: UseProblemsOptions = {}): UseProblemsReturn => {
  const { autoLoad = false, initialFilter = {}, refreshInterval } = options;

  // State
  const [state, setState] = useState<UseProblemsState>({
    loading: false,
    error: null,
    problems: [],
    totalCount: 0,
    currentPage: 1,
    hasNext: false
  });

  const [currentFilter, setCurrentFilter] = useState<GetProblemListRequest>(initialFilter);

  // Load problems
  const loadProblems = useCallback(async (filter: GetProblemListRequest = currentFilter) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response: ProblemListResponse = await problemApi.getProblemList(filter);
      
      setState(prev => ({
        ...prev,
        loading: false,
        problems: response.problems,
        totalCount: response.totalCount,
        currentPage: response.page,
        hasNext: response.hasNext
      }));
      
      setCurrentFilter(filter);
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || '문제 목록을 불러오는데 실패했습니다'
      }));
    }
  }, [currentFilter]);

  // Create problem
  const createProblem = useCallback(async (data: CreateProblemRequest): Promise<Problem | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await problemApi.createProblem(data);
      const newProblem = response.problem;
      
      setState(prev => ({
        ...prev,
        loading: false,
        problems: [newProblem, ...prev.problems],
        totalCount: prev.totalCount + 1
      }));
      
      return newProblem;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || '문제 생성에 실패했습니다'
      }));
      return null;
    }
  }, []);

  // Update problem content
  const updateProblemContent = useCallback(async (
    id: string, 
    data: UpdateProblemContentRequest
  ): Promise<Problem | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const updatedProblem = await problemApi.updateProblemContent(id, data);
      
      setState(prev => ({
        ...prev,
        loading: false,
        problems: prev.problems.map(p => p.id === id ? updatedProblem : p)
      }));
      
      return updatedProblem;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || '문제 내용 수정에 실패했습니다'
      }));
      return null;
    }
  }, []);

  // Update problem answer
  const updateProblemAnswer = useCallback(async (
    id: string, 
    data: UpdateProblemAnswerRequest
  ): Promise<Problem | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const updatedProblem = await problemApi.updateProblemAnswer(id, data);
      
      setState(prev => ({
        ...prev,
        loading: false,
        problems: prev.problems.map(p => p.id === id ? updatedProblem : p)
      }));
      
      return updatedProblem;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || '문제 답안 수정에 실패했습니다'
      }));
      return null;
    }
  }, []);

  // Change problem difficulty
  const changeProblemDifficulty = useCallback(async (
    id: string, 
    data: ChangeProblemDifficultyRequest
  ): Promise<Problem | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const updatedProblem = await problemApi.changeProblemDifficulty(id, data);
      
      setState(prev => ({
        ...prev,
        loading: false,
        problems: prev.problems.map(p => p.id === id ? updatedProblem : p)
      }));
      
      return updatedProblem;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || '문제 난이도 변경에 실패했습니다'
      }));
      return null;
    }
  }, []);

  // Manage problem tags
  const manageProblemTags = useCallback(async (
    id: string, 
    data: ManageProblemTagsRequest
  ): Promise<Problem | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const updatedProblem = await problemApi.manageProblemTags(id, data);
      
      setState(prev => ({
        ...prev,
        loading: false,
        problems: prev.problems.map(p => p.id === id ? updatedProblem : p)
      }));
      
      return updatedProblem;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || '문제 태그 관리에 실패했습니다'
      }));
      return null;
    }
  }, []);

  // Activate problem
  const activateProblem = useCallback(async (id: string): Promise<Problem | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const updatedProblem = await problemApi.activateProblem(id);
      
      setState(prev => ({
        ...prev,
        loading: false,
        problems: prev.problems.map(p => p.id === id ? updatedProblem : p)
      }));
      
      return updatedProblem;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || '문제 활성화에 실패했습니다'
      }));
      return null;
    }
  }, []);

  // Deactivate problem
  const deactivateProblem = useCallback(async (id: string): Promise<Problem | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const updatedProblem = await problemApi.deactivateProblem(id);
      
      setState(prev => ({
        ...prev,
        loading: false,
        problems: prev.problems.map(p => p.id === id ? updatedProblem : p)
      }));
      
      return updatedProblem;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || '문제 비활성화에 실패했습니다'
      }));
      return null;
    }
  }, []);

  // Delete problem
  const deleteProblem = useCallback(async (id: string): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await problemApi.deleteProblem(id);
      
      setState(prev => ({
        ...prev,
        loading: false,
        problems: prev.problems.filter(p => p.id !== id),
        totalCount: prev.totalCount - 1
      }));
      
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || '문제 삭제에 실패했습니다'
      }));
      return false;
    }
  }, []);

  // Clone problem
  const cloneProblem = useCallback(async (
    id: string, 
    data: CloneProblemRequest = {}
  ): Promise<Problem | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const clonedProblem = await problemApi.cloneProblem(id, data);
      
      setState(prev => ({
        ...prev,
        loading: false,
        problems: [clonedProblem, ...prev.problems],
        totalCount: prev.totalCount + 1
      }));
      
      return clonedProblem;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || '문제 복제에 실패했습니다'
      }));
      return null;
    }
  }, []);

  // Refresh
  const refresh = useCallback(async () => {
    await loadProblems(currentFilter);
  }, [loadProblems, currentFilter]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Set pagination
  const setPagination = useCallback((page: number) => {
    const newFilter = { ...currentFilter, page };
    loadProblems(newFilter);
  }, [currentFilter, loadProblems]);

  // Auto load effect
  useEffect(() => {
    if (autoLoad) {
      loadProblems(initialFilter);
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
    problems: state.problems,
    loadProblems,
    createProblem,
    updateProblemContent,
    updateProblemAnswer,
    changeProblemDifficulty,
    manageProblemTags,
    activateProblem,
    deactivateProblem,
    deleteProblem,
    cloneProblem,
    refresh,
    clearError,
    setPagination
  };
};