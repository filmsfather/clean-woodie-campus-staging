import React from 'react';
import {
  Card,
  CardContent,
  Badge,
  Progress,
} from '../../ui';
import { ProblemData } from '../editor/ProblemEditor';
import { GradingResult } from './GradingResults';

interface AnswerComparisonProps {
  gradingResult: GradingResult;
  problem: ProblemData;
  showExplanation?: boolean;
}

export function AnswerComparison({
  gradingResult,
  problem,
  showExplanation = true,
}: AnswerComparisonProps) {
  const renderComparison = () => {
    switch (problem.type) {
      case 'multiple_choice':
        return renderMultipleChoiceComparison();
      case 'short_answer':
        return renderShortAnswerComparison();
      case 'true_false':
        return renderTrueFalseComparison();
      case 'long_answer':
        return renderLongAnswerComparison();
      case 'matching':
        return renderMatchingComparison();
      case 'fill_blank':
        return renderFillBlankComparison();
      case 'ordering':
        return renderOrderingComparison();
      default:
        return (
          <div className="text-sm text-text-secondary">
            이 문제 유형에 대한 답안 비교는 준비 중입니다.
          </div>
        );
    }
  };

  const renderMultipleChoiceComparison = () => {
    const choices = problem.multipleChoiceData?.choices || [];
    const studentAnswers = Array.isArray(gradingResult.studentAnswer) 
      ? gradingResult.studentAnswer 
      : [gradingResult.studentAnswer];
    
    return (
      <div className="space-y-3">
        <div className="flex justify-between text-sm text-text-secondary mb-3">
          <span>선택지 비교</span>
          <span>선택됨 / 정답</span>
        </div>
        
        {choices.map((choice, index) => {
          const isStudentSelected = studentAnswers.includes(choice.id);
          const isCorrectChoice = choice.isCorrect;
          
          let statusClass = 'border-border-primary bg-surface-primary';
          let statusIcon = '';
          
          if (isCorrectChoice && isStudentSelected) {
            statusClass = 'border-green-300 bg-green-50 dark:bg-green-900/20';
            statusIcon = '✅ 정답 선택';
          } else if (isCorrectChoice && !isStudentSelected) {
            statusClass = 'border-orange-300 bg-orange-50 dark:bg-orange-900/20';
            statusIcon = '💡 놓친 정답';
          } else if (!isCorrectChoice && isStudentSelected) {
            statusClass = 'border-red-300 bg-red-50 dark:bg-red-900/20';
            statusIcon = '❌ 잘못 선택';
          } else {
            statusIcon = '⚪ 미선택';
          }
          
          return (
            <div key={choice.id} className={`p-3 rounded-lg border ${statusClass}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <span className="font-medium text-text-secondary min-w-[20px]">
                    {index + 1}.
                  </span>
                  <span className="text-text-primary">{choice.text}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    {isStudentSelected && (
                      <Badge variant="outline" size="sm">선택됨</Badge>
                    )}
                    {isCorrectChoice && (
                      <Badge variant="success" size="sm">정답</Badge>
                    )}
                  </div>
                  <span className="text-xs text-text-secondary">{statusIcon}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderShortAnswerComparison = () => {
    const studentAnswer = gradingResult.studentAnswer || '';
    const correctAnswers = problem.shortAnswerData?.correctAnswers || [];
    const caseSensitive = problem.shortAnswerData?.caseSensitive || false;
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="text-sm font-medium text-text-primary mb-2">학생 답안</h5>
            <div className={`p-3 rounded-lg border-2 ${
              gradingResult.isCorrect 
                ? 'border-green-300 bg-green-50 dark:bg-green-900/20' 
                : 'border-red-300 bg-red-50 dark:bg-red-900/20'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-text-primary">{studentAnswer || '(답안 없음)'}</span>
                <span className="text-lg">
                  {gradingResult.isCorrect ? '✅' : '❌'}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-text-primary mb-2">정답</h5>
            <div className="space-y-2">
              {correctAnswers.map((answer, index) => (
                <div key={index} className="p-3 rounded-lg border border-green-300 bg-green-50 dark:bg-green-900/20">
                  <span className="text-green-800 dark:text-green-200">{answer}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="text-xs text-text-secondary">
          대소문자 구분: {caseSensitive ? '예' : '아니오'}
        </div>
      </div>
    );
  };

  const renderTrueFalseComparison = () => {
    const studentAnswer = gradingResult.studentAnswer;
    const correctAnswer = problem.trueFalseData?.correctAnswer;
    const explanation = problem.trueFalseData?.explanation;
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <h5 className="text-sm font-medium text-text-primary mb-3">학생 선택</h5>
            <div className={`p-4 rounded-lg border-2 ${
              gradingResult.isCorrect 
                ? 'border-green-300 bg-green-50 dark:bg-green-900/20' 
                : 'border-red-300 bg-red-50 dark:bg-red-900/20'
            }`}>
              <div className="text-2xl mb-2">
                {studentAnswer === true ? '⭕' : studentAnswer === false ? '❌' : '❓'}
              </div>
              <div className="font-medium">
                {studentAnswer === true ? '참 (True)' : studentAnswer === false ? '거짓 (False)' : '답안 없음'}
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <h5 className="text-sm font-medium text-text-primary mb-3">정답</h5>
            <div className="p-4 rounded-lg border-2 border-green-300 bg-green-50 dark:bg-green-900/20">
              <div className="text-2xl mb-2">
                {correctAnswer ? '⭕' : '❌'}
              </div>
              <div className="font-medium text-green-800 dark:text-green-200">
                {correctAnswer ? '참 (True)' : '거짓 (False)'}
              </div>
            </div>
          </div>
        </div>
        
        {explanation && showExplanation && (
          <div className="mt-4">
            <h5 className="text-sm font-medium text-text-primary mb-2">해설</h5>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">{explanation}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLongAnswerComparison = () => {
    const studentAnswer = gradingResult.studentAnswer || '';
    const sampleAnswer = problem.longAnswerData?.sampleAnswer;
    const keywords = problem.longAnswerData?.keywords || [];
    const rubric = problem.longAnswerData?.rubric || [];
    
    // 키워드 매칭 분석
    const foundKeywords = keywords.filter(keyword => 
      studentAnswer.toLowerCase().includes(keyword.toLowerCase())
    );
    
    return (
      <div className="space-y-4">
        {/* 학생 답안 */}
        <div>
          <h5 className="text-sm font-medium text-text-primary mb-2">학생 답안</h5>
          <div className="p-4 rounded-lg border border-border-primary bg-surface-secondary">
            <p className="text-text-primary whitespace-pre-wrap">
              {studentAnswer || '(답안 없음)'}
            </p>
            <div className="mt-2 text-xs text-text-secondary">
              글자 수: {studentAnswer.length}자
            </div>
          </div>
        </div>
        
        {/* 키워드 분석 */}
        {keywords.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-text-primary mb-2">핵심 키워드 분석</h5>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => {
                const isFound = foundKeywords.includes(keyword);
                return (
                  <Badge
                    key={index}
                    variant={isFound ? 'success' : 'outline'}
                    size="sm"
                    className={isFound ? '' : 'opacity-50'}
                  >
                    {keyword} {isFound ? '✓' : '✗'}
                  </Badge>
                );
              })}
            </div>
            <div className="mt-2 text-sm text-text-secondary">
              포함된 키워드: {foundKeywords.length}/{keywords.length}개
            </div>
          </div>
        )}
        
        {/* 채점 기준 */}
        {rubric.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-text-primary mb-2">채점 기준</h5>
            <div className="space-y-2">
              {rubric.map((criterion, index) => (
                <div key={index} className="p-3 rounded-lg border border-border-secondary bg-surface-primary">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-text-primary">{criterion.criteria}</span>
                    <Badge variant="outline" size="sm">{criterion.points}점</Badge>
                  </div>
                  <p className="text-sm text-text-secondary">{criterion.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 모범 답안 */}
        {sampleAnswer && showExplanation && (
          <div>
            <h5 className="text-sm font-medium text-text-primary mb-2">모범 답안</h5>
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap">
                {sampleAnswer}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMatchingComparison = () => {
    const studentMatches = gradingResult.studentAnswer || [];
    const correctMatches = problem.matchingData?.correctMatches || [];
    const leftItems = problem.matchingData?.leftItems || [];
    const rightItems = problem.matchingData?.rightItems || [];
    
    const correctCount = studentMatches.filter((studentMatch: any) =>
      correctMatches.some(correctMatch => 
        correctMatch.leftId === studentMatch.leftId && correctMatch.rightId === studentMatch.rightId
      )
    ).length;
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h5 className="text-sm font-medium text-text-primary">매칭 결과</h5>
          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm">
              {correctCount}/{correctMatches.length} 정답
            </Badge>
            <Progress 
              value={(correctCount / correctMatches.length) * 100} 
              className="w-20 h-2"
              variant={correctCount === correctMatches.length ? 'success' : 'warning'}
            />
          </div>
        </div>
        
        <div className="space-y-3">
          {leftItems.map((leftItem) => {
            const studentMatch = studentMatches.find((m: any) => m.leftId === leftItem.id);
            const correctMatch = correctMatches.find(m => m.leftId === leftItem.id);
            const studentRightItem = rightItems.find(r => r.id === studentMatch?.rightId);
            const correctRightItem = rightItems.find(r => r.id === correctMatch?.rightId);
            
            const isCorrect = studentMatch && correctMatch && 
              studentMatch.rightId === correctMatch.rightId;
            
            return (
              <div key={leftItem.id} className={`p-4 rounded-lg border ${
                isCorrect 
                  ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                  : 'border-red-300 bg-red-50 dark:bg-red-900/20'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-text-primary min-w-[100px]">
                      {leftItem.text}
                    </span>
                    <span className="text-text-secondary">→</span>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-text-primary">
                          {studentRightItem?.text || '(연결 안됨)'}
                        </span>
                        {isCorrect ? (
                          <Badge variant="success" size="sm">정답</Badge>
                        ) : (
                          <Badge variant="error" size="sm">오답</Badge>
                        )}
                      </div>
                      {!isCorrect && correctRightItem && (
                        <div className="text-xs text-green-600">
                          정답: {correctRightItem.text}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-lg">
                    {isCorrect ? '✅' : '❌'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderFillBlankComparison = () => {
    const studentAnswers = gradingResult.studentAnswer || {};
    const blanks = problem.fillBlankData?.blanks || [];
    const text = problem.fillBlankData?.text || '';
    
    const correctBlanks = Object.entries(studentAnswers).filter(([blankId, answer]) => {
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
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h5 className="text-sm font-medium text-text-primary">빈칸 채우기 결과</h5>
          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm">
              {correctBlanks}/{blanks.length} 정답
            </Badge>
            <Progress 
              value={(correctBlanks / blanks.length) * 100} 
              className="w-20 h-2"
              variant={correctBlanks === blanks.length ? 'success' : 'warning'}
            />
          </div>
        </div>
        
        {/* 텍스트와 답안 표시 */}
        <div className="p-4 rounded-lg border border-border-primary bg-surface-secondary">
          <div className="text-text-primary leading-relaxed">
            {text.split('__blank__').map((textPart, index) => (
              <React.Fragment key={index}>
                <span>{textPart}</span>
                {index < blanks.length && (
                  <span className="inline-block mx-1">
                    {(() => {
                      const blank = blanks[index];
                      const studentAnswer = studentAnswers[blank.id] || '';
                      const isCorrect = blank.acceptedAnswers.some(acceptedAnswer => {
                        if (blank.caseSensitive) {
                          return acceptedAnswer === studentAnswer.trim();
                        }
                        return acceptedAnswer.toLowerCase() === studentAnswer.trim().toLowerCase();
                      });
                      
                      return (
                        <span className={`px-2 py-1 rounded border-2 font-medium ${
                          isCorrect
                            ? 'border-green-400 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                            : 'border-red-400 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                        }`}>
                          {studentAnswer || '(빈칸)'}
                          <span className="ml-1 text-xs">
                            {isCorrect ? '✓' : '✗'}
                          </span>
                        </span>
                      );
                    })()}
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        
        {/* 빈칸별 상세 분석 */}
        <div className="space-y-2">
          {blanks.map((blank, index) => {
            const studentAnswer = studentAnswers[blank.id] || '';
            const isCorrect = blank.acceptedAnswers.some(acceptedAnswer => {
              if (blank.caseSensitive) {
                return acceptedAnswer === studentAnswer.trim();
              }
              return acceptedAnswer.toLowerCase() === studentAnswer.trim().toLowerCase();
            });
            
            return (
              <div key={blank.id} className="flex items-center justify-between p-3 rounded-lg border border-border-secondary">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-text-secondary">
                    빈칸 {index + 1}:
                  </span>
                  <span className="text-text-primary">
                    {studentAnswer || '(답안 없음)'}
                  </span>
                  {isCorrect ? (
                    <Badge variant="success" size="sm">정답</Badge>
                  ) : (
                    <Badge variant="error" size="sm">오답</Badge>
                  )}
                </div>
                {!isCorrect && (
                  <div className="text-xs text-text-secondary">
                    정답: {blank.acceptedAnswers.join(', ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderOrderingComparison = () => {
    const studentOrder = gradingResult.studentAnswer || [];
    const correctOrder = problem.orderingData?.correctOrder || [];
    const items = problem.orderingData?.items || [];
    
    const correctPositions = studentOrder.filter((itemId: string, index: number) => 
      correctOrder[index] === itemId
    ).length;
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h5 className="text-sm font-medium text-text-primary">순서 배열 결과</h5>
          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm">
              {correctPositions}/{correctOrder.length} 정답
            </Badge>
            <Progress 
              value={(correctPositions / correctOrder.length) * 100} 
              className="w-20 h-2"
              variant={correctPositions === correctOrder.length ? 'success' : 'warning'}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 학생 순서 */}
          <div>
            <h6 className="text-sm font-medium text-text-primary mb-2">학생이 배열한 순서</h6>
            <div className="space-y-2">
              {studentOrder.map((itemId: string, index: number) => {
                const item = items.find(i => i.id === itemId);
                const isCorrectPosition = correctOrder[index] === itemId;
                
                return (
                  <div key={`student-${index}`} className={`flex items-center gap-3 p-3 rounded-lg border ${
                    isCorrectPosition
                      ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                      : 'border-red-300 bg-red-50 dark:bg-red-900/20'
                  }`}>
                    <span className="font-medium text-text-secondary min-w-[20px]">
                      {index + 1}.
                    </span>
                    <span className="flex-1 text-text-primary">
                      {item?.text || '항목 없음'}
                    </span>
                    <span className="text-lg">
                      {isCorrectPosition ? '✅' : '❌'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* 정답 순서 */}
          <div>
            <h6 className="text-sm font-medium text-text-primary mb-2">정답 순서</h6>
            <div className="space-y-2">
              {correctOrder.map((itemId: string, index: number) => {
                const item = items.find(i => i.id === itemId);
                
                return (
                  <div key={`correct-${index}`} className="flex items-center gap-3 p-3 rounded-lg border border-green-300 bg-green-50 dark:bg-green-900/20">
                    <span className="font-medium text-green-600 min-w-[20px]">
                      {index + 1}.
                    </span>
                    <span className="flex-1 text-green-800 dark:text-green-200">
                      {item?.text || '항목 없음'}
                    </span>
                    <span className="text-lg">✓</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardContent className="p-4">
        {renderComparison()}
      </CardContent>
    </Card>
  );
}