import { ILogger } from '@woodie/application/common/interfaces/ILogger';
import { Result } from '@woodie/domain/common/Result';
export interface AnalyticsEvent {
    eventName: string;
    userId?: string;
    sessionId?: string;
    properties: Record<string, any>;
    timestamp: Date;
    context: {
        userAgent?: string;
        ipAddress?: string;
        referrer?: string;
        page?: string;
        platform?: string;
        version?: string;
    };
}
export interface UserProfile {
    userId: string;
    traits: Record<string, any>;
    createdAt: Date;
    lastSeenAt: Date;
}
export interface AnalyticsConfig {
    provider: 'mixpanel' | 'google_analytics' | 'amplitude' | 'segment' | 'custom';
    apiKey: string;
    projectId?: string;
    enableDebugMode?: boolean;
    batchSize?: number;
    flushIntervalMs?: number;
    enableUserTracking?: boolean;
    enableAutoCapture?: boolean;
    apiEndpoint?: string;
}
export interface AnalyticsQuery {
    eventName?: string;
    userId?: string;
    properties?: Record<string, any>;
    fromDate: Date;
    toDate: Date;
    groupBy?: string[];
    aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'unique';
    limit?: number;
}
export interface AnalyticsResult {
    data: Array<{
        dimensions: Record<string, string>;
        metrics: Record<string, number>;
        timestamp?: Date;
    }>;
    totalCount: number;
    period: {
        start: Date;
        end: Date;
    };
}
export interface FunnelStep {
    eventName: string;
    properties?: Record<string, any>;
    stepName: string;
}
export interface FunnelResult {
    steps: Array<{
        stepName: string;
        userCount: number;
        conversionRate: number;
        dropoffRate: number;
    }>;
    totalUsers: number;
    overallConversionRate: number;
}
export interface CohortAnalysis {
    cohortPeriod: 'daily' | 'weekly' | 'monthly';
    retentionPeriods: number[];
    cohorts: Array<{
        cohortName: string;
        cohortStart: Date;
        userCount: number;
        retentionRates: number[];
    }>;
}
export declare abstract class AnalyticsService {
    protected readonly logger: ILogger;
    protected readonly config: AnalyticsConfig;
    protected readonly eventBuffer: AnalyticsEvent[];
    protected flushTimer?: NodeJS.Timeout;
    constructor(logger: ILogger, config: AnalyticsConfig);
    abstract track(eventName: string, properties: Record<string, any>, context?: Partial<AnalyticsEvent['context']>): Promise<Result<void>>;
    abstract identify(userId: string, traits: Record<string, any>): Promise<Result<void>>;
    abstract page(userId: string, pageName: string, properties: Record<string, any>): Promise<Result<void>>;
    abstract flush(): Promise<Result<void>>;
    abstract query(query: AnalyticsQuery): Promise<Result<AnalyticsResult>>;
    abstract analyzeFunnel(steps: FunnelStep[], fromDate: Date, toDate: Date, userSegment?: Record<string, any>): Promise<Result<FunnelResult>>;
    abstract analyzeCohort(cohortPeriod: 'daily' | 'weekly' | 'monthly', retentionEvent: string, fromDate: Date, toDate: Date): Promise<Result<CohortAnalysis>>;
    trackLearningProgress(studentId: string, courseId: string, lessonId: string, progressPercentage: number, timeSpent: number, context?: Record<string, any>): Promise<Result<void>>;
    trackProblemAttempt(studentId: string, problemId: string, attempt: {
        isCorrect: boolean;
        timeSpent: number;
        attempts: number;
        score?: number;
        difficulty: string;
        subject: string;
    }, context?: Record<string, any>): Promise<Result<void>>;
    trackTeacherActivity(teacherId: string, activity: string, details: Record<string, any>, context?: Record<string, any>): Promise<Result<void>>;
    startLearningSession(studentId: string, sessionData: {
        courseId?: string;
        lessonId?: string;
        studyMode: string;
        deviceType: string;
    }): Promise<Result<void>>;
    endLearningSession(studentId: string, sessionId: string, sessionSummary: {
        duration: number;
        problemsSolved: number;
        correctAnswers: number;
        completedLessons: number;
    }): Promise<Result<void>>;
    analyzeLearningPerformance(studentId: string, fromDate: Date, toDate: Date): Promise<Result<{
        totalStudyTime: number;
        problemsSolved: number;
        accuracyRate: number;
        strongSubjects: string[];
        weakSubjects: string[];
        progressTrend: 'improving' | 'declining' | 'stable';
    }>>;
    analyzeTeacherDashboard(teacherId: string, fromDate: Date, toDate: Date): Promise<Result<{
        studentsCount: number;
        problemsCreated: number;
        averageStudentProgress: number;
        classEngagement: number;
        topPerformingStudents: Array<{
            studentId: string;
            score: number;
        }>;
        strugglingStudents: Array<{
            studentId: string;
            score: number;
        }>;
    }>>;
    analyzeSystemUsage(fromDate: Date, toDate: Date): Promise<Result<{
        dailyActiveUsers: Array<{
            date: string;
            count: number;
        }>;
        featureUsage: Array<{
            feature: string;
            usage: number;
        }>;
        peakHours: Array<{
            hour: number;
            userCount: number;
        }>;
        deviceBreakdown: Record<string, number>;
        platformMetrics: {
            totalSessions: number;
            averageSessionDuration: number;
            bounceRate: number;
        };
    }>>;
    protected addToBuffer(event: AnalyticsEvent): void;
    private startFlushTimer;
    private calculateAccuracyRate;
    private analyzeSubjectPerformance;
    private calculateProgressTrend;
    private calculateClassEngagement;
    private categorizeStudents;
    cleanup(): void;
}
//# sourceMappingURL=AnalyticsService.d.ts.map