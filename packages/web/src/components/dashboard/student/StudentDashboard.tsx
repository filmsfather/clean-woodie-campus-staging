import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { Unauthorized } from '../../auth/Unauthorized';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { ProblemList } from '../../problems';
import { StudentPerformanceAnalysis } from '../../problems/analytics';
import { DashboardSkeleton, DashboardError, EmptyDashboard } from '../shared/components';
import { FeatureGuard } from '../../auth/FeatureGuard';
import { useStudentDashboard, useStartStudySession, useStartReview } from './hooks/useStudentDashboard';
import {
  WelcomeSection,
  QuickStatsGrid,
  TodayTasksSection,
  StudyStreakCard,
  ReviewQueueCard,
  SRSReviewCard,
} from './components';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // 모든 훅을 최상단에서 호출 (Rules of Hooks)
  const { data, isLoading, error, refetch } = useStudentDashboard(user?.id || '');
  const startStudySession = useStartStudySession();
  const startReview = useStartReview();
  
  // 권한 체크 - 학생만 접근 가능
  if (!user) {
    return <DashboardSkeleton />;
  }
  
  if (user.role !== 'student') {
    return <Unauthorized message="학생만 접근할 수 있는 페이지입니다." />;
  }

  // 로딩 상태
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // 에러 상태
  if (error) {
    return (
      <DashboardError 
        onRetry={() => refetch()} 
        error={error as Error}
        title="학생 대시보드를 불러올 수 없어요"
      />
    );
  }

  // 데이터 없음
  if (!data) {
    return (
      <EmptyDashboard
        title="학습 데이터가 없어요"
        message="첫 학습을 시작해서 여러분만의 학습 여정을 시작해보세요!"
        actionLabel="학습 시작하기"
        onAction={() => {
          // TODO: 첫 학습 시작 로직
          console.log('Start first study session');
        }}
      />
    );
  }

  const handleStartTask = (taskId: string) => {
    startStudySession.mutate(taskId);
  };

  const handleStartReview = () => {
    startReview.mutate();
  };

  const dashboard = data.dashboard;

  return (
    <FeatureGuard feature="studentDashboard">
      <div className="space-y-6">
        {/* 환영 메시지 */}
        <WelcomeSection />

        {/* 빠른 통계 카드들 */}
        <QuickStatsGrid 
          currentStreak={dashboard.currentStreak}
          longestStreak={dashboard.longestStreak}
          reviewCount={dashboard.reviewCount}
          totalStudyHours={dashboard.totalStudyHours || 0}
          averageAccuracy={dashboard.averageAccuracy || 0}
          completedProblemSets={dashboard.completedProblemSets || 0}
          totalActiveProblemSets={dashboard.totalActiveProblemSets || 0}
        />

        {/* 오늘의 학습 태스크 */}
        <TodayTasksSection 
          tasks={dashboard.todayTasks}
          onStartTask={handleStartTask}
          isStartingTask={startStudySession.isPending}
        />

        {/* 3열 레이아웃: 스트릭 & 복습 & SRS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <FeatureGuard feature="progressTracking">
            <StudyStreakCard 
              currentStreak={dashboard.currentStreak}
              longestStreak={dashboard.longestStreak}
            />
          </FeatureGuard>
          
          <FeatureGuard feature="reviewSystem">
            <ReviewQueueCard 
              reviewCount={dashboard.reviewCount}
              onStartReview={handleStartReview}
              isStartingReview={startReview.isPending}
            />
          </FeatureGuard>

          <FeatureGuard feature="srs">
            <SRSReviewCard 
              showQuickStart={true}
              showNotificationBadge={true}
            />
          </FeatureGuard>
        </div>

        {/* 추가 섹션들 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 내 학습 분석 */}
          <FeatureGuard feature="analytics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>📈</span>
                  <span>내 학습 분석</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StudentPerformanceAnalysis
                  studentId={user.id}
                  timeRange="month"
                  showComparison={false}
                  compact={true}
                />
              </CardContent>
            </Card>
          </FeatureGuard>

          {/* 추천 문제 */}
          <FeatureGuard feature="recommendations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>🎯</span>
                  <span>추천 문제</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProblemList
                  problems={[]} // TODO: 추천 문제 데이터 연결
                  loading={false}
                  compact={true}
                  mode="recommendation"
                  showDifficulty={true}
                  limit={5}
                  onProblemSelect={(problem) => {
                    // TODO: 문제 풀이 페이지로 이동
                    console.log('추천 문제 선택:', problem);
                  }}
                />
              </CardContent>
            </Card>
          </FeatureGuard>
        </div>
      </div>
    </FeatureGuard>
  );
};