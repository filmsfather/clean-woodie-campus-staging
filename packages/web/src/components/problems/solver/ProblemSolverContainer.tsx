import React, { useState, useCallback, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Progress,
} from '../../ui';
import { MultipleChoiceAnswer } from './MultipleChoiceAnswer';
import { ShortAnswerInput } from './ShortAnswerInput';
import { TrueFalseButtons } from './TrueFalseButtons';
import { LongAnswerTextarea } from './LongAnswerTextarea';
import { MatchingInterface } from './MatchingInterface';
import { FillBlankInputs } from './FillBlankInputs';
import { OrderingInterface } from './OrderingInterface';
import { ProblemNavigation } from './ProblemNavigation';
import { AnswerSubmissionModal } from './AnswerSubmissionModal';
import { ProblemData } from '../editor/ProblemEditor';

export interface ProblemAnswer {
  problemId: string;
  type: string;
  answer: any; // 문제 유형에 따라 다른 형태
  timeSpent: number; // 초 단위
  isBookmarked?: boolean;
}

export interface ProblemSetSession {
  sessionId: string;
  problemSetId: string;
  problems: ProblemData[];
  currentProblemIndex: number;
  answers: Map<string, ProblemAnswer>;
  startTime: Date;
  timeLimit?: number; // 전체 시간 제한 (초)
  isCompleted: boolean;
}

interface ProblemSolverContainerProps {
  session: ProblemSetSession;
  onAnswerChange?: (problemId: string, answer: ProblemAnswer) => void;
  onNavigate?: (newIndex: number) => void;
  onSubmit?: (answers: Map<string, ProblemAnswer>) => Promise<void>;
  onBookmark?: (problemId: string, isBookmarked: boolean) => void;
  isSubmitting?: boolean;
}

const DIFFICULTY_LABELS = {
  easy: '쉬움',
  medium: '보통',
  hard: '어려움',
};

const DIFFICULTY_COLORS = {
  easy: 'success',
  medium: 'warning',
  hard: 'error',
} as const;

export function ProblemSolverContainer({
  session,
  onAnswerChange,
  onNavigate,
  onSubmit,
  onBookmark,
  isSubmitting = false,
}: ProblemSolverContainerProps) {
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [currentProblemStartTime, setCurrentProblemStartTime] = useState(Date.now());
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);

  const currentProblem = session.problems[session.currentProblemIndex];
  const currentAnswer = session.answers.get(currentProblem?.id || '');

  // 타이머 관리
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setTotalElapsedTime(now - session.startTime.getTime());
    }, 1000);

    return () => clearInterval(timer);
  }, [session.startTime]);

  // 문제가 변경될 때 시작 시간 업데이트
  useEffect(() => {
    setCurrentProblemStartTime(Date.now());
  }, [session.currentProblemIndex]);

  const handleAnswerChange = useCallback((answer: any) => {
    if (!currentProblem) return;

    const problemAnswer: ProblemAnswer = {
      problemId: currentProblem.id || '',
      type: currentProblem.type,
      answer,
      timeSpent: Math.floor((Date.now() - currentProblemStartTime) / 1000),
      isBookmarked: currentAnswer?.isBookmarked || false,
    };

    onAnswerChange?.(currentProblem.id || '', problemAnswer);
  }, [currentProblem, currentProblemStartTime, currentAnswer?.isBookmarked, onAnswerChange]);

  const handleNavigation = useCallback((direction: 'prev' | 'next' | number) => {
    if (typeof direction === 'number') {
      onNavigate?.(direction);
    } else {
      const newIndex = direction === 'prev' 
        ? Math.max(0, session.currentProblemIndex - 1)
        : Math.min(session.problems.length - 1, session.currentProblemIndex + 1);
      onNavigate?.(newIndex);
    }
  }, [session.currentProblemIndex, session.problems.length, onNavigate]);

  const handleBookmark = useCallback(() => {
    if (!currentProblem) return;
    
    const isBookmarked = !(currentAnswer?.isBookmarked || false);
    onBookmark?.(currentProblem.id || '', isBookmarked);

    // 현재 답안도 업데이트
    const updatedAnswer: ProblemAnswer = {
      problemId: currentProblem.id || '',
      type: currentProblem.type,
      answer: currentAnswer?.answer,
      timeSpent: currentAnswer?.timeSpent || 0,
      isBookmarked,
    };
    onAnswerChange?.(currentProblem.id || '', updatedAnswer);
  }, [currentProblem, currentAnswer, onBookmark, onAnswerChange]);

  const handleSubmitRequest = useCallback(() => {
    setShowSubmissionModal(true);
  }, []);

  const handleSubmitConfirm = useCallback(async () => {
    await onSubmit?.(session.answers);
    setShowSubmissionModal(false);
  }, [session.answers, onSubmit]);

  const renderProblemAnswer = () => {
    if (!currentProblem) return null;

    switch (currentProblem.type) {
      case 'multiple_choice':
        return (
          <MultipleChoiceAnswer
            choices={currentProblem.multipleChoiceData?.choices || []}
            selectedAnswers={currentAnswer?.answer || []}
            onChange={handleAnswerChange}
            disabled={isSubmitting}
          />
        );
      case 'short_answer':
        return (
          <ShortAnswerInput
            answer={currentAnswer?.answer || ''}
            onChange={handleAnswerChange}
            disabled={isSubmitting}
          />
        );
      case 'true_false':
        return (
          <TrueFalseButtons
            selectedAnswer={currentAnswer?.answer}
            onChange={handleAnswerChange}
            disabled={isSubmitting}
          />
        );
      case 'long_answer':
        return (
          <LongAnswerTextarea
            answer={currentAnswer?.answer || ''}
            onChange={handleAnswerChange}
            placeholder={currentProblem.longAnswerData?.placeholder}
            minLength={currentProblem.longAnswerData?.minLength}
            maxLength={currentProblem.longAnswerData?.maxLength}
            disabled={isSubmitting}
          />
        );
      case 'matching':
        return (
          <MatchingInterface
            leftItems={currentProblem.matchingData?.leftItems || []}
            rightItems={currentProblem.matchingData?.rightItems || []}
            selectedAnswers={currentAnswer?.answer || []}
            onChange={handleAnswerChange}
            disabled={isSubmitting}
          />
        );
      case 'fill_blank':
        return (
          <FillBlankInputs
            text={currentProblem.fillBlankData?.text || ''}
            blanks={currentProblem.fillBlankData?.blanks || []}
            answers={currentAnswer?.answer || {}}
            onChange={handleAnswerChange}
            disabled={isSubmitting}
          />
        );
      case 'ordering':
        return (
          <OrderingInterface
            items={currentProblem.orderingData?.items || []}
            selectedOrder={currentAnswer?.answer || []}
            onChange={handleAnswerChange}
            disabled={isSubmitting}
          />
        );
      default:
        return (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🚧</div>
            <p className="text-text-secondary">
              이 문제 유형은 준비 중입니다.
            </p>
          </div>
        );
    }
  };

  const answeredCount = session.answers.size;
  const totalCount = session.problems.length;
  const progressPercentage = (answeredCount / totalCount) * 100;
  const bookmarkedCount = Array.from(session.answers.values())
    .filter(answer => answer.isBookmarked).length;

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  };

  if (!currentProblem) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📝</div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          문제를 불러올 수 없습니다
        </h2>
        <p className="text-text-secondary">
          문제집이 비어있거나 오류가 발생했습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* 상단 헤더 */}
      <div className="sticky top-0 z-10 bg-surface-primary border-b border-border-primary">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* 진행률 */}
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium text-text-primary">
                {session.currentProblemIndex + 1} / {totalCount}
              </div>
              <Progress
                value={progressPercentage}
                className="w-32"
                variant={progressPercentage === 100 ? 'success' : 'default'}
              />
              <div className="text-xs text-text-secondary">
                {answeredCount}개 완료
              </div>
            </div>

            {/* 시간 및 상태 */}
            <div className="flex items-center gap-4 text-sm">
              {bookmarkedCount > 0 && (
                <Badge variant="outline" size="sm">
                  📌 {bookmarkedCount}
                </Badge>
              )}
              <div className="text-text-secondary">
                경과시간: {formatTime(totalElapsedTime)}
              </div>
              {session.timeLimit && (
                <div className={`font-medium ${
                  totalElapsedTime > session.timeLimit * 1000 * 0.8
                    ? 'text-red-600'
                    : 'text-text-primary'
                }`}>
                  남은시간: {formatTime(session.timeLimit * 1000 - totalElapsedTime)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* 문제 카드 */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-3">
                    {currentProblem.title}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant={DIFFICULTY_COLORS[currentProblem.difficulty]}
                      size="sm"
                    >
                      {DIFFICULTY_LABELS[currentProblem.difficulty]}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {currentProblem.points}점
                    </Badge>
                    {currentProblem.timeLimit && (
                      <Badge variant="outline" size="sm">
                        ⏱️ {Math.floor(currentProblem.timeLimit / 60)}분
                      </Badge>
                    )}
                    {currentProblem.tags.map(tag => (
                      <Badge key={tag} variant="secondary" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBookmark}
                  className={currentAnswer?.isBookmarked ? 'bg-yellow-50 border-yellow-300' : ''}
                >
                  {currentAnswer?.isBookmarked ? '📌' : '📍'} 북마크
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 문제 내용 */}
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-text-primary">
                  {currentProblem.content}
                </div>
              </div>

              {/* 구분선 */}
              <hr className="border-border-primary" />

              {/* 답안 입력 영역 */}
              {renderProblemAnswer()}
            </CardContent>
          </Card>

          {/* 네비게이션 */}
          <ProblemNavigation
            currentIndex={session.currentProblemIndex}
            totalCount={totalCount}
            answers={session.answers}
            problems={session.problems}
            onNavigate={handleNavigation}
            onSubmit={handleSubmitRequest}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* 제출 확인 모달 */}
      {showSubmissionModal && (
        <AnswerSubmissionModal
          session={session}
          onConfirm={handleSubmitConfirm}
          onCancel={() => setShowSubmissionModal(false)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}