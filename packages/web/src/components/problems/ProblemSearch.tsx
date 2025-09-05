// SearchProblemsUseCase에 대응하는 검색 UI 컴포넌트
import React, { useState } from 'react';
import type { ProblemSearchFilters } from '../../hooks';

interface ProblemSearchProps {
  searchTerm: string;
  filters: ProblemSearchFilters;
  onSearchChange: (term: string) => void;
  onFilterChange: (filters: ProblemSearchFilters) => void;
  onSearch?: () => void;
  onClear: () => void;
  isLoading?: boolean;
  showAdvancedFilters?: boolean;
  autoSearch?: boolean;
}

export const ProblemSearch: React.FC<ProblemSearchProps> = ({
  searchTerm,
  filters,
  onSearchChange,
  onFilterChange,
  onSearch,
  onClear,
  isLoading = false,
  showAdvancedFilters = true,
  autoSearch = true
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && !autoSearch) {
      onSearch();
    }
  };

  const handleTagsChange = (tagString: string) => {
    const tags = tagString.split(',').map(t => t.trim()).filter(t => t);
    onFilterChange({ ...filters, tags });
  };

  const handleDifficultyRangeChange = (min: string, max: string) => {
    const minVal = min ? parseInt(min) : undefined;
    const maxVal = max ? parseInt(max) : undefined;
    
    if (minVal !== undefined && maxVal !== undefined) {
      onFilterChange({ ...filters, difficultyRange: { min: minVal, max: maxVal } });
    } else if (minVal !== undefined || maxVal !== undefined) {
      onFilterChange({ 
        ...filters, 
        difficultyRange: minVal !== undefined ? { min: minVal, max: 10 } : { min: 1, max: maxVal! }
      });
    } else {
      const { difficultyRange, ...rest } = filters;
      onFilterChange(rest);
    }
  };

  return (
    <div className="problem-search">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-main">
          <input
            type="text"
            placeholder="문제 제목, 내용, 태그로 검색..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
          {!autoSearch && onSearch && (
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? '검색 중...' : '검색'}
            </button>
          )}
          <button type="button" onClick={onClear} className="btn-secondary">
            초기화
          </button>
          {showAdvancedFilters && (
            <button 
              type="button" 
              onClick={() => setShowFilters(!showFilters)} 
              className="btn-tertiary"
            >
              {showFilters ? '필터 숨기기' : '고급 필터'}
            </button>
          )}
        </div>

        {showAdvancedFilters && showFilters && (
          <div className="search-filters">
            <div className="filter-group">
              <label>태그</label>
              <input
                type="text"
                placeholder="수학, 물리 (쉼표 구분)"
                value={filters.tags?.join(', ') || ''}
                onChange={(e) => handleTagsChange(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>난이도 범위</label>
              <div className="difficulty-range">
                <input
                  type="number"
                  placeholder="최소"
                  min="1"
                  max="10"
                  value={filters.difficultyRange?.min || ''}
                  onChange={(e) => handleDifficultyRangeChange(
                    e.target.value, 
                    filters.difficultyRange?.max?.toString() || ''
                  )}
                />
                <span>~</span>
                <input
                  type="number"
                  placeholder="최대"
                  min="1"
                  max="10"
                  value={filters.difficultyRange?.max || ''}
                  onChange={(e) => handleDifficultyRangeChange(
                    filters.difficultyRange?.min?.toString() || '', 
                    e.target.value
                  )}
                />
              </div>
            </div>

            <div className="filter-group">
              <label>상태</label>
              <select
                value={filters.isActive === undefined ? '' : filters.isActive.toString()}
                onChange={(e) => onFilterChange({
                  ...filters,
                  isActive: e.target.value === '' ? undefined : e.target.value === 'true'
                })}
              >
                <option value="">전체</option>
                <option value="true">활성</option>
                <option value="false">비활성</option>
              </select>
            </div>

            <div className="filter-group">
              <label>생성일 이후</label>
              <input
                type="date"
                value={filters.createdAfter || ''}
                onChange={(e) => onFilterChange({
                  ...filters,
                  createdAfter: e.target.value || undefined
                })}
              />
            </div>

            <div className="filter-group">
              <label>생성일 이전</label>
              <input
                type="date"
                value={filters.createdBefore || ''}
                onChange={(e) => onFilterChange({
                  ...filters,
                  createdBefore: e.target.value || undefined
                })}
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
};