import { httpClient } from './httpClient';

// SRS Types
export interface ReviewQueueItem {
  id: string;
  problemId: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  priority: 'low' | 'medium' | 'high';
  dueAt: Date;
  isOverdue: boolean;
  minutesUntilDue: number;
  easeFactor: number;
  interval: number;
  reviewCount: number;
  lastReview?: Date;
  tags?: string[];
}

export interface ReviewFeedback {
  feedback: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';
  responseTime?: number;
  answerContent?: any;
  metadata?: {
    questionType?: string;
    difficulty?: string;
    tags?: string[];
  };
}

export interface ReviewCompletionResult {
  scheduleId: string;
  newInterval: number;
  nextReviewAt: Date;
  newEaseFactor: number;
  previousEaseFactor: number;
  reviewCount: number;
  wasSuccessful: boolean;
}

export interface ReviewStatistics {
  totalScheduled: number;
  dueToday: number;
  overdue: number;
  completedToday: number;
  streakDays: number;
  averageRetention: number;
  totalTimeSpent: number;
  completionRate: number;
  efficiency: number;
  avgSessionTime: number;
  productivity: 'excellent' | 'good' | 'fair' | 'needs_improvement';
}

export interface StudyPatterns {
  peakHours: string[];
  sessionDuration: number;
  frequency: 'daily' | 'few_times_week' | 'weekly' | 'irregular';
  consistencyScore: number;
  preferredDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface NotificationSettings {
  enabled: boolean;
  overdueEnabled: boolean;
  reminderEnabled: boolean;
  overdueDelayMinutes: number;
  reminderAdvanceMinutes: number;
  quietHours: {
    start: string;
    end: string;
    enabled: boolean;
  };
}

export interface NotificationStatus {
  hasUnreadNotifications: boolean;
  overdueCount: number;
  upcomingCount: number;
  lastChecked: Date;
  settings: NotificationSettings;
}

// API Request/Response Types
export interface GetTodayReviewsResponse {
  reviews: ReviewQueueItem[];
  totalCount: number;
  highPriorityCount: number;
  overdueCount: number;
  upcomingCount: number;
}

export interface SubmitReviewFeedbackResponse {
  success: boolean;
  result: ReviewCompletionResult;
  nextReview?: {
    intervalDays: number;
    scheduledAt: Date;
    difficultyChange: 'easier' | 'harder' | 'same';
  };
  achievements?: {
    streakMilestone?: boolean;
    retentionImprovement?: boolean;
    speedImprovement?: boolean;
  };
}

export interface GetReviewStatisticsRequest {
  period?: 'today' | 'week' | 'month' | 'all';
  includeNotifications?: boolean;
}

export interface GetReviewStatisticsResponse {
  period: string;
  review: ReviewStatistics;
  notification?: any;
  trends?: {
    retentionTrend: 'improving' | 'stable' | 'declining';
    speedTrend: 'improving' | 'stable' | 'declining';
    consistencyScore: number;
  };
  recommendations?: string[];
}

export interface StudyPatternsAnalysisRequest {
  timeRangeInDays?: number;
  includeComparisons?: boolean;
  analysisDepth?: 'basic' | 'standard' | 'detailed';
}

export interface StudyPatternsAnalysisResponse {
  patterns: StudyPatterns;
  insights: string[];
  recommendations: string[];
  comparison?: {
    previousPeriod: StudyPatterns;
    improvement: boolean;
    changes: string[];
  };
}

export interface CreateReviewScheduleRequest {
  problemId: string;
  initialDifficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  firstReviewDelay?: number;
}

export interface CreateReviewScheduleResponse {
  scheduleId: string;
  problemId: string;
  firstReviewAt: Date;
  initialInterval: number;
  message: string;
}

export interface GetOverdueReviewsResponse {
  reviews: ReviewQueueItem[];
  totalCount: number;
  averageOverdueDays: number;
  oldestOverdueDate: Date;
}

/**
 * SRS API Service
 * Spaced Repetition System API를 위한 서비스 클래스
 */
export const srsApi = {
  // Review Management
  async getTodayReviews(): Promise<GetTodayReviewsResponse> {
    const response = await httpClient.get('/api/srs/reviews/today');
    return response.data;
  },

  async submitReviewFeedback(
    scheduleId: string, 
    feedback: ReviewFeedback
  ): Promise<SubmitReviewFeedbackResponse> {
    const response = await httpClient.post(`/api/srs/reviews/${scheduleId}/feedback`, feedback);
    return response.data;
  },

  // Statistics and Analytics
  async getReviewStatistics(
    request: GetReviewStatisticsRequest = {}
  ): Promise<GetReviewStatisticsResponse> {
    const params = new URLSearchParams();
    if (request.period) params.append('period', request.period);
    if (request.includeNotifications !== undefined) {
      params.append('includeNotifications', request.includeNotifications.toString());
    }

    const response = await httpClient.get(`/api/srs/statistics/comprehensive?${params}`);
    return response.data;
  },

  async analyzeStudyPatterns(
    request: StudyPatternsAnalysisRequest = {}
  ): Promise<StudyPatternsAnalysisResponse> {
    const params = new URLSearchParams();
    if (request.timeRangeInDays) {
      params.append('timeRangeInDays', request.timeRangeInDays.toString());
    }
    if (request.includeComparisons !== undefined) {
      params.append('includeComparisons', request.includeComparisons.toString());
    }
    if (request.analysisDepth) {
      params.append('analysisDepth', request.analysisDepth);
    }

    const response = await httpClient.get(`/api/srs/analysis/study-patterns?${params}`);
    return response.data;
  },

  async getProblemReviewPerformance(
    problemId: string,
    options: {
      includeStudents?: boolean;
      timeRangeInDays?: number;
    } = {}
  ): Promise<any> {
    const params = new URLSearchParams();
    if (options.includeStudents !== undefined) {
      params.append('includeStudents', options.includeStudents.toString());
    }
    if (options.timeRangeInDays) {
      params.append('timeRange', options.timeRangeInDays.toString());
    }

    const response = await httpClient.get(`/api/srs/problems/${problemId}/performance?${params}`);
    return response.data;
  },

  async getRetentionProbability(
    problemId?: string,
    predictionDays: number = 7
  ): Promise<any> {
    const params = new URLSearchParams();
    if (problemId) params.append('problemId', problemId);
    params.append('predictionDays', predictionDays.toString());

    const response = await httpClient.get(`/api/srs/retention-probability?${params}`);
    return response.data;
  },

  // Schedule Management
  async createReviewSchedule(
    request: CreateReviewScheduleRequest
  ): Promise<CreateReviewScheduleResponse> {
    const response = await httpClient.post('/api/srs/schedules', request);
    return response.data;
  },

  async getOverdueReviews(): Promise<GetOverdueReviewsResponse> {
    const response = await httpClient.get('/api/srs/schedules/overdue');
    return response.data;
  },

  // Notification Management
  async getNotificationStatus(): Promise<NotificationStatus> {
    const response = await httpClient.get('/api/srs/notifications/status');
    return response.data;
  },

  async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await httpClient.get('/api/srs/notifications/settings');
    return response.data;
  },

  async updateNotificationSettings(
    settings: Partial<NotificationSettings>
  ): Promise<NotificationSettings> {
    const response = await httpClient.put('/api/srs/notifications/settings', settings);
    return response.data;
  },

  async triggerOverdueNotification(): Promise<{ success: boolean; message: string }> {
    const response = await httpClient.post('/api/srs/notifications/trigger-overdue');
    return response.data;
  },

  // Study Records
  async getStudyRecords(options: {
    page?: number;
    limit?: number;
    problemId?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<any> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.problemId) params.append('problemId', options.problemId);
    if (options.startDate) params.append('startDate', options.startDate.toISOString());
    if (options.endDate) params.append('endDate', options.endDate.toISOString());

    const response = await httpClient.get(`/api/srs/study-records?${params}`);
    return response.data;
  },

  async getStudyRecordAnalytics(): Promise<any> {
    const response = await httpClient.get('/api/srs/study-records/analytics');
    return response.data;
  },

  // Admin/Teacher functions
  async getStudentReviewStats(
    studentId: string,
    options: {
      period?: 'today' | 'week' | 'month' | 'all';
      includeDetails?: boolean;
    } = {}
  ): Promise<any> {
    const params = new URLSearchParams();
    if (options.period) params.append('period', options.period);
    if (options.includeDetails !== undefined) {
      params.append('includeDetails', options.includeDetails.toString());
    }

    const response = await httpClient.get(`/api/srs/students/${studentId}/review-stats?${params}`);
    return response.data;
  }
};

// Type exports
export type {
  ReviewQueueItem,
  ReviewFeedback,
  ReviewCompletionResult,
  ReviewStatistics,
  StudyPatterns,
  NotificationSettings,
  NotificationStatus,
  GetTodayReviewsResponse,
  SubmitReviewFeedbackResponse,
  GetReviewStatisticsRequest,
  GetReviewStatisticsResponse,
  StudyPatternsAnalysisRequest,
  StudyPatternsAnalysisResponse,
  CreateReviewScheduleRequest,
  CreateReviewScheduleResponse,
  GetOverdueReviewsResponse
};