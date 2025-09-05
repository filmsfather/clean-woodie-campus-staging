// Command UseCase들에 대응하는 액션 버튼 컴포넌트들
import React from 'react';
import { ProblemDto, ProblemActions } from '../../../types/problems';
import { FeatureGuard } from '../../auth/FeatureGuard';

interface ProblemActionButtonsProps {
  problem: ProblemDto;
  actions: ProblemActions;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'horizontal' | 'vertical' | 'dropdown';
}

export const ProblemActionButtons: React.FC<ProblemActionButtonsProps> = ({
  problem,
  actions,
  isLoading = false,
  size = 'md',
  layout = 'horizontal'
}) => {
  const buttonClass = `btn-${size}`;
  const containerClass = `problem-actions ${layout}`;

  const handleActivate = () => {
    actions.activate({
      problemId: problem.id,
      teacherId: problem.teacherId
    });
  };

  const handleDeactivate = () => {
    actions.deactivate({
      problemId: problem.id,
      teacherId: problem.teacherId
    });
  };

  const handleDelete = () => {
    if (window.confirm('정말로 이 문제를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      actions.delete({
        problemId: problem.id,
        teacherId: problem.teacherId
      });
    }
  };

  const handleClone = () => {
    actions.clone({
      problemId: problem.id,
      requesterId: problem.teacherId // 임시로 자신을 요청자로 설정
    });
  };

  if (layout === 'dropdown') {
    return (
      <div className="dropdown-container">
        <button className={`${buttonClass} dropdown-toggle`} disabled={isLoading}>
          작업 ▼
        </button>
        <div className="dropdown-menu">
          <FeatureGuard feature="problemCloning">
            <button 
              onClick={handleClone}
              disabled={isLoading}
              className="dropdown-item"
            >
              복제
            </button>
          </FeatureGuard>
          
          {problem.isActive ? (
            <FeatureGuard feature="problemDeactivation">
              <button 
                onClick={handleDeactivate}
                disabled={isLoading}
                className="dropdown-item warning"
              >
                비활성화
              </button>
            </FeatureGuard>
          ) : (
            <FeatureGuard feature="problemActivation">
              <button 
                onClick={handleActivate}
                disabled={isLoading}
                className="dropdown-item success"
              >
                활성화
              </button>
            </FeatureGuard>
          )}
          
          <FeatureGuard feature="problemDeletion">
            <button 
              onClick={handleDelete}
              disabled={isLoading}
              className="dropdown-item danger"
            >
              삭제
            </button>
          </FeatureGuard>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <FeatureGuard feature="problemCloning">
        <button 
          onClick={handleClone}
          disabled={isLoading}
          className={`${buttonClass} btn-secondary`}
          title="문제 복제"
        >
          복제
        </button>
      </FeatureGuard>
      
      {problem.isActive ? (
        <FeatureGuard feature="problemDeactivation">
          <button 
            onClick={handleDeactivate}
            disabled={isLoading}
            className={`${buttonClass} btn-warning`}
            title="문제 비활성화"
          >
            비활성화
          </button>
        </FeatureGuard>
      ) : (
        <FeatureGuard feature="problemActivation">
          <button 
            onClick={handleActivate}
            disabled={isLoading}
            className={`${buttonClass} btn-success`}
            title="문제 활성화"
          >
            활성화
          </button>
        </FeatureGuard>
      )}
      
      <FeatureGuard feature="problemDeletion">
        <button 
          onClick={handleDelete}
          disabled={isLoading}
          className={`${buttonClass} btn-danger`}
          title="문제 삭제"
        >
          삭제
        </button>
      </FeatureGuard>
    </div>
  );
};

// 개별 액션 버튼 컴포넌트들
interface SingleActionProps {
  problem: ProblemDto;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const ActivateProblemButton: React.FC<SingleActionProps & { 
  onActivate: (input: { problemId: string; teacherId: string }) => Promise<void> 
}> = ({
  problem,
  onActivate,
  isLoading = false,
  size = 'md',
  onSuccess,
  onError
}) => {
  const handleClick = async () => {
    try {
      await onActivate({
        problemId: problem.id,
        teacherId: problem.teacherId
      });
      onSuccess?.();
    } catch (error) {
      onError?.(error instanceof Error ? error.message : '활성화 중 오류가 발생했습니다');
    }
  };

  return (
    <FeatureGuard feature="problemActivation">
      <button 
        onClick={handleClick}
        disabled={isLoading || problem.isActive}
        className={`btn-${size} btn-success`}
        title="문제 활성화"
      >
        {isLoading ? '처리 중...' : '활성화'}
      </button>
    </FeatureGuard>
  );
};

export const DeactivateProblemButton: React.FC<SingleActionProps & { 
  onDeactivate: (input: { problemId: string; teacherId: string }) => Promise<void> 
}> = ({
  problem,
  onDeactivate,
  isLoading = false,
  size = 'md',
  onSuccess,
  onError
}) => {
  const handleClick = async () => {
    try {
      await onDeactivate({
        problemId: problem.id,
        teacherId: problem.teacherId
      });
      onSuccess?.();
    } catch (error) {
      onError?.(error instanceof Error ? error.message : '비활성화 중 오류가 발생했습니다');
    }
  };

  return (
    <FeatureGuard feature="problemDeactivation">
      <button 
        onClick={handleClick}
        disabled={isLoading || !problem.isActive}
        className={`btn-${size} btn-warning`}
        title="문제 비활성화"
      >
        {isLoading ? '처리 중...' : '비활성화'}
      </button>
    </FeatureGuard>
  );
};

export const CloneProblemButton: React.FC<SingleActionProps & { 
  onClone: (input: { problemId: string; requesterId: string }) => Promise<void> 
}> = ({
  problem,
  onClone,
  isLoading = false,
  size = 'md',
  onSuccess,
  onError
}) => {
  const handleClick = async () => {
    try {
      await onClone({
        problemId: problem.id,
        requesterId: problem.teacherId
      });
      onSuccess?.();
    } catch (error) {
      onError?.(error instanceof Error ? error.message : '복제 중 오류가 발생했습니다');
    }
  };

  return (
    <FeatureGuard feature="problemCloning">
      <button 
        onClick={handleClick}
        disabled={isLoading}
        className={`btn-${size} btn-secondary`}
        title="문제 복제"
      >
        {isLoading ? '복제 중...' : '복제'}
      </button>
    </FeatureGuard>
  );
};

export const DeleteProblemButton: React.FC<SingleActionProps & { 
  onDelete: (input: { problemId: string; teacherId: string }) => Promise<void> 
}> = ({
  problem,
  onDelete,
  isLoading = false,
  size = 'md',
  onSuccess,
  onError
}) => {
  const handleClick = async () => {
    const confirmed = window.confirm(
      `정말로 "${problem.title}" 문제를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
    );
    
    if (!confirmed) return;
    
    try {
      await onDelete({
        problemId: problem.id,
        teacherId: problem.teacherId
      });
      onSuccess?.();
    } catch (error) {
      onError?.(error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다');
    }
  };

  return (
    <FeatureGuard feature="problemDeletion">
      <button 
        onClick={handleClick}
        disabled={isLoading}
        className={`btn-${size} btn-danger`}
        title="문제 삭제"
      >
        {isLoading ? '삭제 중...' : '삭제'}
      </button>
    </FeatureGuard>
  );
};