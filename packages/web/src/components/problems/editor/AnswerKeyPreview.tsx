import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
} from '../../ui';
import { ProblemData } from './ProblemEditor';

interface AnswerKeyPreviewProps {
  problem: ProblemData;
  showExplanations?: boolean;
  showScoring?: boolean;
  compact?: boolean;
}

export function AnswerKeyPreview({
  problem,
  showExplanations = true,
  showScoring = true,
  compact = false,
}: AnswerKeyPreviewProps) {
  const [showDetailedView, setShowDetailedView] = useState(!compact);

  const renderAnswerKey = () => {
    switch (problem.type) {
      case 'multiple_choice':
        return renderMultipleChoiceAnswerKey();
      case 'short_answer':
        return renderShortAnswerAnswerKey();
      case 'true_false':
        return renderTrueFalseAnswerKey();
      case 'long_answer':
        return renderLongAnswerAnswerKey();
      case 'matching':
        return renderMatchingAnswerKey();
      case 'fill_blank':
        return renderFillBlankAnswerKey();
      case 'ordering':
        return renderOrderingAnswerKey();
      default:
        return (
          <div className="text-center py-8 text-text-secondary">
            <div className="text-4xl mb-4">🔧</div>
            <p>이 문제 유형의 정답 미리보기는 준비 중입니다.</p>
          </div>
        );
    }
  };

  const renderMultipleChoiceAnswerKey = () => {
    const choices = problem.multipleChoiceData?.choices || [];
    const correctChoices = choices.filter(c => c.isCorrect);

    if (choices.length === 0) {
      return (
        <div className="text-center py-6 text-text-secondary">
          선택지가 아직 설정되지 않았습니다.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* 간단 요약 */}
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <span className="text-green-600 text-lg">✅</span>
            <span className="font-medium text-green-800 dark:text-green-200">
              정답: {correctChoices.map((c, i) => (
                <span key={c.id}>
                  {choices.findIndex(choice => choice.id === c.id) + 1}번
                  {i < correctChoices.length - 1 ? ', ' : ''}
                </span>
              ))}
            </span>
          </div>
          {showScoring && (
            <Badge variant="success" size="sm">
              {problem.points}점
            </Badge>
          )}
        </div>

        {/* 상세 뷰 */}
        {showDetailedView && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-text-primary">모든 선택지</h4>
            {choices.map((choice, index) => (
              <div
                key={choice.id}
                className={`p-3 rounded-lg border ${
                  choice.isCorrect
                    ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                    : 'border-border-primary bg-surface-secondary'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="font-medium text-text-secondary min-w-[20px]">
                      {index + 1}.
                    </span>
                    <span className="text-text-primary">{choice.text}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {choice.isCorrect && (
                      <>
                        <Badge variant="success" size="sm">정답</Badge>
                        <span className="text-lg">✅</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderShortAnswerAnswerKey = () => {
    const correctAnswers = problem.shortAnswerData?.correctAnswers || [];
    const caseSensitive = problem.shortAnswerData?.caseSensitive || false;

    if (correctAnswers.length === 0) {
      return (
        <div className="text-center py-6 text-text-secondary">
          정답이 아직 설정되지 않았습니다.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-green-800 dark:text-green-200">
              ✅ 정답 ({correctAnswers.length}개)
            </h4>
            {showScoring && (
              <Badge variant="success" size="sm">
                {problem.points}점
              </Badge>
            )}
          </div>
          
          <div className="space-y-2">
            {correctAnswers.map((answer, index) => (
              <div
                key={index}
                className="p-2 bg-white dark:bg-gray-800 rounded border"
              >
                <span className="font-mono text-green-800 dark:text-green-200">
                  {answer}
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-3 text-xs text-green-700 dark:text-green-300">
            대소문자 구분: {caseSensitive ? '예' : '아니오'}
          </div>
        </div>
      </div>
    );
  };

  const renderTrueFalseAnswerKey = () => {
    const correctAnswer = problem.trueFalseData?.correctAnswer;
    const explanation = problem.trueFalseData?.explanation;

    if (typeof correctAnswer !== 'boolean') {
      return (
        <div className="text-center py-6 text-text-secondary">
          정답이 아직 설정되지 않았습니다.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-4xl">
              {correctAnswer ? '⭕' : '❌'}
            </span>
            <div>
              <div className="font-bold text-green-800 dark:text-green-200 text-xl">
                {correctAnswer ? '참 (True)' : '거짓 (False)'}
              </div>
              {showScoring && (
                <Badge variant="success" size="sm" className="mt-1">
                  {problem.points}점
                </Badge>
              )}
            </div>
          </div>
        </div>

        {explanation && showExplanations && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              💡 해설
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {explanation}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderLongAnswerAnswerKey = () => {
    const sampleAnswer = problem.longAnswerData?.sampleAnswer;
    const keywords = problem.longAnswerData?.keywords || [];
    const rubric = problem.longAnswerData?.rubric || [];
    const minLength = problem.longAnswerData?.minLength;
    const maxLength = problem.longAnswerData?.maxLength;

    return (
      <div className="space-y-4">
        {/* 채점 기준 */}
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-green-800 dark:text-green-200">
              📋 채점 정보
            </h4>
            {showScoring && (
              <Badge variant="success" size="sm">
                총 {problem.points}점
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-green-700 dark:text-green-300 font-medium">글자 수:</span>
              <span className="ml-2 text-green-800 dark:text-green-200">
                {minLength && maxLength ? `${minLength}~${maxLength}자` :
                 minLength ? `최소 ${minLength}자` :
                 maxLength ? `최대 ${maxLength}자` : '제한 없음'}
              </span>
            </div>
            <div>
              <span className="text-green-700 dark:text-green-300 font-medium">키워드:</span>
              <span className="ml-2 text-green-800 dark:text-green-200">
                {keywords.length}개
              </span>
            </div>
          </div>
        </div>

        {/* 핵심 키워드 */}
        {keywords.length > 0 && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              🔑 핵심 키워드
            </h4>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" size="sm">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 채점 기준 */}
        {rubric.length > 0 && (
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-3">
              📊 채점 기준
            </h4>
            <div className="space-y-2">
              {rubric.map((criterion, index) => (
                <div key={index} className="flex items-start justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                  <div className="flex-1">
                    <div className="font-medium text-text-primary text-sm">
                      {criterion.criteria}
                    </div>
                    <div className="text-xs text-text-secondary mt-1">
                      {criterion.description}
                    </div>
                  </div>
                  <Badge variant="outline" size="sm">
                    {criterion.points}점
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-purple-700 dark:text-purple-300">
              총 배점: {rubric.reduce((sum, r) => sum + r.points, 0)}점
            </div>
          </div>
        )}

        {/* 모범 답안 */}
        {sampleAnswer && showExplanations && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              📝 모범 답안
            </h4>
            <div className="bg-white dark:bg-gray-800 p-3 rounded border">
              <p className="text-sm text-text-primary whitespace-pre-wrap">
                {sampleAnswer}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMatchingAnswerKey = () => {
    const correctMatches = problem.matchingData?.correctMatches || [];
    const leftItems = problem.matchingData?.leftItems || [];
    const rightItems = problem.matchingData?.rightItems || [];
    const allowsPartialCredit = problem.matchingData?.allowsPartialCredit || false;

    if (correctMatches.length === 0) {
      return (
        <div className="text-center py-6 text-text-secondary">
          정답 매칭이 아직 설정되지 않았습니다.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-green-800 dark:text-green-200">
              🔗 정답 매칭 ({correctMatches.length}개)
            </h4>
            {showScoring && (
              <div className="flex items-center gap-2">
                {allowsPartialCredit && (
                  <Badge variant="info" size="sm">부분점수</Badge>
                )}
                <Badge variant="success" size="sm">
                  {problem.points}점
                </Badge>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {correctMatches.map((match, index) => {
              const leftItem = leftItems.find(item => item.id === match.leftId);
              const rightItem = rightItems.find(item => item.id === match.rightId);
              
              return (
                <div key={index} className="flex items-center justify-center p-3 bg-white dark:bg-gray-800 rounded border">
                  <div className="flex items-center gap-4 w-full max-w-md">
                    <div className="flex-1 text-right">
                      <span className="font-medium text-text-primary">
                        {leftItem?.text || '항목 없음'}
                      </span>
                    </div>
                    <div className="text-2xl text-green-600">
                      ↔️
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-medium text-text-primary">
                        {rightItem?.text || '항목 없음'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderFillBlankAnswerKey = () => {
    const text = problem.fillBlankData?.text || '';
    const blanks = problem.fillBlankData?.blanks || [];
    const allowsPartialCredit = problem.fillBlankData?.allowsPartialCredit || false;

    if (!text || blanks.length === 0) {
      return (
        <div className="text-center py-6 text-text-secondary">
          빈칸 정보가 아직 설정되지 않았습니다.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-green-800 dark:text-green-200">
              🧩 정답 ({blanks.length}개 빈칸)
            </h4>
            {showScoring && (
              <div className="flex items-center gap-2">
                {allowsPartialCredit && (
                  <Badge variant="info" size="sm">부분점수</Badge>
                )}
                <Badge variant="success" size="sm">
                  {problem.points}점
                </Badge>
              </div>
            )}
          </div>

          {/* 정답이 포함된 텍스트 미리보기 */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded border mb-4">
            <div className="text-text-primary leading-relaxed">
              {text.split('__blank__').map((textPart, index) => (
                <React.Fragment key={index}>
                  <span>{textPart}</span>
                  {index < blanks.length && (
                    <span className="inline-block mx-1">
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 border border-green-300 rounded text-green-800 dark:text-green-200 font-medium">
                        {blanks[index]?.acceptedAnswers[0] || '???'}
                      </span>
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* 빈칸별 정답 상세 */}
          <div className="space-y-2">
            {blanks.map((blank, index) => (
              <div key={blank.id} className="p-3 bg-white dark:bg-gray-800 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-text-primary">
                    빈칸 {index + 1}
                  </span>
                  {blank.caseSensitive && (
                    <Badge variant="warning" size="sm">대소문자 구분</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {blank.acceptedAnswers.map((answer, answerIndex) => (
                    <Badge key={answerIndex} variant="success" size="sm">
                      {answer}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderOrderingAnswerKey = () => {
    const correctOrder = problem.orderingData?.correctOrder || [];
    const items = problem.orderingData?.items || [];
    const allowsPartialCredit = problem.orderingData?.allowsPartialCredit || false;

    if (correctOrder.length === 0) {
      return (
        <div className="text-center py-6 text-text-secondary">
          정답 순서가 아직 설정되지 않았습니다.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-green-800 dark:text-green-200">
              📊 정답 순서 ({correctOrder.length}개 항목)
            </h4>
            {showScoring && (
              <div className="flex items-center gap-2">
                {allowsPartialCredit && (
                  <Badge variant="info" size="sm">부분점수</Badge>
                )}
                <Badge variant="success" size="sm">
                  {problem.points}점
                </Badge>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {correctOrder.map((itemId, index) => {
              const item = items.find(i => i.id === itemId);
              
              return (
                <div key={itemId} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded border">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 font-bold rounded-full">
                    {index + 1}
                  </div>
                  <span className="flex-1 text-text-primary font-medium">
                    {item?.text || '항목 없음'}
                  </span>
                  <span className="text-sm text-text-secondary">
                    {index + 1}번째
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            🔑 정답 미리보기
            <Badge variant="outline" size="sm">
              {problem.type}
            </Badge>
          </CardTitle>
          {!compact && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetailedView(!showDetailedView)}
            >
              {showDetailedView ? '간단히' : '자세히'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 문제 기본 정보 */}
          <div className="p-3 bg-surface-secondary rounded-lg">
            <h3 className="font-medium text-text-primary mb-1">
              {problem.title}
            </h3>
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="outline" size="sm">
                {problem.difficulty === 'easy' ? '쉬움' : 
                 problem.difficulty === 'medium' ? '보통' : '어려움'}
              </Badge>
              <Badge variant="outline" size="sm">
                {problem.points}점
              </Badge>
              {problem.timeLimit && (
                <Badge variant="outline" size="sm">
                  {Math.floor(problem.timeLimit / 60)}분
                </Badge>
              )}
            </div>
          </div>

          {/* 정답 정보 */}
          {renderAnswerKey()}
        </div>
      </CardContent>
    </Card>
  );
}