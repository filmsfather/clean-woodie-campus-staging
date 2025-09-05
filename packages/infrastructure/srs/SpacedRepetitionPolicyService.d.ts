import { ISpacedRepetitionPolicy, ReviewCalculationResult, ReviewState, ReviewFeedback } from '@woodie/domain';
/**
 * Infrastructure 레이어의 Spaced Repetition Policy 서비스
 * Domain의 SpacedRepetitionCalculator를 래핑하여 Infrastructure 관심사를 처리
 */
export declare class SpacedRepetitionPolicyService implements ISpacedRepetitionPolicy {
    private calculator;
    constructor();
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
    /**
     * 정책 설정 변경 (향후 확장을 위한 메서드)
     */
    updatePolicy(settings: {
        maxInterval?: number;
        easeFactorRange?: {
            min: number;
            max: number;
        };
        multipliers?: {
            hard?: number;
            easy?: number;
        };
    }): void;
    /**
     * 현재 사용중인 정책 정보 반환
     */
    getPolicyInfo(): {
        name: string;
        version: string;
        settings: any;
    };
}
/**
 * 테스트용 Mock Policy (테스트 환경에서 사용)
 */
export declare class MockSpacedRepetitionPolicyService implements ISpacedRepetitionPolicy {
    calculateNextInterval(currentState: ReviewState, feedback: ReviewFeedback): ReviewCalculationResult;
    createInitialState(baseDate: Date): ReviewState;
    shouldResetInterval(currentState: ReviewState, consecutiveFailures: number): boolean;
    adjustForLateReview(currentState: ReviewState, currentDate: Date): ReviewCalculationResult;
}
//# sourceMappingURL=SpacedRepetitionPolicyService.d.ts.map