import React from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { Badge } from '../../../ui/Badge';
import { Progress } from '../../../ui/Progress';
import { useStudentDashboard, useStartReview } from '../hooks/useStudentDashboard';
import { DashboardSkeleton } from '../../shared/components';
import { Unauthorized } from '../../../auth/Unauthorized';

export const ReviewPage: React.FC = () => {
  const { user } = useAuth();
  const { data, isLoading } = useStudentDashboard(user?.id || '', {
    enabled: !!user && user.role === 'student'
  });
  const startReview = useStartReview();

  if (!user || user.role !== 'student') {
    return <Unauthorized message="학생만 접근할 수 있는 페이지입니다." />;
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const reviewQueue = data?.reviewQueue || { totalCount: 0, urgentCount: 0, items: [] };

  const handleStartReview = () => {
    startReview.mutate();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'hard': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '쉬움';
      case 'medium': return '보통';
      case 'hard': return '어려움';
      default: return difficulty;
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-text-primary">복습</h1>
        <p className="text-text-secondary">
          SRS(간격 반복 학습) 시스템으로 효과적인 복습을 해보세요!
        </p>
      </div>

      {/* 복습 현황 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="text-center py-6 space-y-2">
            <div className="text-3xl font-bold text-text-primary">
              {reviewQueue.totalCount}
            </div>
            <div className="text-sm text-text-secondary">전체 복습 대기</div>
            <Badge variant="outline" size="sm">문제</Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center py-6 space-y-2">
            <div className="text-3xl font-bold text-warning">
              {reviewQueue.urgentCount}
            </div>
            <div className="text-sm text-text-secondary">오늘 복습 필요</div>
            <Badge variant="warning" size="sm">긴급</Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center py-6 space-y-2">
            <div className="text-3xl font-bold text-success">
              {Math.round(((reviewQueue.totalCount - reviewQueue.urgentCount) / Math.max(reviewQueue.totalCount, 1)) * 100)}%
            </div>
            <div className="text-sm text-text-secondary">복습 진도율</div>
            <Badge variant="success" size="sm">달성</Badge>
          </CardContent>
        </Card>
      </div>

      {/* SRS 복습 시작 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🧠</span>
            <span>스마트 복습 시작</span>
            {reviewQueue.urgentCount > 0 && (
              <Badge variant="error" size="sm">
                {reviewQueue.urgentCount}개 대기중
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              간격 반복 학습 (SRS)이란?
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-200">
              과학적으로 검증된 학습법으로, 망각 곡선을 고려해 최적의 타이밍에 복습을 제공합니다. 
              틀린 문제는 더 자주, 맞힌 문제는 점점 더 긴 간격으로 복습하게 됩니다.
            </p>
          </div>

          {reviewQueue.urgentCount > 0 ? (
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <div className="text-lg font-medium text-text-primary">
                  오늘 복습할 {reviewQueue.urgentCount}개 문제가 준비되었어요!
                </div>
                <div className="text-sm text-text-secondary">
                  예상 소요시간: {Math.ceil(reviewQueue.urgentCount * 1.5)}분
                </div>
              </div>
              <Button
                onClick={handleStartReview}
                size="lg"
                className="px-8"
                disabled={startReview.isPending}
              >
                {startReview.isPending ? '복습 준비 중...' : `복습 시작하기 (${reviewQueue.urgentCount}문제)`}
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="text-4xl">🎉</div>
              <div className="space-y-2">
                <div className="text-lg font-medium text-text-primary">
                  오늘의 복습을 모두 완료했어요!
                </div>
                <div className="text-sm text-text-secondary">
                  내일 새로운 복습 문제가 준비될 예정입니다.
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleStartReview}
              >
                전체 복습 목록 보기
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 복습 대기 문제 목록 */}
      {reviewQueue.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📋</span>
              <span>복습 대기 문제들</span>
              <Badge variant="outline" size="sm">
                미리보기
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviewQueue.items.slice(0, 5).map((item, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border border-border-primary bg-surface-secondary"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <h5 className="font-medium text-text-primary">
                        {item.title}
                      </h5>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getDifficultyColor(item.difficulty)}`}>
                        {getDifficultyLabel(item.difficulty)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-text-tertiary">
                      <span>이전 정답률: {item.previousAccuracy}%</span>
                      <span>복습일: {new Date(item.nextReviewDate).toLocaleDateString('ko-KR')}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          item.previousAccuracy >= 80 ? 'bg-green-500' : 
                          item.previousAccuracy >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${item.previousAccuracy}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {reviewQueue.items.length > 5 && (
              <div className="text-center py-2">
                <div className="text-sm text-text-tertiary">
                  그 외 {reviewQueue.items.length - 5}개 문제가 더 있어요
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 복습 통계 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📈</span>
            <span>복습 성과</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-text-primary">이번 주 복습 현황</h4>
            <div className="space-y-3">
              {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => {
                const completed = Math.random() > 0.3; // Mock data
                const count = Math.floor(Math.random() * 10) + 1;
                return (
                  <div key={day} className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary w-8">{day}</span>
                    <div className="flex-1 mx-3">
                      <div className={`h-2 rounded-full ${completed ? 'bg-success' : 'bg-gray-200'}`} />
                    </div>
                    <span className="text-xs text-text-tertiary w-12">
                      {completed ? `${count}개` : '-'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-text-primary">정확도 분포</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">90% 이상</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="w-3/4 h-2 bg-green-500 rounded-full" />
                  </div>
                  <span className="text-xs text-text-tertiary w-8">75%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">70-89%</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="w-1/4 h-2 bg-yellow-500 rounded-full" />
                  </div>
                  <span className="text-xs text-text-tertiary w-8">20%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">70% 미만</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="w-1/12 h-2 bg-red-500 rounded-full" />
                  </div>
                  <span className="text-xs text-text-tertiary w-8">5%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};