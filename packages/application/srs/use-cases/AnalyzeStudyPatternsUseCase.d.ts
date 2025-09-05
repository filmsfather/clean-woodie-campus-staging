import { Result } from '@woodie/domain';
import { IStudyRecordRepository } from '@woodie/domain';
export interface AnalyzeStudyPatternsRequest {
    studentId: string;
    problemId?: string;
    timeRangeInDays?: number;
}
export interface StudyPatternAnalysis {
    pattern: 'quick_correct' | 'slow_correct' | 'quick_incorrect' | 'slow_incorrect';
    count: number;
    percentage: number;
    averageResponseTime?: number;
    averagePerformanceScore: number;
}
export interface AnalyzeStudyPatternsResponse {
    studentId: string;
    problemId?: string;
    analysisDate: Date;
    timeRangeDays: number;
    totalSessions: number;
    patterns: StudyPatternAnalysis[];
    insights: {
        dominantPattern: string;
        strengths: string[];
        weaknesses: string[];
        recommendations: string[];
    };
    performance: {
        overallAccuracy: number;
        averageSpeed: number;
        improvementTrend: 'improving' | 'stable' | 'declining';
        consistencyScore: number;
    };
}
/**
 * 학습 패턴 분석 Use Case
 *
 * 비즈니스 규칙:
 * - 학생의 학습 기록을 기반으로 패턴을 분석함
 * - 시간 범위를 지정하여 분석 기간 설정
 * - 강점과 약점을 식별하고 개선 제안 제공
 * - 성과 트렌드 분석 포함
 */
export declare class AnalyzeStudyPatternsUseCase {
    private studyRecordRepository;
    constructor(studyRecordRepository: IStudyRecordRepository);
    execute(request: AnalyzeStudyPatternsRequest): Promise<Result<AnalyzeStudyPatternsResponse>>;
    /**
     * 입력 요청 유효성 검증
     */
    private validateRequest;
    /**
     * 학습 패턴 분석
     */
    private analyzePatterns;
    /**
     * 인사이트 생성
     */
    private generateInsights;
    /**
     * 성과 분석
     */
    private analyzePerformance;
}
//# sourceMappingURL=AnalyzeStudyPatternsUseCase.d.ts.map