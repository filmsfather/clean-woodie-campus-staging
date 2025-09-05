import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { Badge } from '../../../ui/Badge';
import { Progress } from '../../../ui/Progress';

interface ReviewQueueCardProps {
  reviewCount: number;
  onStartReview?: () => void;
  isStartingReview?: boolean;
}

export const ReviewQueueCard: React.FC<ReviewQueueCardProps> = ({ 
  reviewCount, 
  onStartReview,
  isStartingReview 
}) => {
  const completionRate = reviewCount > 0 
    ? Math.max(0, 100 - (reviewCount * 10)) // 간단한 완료율 계산
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
          <Badge variant={getUrgencyVariant(reviewCount)}>
            {reviewCount === 0 ? '완료!' : `${reviewCount}개 긴급`}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 복습 현황 요약 */}
        <div className="text-center space-y-3">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-text-primary">
              {reviewCount}개
            </div>
            <div className="text-sm text-text-secondary">
              전체 복습 대기 항목
            </div>
            <div className="text-xs text-text-tertiary">
              {getUrgencyMessage(reviewCount)}
            </div>
          </div>
          
          {reviewCount > 0 && (
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

        {/* 복습 시작 버튼 */}
        <div className="pt-4 border-t border-border-primary">
          {reviewCount > 0 ? (
            <Button
              onClick={onStartReview}
              className="w-full"
              disabled={isStartingReview}
            >
              {isStartingReview ? '복습 준비 중...' : `복습 시작 (${reviewCount}개)`}
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