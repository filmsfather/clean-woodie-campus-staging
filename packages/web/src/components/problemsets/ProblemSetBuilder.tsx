import React, { useState, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Badge,
  Grid,
} from '../ui';
import { ProblemPicker } from './ProblemPicker';
import { ProblemData } from '../problems/editor/ProblemEditor';

export interface ProblemSetBuilderData {
  id?: string;
  title: string;
  description: string;
  problems: Array<{
    problemId: string;
    orderIndex: number;
    problem?: ProblemData; // 선택적으로 문제 상세 정보 포함
  }>;
  totalPoints: number;
  estimatedTime: number; // 분 단위
}

interface ProblemSetBuilderProps {
  initialData?: Partial<ProblemSetBuilderData>;
  onSave?: (data: ProblemSetBuilderData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
}

export function ProblemSetBuilder({
  initialData,
  onSave,
  onCancel,
  isLoading = false,
  mode = 'create',
}: ProblemSetBuilderProps) {
  const [builderData, setBuilderData] = useState<ProblemSetBuilderData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    problems: initialData?.problems || [],
    totalPoints: initialData?.totalPoints || 0,
    estimatedTime: initialData?.estimatedTime || 0,
  });

  const [showProblemPicker, setShowProblemPicker] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleFieldChange = useCallback(<K extends keyof ProblemSetBuilderData>(
    field: K,
    value: ProblemSetBuilderData[K]
  ) => {
    setBuilderData(prev => ({ ...prev, [field]: value }));
    setValidationErrors([]);
  }, []);

  const handleAddProblems = useCallback((problems: ProblemData[]) => {
    const currentMaxIndex = Math.max(
      ...builderData.problems.map(p => p.orderIndex),
      -1
    );

    const newProblemItems = problems.map((problem, index) => ({
      problemId: problem.id || `temp-${Date.now()}-${index}`,
      orderIndex: currentMaxIndex + index + 1,
      problem,
    }));

    const updatedProblems = [...builderData.problems, ...newProblemItems];
    const totalPoints = updatedProblems.reduce((sum, item) => 
      sum + (item.problem?.points || 0), 0
    );
    const estimatedTime = updatedProblems.reduce((sum, item) => 
      sum + (item.problem?.timeLimit ? Math.ceil(item.problem.timeLimit / 60) : 2), 0
    );

    setBuilderData(prev => ({
      ...prev,
      problems: updatedProblems,
      totalPoints,
      estimatedTime,
    }));
    setShowProblemPicker(false);
  }, [builderData.problems]);

  const handleRemoveProblem = useCallback((index: number) => {
    const updatedProblems = builderData.problems
      .filter((_, i) => i !== index)
      .map((item, newIndex) => ({ ...item, orderIndex: newIndex }));
    
    const totalPoints = updatedProblems.reduce((sum, item) => 
      sum + (item.problem?.points || 0), 0
    );
    const estimatedTime = updatedProblems.reduce((sum, item) => 
      sum + (item.problem?.timeLimit ? Math.ceil(item.problem.timeLimit / 60) : 2), 0
    );

    setBuilderData(prev => ({
      ...prev,
      problems: updatedProblems,
      totalPoints,
      estimatedTime,
    }));
  }, [builderData.problems]);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    const updatedProblems = [...builderData.problems];
    const [draggedItem] = updatedProblems.splice(draggedIndex, 1);
    updatedProblems.splice(targetIndex, 0, draggedItem);

    // 순서 인덱스 재정렬
    const reorderedProblems = updatedProblems.map((item, index) => ({
      ...item,
      orderIndex: index,
    }));

    setBuilderData(prev => ({ ...prev, problems: reorderedProblems }));
    setDraggedIndex(null);
  }, [draggedIndex, builderData.problems]);

  const validateProblemSet = useCallback((): string[] => {
    const errors: string[] = [];

    if (!builderData.title.trim()) {
      errors.push('문제집 제목을 입력해주세요.');
    }

    if (builderData.problems.length === 0) {
      errors.push('최소 1개 이상의 문제를 추가해주세요.');
    }

    if (builderData.problems.length > 50) {
      errors.push('문제집당 최대 50개의 문제만 추가할 수 있습니다.');
    }

    return errors;
  }, [builderData]);

  const handleSave = async () => {
    const errors = validateProblemSet();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      await onSave?.(builderData);
    } catch (error) {
      console.error('문제집 저장 중 오류:', error);
      setValidationErrors(['저장 중 오류가 발생했습니다.']);
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'outline';
    }
  };

  const getDifficultyLabel = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return '쉬움';
      case 'medium': return '보통';
      case 'hard': return '어려움';
      default: return '미설정';
    }
  };

  const getTypeEmoji = (type?: string) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {mode === 'create' ? '새 문제집 만들기' : '문제집 편집'}
          </h1>
          <p className="text-text-secondary">
            문제를 선택하고 순서를 조정하여 문제집을 구성하세요.
          </p>
        </div>
        <div className="flex gap-3">
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

      <Grid cols={{ base: 1, lg: 3 }} gap={6}>
        {/* 기본 정보 및 문제 목록 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-primary block mb-2">
                  문제집 제목 *
                </label>
                <Input
                  value={builderData.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  placeholder="예: 중학교 수학 1학년 - 정수와 유리수"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary block mb-2">
                  설명 (선택사항)
                </label>
                <textarea
                  className="w-full p-3 text-sm border border-border-primary rounded-lg bg-surface-primary text-text-primary placeholder-text-tertiary resize-none"
                  rows={3}
                  value={builderData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  placeholder="문제집에 대한 간단한 설명을 입력하세요"
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* 문제 목록 */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  문제 목록 ({builderData.problems.length}개)
                </CardTitle>
                <Button 
                  size="sm" 
                  onClick={() => setShowProblemPicker(true)}
                  disabled={isLoading}
                >
                  + 문제 추가
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {builderData.problems.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📝</div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    문제가 없습니다
                  </h3>
                  <p className="text-text-secondary mb-4">
                    문제를 추가하여 문제집을 구성해보세요.
                  </p>
                  <Button onClick={() => setShowProblemPicker(true)}>
                    첫 번째 문제 추가하기
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {builderData.problems.map((item, index) => (
                    <div
                      key={`${item.problemId}-${index}`}
                      draggable={!isLoading}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`p-4 border rounded-lg cursor-move transition-all ${
                        draggedIndex === index 
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' 
                          : 'border-border-primary hover:border-brand-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* 드래그 핸들 */}
                        <div className="flex-shrink-0 text-text-tertiary mt-1">
                          ⋮⋮
                        </div>

                        {/* 순서 번호 */}
                        <div className="flex-shrink-0 w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-sm font-medium text-brand-700">
                          {index + 1}
                        </div>

                        {/* 문제 정보 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-text-primary truncate">
                                {getTypeEmoji(item.problem?.type)} {item.problem?.title || '제목 없음'}
                              </h4>
                              <p className="text-sm text-text-secondary line-clamp-2 mt-1">
                                {item.problem?.content || '내용 없음'}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveProblem(index)}
                              disabled={isLoading}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              ✕
                            </Button>
                          </div>

                          <div className="flex items-center gap-2 mt-3">
                            <Badge 
                              variant={getDifficultyColor(item.problem?.difficulty) as any}
                              size="sm"
                            >
                              {getDifficultyLabel(item.problem?.difficulty)}
                            </Badge>
                            <Badge variant="outline" size="sm">
                              {item.problem?.points || 0}점
                            </Badge>
                            {item.problem?.timeLimit && (
                              <Badge variant="outline" size="sm">
                                {Math.ceil(item.problem.timeLimit / 60)}분
                              </Badge>
                            )}
                            {item.problem?.tags?.map(tag => (
                              <Badge key={tag} variant="secondary" size="sm">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 요약 패널 */}
        <div className="space-y-6">
          {/* 문제집 요약 */}
          <Card className="bg-surface-secondary">
            <CardHeader>
              <CardTitle>문제집 요약</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">총 문제 수:</span>
                  <span className="font-medium">{builderData.problems.length}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">총 점수:</span>
                  <span className="font-medium">{builderData.totalPoints}점</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">예상 시간:</span>
                  <span className="font-medium">{builderData.estimatedTime}분</span>
                </div>
                {builderData.problems.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">평균 배점:</span>
                    <span className="font-medium">
                      {(builderData.totalPoints / builderData.problems.length).toFixed(1)}점
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 문제 유형 분포 */}
          {builderData.problems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>문제 유형 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {Array.from(
                    builderData.problems.reduce((acc, item) => {
                      const type = item.problem?.type || 'unknown';
                      acc.set(type, (acc.get(type) || 0) + 1);
                      return acc;
                    }, new Map<string, number>())
                  ).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-text-secondary">
                        {getTypeEmoji(type)} {
                          type === 'multiple_choice' ? '객관식' :
                          type === 'short_answer' ? '단답형' :
                          type === 'true_false' ? 'OX형' :
                          type === 'long_answer' ? '서술형' :
                          type === 'matching' ? '매칭형' :
                          type === 'fill_blank' ? '빈칸형' :
                          type === 'ordering' ? '순서형' :
                          '기타'
                        }:
                      </span>
                      <Badge variant="outline" size="sm">
                        {count}개
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 도움말 */}
          <Card className="bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="py-4">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                💡 사용 팁
              </h4>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <div>• 드래그하여 문제 순서를 변경할 수 있습니다</div>
                <div>• 다양한 난이도를 적절히 섞어보세요</div>
                <div>• 총 시간을 고려해 문제 수를 조정하세요</div>
                <div>• 태그를 활용해 주제별로 구성해보세요</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Grid>

      {/* 문제 선택 모달 */}
      {showProblemPicker && (
        <ProblemPicker
          onSelect={handleAddProblems}
          onCancel={() => setShowProblemPicker(false)}
          excludeIds={builderData.problems.map(p => p.problemId)}
        />
      )}
    </div>
  );
}