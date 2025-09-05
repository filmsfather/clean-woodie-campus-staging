import React, { useCallback, useState } from 'react';
import { useProblems } from '../../hooks';
import { CreateProblemForm } from '../../components/problems/forms/CreateProblemForm';
import type { Problem, CreateProblemRequest } from '../../services/api';

interface ProblemFormContainerProps {
  onProblemCreated?: (problem: Problem) => void;
  onCancel?: () => void;
  initialData?: Partial<CreateProblemRequest>;
  showSuccessMessage?: boolean;
}

/**
 * 문제 생성 폼 컨테이너
 * 문제 생성 로직과 폼 상태를 관리
 */
export const ProblemFormContainer: React.FC<ProblemFormContainerProps> = ({
  onProblemCreated,
  onCancel,
  initialData = {},
  showSuccessMessage = true
}) => {
  // Local state for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Use problems hook for creation
  const { createProblem } = useProblems();

  // Handle form submission
  const handleSubmit = useCallback(async (formData: CreateProblemRequest) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      const newProblem = await createProblem(formData);
      
      if (newProblem) {
        if (showSuccessMessage) {
          setSuccessMessage(`"${newProblem.title}" 문제가 성공적으로 생성되었습니다.`);
        }
        
        if (onProblemCreated) {
          onProblemCreated(newProblem);
        }
      } else {
        throw new Error('문제 생성에 실패했습니다');
      }
    } catch (error: any) {
      setSubmitError(error.message || '문제 생성 중 오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  }, [createProblem, onProblemCreated, showSuccessMessage]);

  // Handle form cancellation
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  // Clear messages
  const clearError = useCallback(() => {
    setSubmitError(null);
  }, []);

  const clearSuccess = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  return (
    <div className="problem-form-container">
      {/* Success message */}
      {successMessage && (
        <div className="success-banner">
          <p>{successMessage}</p>
          <button onClick={clearSuccess}>닫기</button>
        </div>
      )}

      {/* Error message */}
      {submitError && (
        <div className="error-banner">
          <p>{submitError}</p>
          <button onClick={clearError}>닫기</button>
        </div>
      )}

      {/* Form */}
      <div className="form-content">
        <CreateProblemForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};