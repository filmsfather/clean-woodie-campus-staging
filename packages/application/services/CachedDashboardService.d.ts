/**
 * 캐싱이 적용된 대시보드 서비스
 * 애플리케이션 레이어에서 캐싱 전략을 구현
 * 도메인 서비스와 인프라 캐시 서비스를 조합
 */
import { Result } from '@woodie/domain';
import { ILogger } from '../common/interfaces/ILogger';
import { ICacheService } from '../infrastructure/interfaces/ICacheService';
export interface StudentDashboardDto {
    studentId: string;
    todayTasks: Array<{
        problemId: string;
        title: string;
        difficulty: string;
        estimatedTime: number;
    }>;
    reviewCount: number;
    currentStreak: number;
    longestStreak: number;
    progressData: Array<{
        date: string;
        problemsSolved: number;
        timeSpent: number;
    }>;
    upcomingDeadlines: Array<{
        title: string;
        dueDate: string;
        type: 'assignment' | 'review';
    }>;
    lastUpdated: string;
}
export interface TeacherDashboardDto {
    teacherId: string;
    totalStudents: number;
    activeStudents: number;
    totalProblems: number;
    recentActivity: Array<{
        studentName: string;
        action: string;
        timestamp: string;
    }>;
    problemSetStats: Array<{
        title: string;
        completionRate: number;
        averageScore: number;
    }>;
    lastUpdated: string;
}
export interface StudentStatisticsDto {
    studentId: string;
    period: 'day' | 'week' | 'month';
    problemsAttempted: number;
    problemsSolved: number;
    totalTimeSpent: number;
    averageAccuracy: number;
    streakData: {
        current: number;
        longest: number;
        weeklyData: number[];
    };
    difficultyBreakdown: {
        easy: {
            attempted: number;
            solved: number;
        };
        medium: {
            attempted: number;
            solved: number;
        };
        hard: {
            attempted: number;
            solved: number;
        };
    };
}
/**
 * 학생 대시보드 캐싱 서비스
 */
export declare class CachedStudentDashboardService {
    private cacheService;
    private logger;
    constructor(cacheService: ICacheService, logger: ILogger);
    /**
     * 학생 대시보드 데이터 조회 (캐시 우선)
     */
    getStudentDashboard(studentId: string, forceRefresh?: boolean): Promise<Result<StudentDashboardDto>>;
    /**
     * 학생 대시보드 데이터 캐싱
     */
    cacheStudentDashboard(dashboard: StudentDashboardDto, ttlSeconds?: number): Promise<boolean>;
    /**
     * 학생 대시보드 캐시 무효화
     */
    invalidateStudentDashboard(studentId: string): Promise<boolean>;
}
/**
 * 교사 대시보드 캐싱 서비스
 */
export declare class CachedTeacherDashboardService {
    private cacheService;
    private logger;
    constructor(cacheService: ICacheService, logger: ILogger);
    /**
     * 교사 대시보드 데이터 조회 (캐시 우선)
     */
    getTeacherDashboard(teacherId: string, forceRefresh?: boolean): Promise<Result<TeacherDashboardDto>>;
    /**
     * 교사 대시보드 데이터 캐싱
     */
    cacheTeacherDashboard(dashboard: TeacherDashboardDto, ttlSeconds?: number): Promise<boolean>;
    /**
     * 교사 대시보드 캐시 무효화
     */
    invalidateTeacherDashboard(teacherId: string): Promise<boolean>;
}
/**
 * 통계 데이터 캐싱 서비스
 */
export declare class CachedStatisticsService {
    private cacheService;
    private logger;
    constructor(cacheService: ICacheService, logger: ILogger);
    /**
     * 학생 통계 데이터 조회 (캐시 우선)
     */
    getStudentStatistics(studentId: string, period: 'day' | 'week' | 'month', forceRefresh?: boolean): Promise<Result<StudentStatisticsDto>>;
    /**
     * 학생 통계 데이터 캐싱
     */
    cacheStudentStatistics(statistics: StudentStatisticsDto, ttlSeconds?: number): Promise<boolean>;
    /**
     * 학생 통계 캐시 무효화 (모든 기간)
     */
    invalidateStudentStatistics(studentId: string): Promise<number>;
}
//# sourceMappingURL=CachedDashboardService.d.ts.map