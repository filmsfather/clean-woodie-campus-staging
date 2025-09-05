import React from 'react';
import type { DetailedProblemSet, ProblemSetPermissions, ProblemSetItem } from '../../services/api';

export interface ProblemSetDetailProps {
  problemSet: DetailedProblemSet;
  permissions: ProblemSetPermissions;
  loading?: boolean;
  onAddProblem?: () => void;
  onRemoveProblem?: (problemId: string) => void;
  onReorderProblems?: (orderedProblemIds: string[]) => void;
  onEditItem?: (item: ProblemSetItem) => void;
  onDuplicateItem?: (item: ProblemSetItem) => void;
  onRefresh?: () => void;
}

export const ProblemSetDetail: React.FC<ProblemSetDetailProps> = ({
  problemSet,
  permissions,
  loading = false,
  onAddProblem,
  onRemoveProblem,
  onReorderProblems,
  onEditItem,
  onDuplicateItem,
  onRefresh
}) => {
  return (
    <div className="problem-set-detail">
      <div className="problem-set-header">
        <h2>{problemSet.title}</h2>
        {problemSet.description && (
          <p className="description">{problemSet.description}</p>
        )}
      </div>
      
      <div className="problem-set-meta">
        <span>문제 수: {problemSet.itemCount}</span>
        <span>공개: {problemSet.isPublic ? '예' : '아니오'}</span>
        <span>공유: {problemSet.isShared ? '예' : '아니오'}</span>
      </div>
      
      <div className="problem-set-items">
        <h3>포함된 문제들</h3>
        {problemSet.items.map((item, index) => (
          <div key={item.id} className="problem-item">
            <span>{index + 1}. {item.problemTitle || item.problemId}</span>
            <span>점수: {item.points}</span>
            {permissions.canWrite && (
              <div className="item-actions">
                {onEditItem && (
                  <button onClick={() => onEditItem(item)}>편집</button>
                )}
                {onDuplicateItem && (
                  <button onClick={() => onDuplicateItem(item)}>복제</button>
                )}
                {onRemoveProblem && (
                  <button onClick={() => onRemoveProblem(item.problemId)}>제거</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {permissions.canWrite && onAddProblem && (
        <button onClick={onAddProblem} className="add-problem-btn">
          문제 추가
        </button>
      )}
      
      {onRefresh && (
        <button onClick={onRefresh} disabled={loading}>
          {loading ? '새로고침 중...' : '새로고침'}
        </button>
      )}
    </div>
  );
};