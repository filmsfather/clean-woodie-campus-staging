import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FeatureGuard } from '../../components/auth/FeatureGuard';
import { Button, Card, Badge, Progress } from '../../components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Application Layer DTO 타입 직접 사용 (DTO-First 원칙)
interface ReviewQueueItem {
  scheduleId: string;
  studentId: string;
  problemId: string;
  nextReviewAt: Date;
  currentInterval: number;
  easeFactor: number;
  reviewCount: number;
  consecutiveFailures: number;
  priority: 'high' | 'medium' | 'low';
  isOverdue: boolean;
  minutesUntilDue: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  retentionProbability: number;
}

interface GetTodayReviewsResponse {
  reviews: ReviewQueueItem[];
  totalCount: number;
  highPriorityCount: number;
  overdueCount: number;
  upcomingCount: number;
}

interface ReviewFeedback {
  quality: 'again' | 'hard' | 'good' | 'easy';
  responseTime?: number;
  confidence?: number;
}

/**
 * GetTodayReviewsUseCase → TodayReviewsPage
 * 오늘의 복습 목록 및 복습 진행 UI 표면
 */
export const TodayReviewsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewSession, setReviewSession] = useState<{
    completed: number;
    remaining: number;
    startTime: Date;
  } | null>(null);

  // GetTodayReviewsUseCase 호출
  const { data, isLoading, error } = useQuery({
    queryKey: ['todayReviews', user?.id],
    queryFn: async (): Promise<GetTodayReviewsResponse> => {
      // TODO: 실제 GetTodayReviewsUseCase 연동
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock 데이터 (Application DTO 형태)
      const mockReviews: ReviewQueueItem[] = [
        {
          scheduleId: 'sched-1',
          studentId: user?.id || 'student-1',
          problemId: 'prob-1',
          nextReviewAt: new Date(Date.now() - 30 * 60 * 1000), // 30분 지남
          currentInterval: 1,
          easeFactor: 2.5,
          reviewCount: 3,
          consecutiveFailures: 1,
          priority: 'high',
          isOverdue: true,
          minutesUntilDue: -30,
          difficultyLevel: 'intermediate',
          retentionProbability: 0.6
        },
        {
          scheduleId: 'sched-2',
          studentId: user?.id || 'student-1',
          problemId: 'prob-2',
          nextReviewAt: new Date(Date.now() + 15 * 60 * 1000), // 15분 후
          currentInterval: 4,
          easeFactor: 2.8,
          reviewCount: 8,
          consecutiveFailures: 0,
          priority: 'medium',
          isOverdue: false,
          minutesUntilDue: 15,
          difficultyLevel: 'beginner',
          retentionProbability: 0.85
        },
        {
          scheduleId: 'sched-3',
          studentId: user?.id || 'student-1',
          problemId: 'prob-3',
          nextReviewAt: new Date(Date.now() + 120 * 60 * 1000), // 2시간 후
          currentInterval: 10,
          easeFactor: 3.2,
          reviewCount: 15,
          consecutiveFailures: 0,
          priority: 'low',
          isOverdue: false,
          minutesUntilDue: 120,
          difficultyLevel: 'advanced',
          retentionProbability: 0.92
        }
      ];

      return {
        reviews: mockReviews,
        totalCount: mockReviews.length,
        highPriorityCount: mockReviews.filter(r => r.priority === 'high').length,
        overdueCount: mockReviews.filter(r => r.isOverdue).length,
        upcomingCount: mockReviews.filter(r => r.minutesUntilDue <= 60 && r.minutesUntilDue > 0).length,
      };
    },
    enabled: !!user?.id
  });

  // SubmitReviewFeedbackUseCase 호출
  const submitReviewMutation = useMutation({
    mutationFn: async (feedback: ReviewFeedback & { scheduleId: string }) => {
      // TODO: 실제 SubmitReviewFeedbackUseCase 연동
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayReviews'] });
      handleNextReview();
    }
  });

  const startReviewSession = () => {
    if (!data?.reviews.length) return;
    
    setReviewSession({
      completed: 0,
      remaining: data.reviews.length,
      startTime: new Date()
    });
    setCurrentReviewIndex(0);
  };

  const handleReviewFeedback = (quality: ReviewFeedback['quality']) => {
    if (!data?.reviews[currentReviewIndex]) return;
    
    const currentReview = data.reviews[currentReviewIndex];
    const responseTime = reviewSession?.startTime ? 
      (Date.now() - reviewSession.startTime.getTime()) / 1000 : undefined;
    
    submitReviewMutation.mutate({
      scheduleId: currentReview.scheduleId,
      quality,
      responseTime,
      confidence: quality === 'easy' ? 5 : quality === 'good' ? 4 : quality === 'hard' ? 2 : 1
    });
  };

  const handleNextReview = () => {
    if (!data?.reviews || !reviewSession) return;
    
    const nextIndex = currentReviewIndex + 1;
    
    if (nextIndex >= data.reviews.length) {
      // 세션 완료
      setReviewSession(null);
      setCurrentReviewIndex(0);
      setShowAnswer(false);
    } else {
      setCurrentReviewIndex(nextIndex);
      setShowAnswer(false);
      setReviewSession(prev => prev ? {
        ...prev,
        completed: prev.completed + 1,
        remaining: prev.remaining - 1
      } : null);
    }
  };

  const formatTimeUntilDue = (minutes: number): string => {
    if (minutes < 0) {
      return `${Math.abs(minutes)}분 지남`;
    } else if (minutes < 60) {
      return `${minutes}분 후`;
    } else {
      const hours = Math.floor(minutes / 60);
      return `${hours}시간 후`;
    }
  };

  const getPriorityColor = (priority: ReviewQueueItem['priority']): string => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
    }
  };

  if (!user) {
    return <div>로그인이 필요합니다.</div>;
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-6 text-center">
          <p className="text-red-600">복습 목록을 불러올 수 없습니다.</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            다시 시도
          </Button>
        </Card>
      </div>
    );
  }

  // 복습 세션이 진행 중인 경우
  if (reviewSession && data.reviews.length > 0) {
    const currentReview = data.reviews[currentReviewIndex];
    
    return (
      <FeatureGuard feature="reviewSystem">
        <div className="max-w-2xl mx-auto p-6">
          {/* 진행 상태 */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                {reviewSession.completed + 1} / {data.totalCount}
              </span>
              <span className="text-sm text-gray-500">
                남은 시간: {formatTimeUntilDue(currentReview.minutesUntilDue)}
              </span>
            </div>
            <Progress 
              value={(reviewSession.completed / data.totalCount) * 100}
              className="h-2"
            />
          </div>

          {/* 문제 카드 */}
          <Card className="p-8 mb-6">
            <div className="flex justify-between items-start mb-4">
              <Badge className={getPriorityColor(currentReview.priority)}>
                {currentReview.priority === 'high' ? '높음' : 
                 currentReview.priority === 'medium' ? '보통' : '낮음'}
              </Badge>
              {currentReview.isOverdue && (
                <Badge className="bg-red-100 text-red-800">연체됨</Badge>
              )}
            </div>

            {/* TODO: 실제 문제 내용 표시 */}
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">
                문제 ID: {currentReview.problemId}
              </h2>
              <p className="text-gray-600 mb-8">
                복습 횟수: {currentReview.reviewCount}회 | 
                난이도: {currentReview.difficultyLevel} |
                정답률 예상: {Math.round(currentReview.retentionProbability * 100)}%
              </p>
              
              {!showAnswer ? (
                <Button onClick={() => setShowAnswer(true)}>
                  답안 보기
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded">
                    <p>정답: 예시 답안입니다.</p>
                  </div>
                  
                  <div className="flex justify-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => handleReviewFeedback('again')}
                      className="text-red-600"
                      disabled={submitReviewMutation.isPending}
                    >
                      다시
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleReviewFeedback('hard')}
                      className="text-orange-600"
                      disabled={submitReviewMutation.isPending}
                    >
                      어려움
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleReviewFeedback('good')}
                      className="text-blue-600"
                      disabled={submitReviewMutation.isPending}
                    >
                      좋음
                    </Button>
                    <Button
                      onClick={() => handleReviewFeedback('easy')}
                      className="text-green-600"
                      disabled={submitReviewMutation.isPending}
                    >
                      쉬움
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </FeatureGuard>
    );
  }

  // 복습 목록 표시
  return (
    <FeatureGuard feature="reviewSystem">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">오늘의 복습</h1>
          {data.totalCount > 0 && (
            <Button onClick={startReviewSession}>
              복습 시작 ({data.totalCount}개)
            </Button>
          )}
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">{data.totalCount}</div>
            <div className="text-sm text-gray-600">전체 복습</div>
          </Card>
          
          <Card className="p-4">
            <div className="text-2xl font-bold text-red-600">{data.overdueCount}</div>
            <div className="text-sm text-gray-600">연체됨</div>
          </Card>
          
          <Card className="p-4">
            <div className="text-2xl font-bold text-orange-600">{data.highPriorityCount}</div>
            <div className="text-sm text-gray-600">높은 우선순위</div>
          </Card>
          
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">{data.upcomingCount}</div>
            <div className="text-sm text-gray-600">곧 만료</div>
          </Card>
        </div>

        {/* 복습 목록 */}
        {data.totalCount === 0 ? (
          <Card className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">🎉 모든 복습을 완료했어요!</h3>
            <p className="text-gray-600">오늘 복습할 항목이 없습니다.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {data.reviews.map((review, index) => (
              <Card key={review.scheduleId} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500">#{index + 1}</div>
                    <div>
                      <div className="font-medium">문제 ID: {review.problemId}</div>
                      <div className="text-sm text-gray-600">
                        복습 {review.reviewCount}회 | {review.difficultyLevel}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge className={getPriorityColor(review.priority)}>
                      {review.priority === 'high' ? '높음' : 
                       review.priority === 'medium' ? '보통' : '낮음'}
                    </Badge>
                    
                    {review.isOverdue && (
                      <Badge className="bg-red-100 text-red-800">
                        {formatTimeUntilDue(review.minutesUntilDue)}
                      </Badge>
                    )}
                    
                    <div className="text-sm text-gray-500">
                      정답률 {Math.round(review.retentionProbability * 100)}%
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </FeatureGuard>
  );
};