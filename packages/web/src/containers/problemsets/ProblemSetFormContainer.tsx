import React, { useState, useCallback } from 'react';
import { useProblemSets } from '../../hooks';
import { ProblemSetForm } from '../../components/problemsets';
import { ProblemSelector } from '../../components/problems/ProblemSelector';
import type { 
  ProblemSet,
  CreateProblemSetRequest,
  UpdateProblemSetRequest,
  Problem 
} from '../../services/api';

interface ProblemSetFormContainerProps {
  mode: 'create' | 'edit';
  problemSetId?: string;
  initialData?: Partial<CreateProblemSetRequest>;
  onSave?: (problemSet: ProblemSet) => void;
  onCancel?: () => void;
  onError?: (error: string) => void;
}

/**
 * 문제집 폼 컨테이너
 * 문제집 생성 및 수정 폼을 관리
 */
export const ProblemSetFormContainer: React.FC<ProblemSetFormContainerProps> = ({
  mode,
  problemSetId,
  initialData,
  onSave,
  onCancel,
  onError
}) => {
  // Local state
  const [formData, setFormData] = useState<CreateProblemSetRequest>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    isPublic: initialData?.isPublic || false,
    isShared: initialData?.isShared || false,
    initialProblems: initialData?.initialProblems || []
  });
  
  const [showProblemSelector, setShowProblemSelector] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Use problem sets hook
  const {
    state,
    createProblemSet,
    updateProblemSet
  } = useProblemSets();

  // Validation
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      errors.title = '문제집 제목을 입력해주세요.';
    } else if (formData.title.length < 2) {
      errors.title = '제목은 2글자 이상 입력해주세요.';
    } else if (formData.title.length > 100) {
      errors.title = '제목은 100글자를 초과할 수 없습니다.';
    }
    
    if (formData.description && formData.description.length > 500) {
      errors.description = '설명은 500글자를 초과할 수 없습니다.';
    }
    
    if (formData.initialProblems && formData.initialProblems.length > 100) {
      errors.initialProblems = '한 번에 추가할 수 있는 문제는 최대 100개입니다.';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Handle form field changes
  const handleFieldChange = useCallback((field: keyof CreateProblemSetRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [validationErrors]);

  // Handle adding problems to initial problems list
  const handleAddProblem = useCallback((problem: Problem, options?: { orderIndex?: number; points?: number }) => {
    const newProblem = {
      problemId: problem.id,
      orderIndex: options?.orderIndex || (formData.initialProblems?.length || 0),
      points: options?.points || 100
    };
    
    setFormData(prev => ({
      ...prev,
      initialProblems: [...(prev.initialProblems || []), newProblem]
    }));
    
    setShowProblemSelector(false);
  }, [formData.initialProblems]);

  // Handle removing problems from initial problems list
  const handleRemoveProblem = useCallback((problemId: string) => {
    setFormData(prev => ({
      ...prev,
      initialProblems: prev.initialProblems?.filter(p => p.problemId !== problemId) || []
    }));
  }, []);

  // Handle reordering problems in initial problems list
  const handleReorderProblems = useCallback((orderedProblemIds: string[]) => {
    if (!formData.initialProblems) return;
    
    const reorderedProblems = orderedProblemIds.map((problemId, index) => {
      const problem = formData.initialProblems!.find(p => p.problemId === problemId);
      if (problem) {
        return { ...problem, orderIndex: index };
      }
      return null;
    }).filter(Boolean) as NonNullable<CreateProblemSetRequest['initialProblems']>;
    
    setFormData(prev => ({
      ...prev,
      initialProblems: reorderedProblems
    }));
  }, [formData.initialProblems]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      let result: ProblemSet | null = null;
      
      if (mode === 'create') {
        result = await createProblemSet(formData);
      } else if (mode === 'edit' && problemSetId) {
        const updateData: UpdateProblemSetRequest['updates'] = {
          title: formData.title,
          description: formData.description,
          isPublic: formData.isPublic,
          isShared: formData.isShared
        };
        result = await updateProblemSet(problemSetId, updateData);
      }
      
      if (result && onSave) {
        onSave(result);
      }
    } catch (error: any) {
      const errorMessage = error.message || '문제집 저장에 실패했습니다.';
      if (onError) {
        onError(errorMessage);
      } else {
        alert(errorMessage);
      }
    }
  }, [mode, formData, problemSetId, validateForm, createProblemSet, updateProblemSet, onSave, onError]);

  // Handle form cancellation
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  // Get already selected problem IDs to exclude from selector
  const selectedProblemIds = formData.initialProblems?.map(p => p.problemId) || [];

  return (
    <div className="problem-set-form-container">
      {/* Form Header */}
      <div className="form-header">
        <h2>
          {mode === 'create' ? '새 문제집 만들기' : '문제집 수정'}
        </h2>
      </div>

      {/* Error display */}
      {state.error && (
        <div className="error-banner">
          <p>{state.error}</p>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="problem-set-form">
        <ProblemSetForm
          mode={mode}
          formData={formData}
          validationErrors={validationErrors}
          loading={state.loading}
          onFieldChange={handleFieldChange}
          onAddProblem={() => setShowProblemSelector(true)}
          onRemoveProblem={handleRemoveProblem}
          onReorderProblems={handleReorderProblems}
        />
        
        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="submit"
            disabled={state.loading}
            className="save-button"
          >
            {state.loading 
              ? (mode === 'create' ? '생성 중...' : '수정 중...') 
              : (mode === 'create' ? '문제집 생성' : '수정 완료')
            }
          </button>
          
          <button
            type="button"
            onClick={handleCancel}
            disabled={state.loading}
            className="cancel-button"
          >
            취소
          </button>
        </div>
      </form>

      {/* Problem Selector Modal */}
      {showProblemSelector && (
        <ProblemSelector
          onProblemSelect={handleAddProblem}
          onClose={() => setShowProblemSelector(false)}
          excludeProblemIds={selectedProblemIds}
          multiSelect={true}
        />
      )}
    </div>
  );
};