// Admin Dashboard 전용 타입 정의 (반별 관리 중심)

export interface AdminProfile {
  id: string;
  name: string;
  displayName: string;
  role: 'admin' | 'super_admin';
  avatarUrl?: string;
}

export interface SystemStatistics {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number; // 전체 반 수
  activeClasses: number; // 활성 반 수
  totalProblems: number;
  totalProblemSets: number;
  systemUptime: number; // 시간 단위
  dailyActiveUsers: number;
}

export interface ClassOverview {
  id: string;
  name: string; // 예: "중학교 1학년 3반"
  teacherId: string;
  teacherName: string;
  totalStudents: number;
  activeStudents: number;
  averagePerformance: number;
  averageStudyTime: number; // 분 단위
  lastActivity: string;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
}

export interface TeacherOverview {
  id: string;
  name: string;
  email: string;
  classCount: number;
  totalStudents: number;
  averageClassPerformance: number;
  lastLogin: string;
  status: 'active' | 'inactive' | 'pending_approval';
  registrationDate: string;
  problemSetsCreated: number;
}

export interface UserOverview {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  classInfo?: {
    classId: string;
    className: string;
    teacherName: string;
  };
  lastLogin: string;
  status: 'active' | 'inactive' | 'suspended';
  registrationDate: string;
}

export interface SystemAlert {
  id: string;
  type: 'system_error' | 'performance_issue' | 'security_alert' | 'high_traffic' | 'batch_failure';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
  affectedComponents?: string[];
  relatedClassId?: string;
}

export interface ContentQualityMetrics {
  pendingProblems: number;
  approvedProblems: number;
  rejectedProblems: number;
  popularProblemSets: Array<{
    id: string;
    title: string;
    usageCount: number;
    averageRating: number;
  }>;
  underusedProblemSets: Array<{
    id: string;
    title: string;
    usageCount: number;
    createdBy: string;
  }>;
}

export interface SystemMetrics {
  period: 'hour' | 'day' | 'week' | 'month';
  userActivityData: Array<{
    timestamp: string;
    activeUsers: number;
    activeClasses: number;
    newRegistrations: number;
    loginCount: number;
  }>;
  performanceData: Array<{
    timestamp: string;
    responseTime: number; // ms
    errorRate: number; // %
    cacheHitRate: number; // %
    throughput: number; // requests/sec
  }>;
  learningActivityData: Array<{
    timestamp: string;
    problemsSolved: number;
    studyTimeMinutes: number;
    srsReviewsCompleted: number;
    newProblemSetsCreated: number;
  }>;
  classPerformanceData: Array<{
    timestamp: string;
    averageAccuracy: number;
    averageStudyTime: number;
    activeClassCount: number;
  }>;
}

export interface ClassAnalytics {
  classId: string;
  className: string;
  teacherName: string;
  metrics: {
    totalStudents: number;
    activeStudents: number;
    averageAccuracy: number;
    averageStudyTime: number;
    problemSetCompletion: number;
    srsCompletionRate: number;
  };
  topPerformingStudents: Array<{
    studentId: string;
    studentName: string;
    accuracy: number;
    studyTime: number;
    streak: number;
  }>;
  strugglingStudents: Array<{
    studentId: string;
    studentName: string;
    accuracy: number;
    lastActivity: string;
    issueType: 'low_accuracy' | 'inactive' | 'no_progress';
  }>;
}

export interface RecentSystemActivity {
  id: string;
  type: 'teacher_registration' | 'class_created' | 'system_maintenance' | 'batch_completed' | 'content_approved';
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  classId?: string;
  className?: string;
  details?: Record<string, any>;
}

export interface AdminDashboardData {
  profile: AdminProfile;
  systemStatistics: SystemStatistics;
  classOverviews: ClassOverview[];
  teacherOverviews: TeacherOverview[];
  systemAlerts: SystemAlert[];
  contentQualityMetrics: ContentQualityMetrics;
  systemMetrics: SystemMetrics;
  recentActivity: RecentSystemActivity[];
  topPerformingClasses: ClassAnalytics[];
  pendingApprovals: Array<{
    id: string;
    type: 'teacher_registration' | 'problem_approval' | 'class_creation_request';
    title: string;
    submittedBy: string;
    submittedAt: string;
    priority: 'high' | 'medium' | 'low';
    details?: Record<string, any>;
  }>;
}