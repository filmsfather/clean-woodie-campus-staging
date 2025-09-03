import React, { useState, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Textarea,
} from '../../ui';
import { ProblemData } from '../editor/ProblemEditor';
import { GradingResult } from './GradingResults';

interface FeedbackItem {
  type: 'positive' | 'constructive' | 'suggestion' | 'explanation';
  title: string;
  content: string;
  icon: string;
  bgColor: string;
  textColor: string;
}

interface FeedbackDisplayProps {
  gradingResult: GradingResult;
  problem: ProblemData;
  canEditFeedback?: boolean;
  onFeedbackUpdate?: (feedback: string) => void;
  showDetailedFeedback?: boolean;
}

export function FeedbackDisplay({
  gradingResult,
  problem,
  canEditFeedback = false,
  onFeedbackUpdate,
  showDetailedFeedback = true,
}: FeedbackDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState(gradingResult.feedback || '');

  // AI가 생성할 수 있는 피드백 생성 (실제로는 백엔드에서 처리)
  const generateAutomaticFeedback = useCallback((): FeedbackItem[] => {
    const feedback: FeedbackItem[] = [];
    const { isCorrect, earnedPoints, maxPoints } = gradingResult;
    const scorePercentage = (earnedPoints / maxPoints) * 100;

    // 성과 기반 피드백
    if (isCorrect || scorePercentage >= 80) {
      feedback.push({
        type: 'positive',
        title: '훌륭한 답안입니다!',
        content: scorePercentage === 100 
          ? '완벽한 점수를 획득했습니다. 개념을 정확히 이해하고 있군요!'
          : '좋은 성과입니다. 대부분의 내용을 정확히 이해하고 있습니다.',
        icon: '🎉',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        textColor: 'text-green-800 dark:text-green-200',
      });
    } else if (scorePercentage >= 50) {
      feedback.push({
        type: 'constructive',
        title: '좋은 시도였습니다',
        content: '부분적으로 정답에 가까운 답안이지만, 몇 가지 개선할 점이 있습니다.',
        icon: '💡',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        textColor: 'text-yellow-800 dark:text-yellow-200',
      });
    } else {
      feedback.push({
        type: 'constructive',
        title: '다시 한 번 시도해보세요',
        content: '기본 개념을 다시 확인하고 비슷한 문제들을 더 풀어보시기 바랍니다.',
        icon: '📚',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        textColor: 'text-blue-800 dark:text-blue-200',
      });
    }

    // 문제 유형별 구체적 피드백
    const typeSpecificFeedback = generateTypeSpecificFeedback();
    feedback.push(...typeSpecificFeedback);

    // 시간 관련 피드백
    const timeBasedFeedback = generateTimeBasedFeedback();
    if (timeBasedFeedback) {
      feedback.push(timeBasedFeedback);
    }

    return feedback;
  }, [gradingResult, problem]);

  const generateTypeSpecificFeedback = useCallback((): FeedbackItem[] => {
    const feedback: FeedbackItem[] = [];

    switch (problem.type) {
      case 'multiple_choice':
        if (!gradingResult.isCorrect) {
          feedback.push({
            type: 'suggestion',
            title: '객관식 문제 접근법',
            content: '선택지를 하나씩 신중히 검토하고, 문제에서 요구하는 핵심 개념을 파악해보세요.',
            icon: '🔍',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20',
            textColor: 'text-purple-800 dark:text-purple-200',
          });
        }
        break;

      case 'short_answer':
        if (!gradingResult.isCorrect) {
          feedback.push({
            type: 'suggestion',
            title: '단답형 문제 팁',
            content: '핵심 키워드를 정확히 사용하고, 대소문자나 띄어쓰기에 주의하세요.',
            icon: '✏️',
            bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
            textColor: 'text-indigo-800 dark:text-indigo-200',
          });
        }
        break;

      case 'long_answer':
        const longAnswerData = problem.longAnswerData;
        const studentAnswer = gradingResult.studentAnswer || '';
        
        if (longAnswerData?.keywords) {
          const foundKeywords = longAnswerData.keywords.filter(keyword =>
            studentAnswer.toLowerCase().includes(keyword.toLowerCase())
          );
          
          if (foundKeywords.length < longAnswerData.keywords.length) {
            feedback.push({
              type: 'suggestion',
              title: '키워드 활용',
              content: `핵심 키워드 중 일부가 누락되었습니다. 다음 키워드들을 포함해보세요: ${
                longAnswerData.keywords.filter(k => !foundKeywords.includes(k)).join(', ')
              }`,
              icon: '🔑',
              bgColor: 'bg-orange-50 dark:bg-orange-900/20',
              textColor: 'text-orange-800 dark:text-orange-200',
            });
          }
        }
        
        if (longAnswerData?.minLength && studentAnswer.length < longAnswerData.minLength) {
          feedback.push({
            type: 'constructive',
            title: '답안 길이',
            content: `더 자세한 설명이 필요합니다. 최소 ${longAnswerData.minLength}자 이상 작성해주세요.`,
            icon: '📏',
            bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
            textColor: 'text-yellow-800 dark:text-yellow-200',
          });
        }
        break;

      case 'matching':
        const matchingResult = gradingResult.studentAnswer || [];
        const correctMatches = problem.matchingData?.correctMatches || [];
        const correctCount = matchingResult.filter((studentMatch: any) =>
          correctMatches.some(correctMatch => 
            correctMatch.leftId === studentMatch.leftId && correctMatch.rightId === studentMatch.rightId
          )
        ).length;
        
        if (correctCount < correctMatches.length) {
          feedback.push({
            type: 'suggestion',
            title: '매칭 전략',
            content: '확실한 매칭부터 먼저 연결하고, 나머지는 소거법을 활용해보세요.',
            icon: '🔗',
            bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
            textColor: 'text-cyan-800 dark:text-cyan-200',
          });
        }
        break;

      case 'fill_blank':
        const blankAnswers = gradingResult.studentAnswer || {};
        const blanks = problem.fillBlankData?.blanks || [];
        const correctBlanks = Object.entries(blankAnswers).filter(([blankId, answer]) => {
          const blank = blanks.find(b => b.id === blankId);
          if (!blank) return false;
          
          const studentAnswer = String(answer).trim();
          return blank.acceptedAnswers.some(acceptedAnswer => {
            if (blank.caseSensitive) {
              return acceptedAnswer === studentAnswer;
            }
            return acceptedAnswer.toLowerCase() === studentAnswer.toLowerCase();
          });
        }).length;
        
        if (correctBlanks < blanks.length) {
          feedback.push({
            type: 'suggestion',
            title: '빈칸 채우기 팁',
            content: '문맥을 신중히 읽고, 앞뒤 문장의 관계를 파악해보세요.',
            icon: '🧩',
            bgColor: 'bg-teal-50 dark:bg-teal-900/20',
            textColor: 'text-teal-800 dark:text-teal-200',
          });
        }
        break;

      case 'ordering':
        const studentOrder = gradingResult.studentAnswer || [];
        const correctOrder = problem.orderingData?.correctOrder || [];
        const correctPositions = studentOrder.filter((itemId: string, index: number) => 
          correctOrder[index] === itemId
        ).length;
        
        if (correctPositions < correctOrder.length) {
          feedback.push({
            type: 'suggestion',
            title: '순서 배열 전략',
            content: '논리적 흐름이나 시간 순서를 고려하여 단계별로 배열해보세요.',
            icon: '📊',
            bgColor: 'bg-pink-50 dark:bg-pink-900/20',
            textColor: 'text-pink-800 dark:text-pink-200',
          });
        }
        break;
    }

    return feedback;
  }, [problem, gradingResult]);

  const generateTimeBasedFeedback = useCallback((): FeedbackItem | null => {
    const timeSpent = gradingResult.timeSpent;
    const timeLimit = problem.timeLimit;
    
    if (!timeLimit) return null;

    const timePercentage = (timeSpent / (timeLimit * 1000)) * 100;
    
    if (timePercentage < 30) {
      return {
        type: 'positive',
        title: '효율적인 시간 관리',
        content: '시간을 효율적으로 사용하여 문제를 해결했습니다.',
        icon: '⚡',
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
        textColor: 'text-emerald-800 dark:text-emerald-200',
      };
    } else if (timePercentage > 80) {
      return {
        type: 'suggestion',
        title: '시간 관리 개선',
        content: '좀 더 신속한 판단과 문제 해결 연습이 도움이 될 것 같습니다.',
        icon: '⏰',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        textColor: 'text-amber-800 dark:text-amber-200',
      };
    }
    
    return null;
  }, [gradingResult, problem]);

  const handleSaveFeedback = useCallback(() => {
    onFeedbackUpdate?.(editingFeedback);
    setIsEditing(false);
  }, [editingFeedback, onFeedbackUpdate]);

  const handleCancelEdit = useCallback(() => {
    setEditingFeedback(gradingResult.feedback || '');
    setIsEditing(false);
  }, [gradingResult.feedback]);

  const automaticFeedback = showDetailedFeedback ? generateAutomaticFeedback() : [];
  const hasCustomFeedback = gradingResult.feedback && gradingResult.feedback.trim() !== '';

  return (
    <div className="space-y-4">
      {/* 사용자 정의 피드백 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              💬 교사 피드백
            </CardTitle>
            {canEditFeedback && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => isEditing ? handleCancelEdit() : setIsEditing(true)}
              >
                {isEditing ? '취소' : '수정'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editingFeedback}
                onChange={(e) => setEditingFeedback(e.target.value)}
                placeholder="학생에게 도움이 될 개인화된 피드백을 작성해주세요..."
                className="min-h-[100px]"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                  취소
                </Button>
                <Button size="sm" onClick={handleSaveFeedback}>
                  저장
                </Button>
              </div>
            </div>
          ) : hasCustomFeedback ? (
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                {gradingResult.feedback}
              </p>
            </div>
          ) : (
            <div className="text-center py-6 text-text-secondary">
              <div className="text-4xl mb-2">📝</div>
              <p>아직 개인화된 피드백이 없습니다.</p>
              {canEditFeedback && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="mt-2"
                >
                  피드백 작성하기
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 자동 생성 피드백 */}
      {showDetailedFeedback && automaticFeedback.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🤖 AI 학습 도움말
              <Badge variant="secondary" size="sm">자동 생성</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {automaticFeedback.map((feedback, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${feedback.bgColor} border-opacity-50`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{feedback.icon}</span>
                    <div className="flex-1">
                      <h4 className={`font-medium mb-1 ${feedback.textColor}`}>
                        {feedback.title}
                      </h4>
                      <p className={`text-sm ${feedback.textColor.replace('800', '700').replace('200', '300')}`}>
                        {feedback.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 학습 개선 제안 */}
      {showDetailedFeedback && gradingResult.earnedPoints < gradingResult.maxPoints && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🚀 다음 단계 학습 제안
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📖</span>
                <div>
                  <h4 className="font-medium text-text-primary mb-1">
                    유사한 문제 더 풀어보기
                  </h4>
                  <p className="text-sm text-text-secondary">
                    같은 유형의 문제를 더 풀어보면서 패턴을 익혀보세요.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <h4 className="font-medium text-text-primary mb-1">
                    기본 개념 복습하기
                  </h4>
                  <p className="text-sm text-text-secondary">
                    문제와 관련된 기본 개념을 다시 한 번 정리해보세요.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-2xl">👥</span>
                <div>
                  <h4 className="font-medium text-text-primary mb-1">
                    도움 요청하기
                  </h4>
                  <p className="text-sm text-text-secondary">
                    어려운 부분이 있다면 선생님이나 친구들에게 도움을 요청해보세요.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}