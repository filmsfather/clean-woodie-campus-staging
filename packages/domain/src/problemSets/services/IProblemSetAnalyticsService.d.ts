import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';
export interface ProblemUsageStatistic {
    problemId: string;
    usageCount: number;
    percentage: number;
}
export interface ProblemSetSizeDistribution {
    itemCount: number;
    problemSetCount: number;
    percentage: number;
}
export interface ProblemSetActivityStatistics {
    createdThisWeek: number;
    createdThisMonth: number;
    createdThisYear: number;
    updatedThisWeek: number;
    updatedThisMonth: number;
    mostActiveDay: {
        date: Date;
        activityCount: number;
    };
}
export interface ProblemSetStatistics {
    totalProblemSets: number;
    totalItems: number;
    averageItemsPerSet: number;
    emptyProblemSetsCount: number;
    largestProblemSetSize: number;
    smallestProblemSetSize: number;
    mostUsedProblems: ProblemUsageStatistic[];
    sizeDistribution: ProblemSetSizeDistribution[];
    activity: ProblemSetActivityStatistics;
}
export interface ProblemSetUsageReport {
    teacherId: string;
    reportDate: Date;
    statistics: ProblemSetStatistics;
    insights: {
        underutilizedProblems: string[];
        oversizedProblemSets: string[];
        emptyProblemSets: string[];
        recommendations: string[];
    };
}
export interface ProblemDuplicationAnalysis {
    duplicatedProblems: Array<{
        problemId: string;
        problemSetIds: string[];
        duplicationCount: number;
    }>;
    totalDuplicatedProblems: number;
    duplicationPercentage: number;
}
/**
 * ProblemSet 분석 도메인 서비스
 * 문제집 관련 통계, 분석, 인사이트 생성을 담당
 */
export interface IProblemSetAnalyticsService {
    getTeacherStatistics(teacherId: string): Promise<Result<ProblemSetStatistics>>;
    analyzeProblemUsage(teacherId: string, limit?: number): Promise<Result<ProblemUsageStatistic[]>>;
    analyzeProblemSetSizes(teacherId: string): Promise<Result<ProblemSetSizeDistribution[]>>;
    analyzeActivity(teacherId: string, periodDays?: number): Promise<Result<ProblemSetActivityStatistics>>;
    findUnderutilizedProblemSets(teacherId: string, thresholdDays?: number): Promise<Result<Array<{
        problemSetId: string;
        lastUsed: Date;
    }>>>;
    analyzeProblemDuplication(teacherId: string): Promise<Result<ProblemDuplicationAnalysis>>;
    analyzeEmptyProblemSets(teacherId: string): Promise<Result<string[]>>;
    analyzeOversizedProblemSets(teacherId: string, sizeThreshold?: number): Promise<Result<Array<{
        problemSetId: string;
        itemCount: number;
    }>>>;
    generateUsageReport(teacherId: string): Promise<Result<ProblemSetUsageReport>>;
    generatePeriodReport(teacherId: string, fromDate: Date, toDate: Date): Promise<Result<ProblemSetUsageReport>>;
    analyzeProblemSetSimilarity(problemSetId1: UniqueEntityID, problemSetId2: UniqueEntityID): Promise<Result<{
        similarityPercentage: number;
        commonProblems: string[];
        uniqueToFirst: string[];
        uniqueToSecond: string[];
    }>>;
    compareWithAverages(teacherId: string): Promise<Result<{
        teacherStats: ProblemSetStatistics;
        platformAverages: ProblemSetStatistics;
        comparison: {
            aboveAverage: string[];
            belowAverage: string[];
        };
    }>>;
}
//# sourceMappingURL=IProblemSetAnalyticsService.d.ts.map