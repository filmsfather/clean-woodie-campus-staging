import React, { useCallback } from 'react';
import { useProblemSearch } from '../../hooks';
import { ProblemSearch } from '../../components/problems/ProblemSearch';
import { ProblemList } from '../../components/problems';
import type { Problem, ProblemSearchFilters as SearchFilters } from '../../hooks';

interface ProblemSearchContainerProps {
  initialSearchTerm?: string;
  initialFilters?: SearchFilters;
  onProblemSelect?: (problem: Problem) => void;
  onProblemEdit?: (problemId: string) => void;
  showAdvancedFilters?: boolean;
  autoSearch?: boolean;
  pageSize?: number;
}

/**
 * 문제 검색 컨테이너
 * 문제 검색 기능과 결과 표시를 통합 관리
 */
export const ProblemSearchContainer: React.FC<ProblemSearchContainerProps> = ({
  initialSearchTerm = '',
  initialFilters = {},
  onProblemSelect,
  onProblemEdit,
  showAdvancedFilters = true,
  autoSearch = true,
  pageSize = 20
}) => {
  // Use problem search hook
  const {
    state,
    problems,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    search,
    loadMore,
    clearSearch,
    clearError,
    hasResults,
    isSearching,
    canLoadMore
  } = useProblemSearch({
    initialSearchTerm,
    initialFilters,
    pageSize,
    debounceMs: 300
  });

  // Handle search input changes
  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, [setSearchTerm]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
  }, [setFilters]);

  // Handle manual search trigger
  const handleSearch = useCallback(() => {
    search(searchTerm, filters);
  }, [search, searchTerm, filters]);

  // Handle problem selection
  const handleProblemSelect = useCallback((problem: Problem) => {
    if (onProblemSelect) {
      onProblemSelect(problem);
    }
  }, [onProblemSelect]);

  // Handle problem edit
  const handleProblemEdit = useCallback((problem: Problem) => {
    if (onProblemEdit) {
      onProblemEdit(problem.id);
    }
  }, [onProblemEdit]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (canLoadMore) {
      loadMore();
    }
  }, [loadMore, canLoadMore]);

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    clearSearch();
  }, [clearSearch]);

  return (
    <div className="problem-search-container">
      {/* Error display */}
      {state.error && (
        <div className="error-banner">
          <p>{state.error}</p>
          <button onClick={clearError}>닫기</button>
        </div>
      )}

      {/* Search Interface */}
      <div className="search-section">
        <ProblemSearch
          searchTerm={searchTerm}
          filters={filters}
          onSearchChange={handleSearchChange}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          onClear={handleClearSearch}
          isLoading={isSearching}
          showAdvancedFilters={showAdvancedFilters}
          autoSearch={autoSearch}
        />
      </div>

      {/* Search Results */}
      <div className="results-section">
        {hasResults ? (
          <>
            {/* Search Metadata */}
            {state.searchMetadata && (
              <div className="search-metadata">
                <p>
                  {state.searchMetadata.searchTerm && 
                    `"${state.searchMetadata.searchTerm}"에 대한 `
                  }
                  검색 결과 {state.totalCount}개
                  {state.searchMetadata.searchDurationMs && 
                    ` (${(state.searchMetadata.searchDurationMs / 1000).toFixed(2)}초)`
                  }
                </p>
                {state.searchMetadata.appliedFilters.length > 0 && (
                  <p>적용된 필터: {state.searchMetadata.appliedFilters.join(', ')}</p>
                )}
              </div>
            )}

            {/* Results List */}
            <ProblemList
              problems={problems}
              loading={isSearching}
              totalCount={state.totalCount}
              currentPage={state.currentPage}
              hasNext={state.hasNext}
              onProblemSelect={handleProblemSelect}
              onProblemEdit={handleProblemEdit}
              showPagination={false} // Search uses load more instead
            />

            {/* Load More Button */}
            {canLoadMore && (
              <div className="load-more-section">
                <button 
                  onClick={handleLoadMore}
                  disabled={isSearching}
                  className="load-more-button"
                >
                  {isSearching ? '로딩 중...' : '더 보기'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="no-results">
            {searchTerm || Object.keys(filters).length > 0 ? (
              <div className="empty-results">
                <p>검색 결과가 없습니다.</p>
                <p>다른 검색어나 필터를 시도해보세요.</p>
                <button onClick={handleClearSearch}>
                  검색 초기화
                </button>
              </div>
            ) : (
              <div className="search-placeholder">
                <p>문제를 검색해보세요.</p>
                <p>제목, 내용, 태그 등으로 검색할 수 있습니다.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};