import { Result, ReviewFeedbackType } from '@woodie/domain';
import { ReviewQueueService, ReviewCompletionResult } from '../services/ReviewQueueService';
export interface SubmitReviewFeedbackRequest {
    studentId: string;
    scheduleId: string;
    feedback: ReviewFeedbackType;
    responseTime?: number;
    answerContent?: any;
    metadata?: {
        questionType?: string;
        difficulty?: string;
        tags?: string[];
    };
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
/**
 * 복습 피드백 제출 Use Case
 *
 * 비즈니스 규칙:
 * - 인증된 사용자만 자신의 복습에 피드백을 제출할 수 있음
 * - 피드백 제출 시 즉시 다음 복습 일정이 계산됨
 * - 연속 성공/실패 기록이 업데이트됨
 * - 성취도 및 마일스톤이 평가됨
 * - 복습 완료 이벤트가 발행되어 학습 기록이 생성됨
 */
export declare class SubmitReviewFeedbackUseCase {
    private reviewQueueService;
    constructor(reviewQueueService: ReviewQueueService);
    execute(request: SubmitReviewFeedbackRequest): Promise<Result<SubmitReviewFeedbackResponse>>;
    /**
     * 입력 요청 유효성 검증
     */
    private validateRequest;
    /**
     * 다음 복습 정보 계산
     */
    private calculateNextReviewInfo;
    /**
     * 성취도 평가 (간단한 로직)
     */
    private evaluateAchievements;
}
//# sourceMappingURL=SubmitReviewFeedbackUseCase.d.ts.map