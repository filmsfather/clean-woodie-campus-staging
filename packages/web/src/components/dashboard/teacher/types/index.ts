// Teacher Dashboard 전용 타입 정의

export interface TeacherProfile {
  id: string;
  name: string;
  displayName: string;
  subject?: string[];
  avatarUrl?: string;
}

export interface ClassStatistics {
  totalStudents: number;
  activeStudents: number;
  averageAccuracy: number;
  totalProblemsAssigned: number;
  totalCompletedProblems: number;
  averageStudyTime: number; // 분 단위
}

export interface StudentProgress {
  id: string;
  name: string;
  gradeLevel?: number;
  recentActivity: {
    lastLogin: string;
    problemsSolved: number;
    studyTime: number; // 분
    accuracy: number;
  };
  currentStreak: number;
  averageScore: number;
  status: 'active' | 'inactive' | 'at_risk';
  avatarUrl?: string;
}

export interface ProblemSetOverview {
  id: string;
  title: string;
  description: string;
  totalProblems: number;
  assignedStudents: number;
  completedStudents: number;
  averageScore: number;
  averageCompletionTime: number; // 분
  deadline?: string;
  createdAt: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
}

export interface RecentActivity {
  id: string;
  type: 'problem_completed' | 'problem_set_assigned' | 'student_achievement' | 'login';
  studentId: string;
  studentName: string;
  description: string;
  timestamp: string;
  metadata?: {
    problemSetId?: string;
    accuracy?: number;
    timeSpent?: number;
    achievementType?: string;
  };
}

export interface ClassAnalytics {
  period: 'day' | 'week' | 'month';
  studyTimeData: Array<{
    date: string;
    totalMinutes: number;
    activeStudents: number;
  }>;
  accuracyTrends: Array<{
    date: string;
    averageAccuracy: number;
  }>;
  problemCompletionData: Array<{
    date: string;
    completed: number;
    assigned: number;
  }>;
  subjectPerformance: Array<{
    subject: string;
    averageScore: number;
    totalProblems: number;
    completedProblems: number;
  }>;
}

export interface TeacherAlert {
  id: string;
  type: 'at_risk_student' | 'low_completion' | 'deadline_approaching' | 'achievement';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: string;
  actionRequired: boolean;
  relatedStudentId?: string;
  relatedProblemSetId?: string;
}

export interface TeacherDashboardData {
  profile: TeacherProfile;
  classStatistics: ClassStatistics;
  studentProgress: StudentProgress[];
  problemSetOverviews: ProblemSetOverview[];
  recentActivity: RecentActivity[];
  analytics: ClassAnalytics;
  alerts: TeacherAlert[];
  upcomingDeadlines: Array<{
    problemSetId: string;
    title: string;
    deadline: string;
    assignedStudents: number;
    completedStudents: number;
    urgent: boolean;
  }>;
}