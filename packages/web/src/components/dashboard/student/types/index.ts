// Student Dashboard 전용 타입 정의

export interface StudentProfile {
  id: string;
  name: string;
  displayName: string;
  gradeLevel?: number;
  avatarUrl?: string;
}

export interface StudyStreak {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string;
  weeklyPattern: Array<{
    date: string;
    studyMinutes: number;
    completed: boolean;
    problemsSolved: number;
  }>;
}

export interface StudentStatistics {
  totalStudyHours: number;
  averageAccuracy: number;
  problemsSolvedToday: number;
  problemsSolvedTotal: number;
  completedProblemSets: number;
  totalActiveProblemSets: number;
}

export interface TodayTask {
  id: string;
  type: 'srs_review' | 'new_problems' | 'problem_set';
  title: string;
  description: string;
  estimatedMinutes: number;
  priority: 'high' | 'medium' | 'low';
  dueTime?: string;
}

export interface ReviewQueue {
  totalCount: number;
  urgentCount: number;
  items: Array<{
    problemId: string;
    title: string;
    nextReviewDate: string;
    difficulty: 'easy' | 'medium' | 'hard';
    previousAccuracy: number;
  }>;
}

export interface ActiveProblemSet {
  id: string;
  title: string;
  completionRate: number;
  accuracyRate: number;
  lastStudied: string;
  totalProblems: number;
  completedProblems: number;
  assignedBy?: string;
  deadline?: string;
}

export interface ProgressDataPoint {
  date: string;
  studyMinutes: number;
  problemsSolved: number;
  accuracy: number;
  streakDay: number;
}

export interface UpcomingDeadline {
  type: 'problem_set' | 'assignment' | 'test';
  title: string;
  deadline: string;
  progress: number;
  urgent: boolean;
}

export interface StudentDashboardData {
  profile: StudentProfile;
  studyStreak: StudyStreak;
  statistics: StudentStatistics;
  todayTasks: TodayTask[];
  reviewQueue: ReviewQueue;
  activeProblemSets: ActiveProblemSet[];
  progressData: ProgressDataPoint[];
  upcomingDeadlines: UpcomingDeadline[];
}