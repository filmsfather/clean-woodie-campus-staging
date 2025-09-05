import { ILogger } from '@woodie/application/common/interfaces/ILogger';
import { Result } from '@woodie/domain/common/Result';
import { MetricsCollector } from './MetricsCollector';
export interface UsageEvent {
    userId: string;
    eventType: string;
    resourceType: string;
    resourceId: string;
    action: string;
    metadata: Record<string, any>;
    timestamp: Date;
    sessionId?: string;
    userRole?: string;
}
export interface ProblemUsageStats {
    problemId: string;
    teacherId: string;
    title: string;
    totalViews: number;
    totalAttempts: number;
    totalCompletions: number;
    averageScore: number;
    completionRate: number;
    averageTimeSpent: number;
    difficultyRating?: number;
    popularityScore: number;
    lastUsed: Date;
    usageByGrade: Record<string, number>;
    usageByTimeOfDay: Record<string, number>;
    commonMistakes: string[];
}
export interface TeacherUsageStats {
    teacherId: string;
    totalProblems: number;
    totalProblemSets: number;
    totalStudentAttempts: number;
    averageStudentScore: number;
    mostPopularProblem: string;
    mostDifficultProblem: string;
    teachingEffectiveness: number;
    studentEngagement: number;
    contentCreationRate: number;
    lastActive: Date;
    monthlyStats: Array<{
        month: string;
        problemsCreated: number;
        studentInteractions: number;
        averageScore: number;
    }>;
}
export interface StudentUsageStats {
    studentId: string;
    totalAttempts: number;
    totalCompletions: number;
    averageScore: number;
    totalTimeSpent: number;
    streakDays: number;
    favoriteSubjects: string[];
    strongAreas: string[];
    improvementAreas: string[];
    progressTrend: 'improving' | 'declining' | 'stable';
    lastActive: Date;
    weeklyActivity: Array<{
        week: string;
        attempts: number;
        completions: number;
        averageScore: number;
        timeSpent: number;
    }>;
}
export interface SystemUsageStats {
    totalUsers: number;
    activeUsers: {
        daily: number;
        weekly: number;
        monthly: number;
    };
    totalProblems: number;
    totalProblemSets: number;
    totalAttempts: number;
    averageSessionDuration: number;
    peakUsageHours: Array<{
        hour: number;
        userCount: number;
    }>;
    popularFeatures: Array<{
        feature: string;
        usageCount: number;
    }>;
    systemHealth: {
        uptime: number;
        averageResponseTime: number;
        errorRate: number;
    };
}
export declare class UsageStatisticsService {
    private readonly logger;
    private readonly metricsCollector;
    private readonly usageEvents;
    private readonly retentionPeriodMs;
    constructor(logger: ILogger, metricsCollector: MetricsCollector, retentionPeriodMs?: number);
    recordUsageEvent(event: Omit<UsageEvent, 'timestamp'>): void;
    getProblemUsageStats(problemId?: string, fromDate?: Date, toDate?: Date): Promise<Result<ProblemUsageStats[]>>;
    getTeacherUsageStats(teacherId?: string, fromDate?: Date, toDate?: Date): Promise<Result<TeacherUsageStats[]>>;
    getStudentUsageStats(studentId?: string, fromDate?: Date, toDate?: Date): Promise<Result<StudentUsageStats[]>>;
    getSystemUsageStats(fromDate?: Date, toDate?: Date): Promise<Result<SystemUsageStats>>;
    trackUserActivity(userId: string, activity: string, metadata?: Record<string, any>): void;
    recordPerformanceMetric(operationType: string, durationMs: number, success: boolean, metadata?: Record<string, any>): void;
    private getFilteredEvents;
    private calculatePopularityScore;
    private calculateDifficultyRating;
    private calculateMonthlyStats;
    private calculateTeachingEffectiveness;
    private calculateStudentEngagement;
    private calculateContentCreationRate;
    private calculateWeeklyActivity;
    private calculateStreakDays;
    private calculateFavoriteSubjects;
    private calculateStrongAreas;
    private calculateImprovementAreas;
    private calculateProgressTrend;
    private getUniqueUsersByPeriod;
    private calculateSessionDurations;
    private calculatePeakUsageHours;
    private calculatePopularFeatures;
    private getSystemHealth;
    private getCurrentActiveUsers;
    private startEventProcessingTimer;
}
//# sourceMappingURL=UsageStatisticsService.d.ts.map