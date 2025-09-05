import { useState, useEffect, useCallback } from 'react';
import { problemApi } from '../services/api';
import type { 
  Problem,
  UpdateProblemContentRequest,
  UpdateProblemAnswerRequest,
  ChangeProblemDifficultyRequest,
  ManageProblemTagsRequest
} from '../services/api';

// Hook Options
export interface UseProblemDetailOptions {
  problemId?: string;
  autoLoad?: boolean;
  refreshInterval?: number;
}

// Hook State
export interface UseProblemDetailState {
  loading: boolean;
  error: string | null;
  problem: Problem | null;
  updating: boolean;
  updateError: string | null;
}

// Hook Return Type
export interface UseProblemDetailReturn {
  // State
  state: UseProblemDetailState;
  problem: Problem | null;
  
  // Actions
  loadProblem: (problemId: string) => Promise<void>;
  updateContent: (data: UpdateProblemContentRequest) => Promise<boolean>;
  updateAnswer: (data: UpdateProblemAnswerRequest) => Promise<boolean>;
  changeDifficulty: (data: ChangeProblemDifficultyRequest) => Promise<boolean>;
  manageTags: (data: ManageProblemTagsRequest) => Promise<boolean>;
  activate: () => Promise<boolean>;
  deactivate: () => Promise<boolean>;
  clone: (newTeacherId?: string, preserveOriginalTags?: boolean) => Promise<Problem | null>;
  
  // Utilities
  refresh: () => Promise<void>;
  clearError: () => void;
  clearUpdateError: () => void;
  
  // Computed
  canEdit: boolean;
  isActive: boolean;
}

/**
 * 단일 문제 상세 정보 관리 커스텀 훅
 * 
 * @param options - 훅 설정 옵션
 * @returns 문제 상세 정보 관련 상태와 액션들
 */
export const useProblemDetail = (options: UseProblemDetailOptions = {}): UseProblemDetailReturn => {
  const { problemId, autoLoad = true, refreshInterval } = options;

  // State
  const [state, setState] = useState<UseProblemDetailState>({
    loading: false,
    error: null,
    problem: null,
    updating: false,
    updateError: null
  });

  const [currentProblemId, setCurrentProblemId] = useState<string | undefined>(problemId);

  // Load problem
  const loadProblem = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const problem = await problemApi.getProblem(id);
      
      setState(prev => ({
        ...prev,
        loading: false,
        problem
      }));
      
      setCurrentProblemId(id);
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || '문제를 불러오는데 실패했습니다'
      }));
    }
  }, []);

  // Update content
  const updateContent = useCallback(async (data: UpdateProblemContentRequest): Promise<boolean> => {
    if (!state.problem) return false;
    
    setState(prev => ({ ...prev, updating: true, updateError: null }));
    
    try {
      const updatedProblem = await problemApi.updateProblemContent(state.problem.id, data);
      
      setState(prev => ({
        ...prev,
        updating: false,
        problem: updatedProblem
      }));
      
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        updating: false,
        updateError: error.message || '문제 내용 수정에 실패했습니다'
      }));
      return false;
    }
  }, [state.problem]);

  // Update answer
  const updateAnswer = useCallback(async (data: UpdateProblemAnswerRequest): Promise<boolean> => {
    if (!state.problem) return false;
    
    setState(prev => ({ ...prev, updating: true, updateError: null }));
    
    try {
      const updatedProblem = await problemApi.updateProblemAnswer(state.problem.id, data);
      
      setState(prev => ({
        ...prev,
        updating: false,
        problem: updatedProblem
      }));
      
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        updating: false,
        updateError: error.message || '문제 답안 수정에 실패했습니다'
      }));
      return false;
    }
  }, [state.problem]);

  // Change difficulty
  const changeDifficulty = useCallback(async (data: ChangeProblemDifficultyRequest): Promise<boolean> => {
    if (!state.problem) return false;
    
    setState(prev => ({ ...prev, updating: true, updateError: null }));
    
    try {
      const updatedProblem = await problemApi.changeProblemDifficulty(state.problem.id, data);
      
      setState(prev => ({
        ...prev,
        updating: false,
        problem: updatedProblem
      }));
      
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        updating: false,
        updateError: error.message || '문제 난이도 변경에 실패했습니다'
      }));
      return false;
    }
  }, [state.problem]);

  // Manage tags
  const manageTags = useCallback(async (data: ManageProblemTagsRequest): Promise<boolean> => {
    if (!state.problem) return false;
    
    setState(prev => ({ ...prev, updating: true, updateError: null }));
    
    try {
      const updatedProblem = await problemApi.manageProblemTags(state.problem.id, data);
      
      setState(prev => ({
        ...prev,
        updating: false,
        problem: updatedProblem
      }));
      
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        updating: false,
        updateError: error.message || '문제 태그 관리에 실패했습니다'
      }));
      return false;
    }
  }, [state.problem]);

  // Activate
  const activate = useCallback(async (): Promise<boolean> => {
    if (!state.problem) return false;
    
    setState(prev => ({ ...prev, updating: true, updateError: null }));
    
    try {
      const updatedProblem = await problemApi.activateProblem(state.problem.id);
      
      setState(prev => ({
        ...prev,
        updating: false,
        problem: updatedProblem
      }));
      
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        updating: false,
        updateError: error.message || '문제 활성화에 실패했습니다'
      }));
      return false;
    }
  }, [state.problem]);

  // Deactivate
  const deactivate = useCallback(async (): Promise<boolean> => {
    if (!state.problem) return false;
    
    setState(prev => ({ ...prev, updating: true, updateError: null }));
    
    try {
      const updatedProblem = await problemApi.deactivateProblem(state.problem.id);
      
      setState(prev => ({
        ...prev,
        updating: false,
        problem: updatedProblem
      }));
      
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        updating: false,
        updateError: error.message || '문제 비활성화에 실패했습니다'
      }));
      return false;
    }
  }, [state.problem]);

  // Clone
  const clone = useCallback(async (
    newTeacherId?: string, 
    preserveOriginalTags: boolean = true
  ): Promise<Problem | null> => {
    if (!state.problem) return null;
    
    setState(prev => ({ ...prev, updating: true, updateError: null }));
    
    try {
      const clonedProblem = await problemApi.cloneProblem(state.problem.id, {
        newTeacherId,
        preserveOriginalTags
      });
      
      setState(prev => ({ ...prev, updating: false }));
      
      return clonedProblem;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        updating: false,
        updateError: error.message || '문제 복제에 실패했습니다'
      }));
      return null;
    }
  }, [state.problem]);

  // Refresh
  const refresh = useCallback(async () => {
    if (currentProblemId) {
      await loadProblem(currentProblemId);
    }
  }, [loadProblem, currentProblemId]);

  // Clear errors
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearUpdateError = useCallback(() => {
    setState(prev => ({ ...prev, updateError: null }));
  }, []);

  // Auto load effect
  useEffect(() => {
    if (autoLoad && problemId) {
      loadProblem(problemId);
    }
  }, [autoLoad, problemId, loadProblem]);

  // Auto refresh effect
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refresh, refreshInterval]);

  // Computed values
  const canEdit = Boolean(state.problem); // TODO: 추후 권한 체크 로직 추가
  const isActive = state.problem?.isActive ?? false;

  return {
    state,
    problem: state.problem,
    loadProblem,
    updateContent,
    updateAnswer,
    changeDifficulty,
    manageTags,
    activate,
    deactivate,
    clone,
    refresh,
    clearError,
    clearUpdateError,
    canEdit,
    isActive
  };
};