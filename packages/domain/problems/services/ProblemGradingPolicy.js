import { ProblemType } from '../value-objects/ProblemType';
// 정책/서비스 분리 - 채점 정책을 별도 서비스로 관리
export class ProblemGradingPolicy {
    // 수동 채점이 필요한 문제 유형들
    static MANUAL_GRADING_TYPES = new Set([
        ProblemType.TYPES.LONG_ANSWER
    ]);
    // 자동 채점이 가능한 문제 유형들
    static AUTO_GRADING_TYPES = new Set([
        ProblemType.TYPES.MULTIPLE_CHOICE,
        ProblemType.TYPES.SHORT_ANSWER,
        ProblemType.TYPES.TRUE_FALSE,
        ProblemType.TYPES.MATCHING,
        ProblemType.TYPES.FILL_BLANK,
        ProblemType.TYPES.ORDERING
    ]);
    // 부분 점수를 지원하는 문제 유형들
    static PARTIAL_SCORING_TYPES = new Set([
        ProblemType.TYPES.MATCHING,
        ProblemType.TYPES.FILL_BLANK,
        ProblemType.TYPES.ORDERING
    ]);
    /**
     * 수동 채점이 필요한지 확인
     */
    static requiresManualGrading(problemType) {
        return this.MANUAL_GRADING_TYPES.has(problemType.value);
    }
    /**
     * 자동 채점이 가능한지 확인
     */
    static supportsAutoGrading(problemType) {
        return this.AUTO_GRADING_TYPES.has(problemType.value);
    }
    /**
     * 부분 점수를 지원하는지 확인
     */
    static supportsPartialScoring(problemType) {
        return this.PARTIAL_SCORING_TYPES.has(problemType.value);
    }
    /**
     * 즉시 피드백이 가능한지 확인
     */
    static supportsImmediateFeedback(problemType) {
        return this.supportsAutoGrading(problemType);
    }
    /**
     * 문제 유형별 최대 점수 제한 확인
     */
    static getMaxScoreLimit(problemType) {
        // 대부분 문제는 점수 제한이 없지만, 필요시 확장 가능
        return null;
    }
    /**
     * 문제 유형별 최소 선택지 수 확인
     */
    static getMinimumChoices(problemType) {
        switch (problemType.value) {
            case ProblemType.TYPES.MULTIPLE_CHOICE:
                return 2;
            case ProblemType.TYPES.TRUE_FALSE:
                return 2;
            case ProblemType.TYPES.MATCHING:
                return 2;
            default:
                return null;
        }
    }
    /**
     * 문제 유형별 권장 선택지 수
     */
    static getRecommendedChoices(problemType) {
        switch (problemType.value) {
            case ProblemType.TYPES.MULTIPLE_CHOICE:
                return 4;
            case ProblemType.TYPES.TRUE_FALSE:
                return 2;
            case ProblemType.TYPES.MATCHING:
                return 4;
            default:
                return null;
        }
    }
    /**
     * 답안 형태 검증이 필요한지 확인
     */
    static requiresAnswerValidation(problemType) {
        return this.supportsAutoGrading(problemType);
    }
    /**
     * 시간 제한 적용이 권장되는지 확인
     */
    static recommendsTimeLimit(problemType) {
        switch (problemType.value) {
            case ProblemType.TYPES.LONG_ANSWER:
                return true; // 서술형은 시간 제한 권장
            default:
                return false;
        }
    }
}
//# sourceMappingURL=ProblemGradingPolicy.js.map