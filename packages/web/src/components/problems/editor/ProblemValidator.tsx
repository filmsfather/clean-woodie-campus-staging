import React, { useState, useCallback, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Progress,
} from '../../ui';
import { ProblemData } from './ProblemEditor';

type ValidationLevel = 'error' | 'warning' | 'info' | 'success';

interface ValidationIssue {
  level: ValidationLevel;
  category: string;
  title: string;
  description: string;
  suggestion?: string;
  fieldPath?: string;
  icon: string;
}

interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: ValidationIssue[];
  passedChecks: number;
  totalChecks: number;
}

interface ProblemValidatorProps {
  problem: ProblemData;
  onFixIssue?: (issueId: string, fieldPath?: string) => void;
  showDetailedReport?: boolean;
}

export function ProblemValidator({
  problem,
  onFixIssue,
  showDetailedReport = true,
}: ProblemValidatorProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [showAllIssues, setShowAllIssues] = useState(false);

  const validationResult = useMemo((): ValidationResult => {
    const issues: ValidationIssue[] = [];
    let totalChecks = 0;
    let passedChecks = 0;

    // 기본 정보 검증
    const basicIssues = validateBasicInfo();
    issues.push(...basicIssues);
    totalChecks += 10; // 기본 검증 항목 수
    passedChecks += Math.max(0, 10 - basicIssues.filter(i => i.level === 'error').length);

    // 문제 유형별 검증
    const typeSpecificIssues = validateTypeSpecific();
    issues.push(...typeSpecificIssues);
    totalChecks += 15; // 유형별 검증 항목 수
    passedChecks += Math.max(0, 15 - typeSpecificIssues.filter(i => i.level === 'error').length);

    // 품질 검증
    const qualityIssues = validateQuality();
    issues.push(...qualityIssues);
    totalChecks += 10; // 품질 검증 항목 수
    passedChecks += Math.max(0, 10 - qualityIssues.filter(i => i.level === 'warning').length);

    // 접근성 검증
    const accessibilityIssues = validateAccessibility();
    issues.push(...accessibilityIssues);
    totalChecks += 5; // 접근성 검증 항목 수
    passedChecks += Math.max(0, 5 - accessibilityIssues.filter(i => i.level === 'warning').length);

    const errorCount = issues.filter(i => i.level === 'error').length;
    const isValid = errorCount === 0;
    const score = Math.round((passedChecks / totalChecks) * 100);

    return {
      isValid,
      score,
      issues,
      passedChecks,
      totalChecks,
    };
  }, [problem]);

  const validateBasicInfo = useCallback((): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    // 제목 검증
    if (!problem.title || problem.title.trim().length === 0) {
      issues.push({
        level: 'error',
        category: '기본 정보',
        title: '문제 제목이 없습니다',
        description: '문제 제목은 필수 항목입니다.',
        suggestion: '명확하고 구체적인 제목을 작성해주세요.',
        fieldPath: 'title',
        icon: '📝',
      });
    } else if (problem.title.length > 200) {
      issues.push({
        level: 'warning',
        category: '기본 정보',
        title: '제목이 너무 깁니다',
        description: `제목이 ${problem.title.length}자입니다. 권장 길이는 200자 이내입니다.`,
        suggestion: '간결하고 명확한 제목으로 수정해주세요.',
        fieldPath: 'title',
        icon: '✂️',
      });
    }

    // 내용 검증
    if (!problem.content || problem.content.trim().length === 0) {
      issues.push({
        level: 'error',
        category: '기본 정보',
        title: '문제 내용이 없습니다',
        description: '문제 내용은 필수 항목입니다.',
        suggestion: '학생이 이해할 수 있는 명확한 문제 설명을 작성해주세요.',
        fieldPath: 'content',
        icon: '📄',
      });
    } else if (problem.content.length < 10) {
      issues.push({
        level: 'warning',
        category: '기본 정보',
        title: '문제 내용이 너무 짧습니다',
        description: '문제 내용이 너무 간단할 수 있습니다.',
        suggestion: '학생이 충분히 이해할 수 있도록 상세한 설명을 추가해주세요.',
        fieldPath: 'content',
        icon: '📏',
      });
    }

    // 배점 검증
    if (problem.points < 1) {
      issues.push({
        level: 'error',
        category: '기본 정보',
        title: '배점이 설정되지 않았습니다',
        description: '문제의 배점은 1점 이상이어야 합니다.',
        suggestion: '적절한 배점을 설정해주세요.',
        fieldPath: 'points',
        icon: '💯',
      });
    } else if (problem.points > 100) {
      issues.push({
        level: 'warning',
        category: '기본 정보',
        title: '배점이 너무 높습니다',
        description: `${problem.points}점으로 설정되어 있습니다. 일반적으로 100점 이내를 권장합니다.`,
        suggestion: '배점을 조정해주세요.',
        fieldPath: 'points',
        icon: '⚖️',
      });
    }

    // 태그 검증
    if (problem.tags.length === 0) {
      issues.push({
        level: 'info',
        category: '기본 정보',
        title: '태그가 없습니다',
        description: '태그를 추가하면 문제 관리와 검색이 더 쉬워집니다.',
        suggestion: '관련 주제나 키워드를 태그로 추가해보세요.',
        fieldPath: 'tags',
        icon: '🏷️',
      });
    } else if (problem.tags.length > 10) {
      issues.push({
        level: 'warning',
        category: '기본 정보',
        title: '태그가 너무 많습니다',
        description: `${problem.tags.length}개의 태그가 있습니다. 10개 이내를 권장합니다.`,
        suggestion: '핵심적인 태그만 남기고 정리해주세요.',
        fieldPath: 'tags',
        icon: '🔖',
      });
    }

    return issues;
  }, [problem]);

  const validateTypeSpecific = useCallback((): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    switch (problem.type) {
      case 'multiple_choice':
        const mcData = problem.multipleChoiceData;
        if (!mcData) {
          issues.push({
            level: 'error',
            category: '객관식',
            title: '선택지 데이터가 없습니다',
            description: '객관식 문제에는 선택지가 필요합니다.',
            suggestion: '최소 2개 이상의 선택지를 추가해주세요.',
            icon: '🔘',
          });
        } else {
          if (mcData.choices.length < 2) {
            issues.push({
              level: 'error',
              category: '객관식',
              title: '선택지가 부족합니다',
              description: '최소 2개의 선택지가 필요합니다.',
              suggestion: '더 많은 선택지를 추가해주세요.',
              icon: '➕',
            });
          }
          
          const correctChoices = mcData.choices.filter(c => c.isCorrect);
          if (correctChoices.length === 0) {
            issues.push({
              level: 'error',
              category: '객관식',
              title: '정답이 설정되지 않았습니다',
              description: '최소 1개의 정답을 선택해야 합니다.',
              suggestion: '올바른 선택지를 정답으로 표시해주세요.',
              icon: '✅',
            });
          }
          
          const hasEmptyChoice = mcData.choices.some(c => !c.text.trim());
          if (hasEmptyChoice) {
            issues.push({
              level: 'error',
              category: '객관식',
              title: '빈 선택지가 있습니다',
              description: '모든 선택지에 내용을 입력해야 합니다.',
              suggestion: '빈 선택지를 삭제하거나 내용을 추가해주세요.',
              icon: '📝',
            });
          }
          
          if (mcData.choices.length > 6) {
            issues.push({
              level: 'warning',
              category: '객관식',
              title: '선택지가 너무 많습니다',
              description: '선택지가 많을수록 학생이 혼란을 느낄 수 있습니다.',
              suggestion: '5~6개 이내로 줄이는 것을 권장합니다.',
              icon: '📊',
            });
          }
        }
        break;

      case 'short_answer':
        const saData = problem.shortAnswerData;
        if (!saData || saData.correctAnswers.length === 0) {
          issues.push({
            level: 'error',
            category: '단답형',
            title: '정답이 설정되지 않았습니다',
            description: '단답형 문제에는 정답이 필요합니다.',
            suggestion: '가능한 정답들을 입력해주세요.',
            icon: '✏️',
          });
        } else {
          const hasEmptyAnswer = saData.correctAnswers.some(a => !a.trim());
          if (hasEmptyAnswer) {
            issues.push({
              level: 'error',
              category: '단답형',
              title: '빈 정답이 있습니다',
              description: '모든 정답에 내용이 있어야 합니다.',
              suggestion: '빈 정답을 삭제하거나 내용을 추가해주세요.',
              icon: '📝',
            });
          }
        }
        break;

      case 'true_false':
        const tfData = problem.trueFalseData;
        if (!tfData || typeof tfData.correctAnswer !== 'boolean') {
          issues.push({
            level: 'error',
            category: 'OX형',
            title: '정답이 설정되지 않았습니다',
            description: 'OX형 문제의 정답(참/거짓)을 선택해야 합니다.',
            suggestion: '올바른 답(참 또는 거짓)을 선택해주세요.',
            icon: '✅',
          });
        }
        break;

      case 'long_answer':
        const laData = problem.longAnswerData;
        if (laData?.minLength && laData?.maxLength && laData.minLength > laData.maxLength) {
          issues.push({
            level: 'error',
            category: '서술형',
            title: '글자 수 제한이 잘못되었습니다',
            description: '최소 글자 수가 최대 글자 수보다 큽니다.',
            suggestion: '글자 수 제한을 올바르게 설정해주세요.',
            icon: '📏',
          });
        }
        break;

      case 'matching':
        const mData = problem.matchingData;
        if (!mData) {
          issues.push({
            level: 'error',
            category: '매칭형',
            title: '매칭 데이터가 없습니다',
            description: '매칭형 문제에는 좌우 항목과 정답이 필요합니다.',
            suggestion: '좌우 항목과 정답 매칭을 설정해주세요.',
            icon: '🔗',
          });
        } else {
          if (!mData.leftItems || mData.leftItems.length < 2) {
            issues.push({
              level: 'error',
              category: '매칭형',
              title: '좌측 항목이 부족합니다',
              description: '최소 2개의 좌측 항목이 필요합니다.',
              suggestion: '더 많은 좌측 항목을 추가해주세요.',
              icon: '⬅️',
            });
          }
          
          if (!mData.rightItems || mData.rightItems.length < 2) {
            issues.push({
              level: 'error',
              category: '매칭형',
              title: '우측 항목이 부족합니다',
              description: '최소 2개의 우측 항목이 필요합니다.',
              suggestion: '더 많은 우측 항목을 추가해주세요.',
              icon: '➡️',
            });
          }
          
          if (mData.correctMatches.length === 0) {
            issues.push({
              level: 'error',
              category: '매칭형',
              title: '정답 매칭이 없습니다',
              description: '최소 1개의 정답 매칭이 필요합니다.',
              suggestion: '올바른 매칭 관계를 설정해주세요.',
              icon: '🎯',
            });
          }
        }
        break;

      case 'fill_blank':
        const fbData = problem.fillBlankData;
        if (!fbData) {
          issues.push({
            level: 'error',
            category: '빈칸형',
            title: '빈칸 데이터가 없습니다',
            description: '빈칸 채우기 문제에는 텍스트와 빈칸이 필요합니다.',
            suggestion: '__blank__를 포함한 문제 텍스트를 작성해주세요.',
            icon: '🧩',
          });
        } else {
          const blankCount = (fbData.text.match(/__blank__/g) || []).length;
          if (blankCount === 0) {
            issues.push({
              level: 'error',
              category: '빈칸형',
              title: '빈칸이 없습니다',
              description: '문제 텍스트에 __blank__가 없습니다.',
              suggestion: '빈칸이 들어갈 위치에 __blank__를 입력해주세요.',
              icon: '📄',
            });
          } else if (blankCount !== fbData.blanks.length) {
            issues.push({
              level: 'error',
              category: '빈칸형',
              title: '빈칸 수가 일치하지 않습니다',
              description: `텍스트의 빈칸 수(${blankCount})와 설정된 빈칸 수(${fbData.blanks.length})가 다릅니다.`,
              suggestion: '빈칸 설정을 다시 확인해주세요.',
              icon: '🔍',
            });
          }
          
          const hasEmptyBlank = fbData.blanks.some(b => b.acceptedAnswers.length === 0);
          if (hasEmptyBlank) {
            issues.push({
              level: 'error',
              category: '빈칸형',
              title: '정답이 없는 빈칸이 있습니다',
              description: '모든 빈칸에 정답이 설정되어야 합니다.',
              suggestion: '각 빈칸에 정답을 추가해주세요.',
              icon: '✅',
            });
          }
        }
        break;

      case 'ordering':
        const oData = problem.orderingData;
        if (!oData) {
          issues.push({
            level: 'error',
            category: '순서형',
            title: '순서 데이터가 없습니다',
            description: '순서 배열 문제에는 항목과 정답 순서가 필요합니다.',
            suggestion: '배열할 항목들과 정답 순서를 설정해주세요.',
            icon: '📊',
          });
        } else {
          if (!oData.items || oData.items.length < 2) {
            issues.push({
              level: 'error',
              category: '순서형',
              title: '항목이 부족합니다',
              description: '최소 2개의 항목이 필요합니다.',
              suggestion: '더 많은 항목을 추가해주세요.',
              icon: '📝',
            });
          }
          
          if (oData.correctOrder.length !== oData.items?.length) {
            issues.push({
              level: 'error',
              category: '순서형',
              title: '순서가 완전하지 않습니다',
              description: '모든 항목의 순서가 설정되어야 합니다.',
              suggestion: '정답 순서를 완성해주세요.',
              icon: '🔢',
            });
          }
        }
        break;
    }

    return issues;
  }, [problem]);

  const validateQuality = useCallback((): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    // 문제 명확성 검사
    if (problem.content.includes('?') === false && problem.content.includes('다음') === false) {
      issues.push({
        level: 'info',
        category: '품질',
        title: '질문 형태 확인',
        description: '문제가 질문 형태로 명확히 표현되지 않았을 수 있습니다.',
        suggestion: '학생이 무엇을 해야 하는지 명확히 제시해주세요.',
        icon: '❓',
      });
    }

    // 시간 제한 검사
    if (!problem.timeLimit) {
      issues.push({
        level: 'info',
        category: '품질',
        title: '시간 제한이 없습니다',
        description: '시간 제한을 설정하면 더 공정한 평가가 가능합니다.',
        suggestion: '적절한 시간 제한을 고려해보세요.',
        icon: '⏰',
      });
    } else if (problem.timeLimit < 30) {
      issues.push({
        level: 'warning',
        category: '품질',
        title: '시간이 너무 짧습니다',
        description: `${problem.timeLimit}초는 너무 짧을 수 있습니다.`,
        suggestion: '학생이 충분히 생각할 수 있는 시간을 제공해주세요.',
        icon: '⚡',
      });
    } else if (problem.timeLimit > 3600) {
      issues.push({
        level: 'warning',
        category: '품질',
        title: '시간이 너무 깁니다',
        description: `${Math.floor(problem.timeLimit / 60)}분은 너무 길 수 있습니다.`,
        suggestion: '적절한 시간 제한을 고려해보세요.',
        icon: '🕐',
      });
    }

    return issues;
  }, [problem]);

  const validateAccessibility = useCallback((): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    // 폰트 크기 고려사항
    if (problem.content.length > 1000) {
      issues.push({
        level: 'info',
        category: '접근성',
        title: '긴 텍스트',
        description: '텍스트가 길어서 읽기 어려울 수 있습니다.',
        suggestion: '내용을 단락으로 나누거나 핵심만 정리해보세요.',
        icon: '👁️',
      });
    }

    // 색상 의존성 확인 (이미지 등에서)
    if (problem.content.includes('빨간색') || problem.content.includes('파란색') || problem.content.includes('색깔')) {
      issues.push({
        level: 'warning',
        category: '접근성',
        title: '색상 의존성',
        description: '색상에만 의존한 설명은 색맹이나 시각 장애가 있는 학생에게 어려울 수 있습니다.',
        suggestion: '색상 외에 모양이나 위치 등의 추가 단서를 제공해보세요.',
        icon: '🎨',
      });
    }

    return issues;
  }, [problem]);

  const handleRunValidation = useCallback(async () => {
    setIsValidating(true);
    // 실제로는 서버에서 더 정교한 검증을 수행할 수 있음
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsValidating(false);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreVariant = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const errorIssues = validationResult.issues.filter(i => i.level === 'error');
  const warningIssues = validationResult.issues.filter(i => i.level === 'warning');
  const infoIssues = validationResult.issues.filter(i => i.level === 'info');

  const displayedIssues = showAllIssues ? validationResult.issues : [
    ...errorIssues,
    ...warningIssues.slice(0, 3),
    ...infoIssues.slice(0, 2),
  ];

  return (
    <div className="space-y-6">
      {/* 검증 점수 헤더 */}
      <Card className={`border-2 ${
        validationResult.isValid ? 'border-green-300 bg-green-50 dark:bg-green-900/20' : 'border-orange-300 bg-orange-50 dark:bg-orange-900/20'
      }`}>
        <CardContent className="text-center py-6">
          <div className="space-y-4">
            <div className="text-6xl">
              {validationResult.isValid ? '✅' : '⚠️'}
            </div>
            <div>
              <h2 className={`text-3xl font-bold mb-2 ${getScoreColor(validationResult.score)}`}>
                품질 점수: {validationResult.score}점
              </h2>
              <p className="text-text-secondary">
                {validationResult.passedChecks}/{validationResult.totalChecks} 검사 통과
              </p>
            </div>
            <Progress
              value={validationResult.score}
              variant={getScoreVariant(validationResult.score)}
              className="w-64 mx-auto"
            />
          </div>
        </CardContent>
      </Card>

      {/* 검증 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={errorIssues.length > 0 ? 'border-red-300' : 'border-green-300'}>
          <CardContent className="text-center py-4">
            <div className="text-2xl font-bold text-red-600 mb-1">
              {errorIssues.length}
            </div>
            <div className="text-sm text-text-secondary">오류</div>
          </CardContent>
        </Card>

        <Card className={warningIssues.length > 0 ? 'border-yellow-300' : 'border-green-300'}>
          <CardContent className="text-center py-4">
            <div className="text-2xl font-bold text-yellow-600 mb-1">
              {warningIssues.length}
            </div>
            <div className="text-sm text-text-secondary">경고</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center py-4">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {infoIssues.length}
            </div>
            <div className="text-sm text-text-secondary">개선 제안</div>
          </CardContent>
        </Card>
      </div>

      {/* 검증 결과 상세 */}
      {validationResult.issues.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>검증 결과 상세</CardTitle>
              <div className="flex gap-2">
                {validationResult.issues.length > displayedIssues.length && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllIssues(!showAllIssues)}
                  >
                    {showAllIssues ? '간단히 보기' : '모두 보기'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRunValidation}
                  disabled={isValidating}
                >
                  {isValidating ? '검증 중...' : '다시 검증'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {displayedIssues.map((issue, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    issue.level === 'error'
                      ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                      : issue.level === 'warning'
                      ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20'
                      : 'border-blue-300 bg-blue-50 dark:bg-blue-900/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{issue.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-text-primary">{issue.title}</h4>
                        <Badge
                          variant={
                            issue.level === 'error' ? 'error' :
                            issue.level === 'warning' ? 'warning' : 'secondary'
                          }
                          size="sm"
                        >
                          {issue.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-text-secondary mb-2">
                        {issue.description}
                      </p>
                      {issue.suggestion && (
                        <p className="text-sm text-primary-600 dark:text-primary-400">
                          💡 {issue.suggestion}
                        </p>
                      )}
                    </div>
                    {onFixIssue && issue.fieldPath && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onFixIssue(`issue-${index}`, issue.fieldPath)}
                      >
                        수정
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 성공 메시지 */}
      {validationResult.isValid && (
        <Card className="border-green-300 bg-green-50 dark:bg-green-900/20">
          <CardContent className="text-center py-6">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-lg font-bold text-green-800 dark:text-green-200 mb-2">
              문제가 검증을 통과했습니다!
            </h3>
            <p className="text-green-700 dark:text-green-300 text-sm">
              이 문제는 학생들에게 제공할 준비가 되었습니다.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}