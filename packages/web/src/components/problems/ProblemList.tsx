// GetProblemListUseCase에 대응하는 목록 UI 컴포넌트
import React from 'react';
import type { Problem } from '../../services/api';
import { FeatureGuard } from '../auth/FeatureGuard';

interface ProblemListProps {
  problems: Problem[];
  loading?: boolean;
  error?: string | null;
  totalCount?: number;
  currentPage?: number;
  hasNext?: boolean;
  showPagination?: boolean;
  onProblemSelect?: (problem: Problem) => void;
  onProblemEdit?: (problem: Problem) => void;
  onProblemDelete?: (problem: Problem) => void;
  onProblemClone?: (problem: Problem) => void;
  onToggleActivation?: (problem: Problem) => void;
  onPageChange?: (page: number) => void;
  onRefresh?: () => void;
  onCreateNew?: () => void;
  // 대시보드 통합을 위한 새 props
  compact?: boolean;
  showActions?: ('edit' | 'stats' | 'assign' | 'clone' | 'delete' | 'toggle')[];
  limit?: number;
  mode?: 'default' | 'recommendation' | 'assignment';
  showDifficulty?: boolean;
}

export const ProblemList: React.FC<ProblemListProps> = ({
  problems,
  loading = false,
  error = null,
  totalCount = 0,
  currentPage = 1,
  hasNext = false,
  showPagination = true,
  onProblemSelect,
  onProblemEdit,
  onProblemDelete,
  onProblemClone,
  onToggleActivation,
  onPageChange,
  onRefresh,
  onCreateNew,
  compact = false,
  showActions = ['edit', 'clone', 'toggle', 'delete'],
  limit,
  mode = 'default',
  showDifficulty = false
}) => {
  // 표시할 문제 수 제한
  const displayProblems = limit ? problems.slice(0, limit) : problems;
  
  if (loading && problems.length === 0) {
    return <div className="loading">문제 목록을 불러오는 중...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>오류가 발생했습니다: {error}</p>
        {onRefresh && (
          <button onClick={onRefresh} className="retry-button">
            다시 시도
          </button>
        )}
      </div>
    );
  }

  // 컴팩트 모드일 때 간소화된 UI 반환
  if (compact) {
    return (
      <div className="space-y-2">
        {displayProblems.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            {loading ? '로딩 중...' : 
             mode === 'recommendation' ? '추천 문제가 없습니다' : 
             '문제가 없습니다'}
          </div>
        ) : (
          displayProblems.map((problem) => (
            <div key={problem.id} className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors cursor-pointer"
                 onClick={() => onProblemSelect?.(problem)}>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-sm">{problem.title}</h4>
                  {showDifficulty && (
                    <span className={`text-xs px-2 py-1 rounded ${
                      problem.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      problem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {problem.difficulty === 'easy' ? '쉬움' : 
                       problem.difficulty === 'medium' ? '보통' : '어려움'}
                    </span>
                  )}
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  {problem.type} • {problem.tags.slice(0, 2).map(tag => `#${tag}`).join(' ')}
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                {showActions.includes('stats') && (
                  <button className="text-xs text-blue-600 hover:text-blue-800">
                    통계
                  </button>
                )}
                {showActions.includes('assign') && mode !== 'recommendation' && (
                  <button className="text-xs text-green-600 hover:text-green-800">
                    배정
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        
        {limit && problems.length > limit && (
          <div className="text-center">
            <button className="text-xs text-blue-600 hover:text-blue-800">
              +{problems.length - limit}개 더 보기
            </button>
          </div>
        )}
      </div>
    );
  }
  
  if (problems.length === 0) {
    return (
      <div className="empty-state">
        <h3>등록된 문제가 없습니다</h3>
        <FeatureGuard feature="problemCreation">
          <button onClick={onCreateNew} className="btn-primary">
            첫 번째 문제 만들기
          </button>
        </FeatureGuard>
      </div>
    );
  }

  return (
    <div className="problem-list">
      <div className="list-header">
        <h2>문제 목록</h2>
        <div className="header-actions">
          <FeatureGuard feature="problemCreation">
            <button onClick={onCreateNew} className="btn-primary">
              새 문제 만들기
            </button>
          </FeatureGuard>
        </div>
      </div>

      <div className="list-content">
        {displayProblems.map((problem) => (
          <ProblemListItem
            key={problem.id}
            problem={problem}
            onSelect={() => onProblemSelect?.(problem)}
            onEdit={() => onProblemEdit?.(problem)}
            onClone={() => onProblemClone?.(problem)}
            onToggleActivation={() => onToggleActivation?.(problem)}
            onDelete={() => onProblemDelete?.(problem)}
          />
        ))}
      </div>

      {/* Pagination */}
      {showPagination && onPageChange && (
        <div className="pagination">
          <button 
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            className="btn-secondary"
          >
            이전
          </button>
          <span className="page-info">
            {currentPage} 페이지
          </span>
          <button 
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNext || loading}
            className="btn-secondary"
          >
            다음
          </button>
        </div>
      )}

      <div className="list-summary">
        총 {totalCount}개 문제 중 {problems.length}개 표시
        {loading && <span className="loading-indicator"> (로딩 중...)</span>}
      </div>
    </div>
  );
};

interface ProblemListItemProps {
  problem: Problem;
  onSelect?: () => void;
  onEdit?: () => void;
  onClone?: () => void;
  onToggleActivation?: () => void;
  onDelete?: () => void;
}

const ProblemListItem: React.FC<ProblemListItemProps> = ({
  problem,
  onSelect,
  onEdit,
  onClone,
  onToggleActivation,
  onDelete
}) => {

  return (
    <div className={`problem-item ${!problem.isActive ? 'inactive' : ''}`}>
      <div className="problem-info" onClick={onSelect}>
        <h4>{problem.title}</h4>
        {problem.description && (
          <p className="description">{problem.description}</p>
        )}
        <div className="problem-meta">
          <span className="type">{problem.type}</span>
          <span className="difficulty">난이도 {problem.difficulty}</span>
          <span className={`status ${problem.isActive ? 'active' : 'inactive'}`}>
            {problem.isActive ? '활성' : '비활성'}
          </span>
        </div>
        <div className="problem-tags">
          {problem.tags.map((tag, index) => (
            <span key={index} className="tag">#{tag}</span>
          ))}
        </div>
      </div>

      <div className="problem-actions">
        <button onClick={onEdit} className="btn-sm">편집</button>
        
        <FeatureGuard feature="problemCloning">
          <button onClick={onClone} className="btn-sm">복제</button>
        </FeatureGuard>
        
        <button 
          onClick={onToggleActivation} 
          className={`btn-sm ${problem.isActive ? 'btn-warning' : 'btn-success'}`}
        >
          {problem.isActive ? '비활성화' : '활성화'}
        </button>
        
        <FeatureGuard feature="problemDeletion">
          <button onClick={onDelete} className="btn-sm btn-danger">삭제</button>
        </FeatureGuard>
      </div>
    </div>
  );
};