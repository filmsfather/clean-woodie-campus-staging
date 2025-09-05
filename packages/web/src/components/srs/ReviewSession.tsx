import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { Modal } from '../ui/Modal';
import ReviewCard from './ReviewCard';
import { useSRSReviews } from '../../hooks';
import type { ReviewFeedback, SubmitReviewFeedbackResponse } from '../../services/api/srsApi';

// 컴포넌트 props 타입
interface ReviewSessionProps {
  className?: string;
  onSessionComplete?: (completedCount: number, totalCount: number) => void;  // 세션 완료 콜백
  onSessionExit?: () => void;  // 세션 종료 콜백
  autoAdvance?: boolean;  // 자동으로 다음 문제로 이동
  showProgress?: boolean;  // 진행률 표시
  enableKeyboardShortcuts?: boolean;  // 키보드 단축키 활성화
}

/**
 * SRS 복습 세션 컨테이너 컴포넌트
 * 
 * 복습 세션의 전체 플로우를 관리하는 컨테이너 컴포넌트입니다.
 * 복습 카드 표시, 진행률 추적, 세션 완료 처리 등을 담당합니다.
 */
export const ReviewSession: React.FC<ReviewSessionProps> = ({
  className = '',
  onSessionComplete,
  onSessionExit,
  autoAdvance = true,
  showProgress = true,
  enableKeyboardShortcuts = true
}) => {
  // 상태 관리
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [completedReviews, setCompletedReviews] = useState<Set<string>>(new Set());
  const [showExitModal, setShowExitModal] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    totalTime: 0,
    averageTime: 0,
    correctAnswers: 0,
    incorrectAnswers: 0
  });

  // SRS 복습 훅 사용
  const {
    reviews,
    currentReview,
    hasReviews,
    isLoading,
    isSubmitting,
    submitReviewFeedback,
    nextReview,
    previousReview,
    loadTodayReviews,
    getReviewProgress,
    state
  } = useSRSReviews({
    autoLoad: true,
    onReviewCompleted: handleReviewCompleted
  });

  // 복습 완료 처리
  function handleReviewCompleted(result: SubmitReviewFeedbackResponse) {
    if (currentReview) {
      setCompletedReviews(prev => new Set([...prev, currentReview.id]));
      
      // 성과 통계 업데이트
      setSessionStats(prev => ({
        ...prev,
        correctAnswers: result.success && result.result.wasSuccessful ? 
          prev.correctAnswers + 1 : prev.correctAnswers,
        incorrectAnswers: result.success && !result.result.wasSuccessful ? 
          prev.incorrectAnswers + 1 : prev.incorrectAnswers
      }));

      // 자동으로 다음 문제로 이동
      if (autoAdvance) {
        setTimeout(() => {
          handleNextReview();
        }, 1500);
      }
    }
  }

  // 답안 표시 처리
  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  // 피드백 제출 처리
  const handleFeedbackSubmit = async (feedback: ReviewFeedback) => {
    if (!currentReview) return;
    
    await submitReviewFeedback(currentReview.id, feedback);
  };

  // 다음 복습으로 이동
  const handleNextReview = () => {
    setShowAnswer(false);
    nextReview();
    
    // 모든 복습이 완료된 경우
    const progress = getReviewProgress();
    if (progress.remaining === 0) {
      handleSessionComplete();
    }
  };

  // 이전 복습으로 이동
  const handlePreviousReview = () => {
    setShowAnswer(false);
    previousReview();
  };

  // 세션 완료 처리
  const handleSessionComplete = () => {
    const endTime = Date.now();
    const totalTime = Math.floor((endTime - sessionStartTime) / 1000);
    const completedCount = completedReviews.size;
    
    setSessionStats(prev => ({
      ...prev,
      totalTime,
      averageTime: completedCount > 0 ? Math.floor(totalTime / completedCount) : 0
    }));

    if (onSessionComplete) {
      onSessionComplete(completedCount, reviews.length);
    }
  };

  // 세션 종료 처리
  const handleSessionExit = () => {
    setShowExitModal(true);
  };

  const confirmSessionExit = () => {
    if (onSessionExit) {
      onSessionExit();
    }
    setShowExitModal(false);
  };

  // 키보드 단축키 처리
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      if (showExitModal) return;

      switch (event.key) {
        case ' ': // 스페이스바 - 답안 표시
          event.preventDefault();
          if (!showAnswer) {
            handleShowAnswer();
          }
          break;
        case '1':
          if (showAnswer) handleFeedbackSubmit({ feedback: 'AGAIN' });
          break;
        case '2':
          if (showAnswer) handleFeedbackSubmit({ feedback: 'HARD' });
          break;
        case '3':
          if (showAnswer) handleFeedbackSubmit({ feedback: 'GOOD' });
          break;
        case '4':
          if (showAnswer) handleFeedbackSubmit({ feedback: 'EASY' });
          break;
        case 'ArrowLeft':
          event.preventDefault();
          handlePreviousReview();
          break;
        case 'ArrowRight':
          event.preventDefault();
          handleNextReview();
          break;
        case 'Escape':
          handleSessionExit();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [enableKeyboardShortcuts, showAnswer, showExitModal, currentReview]);

  // 로딩 상태
  if (isLoading && !hasReviews) {
    return (
      <div className={`review-session ${className}`}>
        <Card>
          <div className="animate-pulse text-center py-12">
            <div className="text-lg text-gray-600">복습 준비 중...</div>
          </div>
        </Card>
      </div>
    );
  }

  // 오류 상태
  if (state.error) {
    return (
      <div className={`review-session ${className}`}>
        <Card variant="danger">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold text-red-800 mb-4">
              복습을 불러오는데 실패했습니다
            </h3>
            <p className="text-red-600 mb-6">{state.error}</p>
            <Button onClick={() => loadTodayReviews()} variant="primary">
              다시 시도
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 복습할 항목이 없는 경우
  if (!hasReviews) {
    return (
      <div className={`review-session ${className}`}>
        <Card>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              모든 복습을 완료했습니다!
            </h3>
            <p className="text-gray-600 mb-6">
              오늘 예정된 복습이 없습니다. 훌륭한 학습 습관을 유지하고 계시네요!
            </p>
            <Button onClick={onSessionExit} variant="primary">
              대시보드로 돌아가기
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const progress = getReviewProgress();

  return (
    <div className={`review-session ${className}`}>
      {/* 헤더 - 진행률 및 컨트롤 */}
      <div className="review-session__header mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleSessionExit}
              variant="outline"
              size="sm"
            >
              나가기
            </Button>
            
            {showProgress && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  진행률: {progress.completed}/{progress.completed + progress.remaining}
                </span>
                <Progress 
                  value={progress.progressPercent} 
                  className="w-32" 
                  size="sm" 
                />
                <span className="text-sm font-medium">
                  {progress.progressPercent}%
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handlePreviousReview}
              disabled={state.currentReviewIndex === 0}
              variant="outline"
              size="sm"
            >
              ← 이전
            </Button>
            
            <span className="text-sm text-gray-600 px-3">
              {state.currentReviewIndex + 1} / {reviews.length}
            </span>
            
            <Button
              onClick={handleNextReview}
              disabled={state.currentReviewIndex === reviews.length - 1}
              variant="outline"
              size="sm"
            >
              다음 →
            </Button>
          </div>
        </div>
      </div>

      {/* 메인 복습 카드 */}
      <div className="review-session__main">
        {currentReview && (
          <ReviewCard
            review={currentReview}
            showAnswer={showAnswer}
            onShowAnswer={handleShowAnswer}
            onFeedbackSubmit={handleFeedbackSubmit}
            onNextReview={handleNextReview}
            disabled={isSubmitting}
          />
        )}
      </div>

      {/* 키보드 단축키 안내 */}
      {enableKeyboardShortcuts && (
        <div className="review-session__shortcuts mt-6">
          <Card variant="outline" className="p-4">
            <details>
              <summary className="text-sm font-medium cursor-pointer">
                키보드 단축키 안내
              </summary>
              <div className="mt-3 text-xs text-gray-600 space-y-1">
                <div>스페이스바: 답안 표시</div>
                <div>1~4: 피드백 선택 (다시/어려움/좋음/쉬움)</div>
                <div>←→: 이전/다음 복습</div>
                <div>ESC: 세션 종료</div>
              </div>
            </details>
          </Card>
        </div>
      )}

      {/* 세션 종료 확인 모달 */}
      <Modal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="복습 세션 종료"
      >
        <div className="space-y-4">
          <p>정말로 복습 세션을 종료하시겠습니까?</p>
          
          <div className="bg-gray-50 p-3 rounded text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div>완료한 복습: {completedReviews.size}개</div>
                <div>남은 복습: {progress.remaining}개</div>
              </div>
              <div>
                <div>정답: {sessionStats.correctAnswers}개</div>
                <div>오답: {sessionStats.incorrectAnswers}개</div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 justify-end">
            <Button
              onClick={() => setShowExitModal(false)}
              variant="outline"
            >
              계속 하기
            </Button>
            <Button
              onClick={confirmSessionExit}
              variant="danger"
            >
              종료하기
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

ReviewSession.displayName = 'ReviewSession';

export default ReviewSession;