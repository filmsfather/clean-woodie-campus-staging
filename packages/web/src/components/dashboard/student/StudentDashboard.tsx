import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { Unauthorized } from '../../auth/Unauthorized';
import { DashboardSkeleton, DashboardError, EmptyDashboard } from '../shared/components';
import { FeatureGuard } from '../../auth/FeatureGuard';
import { useStudentDashboard, useStartStudySession, useStartReview } from './hooks/useStudentDashboard';
import {
  WelcomeSection,
  QuickStatsGrid,
  TodayTasksSection,
  StudyStreakCard,
  ReviewQueueCard,
} from './components';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // 권한 체크 - 학생만 접근 가능
  if (!user) {
    return <DashboardSkeleton />;
  }
  
  if (user.role !== 'student') {
    return <Unauthorized message="학생만 접근할 수 있는 페이지입니다." />;
  }

  const { data, isLoading, error, refetch } = useStudentDashboard(user.id);
  const startStudySession = useStartStudySession();
  const startReview = useStartReview();

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

  return (
    <FeatureGuard feature="studentDashboard">
      <div className="space-y-6">
        {/* 환영 메시지 */}
        <WelcomeSection studentId={data.dashboard.studentId} />

        {/* 빠른 통계 카드들 */}
        <QuickStatsGrid 
          currentStreak={data.dashboard.currentStreak}
          longestStreak={data.dashboard.longestStreak}
          reviewCount={data.dashboard.reviewCount}
        />

        {/* 오늘의 학습 태스크 */}
        <TodayTasksSection 
          tasks={data.dashboard.todayTasks}
          onStartTask={handleStartTask}
          isStartingTask={startStudySession.isPending}
        />

        {/* 2열 레이아웃: 스트릭 & 복습 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FeatureGuard feature="progressTracking">
            <StudyStreakCard 
              currentStreak={data.dashboard.currentStreak}
              longestStreak={data.dashboard.longestStreak}
            />
          </FeatureGuard>
          
          <FeatureGuard feature="reviewSystem">
            <ReviewQueueCard 
              reviewCount={data.dashboard.reviewCount}
              onStartReview={handleStartReview}
              isStartingReview={startReview.isPending}
            />
          </FeatureGuard>
        </div>

        {/* 추가 섹션들은 필요에 따라 구현 예정 */}
        {/* 
        <ProgressChartSection data={data.dashboard.progressData} />
        <UpcomingDeadlinesSection deadlines={data.dashboard.upcomingDeadlines} />
        */}
      </div>
    </FeatureGuard>
  );
};