import { ReviewFeedback } from '../value-objects/ReviewFeedback';
import { ReviewState } from '../value-objects/ReviewState';
import { ReviewInterval } from '../value-objects/ReviewInterval';
import { EaseFactor } from '../value-objects/EaseFactor';
export interface ReviewCalculationResult {
    newInterval: ReviewInterval;
    newEaseFactor: EaseFactor;
}
export interface ISpacedRepetitionPolicy {
    /**
     * 피드백에 따른 다음 복습 간격과 난이도 계수 계산
     */
    calculateNextInterval(currentState: ReviewState, feedback: ReviewFeedback): ReviewCalculationResult;
    /**
     * 새로운 문제 학습 시 초기 복습 상태 생성
     */
    createInitialState(baseDate: Date): ReviewState;
    /**
     * 연속 실패 시 간격 리셋 여부 결정
     */
    shouldResetInterval(currentState: ReviewState, consecutiveFailures: number): boolean;
    /**
     * 늦은 복습에 대한 페널티 조정
     */
    adjustForLateReview(currentState: ReviewState, currentDate: Date): ReviewCalculationResult;
}
//# sourceMappingURL=ISpacedRepetitionPolicy.d.ts.map