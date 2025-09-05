import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { Badge } from '../../../ui/Badge';
import { Progress } from '../../../ui/Progress';
import { useSRSReviews, useSRSNotifications } from '../../../../hooks';

// 컴포넌트 props 타입
interface SRSReviewCardProps {
  className?: string;
  showQuickStart?: boolean;  // 빠른 시작 버튼 표시
  showNotificationBadge?: boolean;  // 알림 배지 표시
}

/**
 * 학생 대시보드용 SRS 복습 카드
 * 
 * 대시보드에서 복습 상태를 한눈에 볼 수 있고,
 * 빠르게 복습을 시작할 수 있는 위젯입니다.
 */
export const SRSReviewCard: React.FC<SRSReviewCardProps> = ({
  className = '',
  showQuickStart = true,
  showNotificationBadge = true
}) => {
  // SRS 복습 데이터
  const {
    reviews,
    hasReviews,
    isLoading,
    getReviewProgress,
    state
  } = useSRSReviews({
    autoLoad: true
  });

  // 알림 상태
  const {
    hasUnreadNotifications,
    overdueCount,
    upcomingCount
  } = useSRSNotifications({
    autoLoad: showNotificationBadge
  });

  if (isLoading) {
    return (
      <Card className={`srs-review-card ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </Card>
    );
  }

  if (state.error) {
    return (
      <Card className={`srs-review-card ${className}`} variant="danger">
        <div className="text-center py-4">
          <div className="text-red-600 text-sm">
            복습 정보를 불러올 수 없습니다
          </div>
        </div>
      </Card>
    );
  }

  const progress = getReviewProgress();
  const hasOverdueReviews = overdueCount > 0;
  const hasUpcomingReviews = upcomingCount > 0;

  return (
    <Card className={`srs-review-card ${className}`}>
      {/* 카드 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">
            📚 SRS 복습
          </h3>
          
          {showNotificationBadge && hasUnreadNotifications && (
            <Badge variant="danger" size="sm">
              알림
            </Badge>
          )}
        </div>
        
        <Link to="/srs/statistics" className="text-sm text-blue-600 hover:underline">
          통계 →
        </Link>
      </div>

      {/* 복습 상태 */}
      {!hasReviews ? (
        <div className="text-center py-6">
          <div className="text-4xl mb-2">🎉</div>
          <div className="font-medium text-gray-800 mb-1">
            모든 복습 완료!
          </div>
          <div className="text-sm text-gray-600">
            오늘 예정된 복습이 없습니다
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 진행률 표시 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                오늘의 복습 진행률
              </span>
              <span className="text-sm text-gray-600">
                {progress.completed}/{progress.completed + progress.remaining}
              </span>
            </div>
            <Progress 
              value={progress.progressPercent} 
              size="md"
              className="mb-1"
            />
            <div className="text-xs text-gray-500">
              {progress.progressPercent}% 완료
            </div>
          </div>

          {/* 복습 상태 요약 */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">
                {progress.remaining}
              </div>
              <div className="text-xs text-gray-600">남은 복습</div>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">
                {progress.completed}
              </div>
              <div className="text-xs text-gray-600">완료</div>
            </div>
            
            {hasOverdueReviews ? (
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-xl font-bold text-red-600">
                  {overdueCount}
                </div>
                <div className="text-xs text-gray-600">연체</div>
              </div>
            ) : (
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-xl font-bold text-orange-600">
                  {upcomingCount}
                </div>
                <div className="text-xs text-gray-600">예정</div>
              </div>
            )}
          </div>

          {/* 우선순위 알림 */}
          {hasOverdueReviews && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-red-600">⚠️</span>
                <span className="text-sm text-red-800">
                  {overdueCount}개의 연체된 복습이 있습니다
                </span>
              </div>
            </div>
          )}

          {/* 액션 버튼들 */}
          {showQuickStart && (
            <div className="flex gap-2">
              <Link to="/srs/review">
                <Button
                  variant={hasOverdueReviews ? "danger" : "primary"}
                  size="sm"
                  className="w-full"
                >
                  {hasOverdueReviews ? "연체 복습 시작" : "복습 시작"}
                </Button>
              </Link>
              
              <Link to="/srs/settings">
                <Button
                  variant="outline"
                  size="sm"
                >
                  설정
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 학습 팁 (복습이 없을 때) */}
      {!hasReviews && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            💡 <strong>팁:</strong> 새로운 문제를 추가하면 복습 스케줄이 자동으로 생성됩니다.
          </div>
          <div className="mt-2">
            <Link to="/problems">
              <Button
                variant="outline"
                size="sm"
              >
                문제 찾아보기
              </Button>
            </Link>
          </div>
        </div>
      )}
    </Card>
  );
};

SRSReviewCard.displayName = 'SRSReviewCard';

export default SRSReviewCard;