import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import type { ReviewQueueItem, ReviewFeedback } from '../../services/api/srsApi';

// 컴포넌트 props 타입
interface ReviewCardProps {
  review: ReviewQueueItem;
  showAnswer?: boolean;  // 답안 표시 여부
  onFeedbackSubmit?: (feedback: ReviewFeedback) => void;  // 피드백 제출 콜백
  onShowAnswer?: () => void;  // 답안 표시 콜백
  onNextReview?: () => void;  // 다음 리뷰로 이동 콜백
  disabled?: boolean;  // 비활성화 상태
  className?: string;
}

// 난이도에 따른 색상 매핑
const difficultyColors = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'danger'
} as const;

// 우선순위에 따른 색상 매핑
const priorityColors = {
  low: 'secondary',
  medium: 'primary',
  high: 'danger'
} as const;

/**
 * SRS 복습 카드 컴포넌트
 * 
 * 개별 복습 항목을 표시하고 피드백을 받는 카드 컴포넌트입니다.
 * 문제 정보, 진행 상황, 피드백 버튼들을 포함합니다.
 */
export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  showAnswer = false,
  onFeedbackSubmit,
  onShowAnswer,
  onNextReview,
  disabled = false,
  className = ''
}) => {
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);
  const [responseStartTime] = useState<number>(Date.now());

  // 피드백 제출 처리
  const handleFeedbackSubmit = (feedbackType: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') => {
    if (!onFeedbackSubmit || disabled) return;

    const responseTime = Math.floor((Date.now() - responseStartTime) / 1000);
    
    const feedback: ReviewFeedback = {
      feedback: feedbackType,
      responseTime,
      metadata: {
        difficulty: review.difficulty,
        tags: review.tags
      }
    };

    setSelectedFeedback(feedbackType);
    onFeedbackSubmit(feedback);
  };

  // 연체 여부에 따른 스타일 클래스
  const cardVariant = review.isOverdue ? 'danger' : 'default';

  // 복습 횟수에 따른 진행률 계산 (임의로 최대 10회로 설정)
  const progressPercent = Math.min((review.reviewCount / 10) * 100, 100);

  return (
    <Card 
      className={`review-card ${className}`}
      variant={cardVariant}
    >
      {/* 카드 헤더 - 메타 정보 */}
      <div className="review-card__header">
        <div className="review-card__meta">
          <Badge 
            variant={difficultyColors[review.difficulty]}
            size="sm"
          >
            {review.difficulty}
          </Badge>
          
          <Badge 
            variant={priorityColors[review.priority]}
            size="sm"
          >
            우선순위: {review.priority}
          </Badge>

          {review.isOverdue && (
            <Badge variant="danger" size="sm">
              연체 {Math.abs(review.minutesUntilDue)} 분
            </Badge>
          )}

          {!review.isOverdue && review.minutesUntilDue > 0 && (
            <Badge variant="info" size="sm">
              {review.minutesUntilDue}분 후
            </Badge>
          )}
        </div>

        <div className="review-card__stats">
          <span className="text-sm text-gray-600">
            복습 {review.reviewCount}회 | 간격 {review.interval}일
          </span>
        </div>
      </div>

      {/* 카드 본문 - 문제 내용 */}
      <div className="review-card__content">
        <h3 className="review-card__title">
          {review.title}
        </h3>

        {/* 진행률 표시 */}
        <div className="review-card__progress">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">학습 진행률</span>
            <span className="text-sm font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} size="sm" />
        </div>

        {/* 태그 표시 */}
        {review.tags && review.tags.length > 0 && (
          <div className="review-card__tags">
            {review.tags.map((tag, index) => (
              <Badge key={index} variant="outline" size="xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* 마지막 복습 정보 */}
        {review.lastReview && (
          <div className="review-card__last-review">
            <span className="text-xs text-gray-500">
              마지막 복습: {new Date(review.lastReview).toLocaleDateString('ko-KR')}
            </span>
          </div>
        )}
      </div>

      {/* 카드 액션 - 피드백 버튼들 */}
      <div className="review-card__actions">
        {!showAnswer ? (
          // 답안 표시 버튼
          <div className="review-card__show-answer">
            <Button
              onClick={onShowAnswer}
              disabled={disabled}
              variant="primary"
              size="lg"
              fullWidth
            >
              답안 보기
            </Button>
          </div>
        ) : (
          // 피드백 버튼들
          <div className="review-card__feedback-buttons">
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button
                onClick={() => handleFeedbackSubmit('AGAIN')}
                disabled={disabled}
                variant={selectedFeedback === 'AGAIN' ? 'danger' : 'outline'}
                size="md"
              >
                다시 (1분)
              </Button>
              
              <Button
                onClick={() => handleFeedbackSubmit('HARD')}
                disabled={disabled}
                variant={selectedFeedback === 'HARD' ? 'warning' : 'outline'}
                size="md"
              >
                어려움 (6분)
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleFeedbackSubmit('GOOD')}
                disabled={disabled}
                variant={selectedFeedback === 'GOOD' ? 'success' : 'outline'}
                size="md"
              >
                좋음 ({review.interval}일)
              </Button>
              
              <Button
                onClick={() => handleFeedbackSubmit('EASY')}
                disabled={disabled}
                variant={selectedFeedback === 'EASY' ? 'primary' : 'outline'}
                size="md"
              >
                쉬움 ({Math.round(review.interval * review.easeFactor)}일)
              </Button>
            </div>

            {/* 다음 버튼 */}
            {selectedFeedback && (
              <div className="review-card__next-button mt-4">
                <Button
                  onClick={onNextReview}
                  variant="primary"
                  size="lg"
                  fullWidth
                >
                  다음 복습
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 디버그 정보 (개발용) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="review-card__debug mt-4 p-3 bg-gray-100 rounded text-xs">
          <details>
            <summary>디버그 정보</summary>
            <pre className="mt-2">{JSON.stringify(review, null, 2)}</pre>
          </details>
        </div>
      )}
    </Card>
  );
};

// 스타일 (Tailwind CSS 클래스 사용)
ReviewCard.displayName = 'ReviewCard';

export default ReviewCard;