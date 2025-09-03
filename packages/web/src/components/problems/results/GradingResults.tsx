import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Progress,
  Grid,
} from '../../ui';
import { ProblemData } from '../editor/ProblemEditor';
import { ProblemAnswer } from '../solver/ProblemSolverContainer';

export interface GradingResult {
  problemId: string;
  isCorrect: boolean;
  earnedPoints: number;
  maxPoints: number;
  studentAnswer: any;
  correctAnswer: any;
  feedback?: string;
  timeSpent: number;
}

export interface SessionResult {
  sessionId: string;
  problemSetId: string;
  studentId: string;
  totalScore: number;
  maxScore: number;
  accuracy: number; // 정답률 (0-1)
  totalTimeSpent: number;
  submittedAt: Date;
  gradingResults: GradingResult[];
}

interface GradingResultsProps {
  result: SessionResult;
  problems: ProblemData[];
  onReviewProblem?: (problemIndex: number) => void;
  onRetry?: () => void;
  showDetailedAnswers?: boolean;
}

export function GradingResults({
  result,
  problems,
  onReviewProblem,
  onRetry,
  showDetailedAnswers = true,
}: GradingResultsProps) {
  const [selectedProblemIndex, setSelectedProblemIndex] = useState<number | null>(null);

  const correctCount = result.gradingResults.filter(r => r.isCorrect).length;
  const totalCount = result.gradingResults.length;
  const scorePercentage = (result.totalScore / result.maxScore) * 100;
  
  // 성과 등급 계산
  const getPerformanceGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A+', color: 'success', message: '탁월함' };
    if (percentage >= 80) return { grade: 'A', color: 'success', message: '우수함' };
    if (percentage >= 70) return { grade: 'B', color: 'warning', message: '양호함' };
    if (percentage >= 60) return { grade: 'C', color: 'warning', message: '보통' };
    return { grade: 'F', color: 'error', message: '더 노력 필요' };
  };

  const performance = getPerformanceGrade(scorePercentage);

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}분 ${seconds % 60}초`;
    }
    return `${seconds}초`;
  };

  const getResultIcon = (isCorrect: boolean) => {
    return isCorrect ? '✅' : '❌';
  };

  const renderAnswerComparison = (gradingResult: GradingResult, problem: ProblemData) => {
    switch (problem.type) {
      case 'multiple_choice':
        return renderMultipleChoiceComparison(gradingResult, problem);
      default:
        return (
          <div className="text-sm text-text-secondary">
            답안 비교는 이 문제 유형에 대해 준비 중입니다.
          </div>
        );
    }
  };

  const renderMultipleChoiceComparison = (gradingResult: GradingResult, problem: ProblemData) => {
    const choices = problem.multipleChoiceData?.choices || [];
    const studentAnswers = Array.isArray(gradingResult.studentAnswer) 
      ? gradingResult.studentAnswer 
      : [gradingResult.studentAnswer];
    
    return (
      <div className="space-y-2">
        {choices.map((choice, index) => {
          const isStudentSelected = studentAnswers.includes(choice.id);
          const isCorrectChoice = choice.isCorrect;
          
          let statusClass = 'border-border-primary bg-surface-primary';
          let statusIcon = '';
          
          if (isCorrectChoice && isStudentSelected) {
            statusClass = 'border-green-300 bg-green-50 dark:bg-green-900/20';
            statusIcon = '✅';
          } else if (isCorrectChoice && !isStudentSelected) {
            statusClass = 'border-orange-300 bg-orange-50 dark:bg-orange-900/20';
            statusIcon = '💡'; // 놓친 정답
          } else if (!isCorrectChoice && isStudentSelected) {
            statusClass = 'border-red-300 bg-red-50 dark:bg-red-900/20';
            statusIcon = '❌';
          }
          
          return (
            <div key={choice.id} className={`p-3 rounded border ${statusClass}`}>
              <div className="flex items-start gap-3">
                <span className="font-medium">{index + 1}.</span>
                <span className="flex-1">{choice.text}</span>
                <div className="flex items-center gap-2">
                  {isStudentSelected && (
                    <Badge variant="outline" size="sm">선택됨</Badge>
                  )}
                  {isCorrectChoice && (
                    <Badge variant="success" size="sm">정답</Badge>
                  )}
                  <span className="text-lg">{statusIcon}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 결과 헤더 */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <CardContent className="text-center py-8">
          <div className="space-y-4">
            <div className="text-6xl">{scorePercentage >= 70 ? '🎉' : '📚'}</div>
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                채점 완료!
              </h1>
              <p className="text-text-secondary">
                수고하셨습니다. 결과를 확인해보세요.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 성과 요약 */}
      <Grid cols={{ base: 1, md: 2, lg: 4 }} gap={4}>
        <Card>
          <CardContent className="text-center py-6">
            <div className="text-3xl font-bold text-brand-600 mb-2">
              {result.totalScore}
            </div>
            <div className="text-sm text-text-secondary">
              총점 (만점: {result.maxScore})
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center py-6">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {correctCount}/{totalCount}
            </div>
            <div className="text-sm text-text-secondary">
              정답 문제 수
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center py-6">
            <Badge 
              variant={performance.color as any}
              className="text-lg px-4 py-2"
            >
              {performance.grade}
            </Badge>
            <div className="text-sm text-text-secondary mt-2">
              {performance.message}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center py-6">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {formatTime(result.totalTimeSpent)}
            </div>
            <div className="text-sm text-text-secondary">
              총 소요시간
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* 정답률 시각화 */}
      <Card>
        <CardHeader>
          <CardTitle>정답률</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>전체 정답률</span>
              <span className="font-medium">{(result.accuracy * 100).toFixed(1)}%</span>
            </div>
            <Progress
              value={result.accuracy * 100}
              variant={result.accuracy >= 0.8 ? 'success' : result.accuracy >= 0.6 ? 'warning' : 'error'}
              className="h-3"
            />
          </div>
        </CardContent>
      </Card>

      {/* 문제별 결과 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>문제별 상세 결과</CardTitle>
            <Badge variant="outline" size="sm">
              {totalCount}문제
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {result.gradingResults.map((gradingResult, index) => {
              const problem = problems.find(p => p.id === gradingResult.problemId);
              if (!problem) return null;

              const isSelected = selectedProblemIndex === index;

              return (
                <div key={gradingResult.problemId} className="border border-border-primary rounded-lg">
                  <button
                    className="w-full p-4 text-left hover:bg-surface-secondary rounded-lg transition-colors"
                    onClick={() => setSelectedProblemIndex(isSelected ? null : index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          {getResultIcon(gradingResult.isCorrect)}
                        </span>
                        <div>
                          <div className="font-medium text-text-primary">
                            {index + 1}. {problem.title}
                          </div>
                          <div className="text-sm text-text-secondary">
                            {gradingResult.earnedPoints}/{gradingResult.maxPoints}점
                            • {formatTime(gradingResult.timeSpent)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {gradingResult.isCorrect ? (
                          <Badge variant="success" size="sm">정답</Badge>
                        ) : (
                          <Badge variant="error" size="sm">오답</Badge>
                        )}
                        <span className="text-sm text-text-secondary">
                          {isSelected ? '▲' : '▼'}
                        </span>
                      </div>
                    </div>
                  </button>

                  {isSelected && showDetailedAnswers && (
                    <div className="px-4 pb-4 border-t border-border-primary">
                      <div className="pt-4 space-y-4">
                        <div>
                          <h4 className="font-medium text-text-primary mb-2">문제</h4>
                          <p className="text-sm text-text-secondary whitespace-pre-wrap">
                            {problem.content}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-text-primary mb-2">답안 비교</h4>
                          {renderAnswerComparison(gradingResult, problem)}
                        </div>

                        {gradingResult.feedback && (
                          <div>
                            <h4 className="font-medium text-text-primary mb-2">피드백</h4>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                {gradingResult.feedback}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onReviewProblem?.(index)}
                          >
                            문제 다시보기
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 액션 버튼 */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={onRetry}>
          다시 도전하기
        </Button>
        <Button variant="default">
          결과 저장하기
        </Button>
      </div>

      {/* 성과 분석 및 조언 */}
      <Card className="bg-surface-secondary">
        <CardHeader>
          <CardTitle>성과 분석 및 학습 조언</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scorePercentage >= 80 ? (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-green-800 dark:text-green-200">
                  🎉 <strong>우수한 성과입니다!</strong> 지속적인 학습을 통해 더욱 발전해보세요.
                </p>
              </div>
            ) : scorePercentage >= 60 ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200">
                  💪 <strong>좋은 시작입니다!</strong> 틀린 문제들을 다시 복습하면 더 좋은 결과를 얻을 수 있을 것 같습니다.
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-blue-800 dark:text-blue-200">
                  📚 <strong>더 많은 연습이 필요해요.</strong> 기초를 다시 한 번 점검하고 비슷한 문제들을 더 풀어보세요.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}