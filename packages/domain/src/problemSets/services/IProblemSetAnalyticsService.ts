import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';

// 문제 사용 빈도 통계
export interface ProblemUsageStatistic {
  problemId: string;
  usageCount: number;
  percentage: number;
}

// 문제집 크기 분포
export interface ProblemSetSizeDistribution {
  itemCount: number;
  problemSetCount: number;
  percentage: number;
}

// 활동 통계
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

// 전체 통계 정보
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

// 문제집 사용 보고서
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

// 문제 중복 분석 결과
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
  
  // === 기본 통계 ===
  
  // 교사의 전체 문제집 통계
  getTeacherStatistics(teacherId: string): Promise<Result<ProblemSetStatistics>>;
  
  // 문제 사용 빈도 분석
  analyzeProblemUsage(
    teacherId: string,
    limit?: number
  ): Promise<Result<ProblemUsageStatistic[]>>;
  
  // 문제집 크기 분포 분석
  analyzeProblemSetSizes(teacherId: string): Promise<Result<ProblemSetSizeDistribution[]>>;
  
  // === 활동 분석 ===
  
  // 활동 패턴 분석
  analyzeActivity(
    teacherId: string,
    periodDays?: number
  ): Promise<Result<ProblemSetActivityStatistics>>;
  
  // 사용률이 낮은 문제집 찾기
  findUnderutilizedProblemSets(
    teacherId: string,
    thresholdDays?: number
  ): Promise<Result<Array<{ problemSetId: string; lastUsed: Date }>>>;
  
  // === 최적화 분석 ===
  
  // 문제 중복 분석
  analyzeProblemDuplication(teacherId: string): Promise<Result<ProblemDuplicationAnalysis>>;
  
  // 빈 문제집 분석
  analyzeEmptyProblemSets(teacherId: string): Promise<Result<string[]>>;
  
  // 비대한 문제집 분석 (너무 많은 문제가 포함된 문제집)
  analyzeOversizedProblemSets(
    teacherId: string,
    sizeThreshold?: number
  ): Promise<Result<Array<{ problemSetId: string; itemCount: number }>>>;
  
  // === 종합 보고서 ===
  
  // 사용 현황 종합 보고서 생성
  generateUsageReport(teacherId: string): Promise<Result<ProblemSetUsageReport>>;
  
  // 특정 기간 사용 보고서 생성
  generatePeriodReport(
    teacherId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<Result<ProblemSetUsageReport>>;
  
  // === 비교 분석 ===
  
  // 문제집 간 유사도 분석 (공통 문제 비율)
  analyzeProblemSetSimilarity(
    problemSetId1: UniqueEntityID,
    problemSetId2: UniqueEntityID
  ): Promise<Result<{
    similarityPercentage: number;
    commonProblems: string[];
    uniqueToFirst: string[];
    uniqueToSecond: string[];
  }>>;
  
  // 교사별 사용 패턴 비교 (익명화된 통계)
  compareWithAverages(
    teacherId: string
  ): Promise<Result<{
    teacherStats: ProblemSetStatistics;
    platformAverages: ProblemSetStatistics;
    comparison: {
      aboveAverage: string[];
      belowAverage: string[];
    };
  }>>;
}