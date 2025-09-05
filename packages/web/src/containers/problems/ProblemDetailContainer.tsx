import React, { useCallback, useEffect } from 'react';
import { useProblemDetail } from '../../hooks';
import { ProblemDetail } from '../../components/problems/ProblemDetail';
import { ProblemActionButtons } from '../../components/problems/actions/ProblemActionButtons';
import type { 
  Problem,
  UpdateProblemContentRequest,
  UpdateProblemAnswerRequest,
  ChangeProblemDifficultyRequest,
  ManageProblemTagsRequest
} from '../../services/api';

interface ProblemDetailContainerProps {
  problemId: string;
  onProblemUpdate?: (problem: Problem) => void;
  onProblemDelete?: (problemId: string) => void;
  onProblemClone?: (clonedProblem: Problem) => void;
  onBack?: () => void;
  showActions?: boolean;
  editable?: boolean;
}

/**
 * 문제 상세 정보 컨테이너
 * 문제 상세 보기, 편집, 액션 기능을 통합 관리
 */
export const ProblemDetailContainer: React.FC<ProblemDetailContainerProps> = ({
  problemId,
  onProblemUpdate,
  onProblemDelete,
  onProblemClone,
  onBack,
  showActions = true,
  editable = true
}) => {
  // Use problem detail hook
  const {
    state,
    problem,
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
  } = useProblemDetail({
    problemId,
    autoLoad: true,
    refreshInterval: 0 // 수동 새로고침만
  });

  // Load problem when problemId changes
  useEffect(() => {
    if (problemId) {
      loadProblem(problemId);
    }
  }, [problemId, loadProblem]);

  // Handle content update
  const handleContentUpdate = useCallback(async (data: UpdateProblemContentRequest) => {
    const success = await updateContent(data);
    if (success && problem && onProblemUpdate) {
      onProblemUpdate({ ...problem, ...data });
    }
    return success;
  }, [updateContent, problem, onProblemUpdate]);

  // Handle answer update
  const handleAnswerUpdate = useCallback(async (data: UpdateProblemAnswerRequest) => {
    const success = await updateAnswer(data);
    if (success && problem && onProblemUpdate) {
      onProblemUpdate(problem);
    }
    return success;
  }, [updateAnswer, problem, onProblemUpdate]);

  // Handle difficulty change
  const handleDifficultyChange = useCallback(async (data: ChangeProblemDifficultyRequest) => {
    const success = await changeDifficulty(data);
    if (success && problem && onProblemUpdate) {
      onProblemUpdate({ ...problem, difficulty: data.newDifficultyLevel });
    }
    return success;
  }, [changeDifficulty, problem, onProblemUpdate]);

  // Handle tags management
  const handleTagsUpdate = useCallback(async (data: ManageProblemTagsRequest) => {
    const success = await manageTags(data);
    if (success && problem && onProblemUpdate) {
      onProblemUpdate({ ...problem, tags: data.tags });
    }
    return success;
  }, [manageTags, problem, onProblemUpdate]);

  // Handle activation toggle
  const handleActivationToggle = useCallback(async () => {
    const success = isActive ? await deactivate() : await activate();
    if (success && problem && onProblemUpdate) {
      onProblemUpdate({ ...problem, isActive: !isActive });
    }
    return success;
  }, [activate, deactivate, isActive, problem, onProblemUpdate]);

  // Handle clone
  const handleClone = useCallback(async (newTeacherId?: string, preserveOriginalTags?: boolean) => {
    const clonedProblem = await clone(newTeacherId, preserveOriginalTags);
    if (clonedProblem && onProblemClone) {
      onProblemClone(clonedProblem);
    }
    return clonedProblem;
  }, [clone, onProblemClone]);

  // Handle delete (placeholder - actual deletion should be handled by parent)
  const handleDelete = useCallback(() => {
    if (problem && onProblemDelete) {
      onProblemDelete(problem.id);
    }
  }, [problem, onProblemDelete]);

  // Loading state
  if (state.loading && !problem) {
    return (
      <div className="problem-detail-container loading">
        <div className="loading-spinner">
          <p>문제를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (state.error && !problem) {
    return (
      <div className="problem-detail-container error">
        <div className="error-message">
          <h3>오류 발생</h3>
          <p>{state.error}</p>
          <div className="error-actions">
            <button onClick={() => loadProblem(problemId)}>
              다시 시도
            </button>
            {onBack && (
              <button onClick={onBack}>
                뒤로 가기
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // No problem state
  if (!problem) {
    return (
      <div className="problem-detail-container not-found">
        <div className="not-found-message">
          <h3>문제를 찾을 수 없습니다</h3>
          <p>요청한 문제가 존재하지 않거나 접근 권한이 없습니다.</p>
          {onBack && (
            <button onClick={onBack}>
              뒤로 가기
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="problem-detail-container">
      {/* Error displays */}
      {state.error && (
        <div className="error-banner">
          <p>{state.error}</p>
          <button onClick={clearError}>닫기</button>
        </div>
      )}

      {state.updateError && (
        <div className="update-error-banner">
          <p>{state.updateError}</p>
          <button onClick={clearUpdateError}>닫기</button>
        </div>
      )}

      {/* Header with actions */}
      {(showActions || onBack) && (
        <div className="detail-header">
          {onBack && (
            <button onClick={onBack} className="back-button">
              ← 뒤로
            </button>
          )}

          {showActions && (
            <ProblemActionButtons
              problem={problem}
              onEdit={editable ? () => {} : undefined} // Edit is handled inline
              onClone={handleClone}
              onToggleActivation={handleActivationToggle}
              onDelete={handleDelete}
              onRefresh={refresh}
              isLoading={state.updating}
              canEdit={canEdit && editable}
            />
          )}
        </div>
      )}

      {/* Problem Detail */}
      <div className="detail-content">
        <ProblemDetail
          problem={problem}
          editable={editable && canEdit}
          isUpdating={state.updating}
          onContentUpdate={handleContentUpdate}
          onAnswerUpdate={handleAnswerUpdate}
          onDifficultyChange={handleDifficultyChange}
          onTagsUpdate={handleTagsUpdate}
        />
      </div>
    </div>
  );
};