import React, { useState, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Button,
  Input,
  Select,
  Badge,
  Grid,
} from '../../ui';
import { MultipleChoiceEditor } from './MultipleChoiceEditor';
import { ShortAnswerEditor } from './ShortAnswerEditor';
import { TrueFalseEditor } from './TrueFalseEditor';
import { LongAnswerEditor } from './LongAnswerEditor';
import { MatchingEditor } from './MatchingEditor';
import { FillBlankEditor } from './FillBlankEditor';
import { OrderingEditor } from './OrderingEditor';
import { ProblemPreview } from './ProblemPreview';

// 도메인에서 정의된 문제 유형들
export type ProblemType = 
  | 'multiple_choice' 
  | 'short_answer' 
  | 'long_answer' 
  | 'true_false' 
  | 'matching' 
  | 'fill_blank' 
  | 'ordering';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface ProblemData {
  id?: string;
  title: string;
  content: string;
  type: ProblemType;
  difficulty: DifficultyLevel;
  tags: string[];
  points: number;
  timeLimit?: number; // 초 단위
  // 문제 유형별 추가 데이터
  multipleChoiceData?: {
    choices: Array<{ id: string; text: string; isCorrect: boolean }>;
  };
  shortAnswerData?: {
    correctAnswers: string[];
    caseSensitive: boolean;
  };
  trueFalseData?: {
    correctAnswer: boolean;
    explanation?: string;
  };
  longAnswerData?: {
    sampleAnswer?: string;
    keywords?: string[];
    rubric?: {
      criteria: string;
      points: number;
      description: string;
    }[];
    minLength?: number;
    maxLength?: number;
    placeholder?: string;
  };
  matchingData?: {
    correctMatches: {
      leftId: string;
      rightId: string;
    }[];
    allowsPartialCredit?: boolean;
    leftItems?: {
      id: string;
      text: string;
    }[];
    rightItems?: {
      id: string;
      text: string;
    }[];
  };
  fillBlankData?: {
    text: string; // __blank__ 형태로 빈칸 표시
    blanks: {
      id: string;
      acceptedAnswers: string[];
      caseSensitive?: boolean;
      placeholder?: string;
      maxLength?: number;
    }[];
    allowsPartialCredit?: boolean;
  };
  orderingData?: {
    correctOrder: string[];
    allowsPartialCredit?: boolean;
    items?: {
      id: string;
      text: string;
    }[];
  };
}

interface ProblemEditorProps {
  initialData?: Partial<ProblemData>;
  onSave?: (data: ProblemData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
}

const PROBLEM_TYPES: Array<{ value: ProblemType; label: string; emoji: string }> = [
  { value: 'multiple_choice', label: '객관식', emoji: '🔘' },
  { value: 'short_answer', label: '단답형', emoji: '✏️' },
  { value: 'long_answer', label: '서술형', emoji: '📝' },
  { value: 'true_false', label: 'OX형', emoji: '✅' },
  { value: 'matching', label: '매칭형', emoji: '🔗' },
  { value: 'fill_blank', label: '빈칸형', emoji: '📄' },
  { value: 'ordering', label: '순서형', emoji: '📊' },
];

const DIFFICULTY_LEVELS: Array<{ value: DifficultyLevel; label: string; color: string }> = [
  { value: 'easy', label: '쉬움', color: 'success' },
  { value: 'medium', label: '보통', color: 'warning' },
  { value: 'hard', label: '어려움', color: 'error' },
];

export function ProblemEditor({
  initialData,
  onSave,
  onCancel,
  isLoading = false,
  mode = 'create',
}: ProblemEditorProps) {
  const [problemData, setProblemData] = useState<ProblemData>({
    title: initialData?.title || '',
    content: initialData?.content || '',
    type: initialData?.type || 'multiple_choice',
    difficulty: initialData?.difficulty || 'medium',
    tags: initialData?.tags || [],
    points: initialData?.points || 10,
    timeLimit: initialData?.timeLimit,
    ...initialData,
  });

  const [newTag, setNewTag] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleFieldChange = useCallback(<K extends keyof ProblemData>(
    field: K,
    value: ProblemData[K]
  ) => {
    setProblemData(prev => ({ ...prev, [field]: value }));
    // 값이 변경되면 검증 에러 초기화
    setValidationErrors([]);
  }, []);

  const handleAddTag = useCallback(() => {
    if (newTag.trim() && !problemData.tags.includes(newTag.trim())) {
      setProblemData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  }, [newTag, problemData.tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setProblemData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  }, []);

  const validateProblem = useCallback((): string[] => {
    const errors: string[] = [];

    if (!problemData.title.trim()) {
      errors.push('문제 제목을 입력해주세요.');
    }

    if (!problemData.content.trim()) {
      errors.push('문제 내용을 입력해주세요.');
    }

    if (problemData.points < 1 || problemData.points > 100) {
      errors.push('배점은 1점에서 100점 사이여야 합니다.');
    }

    // 문제 유형별 추가 검증
    if (problemData.type === 'multiple_choice') {
      const choiceData = problemData.multipleChoiceData;
      if (!choiceData || choiceData.choices.length < 2) {
        errors.push('객관식 문제는 최소 2개의 선택지가 필요합니다.');
      } else {
        const correctCount = choiceData.choices.filter(c => c.isCorrect).length;
        if (correctCount === 0) {
          errors.push('정답을 최소 1개 선택해주세요.');
        }
        const hasEmptyChoice = choiceData.choices.some(c => !c.text.trim());
        if (hasEmptyChoice) {
          errors.push('모든 선택지를 입력해주세요.');
        }
      }
    }

    return errors;
  }, [problemData]);

  const handleSave = async () => {
    const errors = validateProblem();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      await onSave?.(problemData);
    } catch (error) {
      console.error('문제 저장 중 오류:', error);
      setValidationErrors(['저장 중 오류가 발생했습니다.']);
    }
  };

  const renderTypeSpecificEditor = () => {
    switch (problemData.type) {
      case 'multiple_choice':
        return (
          <MultipleChoiceEditor
            data={problemData.multipleChoiceData}
            onChange={(data) => handleFieldChange('multipleChoiceData', data)}
          />
        );
      case 'short_answer':
        return (
          <ShortAnswerEditor
            data={problemData.shortAnswerData}
            onChange={(data) => handleFieldChange('shortAnswerData', data)}
          />
        );
      case 'true_false':
        return (
          <TrueFalseEditor
            data={problemData.trueFalseData}
            onChange={(data) => handleFieldChange('trueFalseData', data)}
          />
        );
      case 'long_answer':
        return (
          <LongAnswerEditor
            data={problemData.longAnswerData}
            onChange={(data) => handleFieldChange('longAnswerData', data)}
          />
        );
      case 'matching':
        return (
          <MatchingEditor
            data={problemData.matchingData}
            onChange={(data) => handleFieldChange('matchingData', data)}
          />
        );
      case 'fill_blank':
        return (
          <FillBlankEditor
            data={problemData.fillBlankData}
            onChange={(data) => handleFieldChange('fillBlankData', data)}
          />
        );
      case 'ordering':
        return (
          <OrderingEditor
            data={problemData.orderingData}
            onChange={(data) => handleFieldChange('orderingData', data)}
          />
        );
      default:
        return (
          <Card>
            <CardContent className="text-center py-8">
              <div className="text-4xl mb-4">🚧</div>
              <p className="text-text-secondary">
                {PROBLEM_TYPES.find(t => t.value === problemData.type)?.label} 편집기는 준비 중입니다.
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {mode === 'create' ? '새 문제 만들기' : '문제 편집'}
          </h1>
          <p className="text-text-secondary">
            학습자들에게 제공할 문제를 생성하세요.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            disabled={isLoading}
          >
            {showPreview ? '편집 모드' : '미리보기'}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            취소
          </Button>
          <Button variant="default" onClick={handleSave} disabled={isLoading}>
            {isLoading ? '저장 중...' : '저장하기'}
          </Button>
        </div>
      </div>

      {/* 검증 에러 표시 */}
      {validationErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="py-4">
            <h3 className="font-medium text-red-800 dark:text-red-200 mb-2">
              다음 항목들을 확인해주세요:
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {showPreview ? (
        <ProblemPreview data={problemData} />
      ) : (
        <Grid cols={{ base: 1, lg: 3 }} gap={6}>
          {/* 기본 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 문제 기본 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-text-primary block mb-2">
                    문제 제목 *
                  </label>
                  <Input
                    value={problemData.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    placeholder="예: 이차방정식의 해 구하기"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-text-primary block mb-2">
                    문제 내용 *
                  </label>
                  <textarea
                    className="w-full p-3 text-sm border border-border-primary rounded-lg bg-surface-primary text-text-primary placeholder-text-tertiary resize-none min-h-[120px]"
                    value={problemData.content}
                    onChange={(e) => handleFieldChange('content', e.target.value)}
                    placeholder="문제 설명을 자세히 입력하세요..."
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 문제 유형별 에디터 */}
            {renderTypeSpecificEditor()}
          </div>

          {/* 설정 패널 */}
          <div className="space-y-6">
            {/* 문제 유형 */}
            <Card>
              <CardHeader>
                <CardTitle>문제 유형</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={problemData.type}
                  onValueChange={(value) => handleFieldChange('type', value as ProblemType)}
                  disabled={isLoading}
                >
                  {PROBLEM_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.emoji} {type.label}
                    </option>
                  ))}
                </Select>
              </CardContent>
            </Card>

            {/* 난이도 및 설정 */}
            <Card>
              <CardHeader>
                <CardTitle>난이도 및 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-text-primary block mb-2">
                    난이도
                  </label>
                  <Select
                    value={problemData.difficulty}
                    onValueChange={(value) => handleFieldChange('difficulty', value as DifficultyLevel)}
                    disabled={isLoading}
                  >
                    {DIFFICULTY_LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-text-primary block mb-2">
                    배점
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={problemData.points}
                    onChange={(e) => handleFieldChange('points', parseInt(e.target.value) || 10)}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-text-primary block mb-2">
                    제한 시간 (초, 선택사항)
                  </label>
                  <Input
                    type="number"
                    min="30"
                    max="3600"
                    value={problemData.timeLimit || ''}
                    onChange={(e) => handleFieldChange('timeLimit', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="예: 300 (5분)"
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 태그 */}
            <Card>
              <CardHeader>
                <CardTitle>태그</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="태그 입력"
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button size="sm" onClick={handleAddTag} disabled={isLoading}>
                    추가
                  </Button>
                </div>
                
                {problemData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {problemData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        {tag} ✕
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 요약 정보 */}
            <Card className="bg-surface-secondary">
              <CardHeader>
                <CardTitle>문제 요약</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">유형:</span>
                    <span className="font-medium">
                      {PROBLEM_TYPES.find(t => t.value === problemData.type)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">난이도:</span>
                    <Badge 
                      variant={DIFFICULTY_LEVELS.find(d => d.value === problemData.difficulty)?.color as any}
                      size="sm"
                    >
                      {DIFFICULTY_LEVELS.find(d => d.value === problemData.difficulty)?.label}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">배점:</span>
                    <span className="font-medium">{problemData.points}점</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">태그:</span>
                    <span className="font-medium">{problemData.tags.length}개</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Grid>
      )}
    </div>
  );
}