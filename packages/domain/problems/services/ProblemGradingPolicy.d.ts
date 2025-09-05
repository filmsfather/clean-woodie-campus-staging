import { ProblemType } from '../value-objects/ProblemType';
export declare class ProblemGradingPolicy {
    private static readonly MANUAL_GRADING_TYPES;
    private static readonly AUTO_GRADING_TYPES;
    private static readonly PARTIAL_SCORING_TYPES;
    /**
     * 수동 채점이 필요한지 확인
     */
    static requiresManualGrading(problemType: ProblemType): boolean;
    /**
     * 자동 채점이 가능한지 확인
     */
    static supportsAutoGrading(problemType: ProblemType): boolean;
    /**
     * 부분 점수를 지원하는지 확인
     */
    static supportsPartialScoring(problemType: ProblemType): boolean;
    /**
     * 즉시 피드백이 가능한지 확인
     */
    static supportsImmediateFeedback(problemType: ProblemType): boolean;
    /**
     * 문제 유형별 최대 점수 제한 확인
     */
    static getMaxScoreLimit(problemType: ProblemType): number | null;
    /**
     * 문제 유형별 최소 선택지 수 확인
     */
    static getMinimumChoices(problemType: ProblemType): number | null;
    /**
     * 문제 유형별 권장 선택지 수
     */
    static getRecommendedChoices(problemType: ProblemType): number | null;
    /**
     * 답안 형태 검증이 필요한지 확인
     */
    static requiresAnswerValidation(problemType: ProblemType): boolean;
    /**
     * 시간 제한 적용이 권장되는지 확인
     */
    static recommendsTimeLimit(problemType: ProblemType): boolean;
}
//# sourceMappingURL=ProblemGradingPolicy.d.ts.map