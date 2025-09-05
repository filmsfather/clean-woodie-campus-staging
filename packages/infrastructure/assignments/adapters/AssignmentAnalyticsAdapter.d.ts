import { Assignment, Result } from '@woodie/domain';
import { ILogger } from '../../common/interfaces/ILogger';
import { ICacheService } from '../../common/interfaces/ICacheService';
export interface AssignmentAnalyticsData {
    assignmentId: string;
    teacherId: string;
    title: string;
    status: string;
    createdAt: Date;
    dueDate: Date;
    targetCount: number;
    targetTypes: ('class' | 'student')[];
    schoolId?: string;
    metadata: {
        maxAttempts?: number;
        estimatedCompletionTime?: number;
        difficultyLevel?: string;
        subject?: string;
        tags?: string[];
    };
}
export interface AssignmentPerformanceMetrics {
    assignmentId: string;
    completionRate: number;
    averageScore: number;
    averageTimeSpent: number;
    totalSubmissions: number;
    onTimeSubmissions: number;
    lateSubmissions: number;
    distributionByScore: {
        scoreRange: string;
        count: number;
        percentage: number;
    }[];
}
export interface TeacherAssignmentInsights {
    teacherId: string;
    period: {
        startDate: Date;
        endDate: Date;
    };
    totalAssignments: number;
    activeAssignments: number;
    completedAssignments: number;
    averageCompletionRate: number;
    mostPopularTags: string[];
    assignmentTrends: {
        date: string;
        createdCount: number;
        completedCount: number;
    }[];
}
export interface ClassAssignmentAnalytics {
    classId: string;
    assignmentId: string;
    studentPerformance: {
        studentId: string;
        studentName: string;
        status: 'not_started' | 'in_progress' | 'submitted' | 'late';
        score?: number;
        timeSpent?: number;
        submittedAt?: Date;
    }[];
    classMetrics: {
        totalStudents: number;
        submittedCount: number;
        averageScore: number;
        completionRate: number;
    };
}
export interface AnalyticsEventPayload {
    eventType: 'assignment_created' | 'assignment_activated' | 'assignment_completed' | 'assignment_overdue';
    timestamp: Date;
    assignmentData: AssignmentAnalyticsData;
    contextData?: Record<string, any>;
}
export declare class AssignmentAnalyticsAdapter {
    private logger;
    private cache?;
    private readonly CACHE_PREFIX;
    private readonly BATCH_SIZE;
    private readonly EVENT_QUEUE;
    constructor(logger: ILogger, cache?: ICacheService | undefined);
    trackAssignmentCreated(assignment: Assignment): Promise<Result<void>>;
    trackAssignmentActivated(assignment: Assignment): Promise<Result<void>>;
    trackAssignmentCompleted(assignment: Assignment, completionMetrics: any): Promise<Result<void>>;
    trackAssignmentOverdue(assignment: Assignment): Promise<Result<void>>;
    generateTeacherInsights(teacherId: string, startDate: Date, endDate: Date): Promise<Result<TeacherAssignmentInsights>>;
    generateClassAnalytics(classId: string, assignmentId: string): Promise<Result<ClassAssignmentAnalytics>>;
    generatePerformanceMetrics(assignmentId: string): Promise<Result<AssignmentPerformanceMetrics>>;
    exportTeacherData(teacherId: string, startDate: Date, endDate: Date, format?: 'csv' | 'json'): Promise<Result<string>>;
    private queueEvent;
    private startBatchProcessor;
    private processBatch;
    private sendToExternalAnalytics;
    private mapAssignmentToAnalyticsData;
    private determineTargetTypes;
    private calculateActivationDelay;
    private calculateAssignmentDuration;
    private getCompletionStatusAtOverdue;
    private convertToCSV;
    invalidateAnalyticsCache(teacherId?: string, assignmentId?: string): Promise<void>;
    getQueueStatus(): {
        queueLength: number;
        isProcessing: boolean;
    };
}
//# sourceMappingURL=AssignmentAnalyticsAdapter.d.ts.map