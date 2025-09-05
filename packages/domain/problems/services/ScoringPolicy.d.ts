export declare class ScoringPolicy {
    static readonly MIN_POINTS = 0;
    static readonly MAX_POINTS = 1000;
    static readonly DEFAULT_POINTS = 10;
    static validatePoints(points: number): boolean;
    static calculatePartialScore(correctCount: number, totalCount: number, maxPoints: number, roundingStrategy?: 'round' | 'floor' | 'ceil'): number;
    static applyMinimumThreshold(score: number, totalPoints: number, threshold?: number): number;
}
export declare class PartialScoringStrategy {
    static calculate(params: {
        correctItems: number;
        totalItems: number;
        maxPoints: number;
        allowPartialCredit: boolean;
        minimumThreshold?: number;
        roundingStrategy?: 'round' | 'floor' | 'ceil';
    }): number;
    static getDefaultPartialCreditPolicy(problemType: string): {
        allowsPartialCredit: boolean;
        minimumThreshold?: number;
    };
}
//# sourceMappingURL=ScoringPolicy.d.ts.map