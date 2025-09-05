import React, { useState, useCallback } from 'react';
import { useProblems } from '../../hooks';
import { ProblemList } from '../../components/problems';
import { FilterPanel, FilterConfig, ActiveFilters } from '../../components/problems/FilterPanel';
import type { Problem, GetProblemListRequest } from '../../services/api';

interface ProblemListContainerProps {
  initialFilter?: GetProblemListRequest;
  onProblemSelect?: (problem: Problem) => void;
  onProblemEdit?: (problemId: string) => void;
  onProblemDelete?: (problemId: string) => void;
  showFilters?: boolean;
  pageSize?: number;
}

/**
 * 문제 목록 컨테이너
 * 문제 목록과 필터링 기능을 통합 관리
 */
export const ProblemListContainer: React.FC<ProblemListContainerProps> = ({
  initialFilter = {},
  onProblemSelect,
  onProblemEdit,
  onProblemDelete,
  showFilters = true,
  pageSize = 20
}) => {
  // Local state for filters
  const [activeFilters, setActiveFilters] = useState<GetProblemListRequest>(initialFilter);

  // Filter configuration for FilterPanel
  const filterConfigs: FilterConfig[] = [
    {
      id: 'includeInactive',
      label: '비활성 문제 포함',
      type: 'checkbox',
      defaultValue: false
    },
    {
      id: 'tags',
      label: '태그',
      type: 'tags',
      placeholder: '태그를 입력하세요 (쉼표로 구분)'
    },
    {
      id: 'difficultyRange',
      label: '난이도 범위',
      type: 'range',
      min: 1,
      max: 10
    }
  ];

  // Use problems hook
  const {
    state,
    problems,
    loadProblems,
    deleteProblem,
    activateProblem,
    deactivateProblem,
    cloneProblem,
    refresh,
    clearError,
    setPagination
  } = useProblems({
    autoLoad: true,
    initialFilter: { ...initialFilter, limit: pageSize }
  });

  // Handle filter changes
  const handleFilterChange = useCallback((filters: ActiveFilters) => {
    // Convert ActiveFilters to GetProblemListRequest
    const problemFilters: GetProblemListRequest = {
      includeInactive: filters.includeInactive || false,
      tags: filters.tags || undefined,
      difficultyRange: filters.difficultyRange || undefined,
      limit: pageSize
    };
    
    setActiveFilters(problemFilters);
    loadProblems(problemFilters);
  }, [loadProblems, pageSize]);

  // Handle problem actions
  const handleProblemEdit = useCallback((problem: Problem) => {
    if (onProblemEdit) {
      onProblemEdit(problem.id);
    }
  }, [onProblemEdit]);

  const handleProblemDelete = useCallback(async (problem: Problem) => {
    if (window.confirm(`"${problem.title}" 문제를 정말 삭제하시겠습니까?`)) {
      const success = await deleteProblem(problem.id);
      if (success && onProblemDelete) {
        onProblemDelete(problem.id);
      }
    }
  }, [deleteProblem, onProblemDelete]);

  const handleProblemClone = useCallback(async (problem: Problem) => {
    const clonedProblem = await cloneProblem(problem.id);
    if (clonedProblem) {
      // 성공 메시지 또는 리다이렉트 로직
      console.log('문제가 성공적으로 복제되었습니다:', clonedProblem);
    }
  }, [cloneProblem]);

  const handleToggleActivation = useCallback(async (problem: Problem) => {
    if (problem.isActive) {
      await deactivateProblem(problem.id);
    } else {
      await activateProblem(problem.id);
    }
  }, [activateProblem, deactivateProblem]);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    setPagination(page);
  }, [setPagination]);

  // Handle problem selection
  const handleProblemSelect = useCallback((problem: Problem) => {
    if (onProblemSelect) {
      onProblemSelect(problem);
    }
  }, [onProblemSelect]);

  return (
    <div className="problem-list-container">
      {/* Error display */}
      {state.error && (
        <div className="error-banner">
          <p>{state.error}</p>
          <button onClick={clearError}>닫기</button>
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <div className="filters-section">
          <FilterPanel 
            filters={filterConfigs}
            activeFilters={activeFilters}
            onFiltersChange={handleFilterChange}
            onReset={() => handleFilterChange({})}
          />
        </div>
      )}

      {/* Problem List */}
      <div className="problems-section">
        <ProblemList
          problems={problems}
          loading={state.loading}
          totalCount={state.totalCount}
          currentPage={state.currentPage}
          hasNext={state.hasNext}
          onProblemSelect={handleProblemSelect}
          onProblemEdit={handleProblemEdit}
          onProblemDelete={handleProblemDelete}
          onProblemClone={handleProblemClone}
          onToggleActivation={handleToggleActivation}
          onPageChange={handlePageChange}
          onRefresh={refresh}
        />
      </div>
    </div>
  );
};