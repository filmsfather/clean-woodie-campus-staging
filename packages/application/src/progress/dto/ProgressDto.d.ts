/**
 * 진도 추적 관련 DTO 정의
 */
export interface StudyStreakDto {
    id: string;
    studentId: string;
    currentStreak: number;
    longestStreak: number;
    lastStudyDate: Date;
    isActive: boolean;
    isAtRisk: boolean;
    isPersonalRecord: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface StatisticsDto {
    id: string;
    studentId: string;
    problemSetId: string;
    totalProblems: number;
    completedProblems: number;
    correctAnswers: number;
    completionRate: number;
    accuracyRate: number;
    overallAccuracyRate: number;
    totalTimeSpent: number;
    averageResponseTime: number;
    averageResponseTimeInSeconds: number;
    totalTimeInMinutes: number;
    isCompleted: boolean;
    progressStatus: 'not_started' | 'in_progress' | 'completed';
    performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    efficiencyScore: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface StudentProgressDto {
    studentId: string;
    studyStreak: StudyStreakDto | null;
    statistics: StatisticsDto[];
    overallMetrics: {
        totalProblemSets: number;
        completedProblemSets: number;
        averageCompletionRate: number;
        averageAccuracyRate: number;
        totalStudyTime: number;
        totalStudyTimeInMinutes: number;
        efficiencyScore: number;
    };
}
export interface ClassProgressDto {
    classId: string;
    className?: string;
    teacherId: string;
    streaks: StudyStreakDto[];
    statistics: StatisticsDto[];
    classMetrics: {
        totalStudents: number;
        activeStreakCount: number;
        averageCurrentStreak: number;
        averageCompletionRate: number;
        averageAccuracyRate: number;
        studentsWithStreak: number;
        studiedToday: number;
        atRiskStudents: number;
    };
}
export interface UpdateProgressRequest {
    studentId: string;
    problemId: string;
    problemSetId: string;
    isCorrect: boolean;
    responseTime: number;
    totalProblemsInSet: number;
    studyDate?: Date;
}
export interface UpdateProgressResponse {
    success: boolean;
    streakUpdated: {
        previousStreak: number;
        currentStreak: number;
        isNewRecord: boolean;
        achievedMilestone?: number;
        streakStatus: 'continued' | 'started' | 'broken';
    };
    statisticsUpdated: {
        previousCompletionRate: number;
        currentCompletionRate: number;
        previousAccuracyRate: number;
        currentAccuracyRate: number;
        isCompleted: boolean;
        wasJustCompleted: boolean;
        performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
        efficiencyScore: number;
    };
}
export interface StreakRankingDto {
    rankings: Array<{
        rank: number;
        studentId: string;
        studentName?: string;
        studentEmail?: string;
        currentStreak: number;
        longestStreak: number;
        lastStudyDate: Date;
        isActive: boolean;
    }>;
    myRanking?: {
        rank: number;
        currentStreak: number;
        longestStreak: number;
    };
}
export interface ProblemSetStatsSummaryDto {
    problemSetId: string;
    problemSetTitle?: string;
    teacherId: string;
    totalStudents: number;
    averageCompletionRate: number;
    averageAccuracyRate: number;
    averageResponseTime: number;
    completedStudentCount: number;
    topPerformers: Array<{
        studentId: string;
        studentName?: string;
        completionRate: number;
        accuracyRate: number;
        efficiencyScore: number;
    }>;
}
export interface StudentDashboardDto {
    student: {
        id: string;
        name?: string;
        email?: string;
    };
    progress: StudentProgressDto;
    recentActivity: Array<{
        date: Date;
        problemSetsWorkedOn: number;
        problemsCompleted: number;
        correctAnswers: number;
        timeSpent: number;
    }>;
    achievements: {
        streakMilestones: number[];
        completedSets: number;
        perfectScores: number;
        totalProblemsCompleted: number;
    };
    recommendations: Array<{
        type: 'continue_streak' | 'review_weak_areas' | 'complete_pending' | 'improve_speed';
        title: string;
        description: string;
        actionUrl?: string;
    }>;
}
export interface TeacherDashboardDto {
    teacher: {
        id: string;
        name?: string;
        email?: string;
    };
    classes: Array<{
        classId: string;
        className: string;
        progress: ClassProgressDto;
    }>;
    overallMetrics: {
        totalStudents: number;
        totalProblemSets: number;
        activeStreaks: number;
        averageClassCompletion: number;
        studentsNeedingAttention: Array<{
            studentId: string;
            studentName?: string;
            issues: Array<'low_completion' | 'poor_accuracy' | 'inactive' | 'streak_at_risk'>;
            lastActivity: Date;
        }>;
    };
    insights: Array<{
        type: 'high_performer' | 'needs_help' | 'engagement_drop' | 'milestone_achieved';
        studentId: string;
        studentName?: string;
        description: string;
        suggestion?: string;
    }>;
}
//# sourceMappingURL=ProgressDto.d.ts.map