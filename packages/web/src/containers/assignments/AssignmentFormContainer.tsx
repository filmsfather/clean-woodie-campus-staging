import React, { useState, useCallback, useEffect } from 'react';
import { 
  useAssignmentDetail,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  Assignment
} from '../../hooks';
import { useProblemSets } from '../../hooks';

// ===== Form Data Types =====
interface AssignmentFormData {
  problemSetId: string;
  title: string;
  description: string;
  dueDate: string; // ISO string or local date string
  timezone: string;
  maxAttempts: number | null;
  classIds: string[];
  studentIds: string[];
}

// ===== Container Props =====
interface AssignmentFormContainerProps {
  assignmentId?: string | null; // null for create, string for edit
  initialData?: Partial<AssignmentFormData>;
  onSubmit?: (assignment: Assignment) => void;
  onCancel?: () => void;
  onSuccess?: (assignment: Assignment, isEdit: boolean) => void;
  onError?: (error: string, isEdit: boolean) => void;
  children: (props: AssignmentFormContainerRenderProps) => React.ReactNode;
}

interface AssignmentFormContainerRenderProps {
  // Data
  assignment: Assignment | null;
  problemSets: any[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
  
  // Form State
  formData: AssignmentFormData;
  formErrors: Partial<Record<keyof AssignmentFormData, string>>;
  isValid: boolean;
  isDirty: boolean;
  isEdit: boolean;
  
  // Form Actions
  handleFieldChange: (field: keyof AssignmentFormData, value: any) => void;
  handleFormReset: () => void;
  handleFormSubmit: () => Promise<void>;
  
  // Validation
  validateField: (field: keyof AssignmentFormData) => string | null;
  validateForm: () => boolean;
  
  // Class/Student Management
  handleAddClass: (classId: string) => void;
  handleRemoveClass: (classId: string) => void;
  handleAddStudent: (studentId: string) => void;
  handleRemoveStudent: (studentId: string) => void;
  handleClearTargets: () => void;
  
  // Due Date Helpers
  formatDueDateForInput: (date: Date | string) => string;
  parseDueDateFromInput: (dateString: string) => Date;
  getMinDate: () => string;
  getMaxDate: () => string;
  
  // UI Actions
  handleClearError: () => void;
}

// ===== Default Form Data =====
const createDefaultFormData = (): AssignmentFormData => ({
  problemSetId: '',
  title: '',
  description: '',
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 일주일 후
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  maxAttempts: null,
  classIds: [],
  studentIds: []
});

// ===== Main Container =====
export const AssignmentFormContainer: React.FC<AssignmentFormContainerProps> = ({
  assignmentId,
  initialData = {},
  onSubmit,
  onCancel,
  onSuccess,
  onError,
  children
}) => {
  const isEdit = !!assignmentId;
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<AssignmentFormData>({
    ...createDefaultFormData(),
    ...initialData
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AssignmentFormData, string>>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Hooks
  const {
    assignment,
    loading: assignmentLoading,
    error: assignmentError,
    clearError: clearAssignmentError
  } = useAssignmentDetail(assignmentId);

  const {
    problemSets,
    loading: problemSetsLoading,
    error: problemSetsError
  } = useProblemSets();

  const loading = assignmentLoading || problemSetsLoading;
  const error = assignmentError || problemSetsError;

  // ===== Initialize Form Data from Assignment =====
  useEffect(() => {
    if (assignment && isEdit) {
      setFormData({
        problemSetId: assignment.problemSetId,
        title: assignment.title,
        description: assignment.description || '',
        dueDate: new Date(assignment.dueDate).toISOString().split('T')[0],
        timezone: assignment.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        maxAttempts: assignment.maxAttempts || null,
        classIds: assignment.targets?.assignedClasses || [],
        studentIds: assignment.targets?.assignedStudents || []
      });
      setIsDirty(false);
    }
  }, [assignment, isEdit]);

  // ===== Validation Functions =====
  const validateField = useCallback((field: keyof AssignmentFormData): string | null => {
    const value = formData[field];
    
    switch (field) {
      case 'problemSetId':
        if (!value || value === '') return 'Problem set is required';
        return null;
      
      case 'title':
        if (!value || (value as string).trim() === '') return 'Title is required';
        if ((value as string).length > 200) return 'Title must be less than 200 characters';
        return null;
      
      case 'description':
        if (value && (value as string).length > 2000) return 'Description must be less than 2000 characters';
        return null;
      
      case 'dueDate':
        if (!value || value === '') return 'Due date is required';
        const dueDate = new Date(value as string);
        const now = new Date();
        if (dueDate <= now) return 'Due date must be in the future';
        return null;
      
      case 'maxAttempts':
        if (value !== null && (value as number) < 1) return 'Max attempts must be at least 1';
        if (value !== null && (value as number) > 999) return 'Max attempts cannot exceed 999';
        return null;
      
      default:
        return null;
    }
  }, [formData]);

  const validateForm = useCallback((): boolean => {
    const fields: (keyof AssignmentFormData)[] = [
      'problemSetId', 'title', 'description', 'dueDate', 'maxAttempts'
    ];
    
    const errors: Partial<Record<keyof AssignmentFormData, string>> = {};
    let isValid = true;
    
    fields.forEach(field => {
      const error = validateField(field);
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    });
    
    // At least one target (class or student) is required
    if (formData.classIds.length === 0 && formData.studentIds.length === 0) {
      errors.classIds = 'At least one class or student must be assigned';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  }, [formData, validateField]);

  const isValid = Object.keys(formErrors).length === 0;

  // ===== Form Actions =====
  const handleFieldChange = useCallback((field: keyof AssignmentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    
    // Clear field error on change
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [formErrors]);

  const handleFormReset = useCallback(() => {
    if (isEdit && assignment) {
      setFormData({
        problemSetId: assignment.problemSetId,
        title: assignment.title,
        description: assignment.description || '',
        dueDate: new Date(assignment.dueDate).toISOString().split('T')[0],
        timezone: assignment.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        maxAttempts: assignment.maxAttempts || null,
        classIds: assignment.targets?.assignedClasses || [],
        studentIds: assignment.targets?.assignedStudents || []
      });
    } else {
      setFormData({ ...createDefaultFormData(), ...initialData });
    }
    setFormErrors({});
    setIsDirty(false);
  }, [isEdit, assignment, initialData]);

  const handleFormSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    
    try {
      if (isEdit && assignmentId) {
        // Update existing assignment
        const updateData: UpdateAssignmentRequest = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          dueDate: new Date(formData.dueDate).toISOString(),
          timezone: formData.timezone,
          maxAttempts: formData.maxAttempts || undefined
        };

        // TODO: Call update API
        // const updatedAssignment = await updateAssignment(assignmentId, updateData);
        
        // For now, create a mock response
        const updatedAssignment = { ...assignment, ...updateData } as Assignment;
        
        onSubmit?.(updatedAssignment);
        onSuccess?.(updatedAssignment, true);
      } else {
        // Create new assignment
        const createData: CreateAssignmentRequest = {
          problemSetId: formData.problemSetId,
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          dueDate: new Date(formData.dueDate).toISOString(),
          timezone: formData.timezone,
          maxAttempts: formData.maxAttempts || undefined,
          classIds: formData.classIds.length > 0 ? formData.classIds : undefined,
          studentIds: formData.studentIds.length > 0 ? formData.studentIds : undefined
        };

        // TODO: Call create API
        // const newAssignment = await createAssignment(createData);
        
        // For now, create a mock response
        const newAssignment = {
          id: `assignment-${Date.now()}`,
          teacherId: 'current-user-id',
          ...createData
        } as Assignment;
        
        onSubmit?.(newAssignment);
        onSuccess?.(newAssignment, false);
      }
    } catch (error: any) {
      const errorMessage = error.message || `Failed to ${isEdit ? 'update' : 'create'} assignment`;
      onError?.(errorMessage, isEdit);
    } finally {
      setSubmitting(false);
    }
  }, [formData, validateForm, isEdit, assignmentId, assignment, onSubmit, onSuccess, onError]);

  // ===== Class/Student Management =====
  const handleAddClass = useCallback((classId: string) => {
    setFormData(prev => ({
      ...prev,
      classIds: prev.classIds.includes(classId) ? prev.classIds : [...prev.classIds, classId]
    }));
    setIsDirty(true);
  }, []);

  const handleRemoveClass = useCallback((classId: string) => {
    setFormData(prev => ({
      ...prev,
      classIds: prev.classIds.filter(id => id !== classId)
    }));
    setIsDirty(true);
  }, []);

  const handleAddStudent = useCallback((studentId: string) => {
    setFormData(prev => ({
      ...prev,
      studentIds: prev.studentIds.includes(studentId) ? prev.studentIds : [...prev.studentIds, studentId]
    }));
    setIsDirty(true);
  }, []);

  const handleRemoveStudent = useCallback((studentId: string) => {
    setFormData(prev => ({
      ...prev,
      studentIds: prev.studentIds.filter(id => id !== studentId)
    }));
    setIsDirty(true);
  }, []);

  const handleClearTargets = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      classIds: [],
      studentIds: []
    }));
    setIsDirty(true);
  }, []);

  // ===== Due Date Helpers =====
  const formatDueDateForInput = useCallback((date: Date | string): string => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }, []);

  const parseDueDateFromInput = useCallback((dateString: string): Date => {
    return new Date(dateString);
  }, []);

  const getMinDate = useCallback((): string => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const getMaxDate = useCallback((): string => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1); // 1년 후
    return maxDate.toISOString().split('T')[0];
  }, []);

  // ===== UI Actions =====
  const handleClearError = useCallback(() => {
    clearAssignmentError();
  }, [clearAssignmentError]);

  // Render props pattern
  return (
    <>
      {children({
        // Data
        assignment,
        problemSets: problemSets || [],
        loading,
        submitting,
        error,
        
        // Form State
        formData,
        formErrors,
        isValid,
        isDirty,
        isEdit,
        
        // Form Actions
        handleFieldChange,
        handleFormReset,
        handleFormSubmit,
        
        // Validation
        validateField,
        validateForm,
        
        // Class/Student Management
        handleAddClass,
        handleRemoveClass,
        handleAddStudent,
        handleRemoveStudent,
        handleClearTargets,
        
        // Due Date Helpers
        formatDueDateForInput,
        parseDueDateFromInput,
        getMinDate,
        getMaxDate,
        
        // UI Actions
        handleClearError
      })}
    </>
  );
};

export default AssignmentFormContainer;