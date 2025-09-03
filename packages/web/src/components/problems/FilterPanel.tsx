import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';

export interface FilterConfig {
  id: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'checkbox' | 'range' | 'date' | 'daterange' | 'tags';
  options?: Array<{ value: any; label: string; color?: string }>;
  placeholder?: string;
  min?: number;
  max?: number;
  defaultValue?: any;
  required?: boolean;
  group?: string;
}

export interface ActiveFilters {
  [key: string]: any;
}

interface FilterPanelProps {
  filters: FilterConfig[];
  activeFilters?: ActiveFilters;
  onFiltersChange: (filters: ActiveFilters) => void;
  onReset?: () => void;
  onSavePreset?: (name: string, filters: ActiveFilters) => void;
  presets?: Array<{ name: string; filters: ActiveFilters }>;
  onLoadPreset?: (filters: ActiveFilters) => void;
  showPresets?: boolean;
  showActiveCount?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  activeFilters = {},
  onFiltersChange,
  onReset,
  onSavePreset,
  presets = [],
  onLoadPreset,
  showPresets = true,
  showActiveCount = true,
  collapsible = true,
  defaultCollapsed = false,
  className = ''
}) => {
  const [internalFilters, setInternalFilters] = useState<ActiveFilters>(activeFilters);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [presetName, setPresetName] = useState('');
  const [showPresetInput, setShowPresetInput] = useState(false);

  useEffect(() => {
    setInternalFilters(activeFilters);
  }, [activeFilters]);

  const updateFilter = (filterId: string, value: any) => {
    const newFilters = {
      ...internalFilters,
      [filterId]: value
    };

    // 빈 값이면 필터에서 제거
    if (value === '' || value === null || value === undefined || 
        (Array.isArray(value) && value.length === 0)) {
      delete newFilters[filterId];
    }

    setInternalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters: ActiveFilters = {};
    filters.forEach(filter => {
      if (filter.defaultValue !== undefined) {
        defaultFilters[filter.id] = filter.defaultValue;
      }
    });
    
    setInternalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
    onReset?.();
  };

  const getActiveFilterCount = () => {
    return Object.keys(internalFilters).filter(key => {
      const value = internalFilters[key];
      return value !== '' && value !== null && value !== undefined && 
             !(Array.isArray(value) && value.length === 0);
    }).length;
  };

  const savePreset = () => {
    if (presetName.trim()) {
      onSavePreset?.(presetName.trim(), internalFilters);
      setPresetName('');
      setShowPresetInput(false);
    }
  };

  const loadPreset = (preset: { name: string; filters: ActiveFilters }) => {
    setInternalFilters(preset.filters);
    onFiltersChange(preset.filters);
    onLoadPreset?.(preset.filters);
  };

  const renderFilterControl = (filter: FilterConfig) => {
    const value = internalFilters[filter.id];

    switch (filter.type) {
      case 'text':
        return (
          <Input
            placeholder={filter.placeholder}
            value={value || ''}
            onChange={(e) => updateFilter(filter.id, e.target.value)}
          />
        );

      case 'select':
        return (
          <Select
            value={value || ''}
            onChange={(newValue) => updateFilter(filter.id, newValue)}
          >
            <option value="">전체</option>
            {filter.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {filter.options?.map(option => {
              const isChecked = Array.isArray(value) && value.includes(option.value);
              return (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${filter.id}-${option.value}`}
                    checked={isChecked}
                    onChange={(checked) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      const newValues = checked
                        ? [...currentValues, option.value]
                        : currentValues.filter(v => v !== option.value);
                      updateFilter(filter.id, newValues);
                    }}
                  />
                  <label htmlFor={`${filter.id}-${option.value}`} className="text-sm">
                    {option.label}
                  </label>
                </div>
              );
            })}
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={filter.id}
              checked={!!value}
              onChange={(checked) => updateFilter(filter.id, checked)}
            />
            <label htmlFor={filter.id} className="text-sm">
              {filter.label}
            </label>
          </div>
        );

      case 'range':
        const rangeValue = Array.isArray(value) ? value : [filter.min || 0, filter.max || 100];
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="최소"
                value={rangeValue[0] || ''}
                onChange={(e) => {
                  const newMin = e.target.value ? Number(e.target.value) : filter.min || 0;
                  updateFilter(filter.id, [newMin, rangeValue[1]]);
                }}
                min={filter.min}
                max={filter.max}
              />
              <span className="text-sm text-text-secondary">~</span>
              <Input
                type="number"
                placeholder="최대"
                value={rangeValue[1] || ''}
                onChange={(e) => {
                  const newMax = e.target.value ? Number(e.target.value) : filter.max || 100;
                  updateFilter(filter.id, [rangeValue[0], newMax]);
                }}
                min={filter.min}
                max={filter.max}
              />
            </div>
            <div className="text-xs text-text-secondary">
              {filter.min !== undefined && filter.max !== undefined && 
                `범위: ${filter.min} ~ ${filter.max}`
              }
            </div>
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => updateFilter(filter.id, e.target.value)}
          />
        );

      case 'daterange':
        const dateRange = Array.isArray(value) ? value : ['', ''];
        return (
          <div className="space-y-2">
            <Input
              type="date"
              placeholder="시작일"
              value={dateRange[0] || ''}
              onChange={(e) => {
                updateFilter(filter.id, [e.target.value, dateRange[1]]);
              }}
            />
            <Input
              type="date"
              placeholder="종료일"
              value={dateRange[1] || ''}
              onChange={(e) => {
                updateFilter(filter.id, [dateRange[0], e.target.value]);
              }}
            />
          </div>
        );

      case 'tags':
        const selectedTags = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            <Input
              placeholder="태그를 입력하고 Enter를 누르세요"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  const newTag = e.currentTarget.value.trim();
                  if (!selectedTags.includes(newTag)) {
                    updateFilter(filter.id, [...selectedTags, newTag]);
                  }
                  e.currentTarget.value = '';
                }
              }}
            />
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag: string, index: number) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => {
                      updateFilter(filter.id, selectedTags.filter(t => t !== tag));
                    }}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
            {filter.options && (
              <div className="space-y-1">
                <div className="text-xs text-text-secondary">추천 태그:</div>
                <div className="flex flex-wrap gap-1">
                  {filter.options
                    .filter(option => !selectedTags.includes(option.value))
                    .slice(0, 10)
                    .map(option => (
                      <Badge
                        key={option.value}
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        onClick={() => {
                          updateFilter(filter.id, [...selectedTags, option.value]);
                        }}
                      >
                        + {option.label}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const renderActiveFilters = () => {
    const activeCount = getActiveFilterCount();
    if (activeCount === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">
            활성 필터 ({activeCount}개)
          </span>
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            모두 지우기
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(internalFilters).map(([key, value]) => {
            if (value === '' || value === null || value === undefined || 
                (Array.isArray(value) && value.length === 0)) {
              return null;
            }

            const filter = filters.find(f => f.id === key);
            if (!filter) return null;

            let displayValue: string;
            if (Array.isArray(value)) {
              if (filter.type === 'range' || filter.type === 'daterange') {
                displayValue = `${value[0]} ~ ${value[1]}`;
              } else {
                displayValue = `${value.length}개 선택`;
              }
            } else if (typeof value === 'boolean') {
              displayValue = value ? '예' : '아니오';
            } else {
              displayValue = String(value);
            }

            return (
              <Badge
                key={key}
                variant="default"
                className="cursor-pointer"
                onClick={() => updateFilter(key, undefined)}
              >
                {filter.label}: {displayValue} ×
              </Badge>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPresets = () => {
    if (!showPresets) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">필터 프리셋</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowPresetInput(!showPresetInput)}
          >
            저장
          </Button>
        </div>

        {showPresetInput && (
          <div className="flex space-x-2">
            <Input
              placeholder="프리셋 이름"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  savePreset();
                }
              }}
            />
            <Button size="sm" onClick={savePreset}>
              저장
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowPresetInput(false)}>
              취소
            </Button>
          </div>
        )}

        {presets.length > 0 && (
          <div className="space-y-1">
            {presets.map((preset, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-surface-secondary rounded">
                <span className="text-sm">{preset.name}</span>
                <Button variant="ghost" size="sm" onClick={() => loadPreset(preset)}>
                  적용
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const groupedFilters = filters.reduce((groups, filter) => {
    const group = filter.group || 'default';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(filter);
    return groups;
  }, {} as Record<string, FilterConfig[]>);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle>필터</CardTitle>
            {showActiveCount && getActiveFilterCount() > 0 && (
              <Badge variant="default" size="sm">
                {getActiveFilterCount()}
              </Badge>
            )}
          </div>
          {collapsible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? '▼' : '▲'}
            </Button>
          )}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="space-y-6">
          {/* 활성 필터 표시 */}
          {renderActiveFilters()}

          {/* 필터 컨트롤들 */}
          {Object.entries(groupedFilters).map(([groupName, groupFilters]) => (
            <div key={groupName} className="space-y-4">
              {groupName !== 'default' && (
                <h4 className="text-sm font-medium text-text-primary border-b pb-2">
                  {groupName}
                </h4>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupFilters.map(filter => (
                  <div key={filter.id} className="space-y-2">
                    <label className="block text-sm font-medium text-text-primary">
                      {filter.label}
                      {filter.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderFilterControl(filter)}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* 프리셋 */}
          {renderPresets()}

          {/* 액션 버튼들 */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="ghost" onClick={resetFilters}>
              초기화
            </Button>
            <div className="text-sm text-text-secondary">
              {getActiveFilterCount()}개 필터 활성화
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// 자주 사용되는 필터 구성들을 미리 정의
export const COMMON_FILTER_CONFIGS = {
  // 문제 관련 필터
  PROBLEM_FILTERS: [
    {
      id: 'search',
      label: '검색',
      type: 'text' as const,
      placeholder: '제목, 내용, 태그로 검색...',
      group: '기본'
    },
    {
      id: 'type',
      label: '문제 유형',
      type: 'multiselect' as const,
      options: [
        { value: 'multiple_choice', label: '객관식' },
        { value: 'short_answer', label: '단답식' },
        { value: 'long_answer', label: '서술식' },
        { value: 'true_false', label: '참/거짓' },
        { value: 'matching', label: '연결식' },
        { value: 'fill_blank', label: '빈칸 채우기' },
        { value: 'ordering', label: '순서 배열' }
      ],
      group: '기본'
    },
    {
      id: 'difficulty',
      label: '난이도',
      type: 'multiselect' as const,
      options: [
        { value: 'easy', label: '쉬움', color: 'success' },
        { value: 'medium', label: '보통', color: 'warning' },
        { value: 'hard', label: '어려움', color: 'error' }
      ],
      group: '기본'
    },
    {
      id: 'subject',
      label: '과목',
      type: 'multiselect' as const,
      options: [
        { value: 'math', label: '수학' },
        { value: 'korean', label: '국어' },
        { value: 'english', label: '영어' },
        { value: 'science', label: '과학' },
        { value: 'social', label: '사회' },
        { value: 'other', label: '기타' }
      ],
      group: '기본'
    },
    {
      id: 'tags',
      label: '태그',
      type: 'tags' as const,
      group: '기본'
    },
    {
      id: 'scoreRange',
      label: '평균 점수',
      type: 'range' as const,
      min: 0,
      max: 100,
      group: '성과'
    },
    {
      id: 'usageRange',
      label: '사용 횟수',
      type: 'range' as const,
      min: 0,
      max: 1000,
      group: '성과'
    },
    {
      id: 'timeRange',
      label: '소요 시간 (분)',
      type: 'range' as const,
      min: 1,
      max: 60,
      group: '기타'
    },
    {
      id: 'isPublic',
      label: '공개 여부',
      type: 'select' as const,
      options: [
        { value: true, label: '공개' },
        { value: false, label: '비공개' }
      ],
      group: '기타'
    },
    {
      id: 'createdDateRange',
      label: '생성일',
      type: 'daterange' as const,
      group: '기타'
    }
  ],

  // 학생 관련 필터
  STUDENT_FILTERS: [
    {
      id: 'search',
      label: '학생 검색',
      type: 'text' as const,
      placeholder: '이름, 이메일로 검색...',
      group: '기본'
    },
    {
      id: 'class',
      label: '반',
      type: 'multiselect' as const,
      group: '기본'
    },
    {
      id: 'scoreRange',
      label: '평균 점수',
      type: 'range' as const,
      min: 0,
      max: 100,
      group: '성과'
    },
    {
      id: 'progressRange',
      label: '진도율 (%)',
      type: 'range' as const,
      min: 0,
      max: 100,
      group: '성과'
    },
    {
      id: 'streakRange',
      label: '연속 학습일',
      type: 'range' as const,
      min: 0,
      max: 365,
      group: '성과'
    },
    {
      id: 'isAtRisk',
      label: '위험군만 표시',
      type: 'checkbox' as const,
      group: '기타'
    }
  ]
};

export default FilterPanel;