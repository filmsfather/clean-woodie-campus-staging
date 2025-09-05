import { useState, useCallback, useMemo } from 'react';
import { problemApi } from '../services/api';
import type { 
  Problem, 
  SearchProblemsResponse,
  SearchProblemsRequest
} from '../services/api';

// Hook Options
export interface UseProblemSearchOptions {
  initialSearchTerm?: string;
  initialFilters?: Omit<SearchProblemsRequest, 'searchTerm' | 'page' | 'limit'>;
  pageSize?: number;
  debounceMs?: number;
}

// Hook State
export interface UseProblemSearchState {
  loading: boolean;
  error: string | null;
  problems: Problem[];
  totalCount: number;
  currentPage: number;
  hasNext: boolean;
  searchMetadata?: {
    searchTerm?: string;
    appliedFilters: string[];
    searchDurationMs: number;
  };
}

// Search Filters
export interface ProblemSearchFilters {
  tags?: string[];
  difficultyLevel?: number;
  difficultyRange?: { min: number; max: number };
  isActive?: boolean;
  createdAfter?: string;
  createdBefore?: string;
}

// Hook Return Type
export interface UseProblemSearchReturn {
  // State
  state: UseProblemSearchState;
  problems: Problem[];
  
  // Search Control
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: ProblemSearchFilters;
  setFilters: (filters: ProblemSearchFilters) => void;
  
  // Actions
  search: (term?: string, customFilters?: ProblemSearchFilters) => Promise<void>;
  loadMore: () => Promise<void>;
  clearSearch: () => void;
  clearError: () => void;
  
  // Computed
  hasResults: boolean;
  isSearching: boolean;
  canLoadMore: boolean;
}

/**
 * 문제 검색 커스텀 훅
 * 
 * @param options - 훅 설정 옵션
 * @returns 문제 검색 관련 상태와 액션들
 */
export const useProblemSearch = (options: UseProblemSearchOptions = {}): UseProblemSearchReturn => {
  const { 
    initialSearchTerm = '', 
    initialFilters = {}, 
    pageSize = 20,
    debounceMs = 300 
  } = options;

  // State
  const [searchTerm, setSearchTerm] = useState<string>(initialSearchTerm);
  const [filters, setFilters] = useState<ProblemSearchFilters>(initialFilters);
  const [state, setState] = useState<UseProblemSearchState>({
    loading: false,
    error: null,
    problems: [],
    totalCount: 0,
    currentPage: 1,
    hasNext: false
  });

  // Debounced search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>(initialSearchTerm);

  // Debounce effect
  useState(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  });

  // Search function
  const search = useCallback(async (
    term: string = debouncedSearchTerm,
    customFilters: ProblemSearchFilters = filters,
    page: number = 1,
    append: boolean = false
  ) => {
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null,
      ...(page === 1 && !append ? { problems: [] } : {})
    }));

    try {
      const searchRequest: SearchProblemsRequest = {
        searchTerm: term || undefined,
        ...customFilters,
        page,
        limit: pageSize
      };

      const response: SearchProblemsResponse = await problemApi.searchProblems(searchRequest);

      setState(prev => ({
        ...prev,
        loading: false,
        problems: append ? [...prev.problems, ...response.problems] : response.problems,
        totalCount: response.totalCount,
        currentPage: response.page,
        hasNext: response.hasNext,
        searchMetadata: response.searchMetadata
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || '문제 검색에 실패했습니다'
      }));
    }
  }, [debouncedSearchTerm, filters, pageSize]);

  // Load more results
  const loadMore = useCallback(async () => {
    if (state.hasNext && !state.loading) {
      await search(debouncedSearchTerm, filters, state.currentPage + 1, true);
    }
  }, [search, debouncedSearchTerm, filters, state.hasNext, state.loading, state.currentPage]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setFilters({});
    setState({
      loading: false,
      error: null,
      problems: [],
      totalCount: 0,
      currentPage: 1,
      hasNext: false
    });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Enhanced setSearchTerm with auto-search
  const handleSetSearchTerm = useCallback((term: string) => {
    setSearchTerm(term);
    if (term.trim() === '') {
      clearSearch();
    }
  }, [clearSearch]);

  // Enhanced setFilters with auto-search
  const handleSetFilters = useCallback((newFilters: ProblemSearchFilters) => {
    setFilters(newFilters);
    if (debouncedSearchTerm || Object.keys(newFilters).some(key => newFilters[key as keyof ProblemSearchFilters] !== undefined)) {
      search(debouncedSearchTerm, newFilters);
    }
  }, [debouncedSearchTerm, search]);

  // Auto search when debounced term changes
  useState(() => {
    if (debouncedSearchTerm.trim()) {
      search(debouncedSearchTerm, filters);
    }
  });

  // Computed values
  const hasResults = useMemo(() => state.problems.length > 0, [state.problems.length]);
  const isSearching = useMemo(() => state.loading, [state.loading]);
  const canLoadMore = useMemo(() => state.hasNext && !state.loading, [state.hasNext, state.loading]);

  return {
    state,
    problems: state.problems,
    searchTerm,
    setSearchTerm: handleSetSearchTerm,
    filters,
    setFilters: handleSetFilters,
    search,
    loadMore,
    clearSearch,
    clearError,
    hasResults,
    isSearching,
    canLoadMore
  };
};