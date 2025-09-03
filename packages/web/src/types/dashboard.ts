import { UserRole } from './auth';

// 공통 위젯 데이터 인터페이스
export interface BaseWidgetData {
  id: string;
  lastUpdated: Date;
  isLoading?: boolean;
  error?: string;
}

// 학생 대시보드 데이터 타입
export interface StudentDashboardData {
  // 빠른 통계
  studentProgress: BaseWidgetData & {
    totalProblemsCompleted: number;
    todayProblemsCompleted: number;
    weeklyAccuracy: number;
    currentStreak: number;
    longestStreak: number;
    totalStudyTimeMinutes: number;
    todayStudyTimeMinutes: number;
    rank: number;
    totalStudents: number;
  };

  // 스트릭 데이터
  streakData: BaseWidgetData & {
    currentStreak: number;
    longestStreak: number;
    streakHistory: Array<{
      date: string;
      hasActivity: boolean;
    }>;
    nextGoal: number;
    progress: number;
  };

  // 복습 큐 데이터
  reviewQueue: BaseWidgetData & {
    totalCount: number;
    urgentCount: number;
    items: Array<{
      problemId: string;
      title: string;
      difficulty: 'easy' | 'medium' | 'hard';
      previousAccuracy: number;
      nextReviewDate: string;
      reviewCount: number;
    }>;
  };

  // 오늘의 학습 데이터
  todayTasks: BaseWidgetData & {
    assignedProblems: Array<{
      problemSetId: string;
      title: string;
      totalProblems: number;
      completedProblems: number;
      dueDate?: string;
      difficulty: 'easy' | 'medium' | 'hard';
      estimatedMinutes: number;
    }>;
    totalTasks: number;
    completedTasks: number;
    estimatedTimeRemaining: number;
  };

  // 게임화 데이터
  gamificationData: BaseWidgetData & {
    tokenBalance: number;
    totalTokensEarned: number;
    recentAchievements: Array<{
      id: string;
      title: string;
      description: string;
      iconUrl?: string;
      earnedAt: string;
    }>;
    leaderboardPosition: number;
    availableRewards: Array<{
      id: string;
      name: string;
      cost: number;
      available: boolean;
    }>;
  };
}

// 교사 대시보드 데이터 타입
export interface TeacherDashboardData {
  // 반 현황 데이터
  classData: BaseWidgetData & {
    totalStudents: number;
    activeStudents: number;
    averageProgress: number;
    classRanking: number;
    recentActivity: Array<{
      studentName: string;
      action: string;
      timestamp: string;
    }>;
    problemSetStats: Array<{
      problemSetId: string;
      title: string;
      assignedDate: string;
      completionRate: number;
      averageScore: number;
      studentsCompleted: number;
      studentsInProgress: number;
    }>;
  };

  // 학생 성과 데이터
  studentPerformance: BaseWidgetData & {
    students: Array<{
      studentId: string;
      name: string;
      avatar?: string;
      overallScore: number;
      recentAccuracy: number;
      problemsCompleted: number;
      studyTimeWeek: number;
      lastActive: string;
      trend: 'improving' | 'stable' | 'declining';
      strugglingTopics?: string[];
    }>;
    classAverages: {
      accuracy: number;
      completionRate: number;
      studyTime: number;
    };
  };

  // 문제집 분석 데이터
  problemSetAnalytics: BaseWidgetData & {
    createdProblemSets: Array<{
      id: string;
      title: string;
      createdDate: string;
      totalProblems: number;
      timesAssigned: number;
      averageCompletion: number;
      averageScore: number;
      difficulty: 'easy' | 'medium' | 'hard';
      tags: string[];
    }>;
    popularProblemSets: Array<{
      id: string;
      title: string;
      usage: number;
      rating: number;
    }>;
    performanceInsights: Array<{
      type: 'high_performer' | 'needs_attention' | 'difficulty_spike';
      message: string;
      problemSetId?: string;
      studentIds?: string[];
    }>;
  };

  // 교사 통계 데이터
  teacherStats: BaseWidgetData & {
    totalProblemsCreated: number;
    totalProblemSetsCreated: number;
    studentsManaged: number;
    averageClassPerformance: number;
    topPerformingClass?: string;
    weeklyEngagement: number;
  };
}

// 관리자 대시보드 데이터 타입
export interface AdminDashboardData {
  // 시스템 지표 데이터
  systemMetrics: BaseWidgetData & {
    serverHealth: {
      cpuUsage: number;
      memoryUsage: number;
      diskUsage: number;
      uptime: string;
      responseTime: number;
    };
    databaseStats: {
      connectionCount: number;
      queryPerformance: number;
      storageUsed: number;
      backupStatus: 'healthy' | 'warning' | 'error';
    };
    applicationMetrics: {
      activeUsers: number;
      requestsPerMinute: number;
      errorRate: number;
      averageLoadTime: number;
    };
  };

  // 사용자 분석 데이터
  userAnalytics: BaseWidgetData & {
    totalUsers: number;
    activeUsersToday: number;
    newUsersThisWeek: number;
    userGrowthRate: number;
    roleDistribution: {
      students: number;
      teachers: number;
      admins: number;
    };
    engagementMetrics: {
      averageSessionDuration: number;
      dailyActiveUsers: number;
      retentionRate: number;
    };
    topUsagePatterns: Array<{
      feature: string;
      usageCount: number;
      trend: 'up' | 'down' | 'stable';
    }>;
  };

  // 관리자 통계 데이터
  adminStats: BaseWidgetData & {
    totalProblems: number;
    totalProblemSets: number;
    totalClasses: number;
    pendingApprovals: number;
    systemAlerts: Array<{
      id: string;
      type: 'critical' | 'warning' | 'info';
      message: string;
      timestamp: string;
      resolved: boolean;
    }>;
    recentActivity: Array<{
      type: string;
      description: string;
      user: string;
      timestamp: string;
    }>;
  };

  // 배치 작업 데이터 (선택적)
  batchJobs?: BaseWidgetData & {
    runningJobs: Array<{
      id: string;
      name: string;
      status: 'running' | 'pending' | 'completed' | 'failed';
      progress: number;
      startTime: string;
      estimatedCompletion?: string;
    }>;
    recentJobs: Array<{
      id: string;
      name: string;
      status: 'completed' | 'failed';
      duration: number;
      completedAt: string;
      errorMessage?: string;
    }>;
    scheduledJobs: Array<{
      id: string;
      name: string;
      nextRun: string;
      frequency: string;
      enabled: boolean;
    }>;
  };

  // 전체 문제집 분석 데이터
  globalProblemSetAnalytics: BaseWidgetData & {
    totalProblemSets: number;
    averageCompletionRate: number;
    mostPopularSets: Array<{
      id: string;
      title: string;
      creator: string;
      usageCount: number;
      rating: number;
    }>;
    difficultyDistribution: {
      easy: number;
      medium: number;
      hard: number;
    };
    subjectDistribution: Record<string, number>;
    performanceTrends: Array<{
      date: string;
      averageScore: number;
      completionRate: number;
    }>;
  };
}

// 통합 대시보드 데이터 타입
export type DashboardData = 
  | { role: 'student'; data: StudentDashboardData }
  | { role: 'teacher'; data: TeacherDashboardData }
  | { role: 'admin'; data: AdminDashboardData };

// 대시보드 상태 타입
export interface DashboardState {
  isLoading: boolean;
  error?: string;
  lastRefresh: Date;
  autoRefreshEnabled: boolean;
  refreshInterval: number; // seconds
}

// 위젯 상태 타입
export interface WidgetState {
  id: string;
  isVisible: boolean;
  isLoading: boolean;
  error?: string;
  lastRefresh?: Date;
  data?: any;
}

// 대시보드 액션 타입
export type DashboardAction =
  | { type: 'LOADING_START' }
  | { type: 'LOADING_END' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_DATA'; payload: any }
  | { type: 'REFRESH_WIDGET'; payload: string }
  | { type: 'TOGGLE_WIDGET'; payload: string }
  | { type: 'SET_AUTO_REFRESH'; payload: boolean };

// 차트 데이터 공통 타입
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  trend?: 'up' | 'down' | 'stable';
}

export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

// 필터 및 정렬 옵션
export interface DashboardFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  studentIds?: string[];
  problemSetIds?: string[];
  difficulty?: ('easy' | 'medium' | 'hard')[];
  tags?: string[];
}

export interface DashboardSortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// 내보내기 옵션
export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  includeCharts: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  sections?: string[];
}

export default DashboardData;