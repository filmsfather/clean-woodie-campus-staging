import React, { useState, useCallback } from 'react';
import { 
  useAssignments, 
  GetTeacherAssignmentsParams,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  AssignToClassRequest,
  AssignToStudentRequest,
  ExtendDueDateRequest,
  ChangeDueDateRequest
} from '../../hooks';
import { useAuth } from '../../contexts/AuthContext';

// ===== Container Props =====
interface AssignmentListContainerProps {
  initialParams?: GetTeacherAssignmentsParams;
  onAssignmentSelect?: (assignmentId: string) => void;
  onAssignmentCreate?: (assignment: any) => void;
  onAssignmentUpdate?: (assignment: any) => void;
  onAssignmentDelete?: (assignmentId: string) => void;
  children: (props: AssignmentListContainerRenderProps) => React.ReactNode;
}

interface AssignmentListContainerRenderProps {
  // Data
  assignments: any[];
  summary: any;
  loading: boolean;
  error: string | null;
  hasAssignments: boolean;
  isEmpty: boolean;
  
  // State
  selectedAssignments: string[];
  filterParams: GetTeacherAssignmentsParams;
  
  // Actions - CRUD
  handleCreateAssignment: (data: CreateAssignmentRequest) => Promise<boolean>;
  handleUpdateAssignment: (assignmentId: string, data: UpdateAssignmentRequest) => Promise<boolean>;
  handleDeleteAssignment: (assignmentId: string) => Promise<boolean>;
  handleDeleteSelected: () => Promise<boolean>;
  
  // Actions - Status Management
  handleActivateAssignment: (assignmentId: string) => Promise<boolean>;
  handleDeactivateAssignment: (assignmentId: string) => Promise<boolean>;
  handleCloseAssignment: (assignmentId: string) => Promise<boolean>;
  handleArchiveAssignment: (assignmentId: string) => Promise<boolean>;
  handleBatchStatusChange: (status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED') => Promise<boolean>;
  
  // Actions - Target Management
  handleAssignToClass: (assignmentId: string, data: AssignToClassRequest) => Promise<boolean>;
  handleAssignToStudent: (assignmentId: string, data: AssignToStudentRequest) => Promise<boolean>;
  handleRevokeAssignment: (assignmentId: string, targetIds: string[]) => Promise<boolean>;
  
  // Actions - Due Date Management
  handleExtendDueDate: (assignmentId: string, data: ExtendDueDateRequest) => Promise<boolean>;
  handleChangeDueDate: (assignmentId: string, data: ChangeDueDateRequest) => Promise<boolean>;
  
  // Actions - Selection
  handleSelectAssignment: (assignmentId: string, selected: boolean) => void;
  handleSelectAll: (selected: boolean) => void;
  handleClearSelection: () => void;
  
  // Actions - Filter & Search
  handleFilterChange: (params: Partial<GetTeacherAssignmentsParams>) => void;
  handleSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  
  // Actions - UI
  handleRefresh: () => void;
  handleClearError: () => void;
}

// ===== Main Container =====
export const AssignmentListContainer: React.FC<AssignmentListContainerProps> = ({
  initialParams = {},
  onAssignmentSelect,
  onAssignmentCreate,
  onAssignmentUpdate,
  onAssignmentDelete,
  children
}) => {
  const { user } = useAuth();
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  const [filterParams, setFilterParams] = useState<GetTeacherAssignmentsParams>(initialParams);

  const {
    assignments,
    summary,
    loading,
    error,
    hasAssignments,
    isEmpty,
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
    clearError
  } = useAssignments(filterParams);

  // ===== CRUD Actions =====
  const handleCreateAssignment = useCallback(async (data: CreateAssignmentRequest): Promise<boolean> => {
    const assignment = await createAssignment(data);
    if (assignment) {
      onAssignmentCreate?.(assignment);
      return true;
    }
    return false;
  }, [createAssignment, onAssignmentCreate]);

  const handleUpdateAssignment = useCallback(async (
    assignmentId: string, 
    data: UpdateAssignmentRequest
  ): Promise<boolean> => {
    const assignment = await updateAssignment(assignmentId, data);
    if (assignment) {
      onAssignmentUpdate?.(assignment);
      return true;
    }
    return false;
  }, [updateAssignment, onAssignmentUpdate]);

  const handleDeleteAssignment = useCallback(async (assignmentId: string): Promise<boolean> => {
    const success = await deleteAssignment(assignmentId);
    if (success) {
      setSelectedAssignments(prev => prev.filter(id => id !== assignmentId));
      onAssignmentDelete?.(assignmentId);
    }
    return success;
  }, [deleteAssignment, onAssignmentDelete]);

  const handleDeleteSelected = useCallback(async (): Promise<boolean> => {
    const deletePromises = selectedAssignments.map(id => deleteAssignment(id));
    const results = await Promise.allSettled(deletePromises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    
    if (successCount > 0) {
      setSelectedAssignments([]);
      selectedAssignments.forEach(id => onAssignmentDelete?.(id));
    }
    
    return successCount === selectedAssignments.length;
  }, [selectedAssignments, deleteAssignment, onAssignmentDelete]);

  // ===== Status Management Actions =====
  const handleActivateAssignment = useCallback(async (assignmentId: string): Promise<boolean> => {
    return await activateAssignment(assignmentId);
  }, [activateAssignment]);

  const handleDeactivateAssignment = useCallback(async (assignmentId: string): Promise<boolean> => {
    return await deactivateAssignment(assignmentId);
  }, [deactivateAssignment]);

  const handleCloseAssignment = useCallback(async (assignmentId: string): Promise<boolean> => {
    return await closeAssignment(assignmentId);
  }, [closeAssignment]);

  const handleArchiveAssignment = useCallback(async (assignmentId: string): Promise<boolean> => {
    return await archiveAssignment(assignmentId);
  }, [archiveAssignment]);

  const handleBatchStatusChange = useCallback(async (
    status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED'
  ): Promise<boolean> => {
    const promises = selectedAssignments.map(assignmentId => {
      switch (status) {
        case 'ACTIVE':
          return activateAssignment(assignmentId);
        case 'CLOSED':
          return closeAssignment(assignmentId);
        case 'ARCHIVED':
          return archiveAssignment(assignmentId);
        default:
          return Promise.resolve(false);
      }
    });

    const results = await Promise.allSettled(promises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
    
    if (successCount > 0) {
      setSelectedAssignments([]);
    }
    
    return successCount === selectedAssignments.length;
  }, [selectedAssignments, activateAssignment, closeAssignment, archiveAssignment]);

  // ===== Target Management Actions =====
  const handleAssignToClass = useCallback(async (
    assignmentId: string, 
    data: AssignToClassRequest
  ): Promise<boolean> => {
    return await assignToClass(assignmentId, data);
  }, [assignToClass]);

  const handleAssignToStudent = useCallback(async (
    assignmentId: string, 
    data: AssignToStudentRequest
  ): Promise<boolean> => {
    return await assignToStudent(assignmentId, data);
  }, [assignToStudent]);

  const handleRevokeAssignment = useCallback(async (
    assignmentId: string, 
    targetIds: string[]
  ): Promise<boolean> => {
    return await revokeAssignment(assignmentId, targetIds);
  }, [revokeAssignment]);

  // ===== Due Date Management Actions =====
  const handleExtendDueDate = useCallback(async (
    assignmentId: string, 
    data: ExtendDueDateRequest
  ): Promise<boolean> => {
    return await extendDueDate(assignmentId, data);
  }, [extendDueDate]);

  const handleChangeDueDate = useCallback(async (
    assignmentId: string, 
    data: ChangeDueDateRequest
  ): Promise<boolean> => {
    return await changeDueDate(assignmentId, data);
  }, [changeDueDate]);

  // ===== Selection Actions =====
  const handleSelectAssignment = useCallback((assignmentId: string, selected: boolean) => {
    setSelectedAssignments(prev => {
      if (selected) {
        return prev.includes(assignmentId) ? prev : [...prev, assignmentId];
      } else {
        return prev.filter(id => id !== assignmentId);
      }
    });

    if (selected) {
      onAssignmentSelect?.(assignmentId);
    }
  }, [onAssignmentSelect]);

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedAssignments(assignments.map(a => a.id));
    } else {
      setSelectedAssignments([]);
    }
  }, [assignments]);

  const handleClearSelection = useCallback(() => {
    setSelectedAssignments([]);
  }, []);

  // ===== Filter & Search Actions =====
  const handleFilterChange = useCallback((params: Partial<GetTeacherAssignmentsParams>) => {
    setFilterParams(prev => ({ ...prev, ...params }));
    setSelectedAssignments([]); // Clear selection on filter change
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
    setSelectedAssignments([]);
  }, [refresh]);

  const handleClearError = useCallback(() => {
    clearError();
  }, [clearError]);

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
        selectedAssignments,
        filterParams,
        
        // Actions - CRUD
        handleCreateAssignment,
        handleUpdateAssignment,
        handleDeleteAssignment,
        handleDeleteSelected,
        
        // Actions - Status Management
        handleActivateAssignment,
        handleDeactivateAssignment,
        handleCloseAssignment,
        handleArchiveAssignment,
        handleBatchStatusChange,
        
        // Actions - Target Management
        handleAssignToClass,
        handleAssignToStudent,
        handleRevokeAssignment,
        
        // Actions - Due Date Management
        handleExtendDueDate,
        handleChangeDueDate,
        
        // Actions - Selection
        handleSelectAssignment,
        handleSelectAll,
        handleClearSelection,
        
        // Actions - Filter & Search
        handleFilterChange,
        handleSortChange,
        
        // Actions - UI
        handleRefresh,
        handleClearError
      })}
    </>
  );
};

export default AssignmentListContainer;