import { Result } from '@woodie/domain';
import { IReviewScheduleRepository, IStudyRecordRepository } from '@woodie/domain';
export interface AssessDifficultyLevelRequest {
    studentId: string;
    problemId?: string;
    includeRecommendations?: boolean;
}
export interface DifficultyAssessmentItem {
    scheduleId: string;
    problemId: string;
    currentLevel: 'beginner' | 'intermediate' | 'advanced';
    easeFactor: number;
    reviewCount: number;
    consecutiveFailures: number;
    averagePerformanceScore?: number;
    lastReviewPattern?: string;
    suggestedAction: 'continue' | 'increase_frequency' | 'review_fundamentals' | 'consider_advanced';
}
export interface AssessDifficultyLevelResponse {
    studentId: string;
    assessmentDate: Date;
    items: DifficultyAssessmentItem[];
    overallSummary: {
        beginnerCount: number;
        intermediateCount: number;
        advancedCount: number;
        averageEaseFactor: number;
        strugglingItems: number;
    };
    recommendations?: {
        priorityItems: string[];
        studyStrategy: string[];
        nextSteps: string[];
    };
}
/**
 * 난이도 수준 평가 Use Case
 *
 * 비즈니스 규칙:
 * - EaseFactor와 학습 기록을 종합하여 난이도 평가
 * - 개별 문제별 맞춤형 학습 전략 제안
 * - 학습자의 전반적인 수준과 취약점 분석
 * - 다음 학습 단계 추천
 */
export declare class AssessDifficultyLevelUseCase {
    private reviewScheduleRepository;
    private studyRecordRepository;
    constructor(reviewScheduleRepository: IReviewScheduleRepository, studyRecordRepository: IStudyRecordRepository);
    execute(request: AssessDifficultyLevelRequest): Promise<Result<AssessDifficultyLevelResponse>>;
    /**
     * 입력 요청 유효성 검증
     */
    private validateRequest;
    /**
     * 추천 액션 결정
     */
    private determineSuggestedAction;
    /**
     * 전체 요약 계산
     */
    private calculateOverallSummary;
    /**
     * 추천사항 생성
     */
    private generateRecommendations;
}
//# sourceMappingURL=AssessDifficultyLevelUseCase.d.ts.map