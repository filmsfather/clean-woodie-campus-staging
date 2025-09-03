import React, { useState, useCallback, useEffect } from 'react';
import {
  Modal,
  Card,
  CardContent,
  Button,
  Input,
  Badge,
  Checkbox,
  Grid,
} from '../ui';
import { ProblemData } from '../problems/editor/ProblemEditor';

interface ProblemPickerProps {
  onSelect?: (problems: ProblemData[]) => void;
  onCancel?: () => void;
  excludeIds?: string[];
  allowMultiple?: boolean;
}

// Mock 데이터 - 실제 구현에서는 API에서 가져옴
const MOCK_PROBLEMS: ProblemData[] = [
  {
    id: '1',
    title: '이차방정식의 해 구하기',
    content: '다음 이차방정식의 해를 구하시오: x² - 5x + 6 = 0',
    type: 'multiple_choice',
    difficulty: 'medium',
    tags: ['수학', '이차방정식', '인수분해'],
    points: 10,
    timeLimit: 300,
    multipleChoiceData: {
      choices: [
        { id: '1', text: 'x = 2, 3', isCorrect: true },
        { id: '2', text: 'x = 1, 6', isCorrect: false },
        { id: '3', text: 'x = -2, -3', isCorrect: false },
        { id: '4', text: 'x = 0, 5', isCorrect: false },
      ]
    }
  },
  {
    id: '2',
    title: '영어 단어의 의미',
    content: '다음 영어 단어의 뜻은 무엇입니까? "Adventure"',
    type: 'short_answer',
    difficulty: 'easy',
    tags: ['영어', '단어', '기초'],
    points: 5,
    shortAnswerData: {
      correctAnswers: ['모험', '모험'],
      caseSensitive: false,
    }
  },
  {
    id: '3',
    title: '지구는 태양 주위를 돈다',
    content: '지구는 태양 주위를 공전한다.',
    type: 'true_false',
    difficulty: 'easy',
    tags: ['과학', '천체', '지구과학'],
    points: 3,
    trueFalseData: {
      correctAnswer: true,
      explanation: '지구는 태양을 중심으로 약 365일에 걸쳐 공전합니다.',
    }
  },
  {
    id: '4',
    title: '조선시대 건국 연도',
    content: '조선왕조가 건국된 연도는 언제입니까?',
    type: 'short_answer',
    difficulty: 'medium',
    tags: ['역사', '조선시대', '한국사'],
    points: 8,
    shortAnswerData: {
      correctAnswers: ['1392', '1392년'],
      caseSensitive: false,
    }
  },
  {
    id: '5',
    title: '물의 화학식',
    content: '물의 화학식을 쓰시오.',
    type: 'short_answer',
    difficulty: 'easy',
    tags: ['화학', '화학식', '기초'],
    points: 4,
    shortAnswerData: {
      correctAnswers: ['H2O', 'H₂O'],
      caseSensitive: false,
    }
  },
];

export function ProblemPicker({
  onSelect,
  onCancel,
  excludeIds = [],
  allowMultiple = true,
}: ProblemPickerProps) {
  const [problems] = useState(MOCK_PROBLEMS.filter(p => !excludeIds.includes(p.id || '')));
  const [filteredProblems, setFilteredProblems] = useState(problems);
  const [selectedProblems, setSelectedProblems] = useState<ProblemData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // 모든 태그 수집
  const allTags = Array.from(
    new Set(problems.flatMap(p => p.tags))
  ).sort();

  // 필터링 로직
  useEffect(() => {
    let filtered = problems;

    // 검색어 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query) ||
        p.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // 문제 유형 필터
    if (selectedType !== 'all') {
      filtered = filtered.filter(p => p.type === selectedType);
    }

    // 난이도 필터
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(p => p.difficulty === selectedDifficulty);
    }

    // 태그 필터
    if (selectedTag !== 'all') {
      filtered = filtered.filter(p => p.tags.includes(selectedTag));
    }

    setFilteredProblems(filtered);
  }, [problems, searchQuery, selectedType, selectedDifficulty, selectedTag]);

  const handleProblemToggle = useCallback((problem: ProblemData, isSelected: boolean) => {
    if (allowMultiple) {
      if (isSelected) {
        setSelectedProblems(prev => [...prev, problem]);
      } else {
        setSelectedProblems(prev => prev.filter(p => p.id !== problem.id));
      }
    } else {
      setSelectedProblems(isSelected ? [problem] : []);
    }
  }, [allowMultiple]);

  const handleSelectAll = useCallback(() => {
    setSelectedProblems([...filteredProblems]);
  }, [filteredProblems]);

  const handleDeselectAll = useCallback(() => {
    setSelectedProblems([]);
  }, []);

  const handleConfirm = useCallback(() => {
    onSelect?.(selectedProblems);
  }, [selectedProblems, onSelect]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'outline';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '쉬움';
      case 'medium': return '보통';
      case 'hard': return '어려움';
      default: return difficulty;
    }
  };

  const getTypeEmoji = (type: string) => {
    switch (type) {
      case 'multiple_choice': return '🔘';
      case 'short_answer': return '✏️';
      case 'long_answer': return '📝';
      case 'true_false': return '✅';
      case 'matching': return '🔗';
      case 'fill_blank': return '📄';
      case 'ordering': return '📊';
      default: return '❓';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice': return '객관식';
      case 'short_answer': return '단답형';
      case 'long_answer': return '서술형';
      case 'true_false': return 'OX형';
      case 'matching': return '매칭형';
      case 'fill_blank': return '빈칸형';
      case 'ordering': return '순서형';
      default: return type;
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title="문제 선택"
      size="xl"
    >
      <div className="space-y-6">
        {/* 검색 및 필터 */}
        <div className="space-y-4">
          {/* 검색바 */}
          <div>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="문제 제목, 내용, 태그로 검색..."
              className="w-full"
            />
          </div>

          {/* 필터 옵션 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-text-primary block mb-2">
                문제 유형
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary text-text-primary"
              >
                <option value="all">전체</option>
                <option value="multiple_choice">🔘 객관식</option>
                <option value="short_answer">✏️ 단답형</option>
                <option value="true_false">✅ OX형</option>
                <option value="long_answer">📝 서술형</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-text-primary block mb-2">
                난이도
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary text-text-primary"
              >
                <option value="all">전체</option>
                <option value="easy">쉬움</option>
                <option value="medium">보통</option>
                <option value="hard">어려움</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-text-primary block mb-2">
                태그
              </label>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary text-text-primary"
              >
                <option value="all">전체</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 일괄 선택 버튼 */}
          {allowMultiple && filteredProblems.length > 0 && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSelectAll}
                disabled={selectedProblems.length === filteredProblems.length}
              >
                전체 선택 ({filteredProblems.length}개)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDeselectAll}
                disabled={selectedProblems.length === 0}
              >
                선택 해제
              </Button>
            </div>
          )}
        </div>

        {/* 결과 요약 */}
        <div className="flex items-center justify-between bg-surface-secondary rounded-lg p-4">
          <div className="text-sm text-text-secondary">
            {filteredProblems.length}개 문제 중 {selectedProblems.length}개 선택됨
          </div>
          {selectedProblems.length > 0 && (
            <div className="flex items-center gap-4 text-sm">
              <div>
                총점: {selectedProblems.reduce((sum, p) => sum + (p.points || 0), 0)}점
              </div>
              <div>
                예상시간: {selectedProblems.reduce((sum, p) => sum + (p.timeLimit ? Math.ceil(p.timeLimit / 60) : 2), 0)}분
              </div>
            </div>
          )}
        </div>

        {/* 문제 목록 */}
        <div className="max-h-96 overflow-y-auto">
          {filteredProblems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                검색 결과가 없습니다
              </h3>
              <p className="text-text-secondary">
                다른 검색어나 필터 조건을 시도해보세요.
              </p>
            </div>
          ) : (
            <Grid cols={{ base: 1, lg: 2 }} gap={4}>
              {filteredProblems.map((problem) => {
                const isSelected = selectedProblems.some(p => p.id === problem.id);
                
                return (
                  <Card
                    key={problem.id}
                    className={`cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' 
                        : 'hover:border-brand-300'
                    }`}
                    onClick={() => handleProblemToggle(problem, !isSelected)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {allowMultiple && (
                          <Checkbox
                            checked={isSelected}
                            onChange={(checked) => handleProblemToggle(problem, checked)}
                            className="mt-1"
                          />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-medium text-text-primary line-clamp-1">
                              {getTypeEmoji(problem.type)} {problem.title}
                            </h4>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" size="sm">
                                {problem.points}점
                              </Badge>
                            </div>
                          </div>

                          <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                            {problem.content}
                          </p>

                          <div className="flex flex-wrap gap-2">
                            <Badge 
                              variant={getDifficultyColor(problem.difficulty) as any}
                              size="sm"
                            >
                              {getDifficultyLabel(problem.difficulty)}
                            </Badge>
                            <Badge variant="outline" size="sm">
                              {getTypeLabel(problem.type)}
                            </Badge>
                            {problem.timeLimit && (
                              <Badge variant="outline" size="sm">
                                {Math.ceil(problem.timeLimit / 60)}분
                              </Badge>
                            )}
                            {problem.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="secondary" size="sm">
                                {tag}
                              </Badge>
                            ))}
                            {problem.tags.length > 2 && (
                              <Badge variant="secondary" size="sm">
                                +{problem.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </Grid>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center justify-between pt-4 border-t border-border-primary">
          <div className="text-sm text-text-secondary">
            {allowMultiple ? (
              `${selectedProblems.length}개 문제 선택됨`
            ) : (
              selectedProblems.length > 0 ? '1개 문제 선택됨' : '문제를 선택해주세요'
            )}
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel}>
              취소
            </Button>
            <Button
              variant="default"
              onClick={handleConfirm}
              disabled={selectedProblems.length === 0}
            >
              {selectedProblems.length > 0 
                ? `${selectedProblems.length}개 문제 추가`
                : '선택'
              }
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}