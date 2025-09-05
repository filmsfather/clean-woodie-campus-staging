import { SpacedRepetitionCalculator, ReviewState } from '@woodie/domain';
/**
 * Infrastructure 레이어의 Spaced Repetition Policy 서비스
 * Domain의 SpacedRepetitionCalculator를 래핑하여 Infrastructure 관심사를 처리
 */
export class SpacedRepetitionPolicyService {
    calculator;
    constructor() {
        this.calculator = new SpacedRepetitionCalculator();
    }
    /**
     * 피드백에 따른 다음 복습 간격과 난이도 계수 계산
     */
    calculateNextInterval(currentState, feedback) {
        return this.calculator.calculateNextInterval(currentState, feedback);
    }
    /**
     * 새로운 문제 학습 시 초기 복습 상태 생성
     */
    createInitialState(baseDate) {
        return this.calculator.createInitialState(baseDate);
    }
    /**
     * 연속 실패 시 간격 리셋 여부 결정
     */
    shouldResetInterval(currentState, consecutiveFailures) {
        return this.calculator.shouldResetInterval(currentState, consecutiveFailures);
    }
    /**
     * 늦은 복습에 대한 페널티 조정
     */
    adjustForLateReview(currentState, currentDate) {
        return this.calculator.adjustForLateReview(currentState, currentDate);
    }
    /**
     * 정책 설정 변경 (향후 확장을 위한 메서드)
     */
    updatePolicy(settings) {
        // 현재는 기본 정책을 사용하지만, 향후 동적 설정 변경을 위한 확장점
        console.log('Policy update requested:', settings);
        // TODO: 향후 동적 정책 변경 기능 구현 시 활용
    }
    /**
     * 현재 사용중인 정책 정보 반환
     */
    getPolicyInfo() {
        return {
            name: 'SM-2 Based Spaced Repetition',
            version: '1.0.0',
            settings: {
                algorithm: 'Modified SM-2',
                maxIntervalDays: 365,
                resetThreshold: 3,
                easeFactorRange: { min: 1.3, max: 2.5 },
                multipliers: {
                    hard: 1.2,
                    easy: 1.3
                }
            }
        };
    }
}
/**
 * 테스트용 Mock Policy (테스트 환경에서 사용)
 */
export class MockSpacedRepetitionPolicyService {
    calculateNextInterval(currentState, feedback) {
        // 테스트용 간단한 로직
        return {
            newInterval: currentState.interval,
            newEaseFactor: currentState.easeFactor
        };
    }
    createInitialState(baseDate) {
        return ReviewState.initial(baseDate);
    }
    shouldResetInterval(currentState, consecutiveFailures) {
        return consecutiveFailures >= 3;
    }
    adjustForLateReview(currentState, currentDate) {
        return {
            newInterval: currentState.interval,
            newEaseFactor: currentState.easeFactor
        };
    }
}
//# sourceMappingURL=SpacedRepetitionPolicyService.js.map