import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import { Modal } from '../ui/Modal';
import { ProblemEditor } from './editor/ProblemEditor';
import { TagManager } from './TagManager';

interface Problem {
  id: string;
  title: string;
  type: 'multiple_choice' | 'short_answer' | 'long_answer' | 'true_false' | 'matching' | 'fill_blank' | 'ordering';
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  tags: string[];
  content: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isPublic: boolean;
  usageCount: number;
  averageScore?: number;
  estimatedTime: number; // 예상 소요시간 (분)
  description: string;
}

interface FilterOptions {
  type: string[];
  difficulty: string[];
  subject: string[];
  tags: string[];
  isPublic?: boolean;
  createdBy?: string;
  scoreRange?: [number, number];
  usageRange?: [number, number];
  timeRange?: [number, number];
}

interface ProblemBankBrowserProps {
  mode?: 'browse' | 'select' | 'manage';
  selectedProblems?: string[];
  onProblemsSelect?: (problemIds: string[]) => void;
  onProblemView?: (problem: Problem) => void;
  onProblemEdit?: (problem: Problem) => void;
  onProblemDelete?: (problemId: string) => void;
  onProblemClone?: (problem: Problem) => void;
  showMyProblemsOnly?: boolean;
  className?: string;
}

const PROBLEM_TYPES = [
  { value: 'multiple_choice', label: '객관식' },
  { value: 'short_answer', label: '단답식' },
  { value: 'long_answer', label: '서술식' },
  { value: 'true_false', label: '참/거짓' },
  { value: 'matching', label: '연결식' },
  { value: 'fill_blank', label: '빈칸 채우기' },
  { value: 'ordering', label: '순서 배열' }
];

const DIFFICULTY_LEVELS = [
  { value: 'easy', label: '쉬움', color: 'success' },
  { value: 'medium', label: '보통', color: 'warning' },
  { value: 'hard', label: '어려움', color: 'error' }
];

const SUBJECTS = [
  '수학', '국어', '영어', '과학', '사회', '기타'
];

export const ProblemBankBrowser: React.FC<ProblemBankBrowserProps> = ({
  mode = 'browse',
  selectedProblems = [],
  onProblemsSelect,
  onProblemView,
  onProblemEdit,
  onProblemDelete,
  onProblemClone,
  showMyProblemsOnly = false,
  className = ''
}) => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [filteredProblems, setFilteredProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    type: [],
    difficulty: [],
    subject: [],
    tags: []
  });
  const [sortBy, setSortBy] = useState<'title' | 'createdAt' | 'usageCount' | 'averageScore'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [selectedItems, setSelectedItems] = useState<string[]>(selectedProblems);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

  useEffect(() => {
    const fetchProblems = async () => {
      setLoading(true);
      try {
        // 실제 구현에서는 API 호출
        const mockData: Problem[] = [
          {
            id: '1',
            title: '기본 사칙연산',
            type: 'multiple_choice',
            difficulty: 'easy',
            subject: '수학',
            tags: ['기초', '연산', '사칙연산'],
            content: '다음 계산의 결과를 구하시오: 15 + 27 = ?',
            createdAt: '2024-01-15',
            updatedAt: '2024-01-15',
            createdBy: '김교사',
            isPublic: true,
            usageCount: 45,
            averageScore: 92,
            estimatedTime: 2,
            description: '기본적인 덧셈 문제'
          },
          {
            id: '2',
            title: '문법 오류 찾기',
            type: 'short_answer',
            difficulty: 'medium',
            subject: '국어',
            tags: ['문법', '오류', '맞춤법'],
            content: '다음 문장에서 틀린 부분을 찾아 바르게 고치시오.',
            createdAt: '2024-01-10',
            updatedAt: '2024-01-12',
            createdBy: '박교사',
            isPublic: true,
            usageCount: 38,
            averageScore: 76,
            estimatedTime: 5,
            description: '문법 규칙을 적용하여 오류를 찾는 문제'
          },
          {
            id: '3',
            title: '영어 독해',
            type: 'long_answer',
            difficulty: 'hard',
            subject: '영어',
            tags: ['독해', '읽기', '추론'],
            content: 'Read the following passage and answer the questions.',
            createdAt: '2024-01-05',
            updatedAt: '2024-01-08',
            createdBy: '이교사',
            isPublic: false,
            usageCount: 22,
            averageScore: 68,
            estimatedTime: 15,
            description: '영어 지문을 읽고 내용을 파악하는 문제'
          },
          {
            id: '4',
            title: '과학 실험 분석',
            type: 'matching',
            difficulty: 'medium',
            subject: '과학',
            tags: ['실험', '분석', '관찰'],
            content: '실험 결과와 원인을 연결하시오.',
            createdAt: '2024-01-20',
            updatedAt: '2024-01-20',
            createdBy: '최교사',
            isPublic: true,
            usageCount: 31,
            averageScore: 82,
            estimatedTime: 8,
            description: '과학 실험 결과를 분석하는 연결 문제'
          },
          {
            id: '5',
            title: '역사 연표',
            type: 'ordering',
            difficulty: 'medium',
            subject: '사회',
            tags: ['역사', '시간순', '연표'],
            content: '다음 역사적 사건을 시간 순서대로 배열하시오.',
            createdAt: '2024-01-18',
            updatedAt: '2024-01-19',
            createdBy: '김교사',
            isPublic: true,
            usageCount: 28,
            averageScore: 79,
            estimatedTime: 6,
            description: '역사 사건의 시간순 배열 문제'
          },
          {
            id: '6',
            title: '빈칸 추론',
            type: 'fill_blank',
            difficulty: 'hard',
            subject: '국어',
            tags: ['추론', '빈칸', '문맥'],
            content: '다음 글의 빈칸에 들어갈 말을 쓰시오.',
            createdAt: '2024-01-12',
            updatedAt: '2024-01-14',
            createdBy: '박교사',
            isPublic: true,
            usageCount: 35,
            averageScore: 65,
            estimatedTime: 10,
            description: '문맥을 파악하여 빈칸을 채우는 문제'
          }
        ];

        setProblems(mockData);
        
        // 사용 가능한 태그 수집
        const tags = [...new Set(mockData.flatMap(p => p.tags))];
        setAvailableTags(tags);
        
      } catch (error) {
        console.error('문제 데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, [showMyProblemsOnly]);

  useEffect(() => {
    // 검색 및 필터링 적용
    let filtered = problems.filter(problem => {
      // 검색 쿼리 필터
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          problem.title.toLowerCase().includes(query) ||
          problem.description.toLowerCase().includes(query) ||
          problem.content.toLowerCase().includes(query) ||
          problem.tags.some(tag => tag.toLowerCase().includes(query)) ||
          problem.subject.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // 유형 필터
      if (filters.type.length > 0 && !filters.type.includes(problem.type)) {
        return false;
      }

      // 난이도 필터
      if (filters.difficulty.length > 0 && !filters.difficulty.includes(problem.difficulty)) {
        return false;
      }

      // 과목 필터
      if (filters.subject.length > 0 && !filters.subject.includes(problem.subject)) {
        return false;
      }

      // 태그 필터
      if (filters.tags.length > 0 && !filters.tags.some(tag => problem.tags.includes(tag))) {
        return false;
      }

      // 공개 여부 필터
      if (filters.isPublic !== undefined && problem.isPublic !== filters.isPublic) {
        return false;
      }

      return true;
    });

    // 정렬 적용
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortBy) {
        case 'title':
          aVal = a.title;
          bVal = b.title;
          break;
        case 'createdAt':
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
          break;
        case 'usageCount':
          aVal = a.usageCount;
          bVal = b.usageCount;
          break;
        case 'averageScore':
          aVal = a.averageScore || 0;
          bVal = b.averageScore || 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredProblems(filtered);
    setCurrentPage(1);
  }, [problems, searchQuery, filters, sortBy, sortOrder]);

  const handleFilterChange = (filterType: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleSelectProblem = (problemId: string, checked: boolean) => {
    const updatedSelection = checked 
      ? [...selectedItems, problemId]
      : selectedItems.filter(id => id !== problemId);
    
    setSelectedItems(updatedSelection);
    onProblemsSelect?.(updatedSelection);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    const currentPageProblems = getCurrentPageProblems();
    const currentPageIds = currentPageProblems.map(p => p.id);
    
    const updatedSelection = checked 
      ? [...new Set([...selectedItems, ...currentPageIds])]
      : selectedItems.filter(id => !currentPageIds.includes(id));
    
    setSelectedItems(updatedSelection);
    onProblemsSelect?.(updatedSelection);
  };

  const getCurrentPageProblems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProblems.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredProblems.length / itemsPerPage);

  const getTypeLabel = (type: string) => {
    return PROBLEM_TYPES.find(t => t.value === type)?.label || type;
  };

  const getDifficultyBadgeProps = (difficulty: string) => {
    const difficultyInfo = DIFFICULTY_LEVELS.find(d => d.value === difficulty);
    return {
      variant: difficultyInfo?.color as any || 'default',
      children: difficultyInfo?.label || difficulty
    };
  };

  const handleEditProblem = (problem: Problem) => {
    setEditingProblem(problem);
    setIsEditModalOpen(true);
  };

  const handleEditSave = (updatedProblem: Problem) => {
    // 실제 구현에서는 API 호출로 업데이트
    setProblems(prev => 
      prev.map(p => p.id === updatedProblem.id ? updatedProblem : p)
    );
    setIsEditModalOpen(false);
    setEditingProblem(null);
    onProblemEdit?.(updatedProblem);
  };

  const handleEditCancel = () => {
    setIsEditModalOpen(false);
    setEditingProblem(null);
  };

  if (loading) {
    return (
      <div className={`problem-bank-browser loading ${className}`}>
        <div className="loading-spinner">문제 은행을 불러오는 중...</div>
      </div>
    );
  }

  const renderFilters = () => (
    <Card>
      <CardHeader>
        <CardTitle>필터 및 검색</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 검색 */}
        <div>
          <Input
            placeholder="문제 제목, 내용, 태그로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* 필터 옵션들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 문제 유형 */}
          <div>
            <label className="block text-sm font-medium mb-2">문제 유형</label>
            <div className="space-y-1">
              {PROBLEM_TYPES.map(type => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type.value}`}
                    checked={filters.type.includes(type.value)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const newTypes = checked 
                        ? [...filters.type, type.value]
                        : filters.type.filter(t => t !== type.value);
                      handleFilterChange('type', newTypes);
                    }}
                  />
                  <label htmlFor={`type-${type.value}`} className="text-sm">
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* 난이도 */}
          <div>
            <label className="block text-sm font-medium mb-2">난이도</label>
            <div className="space-y-1">
              {DIFFICULTY_LEVELS.map(difficulty => (
                <div key={difficulty.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`difficulty-${difficulty.value}`}
                    checked={filters.difficulty.includes(difficulty.value)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const newDifficulties = checked 
                        ? [...filters.difficulty, difficulty.value]
                        : filters.difficulty.filter(d => d !== difficulty.value);
                      handleFilterChange('difficulty', newDifficulties);
                    }}
                  />
                  <label htmlFor={`difficulty-${difficulty.value}`} className="text-sm">
                    {difficulty.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* 과목 */}
          <div>
            <label className="block text-sm font-medium mb-2">과목</label>
            <div className="space-y-1">
              {SUBJECTS.map(subject => (
                <div key={subject} className="flex items-center space-x-2">
                  <Checkbox
                    id={`subject-${subject}`}
                    checked={filters.subject.includes(subject)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const newSubjects = checked 
                        ? [...filters.subject, subject]
                        : filters.subject.filter(s => s !== subject);
                      handleFilterChange('subject', newSubjects);
                    }}
                  />
                  <label htmlFor={`subject-${subject}`} className="text-sm">
                    {subject}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* 태그 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">태그</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsTagManagerOpen(true)}
              >
                관리
              </Button>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {availableTags.map(tag => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tag-${tag}`}
                    checked={filters.tags.includes(tag)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const newTags = checked 
                        ? [...filters.tags, tag]
                        : filters.tags.filter(t => t !== tag);
                      handleFilterChange('tags', newTags);
                    }}
                  />
                  <label htmlFor={`tag-${tag}`} className="text-sm">
                    {tag}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderToolbar = () => (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <span className="text-sm text-text-secondary">
          총 {filteredProblems.length}개 문제
          {mode === 'select' && ` • ${selectedItems.length}개 선택`}
        </span>
        
        {mode === 'select' && (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={getCurrentPageProblems().every(p => selectedItems.includes(p.id))}
              onChange={handleSelectAll}
            />
            <label className="text-sm">전체 선택</label>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {/* 정렬 옵션 */}
        <Select
          value={sortBy}
          onChange={(value) => setSortBy(value as any)}
          options={[
            { value: 'createdAt', label: '생성일순' },
            { value: 'title', label: '제목순' },
            { value: 'usageCount', label: '사용빈도순' },
            { value: 'averageScore', label: '평균점수순' }
          ]}
        />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </Button>

        {/* 뷰 모드 */}
        <div className="flex">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            ⊞
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            ☰
          </Button>
        </div>
      </div>
    </div>
  );

  const renderProblemCard = (problem: Problem) => (
    <Card 
      key={problem.id} 
      className={`relative cursor-pointer transition-colors hover:bg-surface-secondary ${
        selectedItems.includes(problem.id) ? 'ring-2 ring-primary' : ''
      }`}
    >
      {mode === 'select' && (
        <div className="absolute top-3 left-3 z-10">
          <Checkbox
            checked={selectedItems.includes(problem.id)}
            onChange={(e) => handleSelectProblem(problem.id, e.target.checked)}
          />
        </div>
      )}

      <CardContent className="p-4" onClick={() => onProblemView?.(problem)}>
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-text-primary pr-8">
              {problem.title}
            </h3>
            {!problem.isPublic && (
              <Badge variant="outline" size="sm">비공개</Badge>
            )}
          </div>

          <p className="text-sm text-text-secondary line-clamp-2">
            {problem.description}
          </p>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" size="sm">
              {getTypeLabel(problem.type)}
            </Badge>
            <Badge {...getDifficultyBadgeProps(problem.difficulty)} size="sm" />
            <Badge variant="outline" size="sm">
              {problem.subject}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-1">
            {problem.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" size="sm">
                {tag}
              </Badge>
            ))}
            {problem.tags.length > 3 && (
              <Badge variant="secondary" size="sm">
                +{problem.tags.length - 3}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-text-tertiary">
            <span>사용: {problem.usageCount}회</span>
            {problem.averageScore && (
              <span>평균: {problem.averageScore}점</span>
            )}
            <span>시간: {problem.estimatedTime}분</span>
          </div>

          <div className="text-xs text-text-tertiary">
            작성: {problem.createdBy} • {new Date(problem.createdAt).toLocaleDateString()}
          </div>

          {mode === 'manage' && (
            <div className="flex space-x-2 pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditProblem(problem);
                }}
              >
                수정
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onProblemClone?.(problem);
                }}
              >
                복제
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onProblemDelete?.(problem.id);
                }}
              >
                삭제
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderProblemList = () => {
    const currentProblems = getCurrentPageProblems();

    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {currentProblems.map(renderProblemCard)}
        </div>
      );
    } else {
      return (
        <div className="space-y-2">
          {currentProblems.map(problem => (
            <Card key={problem.id} className="cursor-pointer hover:bg-surface-secondary">
              <CardContent className="p-4" onClick={() => onProblemView?.(problem)}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex items-center space-x-4">
                    {mode === 'select' && (
                      <Checkbox
                        checked={selectedItems.includes(problem.id)}
                        onChange={(e) => handleSelectProblem(problem.id, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-text-primary">{problem.title}</h3>
                      <p className="text-sm text-text-secondary">{problem.description}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" size="sm">
                        {getTypeLabel(problem.type)}
                      </Badge>
                      <Badge {...getDifficultyBadgeProps(problem.difficulty)} size="sm" />
                      <Badge variant="outline" size="sm">
                        {problem.subject}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-text-secondary">
                      사용: {problem.usageCount}회
                    </div>
                    
                    {mode === 'manage' && (
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          handleEditProblem(problem);
                        }}>
                          수정
                        </Button>
                        <Button variant="ghost" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          onProblemDelete?.(problem.id);
                        }}>
                          삭제
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
  };

  const renderPagination = () => (
    <div className="flex items-center justify-center space-x-2">
      <Button
        variant="ghost"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(prev => prev - 1)}
      >
        이전
      </Button>
      
      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(page => {
          const distance = Math.abs(page - currentPage);
          return distance === 0 || distance <= 2 || page === 1 || page === totalPages;
        })
        .map((page, index, visiblePages) => {
          const prevPage = index > 0 ? visiblePages[index - 1] : null;
          const showEllipsis = prevPage && page - prevPage > 1;
          
          return (
            <React.Fragment key={page}>
              {showEllipsis && <span className="text-text-secondary">...</span>}
              <Button
                variant={currentPage === page ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            </React.Fragment>
          );
        })}

      <Button
        variant="ghost"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage(prev => prev + 1)}
      >
        다음
      </Button>
    </div>
  );

  return (
    <div className={`problem-bank-browser ${className} space-y-6`}>
      {/* 헤더 */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary">문제 은행</h2>
        <p className="text-text-secondary">
          {mode === 'browse' && '문제를 탐색하고 미리보기할 수 있습니다'}
          {mode === 'select' && '문제집에 추가할 문제를 선택하세요'}
          {mode === 'manage' && '내가 만든 문제를 관리할 수 있습니다'}
        </p>
      </div>

      {/* 필터 */}
      {renderFilters()}

      {/* 툴바 */}
      {renderToolbar()}

      {/* 문제 목록 */}
      {filteredProblems.length > 0 ? (
        <>
          {renderProblemList()}
          {totalPages > 1 && renderPagination()}
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-text-secondary">조건에 맞는 문제가 없습니다.</p>
          </CardContent>
        </Card>
      )}

      {/* 문제 편집 모달 */}
      {isEditModalOpen && editingProblem && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={handleEditCancel}
          title="문제 편집"
          size="large"
        >
          <ProblemEditor
            problem={editingProblem}
            onSave={handleEditSave}
            onCancel={handleEditCancel}
          />
        </Modal>
      )}

      {/* 태그 관리 모달 */}
      {isTagManagerOpen && (
        <Modal
          isOpen={isTagManagerOpen}
          onClose={() => setIsTagManagerOpen(false)}
          title="태그 관리"
          size="medium"
        >
          <TagManager
            onClose={() => setIsTagManagerOpen(false)}
            onTagsUpdate={(updatedTags) => {
              setAvailableTags(updatedTags);
            }}
          />
        </Modal>
      )}
    </div>
  );
};

export default ProblemBankBrowser;