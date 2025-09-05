import React, { useState, useCallback, useEffect } from 'react';
import { useProblemSetDetail } from '../../hooks';
import { ProblemSetDetail } from '../../components/problemsets';
import { ProblemSetEditor } from '../../components/problemsets/ProblemSetEditor';
import { ProblemSelector } from '../../components/problems/ProblemSelector';
import type { 
  DetailedProblemSet, 
  ProblemSetItem, 
  ProblemSetPermissions,
  Problem 
} from '../../services/api';

interface ProblemSetDetailContainerProps {
  problemSetId: string;
  mode?: 'view' | 'edit';
  onModeChange?: (mode: 'view' | 'edit') => void;
  onProblemSetUpdate?: (problemSet: DetailedProblemSet) => void;
  onProblemSetDelete?: (problemSetId: string) => void;
  onNavigateBack?: () => void;
  showEditButton?: boolean;
  showDeleteButton?: boolean;
}

/**
 * 문제집 상세 컨테이너
 * 문제집 상세 정보 조회, 편집, 문제 관리 기능을 통합 관리
 */
export const ProblemSetDetailContainer: React.FC<ProblemSetDetailContainerProps> = ({
  problemSetId,
  mode = 'view',
  onModeChange,
  onProblemSetUpdate,
  onProblemSetDelete,
  onNavigateBack,
  showEditButton = true,
  showDeleteButton = true
}) => {
  // Local state
  const [currentMode, setCurrentMode] = useState<'view' | 'edit'>(mode);
  const [showProblemSelector, setShowProblemSelector] = useState(false);
  const [editingItem, setEditingItem] = useState<ProblemSetItem | null>(null);

  // Use problem set detail hook
  const {
    state,
    problemSet,
    permissions,
    loadProblemSet,
    addProblem,
    removeProblem,
    reorderProblems,
    refresh,
    clearError
  } = useProblemSetDetail({
    problemSetId,
    autoLoad: true,
    includeItems: true
  });

  // Handle mode changes
  const handleModeChange = useCallback((newMode: 'view' | 'edit') => {
    setCurrentMode(newMode);
    if (onModeChange) {
      onModeChange(newMode);
    }
  }, [onModeChange]);

  // Handle problem set update
  const handleProblemSetUpdate = useCallback((updatedProblemSet: DetailedProblemSet) => {
    if (onProblemSetUpdate) {
      onProblemSetUpdate(updatedProblemSet);
    }
    // Refresh to get latest data
    refresh();
    setCurrentMode('view');
  }, [onProblemSetUpdate, refresh]);

  // Handle problem set deletion
  const handleProblemSetDelete = useCallback(() => {
    if (!problemSet) return;
    
    const confirmMessage = problemSet.itemCount > 0
      ? `"${problemSet.title}" 문제집에는 ${problemSet.itemCount}개의 문제가 있습니다. 정말 삭제하시겠습니까?`
      : `"${problemSet.title}" 문제집을 정말 삭제하시겠습니까?`;
    
    if (window.confirm(confirmMessage)) {
      if (onProblemSetDelete) {
        onProblemSetDelete(problemSet.id);
      }
    }
  }, [problemSet, onProblemSetDelete]);

  // Handle adding problems
  const handleAddProblem = useCallback((problem: Problem, options?: { orderIndex?: number; points?: number }) => {
    addProblem({
      problemId: problem.id,
      orderIndex: options?.orderIndex,
      points: options?.points || 100 // Default points
    });
    setShowProblemSelector(false);
  }, [addProblem]);

  // Handle removing problems
  const handleRemoveProblem = useCallback((problemId: string) => {
    if (window.confirm('이 문제를 문제집에서 제거하시겠습니까?')) {
      removeProblem(problemId);
    }
  }, [removeProblem]);

  // Handle problem reordering
  const handleReorderProblems = useCallback((orderedProblemIds: string[]) => {
    reorderProblems(orderedProblemIds);
  }, [reorderProblems]);

  // Handle item editing
  const handleEditItem = useCallback((item: ProblemSetItem) => {
    setEditingItem(item);
  }, []);

  const handleSaveItemEdit = useCallback(async (updatedItem: Partial<ProblemSetItem>) => {
    if (!editingItem) return;
    
    // In a real implementation, you would have an API call to update the item
    // For now, we'll just refresh the problem set
    setEditingItem(null);
    refresh();
  }, [editingItem, refresh]);

  const handleCancelItemEdit = useCallback(() => {
    setEditingItem(null);
  }, []);

  // Handle duplicate item
  const handleDuplicateItem = useCallback((item: ProblemSetItem) => {
    if (problemSet && problemSet.items) {
      const newOrderIndex = Math.max(...problemSet.items.map(i => i.orderIndex)) + 1;
      addProblem({
        problemId: item.problemId,
        orderIndex: newOrderIndex,
        points: item.points
      });
    }
  }, [problemSet, addProblem]);

  // Check permissions
  const canEdit = permissions?.canWrite ?? false;
  const canDelete = permissions?.canDelete ?? false;

  // Update local mode when prop changes
  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  // Render loading state
  if (state.loading && !problemSet) {
    return (
      <div className="problem-set-detail-container loading">
        <div className="loading-spinner">문제집을 불러오는 중...</div>
      </div>
    );
  }

  // Render error state
  if (state.error) {
    return (
      <div className="problem-set-detail-container error">
        <div className="error-message">
          <h3>오류가 발생했습니다</h3>
          <p>{state.error}</p>
          <div className="error-actions">
            <button onClick={refresh} className="retry-button">
              다시 시도
            </button>
            <button onClick={clearError} className="dismiss-button">
              닫기
            </button>
            {onNavigateBack && (
              <button onClick={onNavigateBack} className="back-button">
                돌아가기
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render not found state
  if (!state.loading && !problemSet) {
    return (
      <div className="problem-set-detail-container not-found">
        <div className="not-found-message">
          <h3>문제집을 찾을 수 없습니다</h3>
          <p>요청하신 문제집이 존재하지 않거나 접근 권한이 없습니다.</p>
          {onNavigateBack && (
            <button onClick={onNavigateBack} className="back-button">
              돌아가기
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="problem-set-detail-container">
      {/* Header with navigation and actions */}
      <div className="detail-header">
        {onNavigateBack && (
          <button onClick={onNavigateBack} className="back-button">
            ← 돌아가기
          </button>
        )}
        
        <div className="header-actions">
          {currentMode === 'view' && canEdit && showEditButton && (
            <button 
              onClick={() => handleModeChange('edit')} 
              className="edit-button"
            >
              편집
            </button>
          )}
          
          {currentMode === 'edit' && (
            <>
              <button 
                onClick={() => handleModeChange('view')} 
                className="cancel-button"
              >
                취소
              </button>
            </>
          )}
          
          {canDelete && showDeleteButton && (
            <button 
              onClick={handleProblemSetDelete} 
              className="delete-button"
            >
              삭제
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="detail-content">
        {currentMode === 'view' ? (
          <ProblemSetDetail
            problemSet={problemSet!}
            permissions={permissions!}
            loading={state.loading}
            onAddProblem={canEdit ? () => setShowProblemSelector(true) : undefined}
            onRemoveProblem={canEdit ? handleRemoveProblem : undefined}
            onReorderProblems={canEdit ? handleReorderProblems : undefined}
            onEditItem={canEdit ? handleEditItem : undefined}
            onDuplicateItem={canEdit ? handleDuplicateItem : undefined}
            onRefresh={refresh}
          />
        ) : (
          <ProblemSetEditor
            problemSet={problemSet!}
            onSave={handleProblemSetUpdate}
            onCancel={() => handleModeChange('view')}
            loading={state.loading}
          />
        )}
      </div>

      {/* Problem Selector Modal */}
      {showProblemSelector && canEdit && (
        <ProblemSelector
          onProblemSelect={handleAddProblem}
          onClose={() => setShowProblemSelector(false)}
          excludeProblemIds={problemSet?.items.map(item => item.problemId) || []}
        />
      )}

      {/* Item Edit Modal */}
      {editingItem && (
        <div className="item-edit-modal">
          <div className="modal-content">
            <h3>문제 설정 편집</h3>
            <div className="edit-form">
              {/* This would contain form fields for editing the problem set item */}
              <div className="form-actions">
                <button 
                  onClick={() => handleSaveItemEdit({})} 
                  className="save-button"
                >
                  저장
                </button>
                <button 
                  onClick={handleCancelItemEdit} 
                  className="cancel-button"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};