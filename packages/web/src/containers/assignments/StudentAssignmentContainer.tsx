import React, { useState, useCallback } from 'react';
import { 
  useStudentAssignments, 
  GetStudentAssignmentsParams,
  StudentAssignmentSummary
} from '../../hooks';
import { useAuth } from '../../contexts/AuthContext';

// ===== Container Props =====
interface StudentAssignmentContainerProps {
  studentId?: string;
  initialParams?: GetStudentAssignmentsParams;
  onAssignmentSelect?: (assignment: StudentAssignmentSummary) => void;
  onAssignmentStart?: (assignmentId: string) => void;
  onAssignmentComplete?: (assignmentId: string) => void;
  children: (props: StudentAssignmentContainerRenderProps) => React.ReactNode;
}

interface StudentAssignmentContainerRenderProps {
  // Data
  assignments: StudentAssignmentSummary[];
  summary: any;
  loading: boolean;
  error: string | null;
  hasAssignments: boolean;
  isEmpty: boolean;
  
  // State
  selectedAssignment: string | null;
  filterParams: GetStudentAssignmentsParams;
  
  // Computed
  assignedAssignments: StudentAssignmentSummary[];
  inProgressAssignments: StudentAssignmentSummary[];
  completedAssignments: StudentAssignmentSummary[];
  overdueAssignments: StudentAssignmentSummary[];
  dueSoonAssignments: StudentAssignmentSummary[];
  
  // Actions - Navigation
  handleAssignmentSelect: (assignment: StudentAssignmentSummary) => void;
  handleAssignmentStart: (assignmentId: string) => void;
  handleAssignmentComplete: (assignmentId: string) => void;
  
  // Actions - Filter & Search
  handleFilterChange: (params: Partial<GetStudentAssignmentsParams>) => void;
  handleStatusFilter: (status: string) => void;
  handleClassFilter: (classId: string | null) => void;
  handleSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  
  // Actions - UI
  handleRefresh: () => void;
  handleClearError: () => void;
  handleClearSelection: () => void;
}

// ===== Main Container =====
export const StudentAssignmentContainer: React.FC<StudentAssignmentContainerProps> = ({
  studentId,
  initialParams = {},
  onAssignmentSelect,
  onAssignmentStart,
  onAssignmentComplete,
  children
}) => {
  const { user } = useAuth();
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [filterParams, setFilterParams] = useState<GetStudentAssignmentsParams>(initialParams);

  const {
    assignments,
    summary,
    loading,
    error,
    hasAssignments,
    isEmpty,
    refresh,
    clearError
  } = useStudentAssignments(studentId, filterParams);

  // ===== Computed Properties =====
  const assignedAssignments = assignments.filter(a => a.status === 'ASSIGNED');
  const inProgressAssignments = assignments.filter(a => a.status === 'IN_PROGRESS');
  const completedAssignments = assignments.filter(a => a.status === 'COMPLETED');
  const overdueAssignments = assignments.filter(a => a.dueDateStatus.isOverdue);
  const dueSoonAssignments = assignments.filter(a => 
    a.dueDateStatus.isDueSoon && !a.dueDateStatus.isOverdue
  );

  // ===== Navigation Actions =====
  const handleAssignmentSelect = useCallback((assignment: StudentAssignmentSummary) => {
    setSelectedAssignment(assignment.id);
    onAssignmentSelect?.(assignment);
  }, [onAssignmentSelect]);

  const handleAssignmentStart = useCallback((assignmentId: string) => {
    setSelectedAssignment(assignmentId);
    onAssignmentStart?.(assignmentId);
  }, [onAssignmentStart]);

  const handleAssignmentComplete = useCallback((assignmentId: string) => {
    onAssignmentComplete?.(assignmentId);
    // Refresh to get updated status
    refresh();
  }, [onAssignmentComplete, refresh]);

  // ===== Filter & Search Actions =====
  const handleFilterChange = useCallback((params: Partial<GetStudentAssignmentsParams>) => {
    setFilterParams(prev => ({ ...prev, ...params }));
    setSelectedAssignment(null); // Clear selection on filter change
  }, []);

  const handleStatusFilter = useCallback((status: string) => {
    setFilterParams(prev => ({ 
      ...prev, 
      status: status === 'ALL' ? undefined : status as any
    }));
    setSelectedAssignment(null);
  }, []);

  const handleClassFilter = useCallback((classId: string | null) => {
    setFilterParams(prev => ({ 
      ...prev, 
      classId: classId || undefined
    }));
    setSelectedAssignment(null);
  }, []);

  const handleSortChange = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilterParams(prev => ({ 
      ...prev, 
      sortBy: sortBy as any, 
      sortOrder 
    }));
  }, []);

  // ===== UI Actions =====
  const handleRefresh = useCallback(() => {
    refresh();
    setSelectedAssignment(null);
  }, [refresh]);

  const handleClearError = useCallback(() => {
    clearError();
  }, [clearError]);

  const handleClearSelection = useCallback(() => {
    setSelectedAssignment(null);
  }, []);

  // Render props pattern
  return (
    <>
      {children({
        // Data
        assignments,
        summary,
        loading,
        error,
        hasAssignments,
        isEmpty,
        
        // State
        selectedAssignment,
        filterParams,
        
        // Computed
        assignedAssignments,
        inProgressAssignments,
        completedAssignments,
        overdueAssignments,
        dueSoonAssignments,
        
        // Actions - Navigation
        handleAssignmentSelect,
        handleAssignmentStart,
        handleAssignmentComplete,
        
        // Actions - Filter & Search
        handleFilterChange,
        handleStatusFilter,
        handleClassFilter,
        handleSortChange,
        
        // Actions - UI
        handleRefresh,
        handleClearError,
        handleClearSelection
      })}
    </>
  );
};

export default StudentAssignmentContainer;