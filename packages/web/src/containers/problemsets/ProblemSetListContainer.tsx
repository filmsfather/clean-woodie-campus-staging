import React, { useState, useCallback } from 'react';
import { useProblemSets } from '../../hooks';
import { ProblemSetList } from '../../components/problemsets';
import { FilterPanel, FilterConfig, ActiveFilters } from '../../components/problems/FilterPanel';
import type { ProblemSet, GetProblemSetListRequest } from '../../services/api';

interface ProblemSetListContainerProps {
  initialFilter?: GetProblemSetListRequest;
  onProblemSetSelect?: (problemSet: ProblemSet) => void;
  onProblemSetEdit?: (problemSetId: string) => void;
  onProblemSetDelete?: (problemSetId: string) => void;
  onProblemSetClone?: (problemSetId: string) => void;
  showFilters?: boolean;
  pageSize?: number;
}

/**
 * 문제집 목록 컨테이너
 * 문제집 목록과 필터링 기능을 통합 관리
 */
export const ProblemSetListContainer: React.FC<ProblemSetListContainerProps> = ({
  initialFilter = {},
  onProblemSetSelect,
  onProblemSetEdit,
  onProblemSetDelete,
  onProblemSetClone,
  showFilters = true,
  pageSize = 20
}) => {
  // Local state for filters
  const [activeFilters, setActiveFilters] = useState<GetProblemSetListRequest>(initialFilter);

  // Filter configuration for FilterPanel
  const filterConfigs: FilterConfig[] = [
    {
      id: 'isPublic',
      label: '공개 문제집만',
      type: 'checkbox',
      defaultValue: false
    },
    {
      id: 'isShared',
      label: '공유된 문제집만',
      type: 'checkbox',
      defaultValue: false
    },
    {
      id: 'teacherId',
      label: '담당 교사',
      type: 'select',
      placeholder: '교사를 선택하세요'
    },
    {
      id: 'search',
      label: '검색',
      type: 'text',
      placeholder: '문제집 제목 또는 설명으로 검색'
    }
  ];

  // Use problem sets hook
  const {
    state,
    problemSets,
    loadProblemSets,
    createProblemSet,
    updateProblemSet,
    deleteProblemSet,
    cloneProblemSet,
    refresh,
    clearError,
    setPagination
  } = useProblemSets({
    autoLoad: true,
    initialFilter: { 
      ...initialFilter, 
      pagination: { page: 1, limit: pageSize }
    }
  });

  // Handle filter changes
  const handleFilterChange = useCallback((filters: ActiveFilters) => {
    // Convert ActiveFilters to GetProblemSetListRequest
    const problemSetFilters: GetProblemSetListRequest = {
      filters: {
        isPublic: filters.isPublic || undefined,
        isShared: filters.isShared || undefined,
        teacherId: filters.teacherId || undefined,
        search: filters.search || undefined
      },
      pagination: { page: 1, limit: pageSize }
    };
    
    setActiveFilters(problemSetFilters);
    loadProblemSets(problemSetFilters);
  }, [loadProblemSets, pageSize]);

  // Handle problem set actions
  const handleProblemSetEdit = useCallback((problemSet: ProblemSet) => {
    if (onProblemSetEdit) {
      onProblemSetEdit(problemSet.id);
    }
  }, [onProblemSetEdit]);

  const handleProblemSetDelete = useCallback(async (problemSet: ProblemSet) => {
    const confirmMessage = problemSet.itemCount > 0
      ? `"${problemSet.title}" 문제집에는 ${problemSet.itemCount}개의 문제가 있습니다. 정말 삭제하시겠습니까?`
      : `"${problemSet.title}" 문제집을 정말 삭제하시겠습니까?`;
    
    if (window.confirm(confirmMessage)) {
      const success = await deleteProblemSet(problemSet.id, problemSet.itemCount === 0);
      if (success && onProblemSetDelete) {
        onProblemSetDelete(problemSet.id);
      }
    }
  }, [deleteProblemSet, onProblemSetDelete]);

  const handleProblemSetClone = useCallback(async (problemSet: ProblemSet) => {
    const newTitle = prompt(
      '복제할 문제집의 제목을 입력하세요:', 
      `${problemSet.title} (복사본)`
    );
    
    if (newTitle && newTitle.trim()) {
      const clonedProblemSet = await cloneProblemSet(problemSet.id, {
        newTitle: newTitle.trim()
      });
      
      if (clonedProblemSet) {
        console.log('문제집이 성공적으로 복제되었습니다:', clonedProblemSet);
        if (onProblemSetClone) {
          onProblemSetClone(clonedProblemSet.id);
        }
      }
    }
  }, [cloneProblemSet, onProblemSetClone]);

  const handleTogglePublic = useCallback(async (problemSet: ProblemSet) => {
    const updatedProblemSet = await updateProblemSet(problemSet.id, {
      isPublic: !problemSet.isPublic
    });
    
    if (updatedProblemSet) {
      console.log(`문제집이 ${updatedProblemSet.isPublic ? '공개' : '비공개'}로 변경되었습니다.`);
    }
  }, [updateProblemSet]);

  const handleToggleShared = useCallback(async (problemSet: ProblemSet) => {
    const updatedProblemSet = await updateProblemSet(problemSet.id, {
      isShared: !problemSet.isShared
    });
    
    if (updatedProblemSet) {
      console.log(`문제집이 ${updatedProblemSet.isShared ? '공유됨' : '공유 해제'}로 변경되었습니다.`);
    }
  }, [updateProblemSet]);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    setPagination(page);
  }, [setPagination]);

  // Handle problem set selection
  const handleProblemSetSelect = useCallback((problemSet: ProblemSet) => {
    if (onProblemSetSelect) {
      onProblemSetSelect(problemSet);
    }
  }, [onProblemSetSelect]);

  // Handle sorting
  const handleSortChange = useCallback((field: string, order: 'asc' | 'desc') => {
    const newFilter = {
      ...activeFilters,
      sorting: {
        field: field as 'title' | 'createdAt' | 'updatedAt' | 'itemCount',
        order
      }
    };
    setActiveFilters(newFilter);
    loadProblemSets(newFilter);
  }, [activeFilters, loadProblemSets]);

  return (
    <div className="problem-set-list-container">
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
            activeFilters={activeFilters.filters || {}}
            onFiltersChange={handleFilterChange}
            onReset={() => handleFilterChange({})}
          />
        </div>
      )}

      {/* Problem Set List */}
      <div className="problem-sets-section">
        <ProblemSetList
          problemSets={problemSets}
          loading={state.loading}
          totalCount={state.totalCount}
          currentPage={state.currentPage}
          hasNext={state.hasNext}
          hasPrevious={state.hasPrevious}
          onProblemSetSelect={handleProblemSetSelect}
          onProblemSetEdit={handleProblemSetEdit}
          onProblemSetDelete={handleProblemSetDelete}
          onProblemSetClone={handleProblemSetClone}
          onTogglePublic={handleTogglePublic}
          onToggleShared={handleToggleShared}
          onPageChange={handlePageChange}
          onSortChange={handleSortChange}
          onRefresh={refresh}
        />
      </div>
    </div>
  );
};