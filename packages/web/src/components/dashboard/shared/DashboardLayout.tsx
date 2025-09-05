import React, { useMemo } from 'react';
import { UserRole } from '../../../types/auth';

// 위젯 인터페이스 정의
export interface DashboardWidget {
  id: string;
  title: string;
  component: React.ComponentType<any>;
  gridSpan: {
    xs: number; // 모바일 (1-12)
    sm: number; // 태블릿 (1-12)  
    md: number; // 데스크톱 (1-12)
    lg: number; // 대형 화면 (1-12)
  };
  priority: number; // 낮을수록 먼저 배치
  roles: UserRole[];
  isEnabled: boolean;
  requiresData?: string[]; // 필요한 데이터 소스
  minHeight?: number; // 최소 높이 (픽셀)
  refreshInterval?: number; // 자동 새로고침 간격 (초)
}

// 레이아웃 설정 인터페이스
export interface DashboardLayoutConfig {
  role: UserRole;
  maxColumns: number;
  gap: string;
  padding: string;
  widgets: DashboardWidget[];
}

// 기본 위젯 컴포넌트들
import { QuickStatsGrid } from '../student/components/QuickStatsGrid';
import { ReviewQueueCard } from '../student/components/ReviewQueueCard';
import { StudyStreakCard } from '../student/components/StudyStreakCard';
import { TodayTasksSection } from '../student/components/TodayTasksSection';
import { WelcomeSection } from '../student/components/WelcomeSection';
import { GamificationDashboard } from '../../gamification/GamificationDashboard';

// 위젯 레지스트리
export const WIDGET_REGISTRY: Record<string, React.ComponentType<any>> = {
  'welcome-section': WelcomeSection,
  'quick-stats': QuickStatsGrid,
  'review-queue': ReviewQueueCard,
  'study-streak': StudyStreakCard,
  'today-tasks': TodayTasksSection,
  'gamification': GamificationDashboard,
  // 교사 대시보드 컴포넌트들
  'class-overview': React.lazy(() => import('../teacher/components/ClassOverview')),
  'student-performance': React.lazy(() => import('../../problems/analytics/StudentPerformanceAnalysis')),
  // 아직 구현되지 않은 컴포넌트들 (임시 대체)
  'problem-set-analytics': () => React.createElement('div', { className: 'p-4 text-gray-500' }, '문제 세트 분석 (준비중)'),
  'system-metrics': () => React.createElement('div', { className: 'p-4 text-gray-500' }, '시스템 메트릭 (준비중)'),
  'user-analytics': () => React.createElement('div', { className: 'p-4 text-gray-500' }, '사용자 분석 (준비중)'),
  'batch-monitor': () => React.createElement('div', { className: 'p-4 text-gray-500' }, '배치 작업 모니터 (준비중)'),
};

// 역할별 위젯 설정
export const getDashboardWidgets = (role: UserRole): DashboardWidget[] => {
  const widgets: Record<UserRole, DashboardWidget[]> = {
    student: [
      {
        id: 'welcome-section',
        title: '환영 메시지',
        component: WIDGET_REGISTRY['welcome-section'],
        gridSpan: { xs: 12, sm: 12, md: 12, lg: 12 },
        priority: 1,
        roles: ['student'],
        isEnabled: true,
        minHeight: 200,
      },
      {
        id: 'quick-stats',
        title: '빠른 통계',
        component: WIDGET_REGISTRY['quick-stats'],
        gridSpan: { xs: 12, sm: 12, md: 12, lg: 8 },
        priority: 2,
        roles: ['student'],
        isEnabled: true,
        requiresData: ['studentProgress'],
        minHeight: 150,
      },
      {
        id: 'study-streak',
        title: '학습 스트릭',
        component: WIDGET_REGISTRY['study-streak'],
        gridSpan: { xs: 12, sm: 6, md: 4, lg: 4 },
        priority: 3,
        roles: ['student'],
        isEnabled: true,
        requiresData: ['streakData'],
        minHeight: 200,
        refreshInterval: 3600, // 1시간마다 새로고침
      },
      {
        id: 'review-queue',
        title: '복습 큐',
        component: WIDGET_REGISTRY['review-queue'],
        gridSpan: { xs: 12, sm: 6, md: 8, lg: 6 },
        priority: 4,
        roles: ['student'],
        isEnabled: true,
        requiresData: ['reviewQueue'],
        minHeight: 300,
        refreshInterval: 600, // 10분마다 새로고침
      },
      {
        id: 'today-tasks',
        title: '오늘의 학습',
        component: WIDGET_REGISTRY['today-tasks'],
        gridSpan: { xs: 12, sm: 12, md: 8, lg: 6 },
        priority: 5,
        roles: ['student'],
        isEnabled: true,
        requiresData: ['todayTasks'],
        minHeight: 250,
      },
      {
        id: 'gamification',
        title: '게임화',
        component: WIDGET_REGISTRY['gamification'],
        gridSpan: { xs: 12, sm: 12, md: 12, lg: 12 },
        priority: 6,
        roles: ['student'],
        isEnabled: true,
        requiresData: ['gamificationData'],
        minHeight: 400,
      },
    ],
    teacher: [
      {
        id: 'welcome-section',
        title: '환영 메시지',
        component: WIDGET_REGISTRY['welcome-section'],
        gridSpan: { xs: 12, sm: 12, md: 12, lg: 12 },
        priority: 1,
        roles: ['teacher'],
        isEnabled: true,
        minHeight: 150,
      },
      {
        id: 'class-overview',
        title: '반 현황',
        component: WIDGET_REGISTRY['class-overview'],
        gridSpan: { xs: 12, sm: 12, md: 12, lg: 8 },
        priority: 2,
        roles: ['teacher'],
        isEnabled: true,
        requiresData: ['classData'],
        minHeight: 300,
        refreshInterval: 300, // 5분마다 새로고침
      },
      {
        id: 'student-performance',
        title: '학생 성과',
        component: WIDGET_REGISTRY['student-performance'],
        gridSpan: { xs: 12, sm: 12, md: 6, lg: 4 },
        priority: 3,
        roles: ['teacher'],
        isEnabled: true,
        requiresData: ['studentPerformance'],
        minHeight: 350,
      },
      {
        id: 'problem-set-analytics',
        title: '문제집 분석',
        component: WIDGET_REGISTRY['problem-set-analytics'],
        gridSpan: { xs: 12, sm: 12, md: 6, lg: 6 },
        priority: 4,
        roles: ['teacher'],
        isEnabled: true,
        requiresData: ['problemSetAnalytics'],
        minHeight: 300,
      },
      {
        id: 'quick-stats',
        title: '빠른 통계',
        component: WIDGET_REGISTRY['quick-stats'],
        gridSpan: { xs: 12, sm: 12, md: 12, lg: 6 },
        priority: 5,
        roles: ['teacher'],
        isEnabled: true,
        requiresData: ['teacherStats'],
        minHeight: 200,
      },
    ],
    admin: [
      {
        id: 'welcome-section',
        title: '환영 메시지',
        component: WIDGET_REGISTRY['welcome-section'],
        gridSpan: { xs: 12, sm: 12, md: 12, lg: 12 },
        priority: 1,
        roles: ['admin'],
        isEnabled: true,
        minHeight: 150,
      },
      {
        id: 'system-metrics',
        title: '시스템 지표',
        component: WIDGET_REGISTRY['system-metrics'],
        gridSpan: { xs: 12, sm: 12, md: 6, lg: 4 },
        priority: 2,
        roles: ['admin'],
        isEnabled: true,
        requiresData: ['systemMetrics'],
        minHeight: 250,
        refreshInterval: 60, // 1분마다 새로고침
      },
      {
        id: 'user-analytics',
        title: '사용자 분석',
        component: WIDGET_REGISTRY['user-analytics'],
        gridSpan: { xs: 12, sm: 12, md: 6, lg: 4 },
        priority: 3,
        roles: ['admin'],
        isEnabled: true,
        requiresData: ['userAnalytics'],
        minHeight: 300,
      },
      {
        id: 'quick-stats',
        title: '빠른 통계',
        component: WIDGET_REGISTRY['quick-stats'],
        gridSpan: { xs: 12, sm: 6, md: 6, lg: 4 },
        priority: 4,
        roles: ['admin'],
        isEnabled: true,
        requiresData: ['adminStats'],
        minHeight: 200,
      },
      {
        id: 'batch-monitor',
        title: '배치 작업',
        component: WIDGET_REGISTRY['batch-monitor'],
        gridSpan: { xs: 12, sm: 6, md: 6, lg: 8 },
        priority: 5,
        roles: ['admin'],
        isEnabled: false, // 기본적으로 비활성화
        requiresData: ['batchJobs'],
        minHeight: 350,
        refreshInterval: 30, // 30초마다 새로고침
      },
      {
        id: 'problem-set-analytics',
        title: '전체 문제집 분석',
        component: WIDGET_REGISTRY['problem-set-analytics'],
        gridSpan: { xs: 12, sm: 12, md: 12, lg: 4 },
        priority: 6,
        roles: ['admin'],
        isEnabled: true,
        requiresData: ['globalProblemSetAnalytics'],
        minHeight: 300,
      },
    ],
  };

  return widgets[role] || [];
};

// 대시보드 레이아웃 컴포넌트
interface DashboardLayoutProps {
  role: UserRole;
  enabledWidgets?: string[]; // 사용자가 활성화한 위젯 ID 목록
  customLayout?: Partial<DashboardLayoutConfig>;
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  role,
  enabledWidgets,
  customLayout,
  children,
}) => {
  const widgets = useMemo(() => {
    const roleWidgets = getDashboardWidgets(role);
    
    // 활성화된 위젯만 필터링
    const filteredWidgets = roleWidgets.filter(widget => {
      if (enabledWidgets) {
        return enabledWidgets.includes(widget.id) && widget.isEnabled;
      }
      return widget.isEnabled;
    });

    // 우선순위 순으로 정렬
    return filteredWidgets.sort((a, b) => a.priority - b.priority);
  }, [role, enabledWidgets]);

  const layoutConfig: DashboardLayoutConfig = {
    role,
    maxColumns: 12,
    gap: 'gap-6',
    padding: 'p-6',
    widgets,
    ...customLayout,
  };

  // 그리드 클래스 생성 함수
  const getGridSpanClass = (widget: DashboardWidget) => {
    const { gridSpan } = widget;
    return [
      `col-span-${gridSpan.xs}`, // xs: 기본 (모바일)
      `sm:col-span-${gridSpan.sm}`, // sm: 640px+
      `md:col-span-${gridSpan.md}`, // md: 768px+
      `lg:col-span-${gridSpan.lg}`, // lg: 1024px+
    ].join(' ');
  };

  // 최소 높이 클래스 생성
  const getMinHeightClass = (minHeight?: number) => {
    if (!minHeight) return '';
    return `min-h-[${minHeight}px]`;
  };

  if (widgets.length === 0) {
    return (
      <div className={`${layoutConfig.padding} text-center`}>
        <div className="text-gray-500">
          이 역할에 사용 가능한 위젯이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className={`${layoutConfig.padding} max-w-7xl mx-auto`}>
      <div className={`grid grid-cols-${layoutConfig.maxColumns} ${layoutConfig.gap}`}>
        {widgets.map((widget) => {
          const WidgetComponent = widget.component;
          
          return (
            <div
              key={widget.id}
              className={`${getGridSpanClass(widget)} ${getMinHeightClass(widget.minHeight)}`}
              data-widget-id={widget.id}
              data-widget-priority={widget.priority}
            >
              <React.Suspense 
                fallback={
                  <div className="flex items-center justify-center h-full min-h-[200px] bg-gray-50 rounded-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                }
              >
                <WidgetComponent 
                  refreshInterval={widget.refreshInterval}
                  minHeight={widget.minHeight}
                />
              </React.Suspense>
            </div>
          );
        })}
        {children}
      </div>
    </div>
  );
};

// 위젯 관리 훅
export const useDashboardWidgets = (role: UserRole) => {
  const availableWidgets = useMemo(() => getDashboardWidgets(role), [role]);

  const enabledWidgets = availableWidgets.filter(w => w.isEnabled);
  const disabledWidgets = availableWidgets.filter(w => !w.isEnabled);

  return {
    availableWidgets,
    enabledWidgets,
    disabledWidgets,
    totalWidgets: availableWidgets.length,
  };
};

export default DashboardLayout;