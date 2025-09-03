import { ReviewFeedback } from '../value-objects/ReviewFeedback';
import { ReviewState } from '../value-objects/ReviewState';
import { ISpacedRepetitionPolicy, ReviewCalculationResult } from './ISpacedRepetitionPolicy';
export declare class SpacedRepetitionCalculator implements ISpacedRepetitionPolicy {
    /**
     * 에빙하우스 망각곡선 기반 간격 반복 알고리즘
     *
     * 피드백별 처리:
     * - AGAIN: 즉시 재복습 (5분 후), 난이도 계수 감소
     * - HARD: 간격 축소 (현재 간격 × 1.2), 난이도 계수 약간 감소
     * - GOOD: 정상 진행 (현재 간격 × 난이도 계수)
     * - EASY: 간격 확대 (현재 간격 × 난이도 계수 × 1.3), 난이도 계수 증가
     */
    calculateNextInterval(currentState: ReviewState, feedback: ReviewFeedback): ReviewCalculationResult;
    /**
     * 새로운 문제 학습 시 초기 복습 상태 생성
     */
    createInitialState(baseDate: Date): ReviewState;
    /**
     * 연속 실패 시 간격 리셋 로직
     */
    shouldResetInterval(currentState: ReviewState, consecutiveFailures: number): boolean;
    /**
     * 장기 미복습 시 간격 조정
     */
    adjustForLateReview(currentState: ReviewState, currentDate: Date): ReviewCalculationResult;
}
//# sourceMappingURL=SpacedRepetitionCalculator.d.ts.map