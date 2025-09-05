import { AnswerContent } from '../value-objects/AnswerContent';
export interface GradingResult {
    isCorrect: boolean;
    score: number;
    maxScore: number;
    feedback?: string;
    partialCredit?: {
        correctCount: number;
        totalCount: number;
        percentage: number;
    };
}
export interface StudentAnswer {
    type: string;
    data: any;
}
export declare class AnswerGradingService {
    static gradeAnswer(studentAnswer: StudentAnswer, correctAnswer: AnswerContent): GradingResult;
    private static createErrorResult;
    private static createSuccessResult;
    private static gradeMultipleChoice;
    private static gradeShortAnswer;
    private static gradeTrueFalse;
    private static gradeMatching;
    private static gradeFillBlank;
    private static gradeOrdering;
    private static gradeLongAnswer;
    static getKeywordScore(studentAnswer: string, correctAnswer: AnswerContent.LongAnswer): {
        keywordCount: number;
        totalKeywords: number;
        suggestedScore: number;
    };
}
//# sourceMappingURL=AnswerGradingService.d.ts.map