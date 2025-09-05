import { useState, useCallback, useEffect } from 'react';
import { 
  assignmentApi,
  Assignment,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  GetTeacherAssignmentsParams,
  GetStudentAssignmentsParams,
  TeacherAssignmentSummary,
  StudentAssignmentSummary,
  AssignToClassRequest,
  AssignToStudentRequest,
  ExtendDueDateRequest,
  ChangeDueDateRequest
} from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// ===== Hook State Types =====
interface UseAssignmentsState {
  assignments: TeacherAssignmentSummary[];
  loading: boolean;
  error: string | null;
  summary: {
    totalCount: number;
    draftCount: number;
    activeCount: number;
    closedCount: number;
    archivedCount: number;
    overdueCount: number;
    dueSoonCount: number;
  } | null;
}

interface UseStudentAssignmentsState {
  assignments: StudentAssignmentSummary[];
  loading: boolean;
  error: string | null;
  summary: {
    totalCount: number;
    assignedCount: number;
    inProgressCount: number;
    completedCount: number;
    overdueCount: number;
    dueSoonCount: number;
  } | null;
}

interface UseAssignmentDetailState {
  assignment: Assignment | null;
  loading: boolean;
  error: string | null;
}

// ===== Main Assignment Hook (Teacher) =====
export function useAssignments(params?: GetTeacherAssignmentsParams) {
  const { user } = useAuth();
  const [state, setState] = useState<UseAssignmentsState>({
    assignments: [],
    loading: false,
    error: null,
    summary: null
  });

  // 과제 목록 조회
  const fetchAssignments = useCallback(async (queryParams?: GetTeacherAssignmentsParams) => {
    if (!user) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await assignmentApi.getTeacherAssignments(queryParams);
      setState(prev => ({
        ...prev,
        assignments: response.assignments,
        summary: response.summary,
        loading: false
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to fetch assignments',
        loading: false
      }));
    }
  }, [user]);

  // 과제 생성
  const createAssignment = useCallback(async (data: CreateAssignmentRequest): Promise<Assignment | null> => {
    if (!user) return null;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const assignment = await assignmentApi.createAssignment(data);
      
      // 목록 다시 조회
      await fetchAssignments(params);
      
      return assignment;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to create assignment',
        loading: false
      }));
      return null;
    }
  }, [user, fetchAssignments, params]);

  // 과제 업데이트
  const updateAssignment = useCallback(async (
    assignmentId: string, 
    data: UpdateAssignmentRequest
  ): Promise<Assignment | null> => {
    if (!user) return null;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const assignment = await assignmentApi.updateAssignment(assignmentId, data);
      
      // 목록 다시 조회
      await fetchAssignments(params);
      
      return assignment;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to update assignment',
        loading: false
      }));
      return null;
    }
  }, [user, fetchAssignments, params]);

  // 과제 삭제
  const deleteAssignment = useCallback(async (assignmentId: string): Promise<boolean> => {
    if (!user) return false;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await assignmentApi.deleteAssignment(assignmentId);
      
      // 목록 다시 조회
      await fetchAssignments(params);
      
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to delete assignment',
        loading: false
      }));
      return false;
    }
  }, [user, fetchAssignments, params]);

  // 과제 활성화
  const activateAssignment = useCallback(async (assignmentId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      await assignmentApi.activateAssignment(assignmentId);
      await fetchAssignments(params);
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to activate assignment'
      }));
      return false;
    }
  }, [user, fetchAssignments, params]);

  // 과제 비활성화
  const deactivateAssignment = useCallback(async (assignmentId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      await assignmentApi.deactivateAssignment(assignmentId);
      await fetchAssignments(params);
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to deactivate assignment'
      }));
      return false;
    }
  }, [user, fetchAssignments, params]);

  // 과제 마감
  const closeAssignment = useCallback(async (assignmentId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      await assignmentApi.closeAssignment(assignmentId);
      await fetchAssignments(params);
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to close assignment'
      }));
      return false;
    }
  }, [user, fetchAssignments, params]);

  // 과제 보관
  const archiveAssignment = useCallback(async (assignmentId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      await assignmentApi.archiveAssignment(assignmentId);
      await fetchAssignments(params);
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to archive assignment'
      }));
      return false;
    }
  }, [user, fetchAssignments, params]);

  // 클래스에 배정
  const assignToClass = useCallback(async (
    assignmentId: string, 
    data: AssignToClassRequest
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      await assignmentApi.assignToClass(assignmentId, data);
      await fetchAssignments(params);
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to assign to class'
      }));
      return false;
    }
  }, [user, fetchAssignments, params]);

  // 개별 학생에게 배정
  const assignToStudent = useCallback(async (
    assignmentId: string, 
    data: AssignToStudentRequest
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      await assignmentApi.assignToStudent(assignmentId, data);
      await fetchAssignments(params);
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to assign to student'
      }));
      return false;
    }
  }, [user, fetchAssignments, params]);

  // 배정 취소
  const revokeAssignment = useCallback(async (
    assignmentId: string, 
    targetIds: string[]
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      await assignmentApi.revokeAssignment(assignmentId, { targetIds });
      await fetchAssignments(params);
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to revoke assignment'
      }));
      return false;
    }
  }, [user, fetchAssignments, params]);

  // 마감일 연장
  const extendDueDate = useCallback(async (
    assignmentId: string, 
    data: ExtendDueDateRequest
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      await assignmentApi.extendDueDate(assignmentId, data);
      await fetchAssignments(params);
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to extend due date'
      }));
      return false;
    }
  }, [user, fetchAssignments, params]);

  // 마감일 변경
  const changeDueDate = useCallback(async (
    assignmentId: string, 
    data: ChangeDueDateRequest
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      await assignmentApi.changeDueDate(assignmentId, data);
      await fetchAssignments(params);
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to change due date'
      }));
      return false;
    }
  }, [user, fetchAssignments, params]);

  // 새로고침
  const refresh = useCallback(() => {
    fetchAssignments(params);
  }, [fetchAssignments, params]);

  // 에러 클리어
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // 초기 로딩
  useEffect(() => {
    if (user) {
      fetchAssignments(params);
    }
  }, [user, fetchAssignments, params]);

  return {
    ...state,
    // Actions
    createAssignment,
    updateAssignment,
    deleteAssignment,
    activateAssignment,
    deactivateAssignment,
    closeAssignment,
    archiveAssignment,
    assignToClass,
    assignToStudent,
    revokeAssignment,
    extendDueDate,
    changeDueDate,
    refresh,
    clearError,
    // Computed
    hasAssignments: state.assignments.length > 0,
    isEmpty: state.assignments.length === 0 && !state.loading
  };
}

// ===== Student Assignment Hook =====
export function useStudentAssignments(
  studentId?: string, 
  params?: GetStudentAssignmentsParams
) {
  const { user } = useAuth();
  const [state, setState] = useState<UseStudentAssignmentsState>({
    assignments: [],
    loading: false,
    error: null,
    summary: null
  });

  const fetchStudentAssignments = useCallback(async (queryParams?: GetStudentAssignmentsParams) => {
    if (!user) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await assignmentApi.getStudentAssignments(studentId, queryParams);
      setState(prev => ({
        ...prev,
        assignments: response.assignments,
        summary: response.summary,
        loading: false
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to fetch student assignments',
        loading: false
      }));
    }
  }, [user, studentId]);

  const refresh = useCallback(() => {
    fetchStudentAssignments(params);
  }, [fetchStudentAssignments, params]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    if (user) {
      fetchStudentAssignments(params);
    }
  }, [user, fetchStudentAssignments, params]);

  return {
    ...state,
    refresh,
    clearError,
    hasAssignments: state.assignments.length > 0,
    isEmpty: state.assignments.length === 0 && !state.loading
  };
}

// ===== Single Assignment Detail Hook =====
export function useAssignmentDetail(assignmentId: string | null) {
  const [state, setState] = useState<UseAssignmentDetailState>({
    assignment: null,
    loading: false,
    error: null
  });

  const fetchAssignment = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const assignment = await assignmentApi.getAssignment(id);
      setState(prev => ({
        ...prev,
        assignment,
        loading: false
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to fetch assignment',
        loading: false
      }));
    }
  }, []);

  const refresh = useCallback(() => {
    if (assignmentId) {
      fetchAssignment(assignmentId);
    }
  }, [assignmentId, fetchAssignment]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignment(assignmentId);
    }
  }, [assignmentId, fetchAssignment]);

  return {
    ...state,
    refresh,
    clearError
  };
}

// ===== Due Date Status Hooks =====
export function useDueSoonAssignments(hoursThreshold: number = 24) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    totalCount: number;
    within24Hours: number;
    within48Hours: number;
    within7Days: number;
  } | null>(null);

  const fetchDueSoonAssignments = useCallback(async (threshold: number = 24) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await assignmentApi.getDueSoonAssignments(threshold);
      setAssignments(response.assignments);
      setSummary(response.summary);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch due soon assignments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDueSoonAssignments(hoursThreshold);
  }, [hoursThreshold, fetchDueSoonAssignments]);

  return {
    assignments,
    loading,
    error,
    summary,
    refresh: () => fetchDueSoonAssignments(hoursThreshold),
    clearError: () => setError(null)
  };
}

export function useOverdueAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    totalCount: number;
    overdue1Day: number;
    overdue3Days: number;
    overdue1Week: number;
  } | null>(null);

  const fetchOverdueAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await assignmentApi.getOverdueAssignments();
      setAssignments(response.assignments);
      setSummary(response.summary);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch overdue assignments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverdueAssignments();
  }, [fetchOverdueAssignments]);

  return {
    assignments,
    loading,
    error,
    summary,
    refresh: fetchOverdueAssignments,
    clearError: () => setError(null)
  };
}