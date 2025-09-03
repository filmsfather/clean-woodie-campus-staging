import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { Badge } from '../../../ui/Badge';
import { Progress } from '../../../ui/Progress';
import type { ReviewQueue } from '../types';

interface ReviewQueueCardProps {
  reviewQueue: ReviewQueue;
  onStartReview?: () => void;
  isStartingReview?: boolean;
}

const ReviewItem: React.FC<{
  item: ReviewQueue['items'][0];
}> = ({ item }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'hard':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '쉬움';
      case 'medium':
        return '보통';
      case 'hard':
        return '어려움';
      default:
        return difficulty;
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-600';
    if (accuracy >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-3 rounded-lg border border-border-primary bg-surface-secondary">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h5 className="font-medium text-text-primary truncate mb-1">
            {item.title}
          </h5>
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getDifficultyColor(item.difficulty)}`}>
              {getDifficultyLabel(item.difficulty)}
            </span>
            <span className={`text-xs font-medium ${getAccuracyColor(item.previousAccuracy)}`}>
              이전 정답률: {item.previousAccuracy}%
            </span>
          </div>
        </div>
        <div className="text-xs text-text-tertiary ml-2">
          {new Date(item.nextReviewDate).toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric'
          })}
        </div>
      </div>
    </div>
  );
};

export const ReviewQueueCard: React.FC<ReviewQueueCardProps> = ({ 
  reviewQueue, 
  onStartReview,
  isStartingReview 
}) => {
  const completionRate = reviewQueue.totalCount > 0 
    ? ((reviewQueue.totalCount - reviewQueue.urgentCount) / reviewQueue.totalCount) * 100 
    : 100;

  const getUrgencyMessage = (urgentCount: number) => {
    if (urgentCount === 0) return '복습할 항목이 없어요! 🎉';
    if (urgentCount <= 5) return '복습할 항목이 조금 있어요 📚';
    if (urgentCount <= 15) return '복습할 항목이 쌓였어요 ⏰';
    return '복습이 많이 밀렸어요! 서둘러 주세요 🚨';
  };

  const getUrgencyVariant = (urgentCount: number) => {
    if (urgentCount === 0) return 'success';
    if (urgentCount <= 5) return 'default';
    if (urgentCount <= 15) return 'warning';
    return 'error';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <span>🔄</span>
            <span>복습 큐</span>
          </span>
          <Badge variant={getUrgencyVariant(reviewQueue.urgentCount)}>
            {reviewQueue.urgentCount === 0 ? '완료!' : `${reviewQueue.urgentCount}개 긴급`}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 복습 현황 요약 */}
        <div className="text-center space-y-3">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-text-primary">
              {reviewQueue.totalCount}개
            </div>
            <div className="text-sm text-text-secondary">
              전체 복습 대기 항목
            </div>
            <div className="text-xs text-text-tertiary">
              {getUrgencyMessage(reviewQueue.urgentCount)}
            </div>
          </div>
          
          {reviewQueue.totalCount > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">복습 진도</span>
                <span className="font-medium">{Math.round(completionRate)}%</span>
              </div>
              <Progress
                value={completionRate}
                variant={completionRate >= 80 ? 'success' : completionRate >= 60 ? 'warning' : 'error'}
                className="h-2"
              />
            </div>
          )}
        </div>

        {/* 긴급 복습 항목들 (최대 3개만 표시) */}
        {reviewQueue.items.length > 0 && (
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-text-secondary">
              오늘 복습할 항목들
            </h5>
            <div className="space-y-2">
              {reviewQueue.items.slice(0, 3).map((item, index) => (
                <ReviewItem key={index} item={item} />
              ))}
            </div>
            
            {reviewQueue.items.length > 3 && (
              <div className="text-center">
                <div className="text-xs text-text-tertiary">
                  그 외 {reviewQueue.items.length - 3}개 항목이 더 있어요
                </div>
              </div>
            )}
          </div>
        )}

        {/* 복습 시작 버튼 */}
        <div className="pt-4 border-t border-border-primary">
          {reviewQueue.urgentCount > 0 ? (
            <Button
              onClick={onStartReview}
              className="w-full"
              disabled={isStartingReview}
            >
              {isStartingReview ? '복습 준비 중...' : `복습 시작 (${reviewQueue.urgentCount}개)`}
            </Button>
          ) : (
            <div className="text-center space-y-2">
              <div className="text-sm text-text-secondary">
                🎉 복습할 항목이 없어요!
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onStartReview}
                disabled={isStartingReview}
              >
                전체 복습 목록 보기
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};