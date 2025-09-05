import { PartialScoringStrategy } from './ScoringPolicy';
import { AnswerValidationPolicy } from './AnswerValidationPolicy';
export class AnswerGradingService {
    static gradeAnswer(studentAnswer, correctAnswer) {
        // 타입 일치 검증
        if (studentAnswer.type !== correctAnswer.type) {
            return this.createErrorResult(correctAnswer.points, 'Answer type mismatch');
        }
        // 타입별 채점
        switch (correctAnswer.type) {
            case 'multiple_choice':
                return this.gradeMultipleChoice(studentAnswer.data, correctAnswer.data);
            case 'short_answer':
                return this.gradeShortAnswer(studentAnswer.data, correctAnswer.data);
            case 'true_false':
                return this.gradeTrueFalse(studentAnswer.data, correctAnswer.data);
            case 'matching':
                return this.gradeMatching(studentAnswer.data, correctAnswer.data);
            case 'fill_blank':
                return this.gradeFillBlank(studentAnswer.data, correctAnswer.data);
            case 'ordering':
                return this.gradeOrdering(studentAnswer.data, correctAnswer.data);
            case 'long_answer':
                return this.gradeLongAnswer(studentAnswer.data, correctAnswer.data);
            default:
                return this.createErrorResult(correctAnswer.points, 'Unsupported problem type');
        }
    }
    static createErrorResult(maxScore, feedback) {
        return {
            isCorrect: false,
            score: 0,
            maxScore,
            feedback
        };
    }
    static createSuccessResult(score, maxScore, feedback, partialCredit) {
        return {
            isCorrect: score === maxScore,
            score,
            maxScore,
            feedback,
            partialCredit
        };
    }
    static gradeMultipleChoice(studentAnswer, correctAnswer) {
        if (!Array.isArray(studentAnswer)) {
            return this.createErrorResult(correctAnswer.points, 'Invalid answer format');
        }
        const studentSet = new Set(studentAnswer);
        const correctSet = new Set(correctAnswer.correctChoices);
        const isCorrect = studentSet.size === correctSet.size &&
            [...studentSet].every(choice => correctSet.has(choice));
        return this.createSuccessResult(isCorrect ? correctAnswer.points : 0, correctAnswer.points, correctAnswer.explanation);
    }
    static gradeShortAnswer(studentAnswer, correctAnswer) {
        if (typeof studentAnswer !== 'string') {
            return this.createErrorResult(correctAnswer.points, 'Invalid answer format');
        }
        const normalizedStudent = AnswerValidationPolicy.normalizeText(studentAnswer, {
            caseSensitive: correctAnswer.caseSensitive,
            trimWhitespace: correctAnswer.trimWhitespace
        });
        const isCorrect = correctAnswer.acceptedAnswers.some(accepted => {
            const normalizedAccepted = AnswerValidationPolicy.normalizeText(accepted, {
                caseSensitive: correctAnswer.caseSensitive,
                trimWhitespace: correctAnswer.trimWhitespace
            });
            return normalizedStudent === normalizedAccepted;
        });
        return this.createSuccessResult(isCorrect ? correctAnswer.points : 0, correctAnswer.points, correctAnswer.explanation);
    }
    static gradeTrueFalse(studentAnswer, correctAnswer) {
        if (typeof studentAnswer !== 'boolean') {
            return this.createErrorResult(correctAnswer.points, 'Invalid answer format');
        }
        const isCorrect = studentAnswer === correctAnswer.isTrue;
        return this.createSuccessResult(isCorrect ? correctAnswer.points : 0, correctAnswer.points, correctAnswer.explanation);
    }
    static gradeMatching(studentAnswer, correctAnswer) {
        if (!Array.isArray(studentAnswer)) {
            return this.createErrorResult(correctAnswer.points, 'Invalid answer format');
        }
        const correctMatches = new Map(correctAnswer.correctMatches.map(match => [match.leftId, match.rightId]));
        let correctCount = 0;
        for (const match of studentAnswer) {
            if (correctMatches.get(match.leftId) === match.rightId) {
                correctCount++;
            }
        }
        const totalMatches = correctAnswer.correctMatches.length;
        const percentage = totalMatches > 0 ? (correctCount / totalMatches) * 100 : 0;
        // 부분 점수 계산
        const score = PartialScoringStrategy.calculate({
            correctItems: correctCount,
            totalItems: totalMatches,
            maxPoints: correctAnswer.points,
            allowPartialCredit: correctAnswer.allowsPartialCredit || false
        });
        return this.createSuccessResult(score, correctAnswer.points, correctAnswer.explanation, { correctCount, totalCount: totalMatches, percentage });
    }
    static gradeFillBlank(studentAnswer, correctAnswer) {
        if (!Array.isArray(studentAnswer)) {
            return this.createErrorResult(correctAnswer.points, 'Invalid answer format');
        }
        const studentAnswerMap = new Map(studentAnswer.map(item => [item.id, item.answer]));
        let correctCount = 0;
        for (const blank of correctAnswer.blanks) {
            const studentAns = studentAnswerMap.get(blank.id);
            if (studentAns) {
                const normalizedStudent = AnswerValidationPolicy.normalizeText(studentAns, { caseSensitive: blank.caseSensitive });
                const isBlankCorrect = blank.acceptedAnswers.some(accepted => {
                    const normalizedAccepted = AnswerValidationPolicy.normalizeText(accepted, { caseSensitive: blank.caseSensitive });
                    return normalizedStudent === normalizedAccepted;
                });
                if (isBlankCorrect) {
                    correctCount++;
                }
            }
        }
        const totalBlanks = correctAnswer.blanks.length;
        const percentage = totalBlanks > 0 ? (correctCount / totalBlanks) * 100 : 0;
        // 부분 점수 계산
        const score = PartialScoringStrategy.calculate({
            correctItems: correctCount,
            totalItems: totalBlanks,
            maxPoints: correctAnswer.points,
            allowPartialCredit: correctAnswer.allowsPartialCredit || false
        });
        return this.createSuccessResult(score, correctAnswer.points, correctAnswer.explanation, { correctCount, totalCount: totalBlanks, percentage });
    }
    static gradeOrdering(studentAnswer, correctAnswer) {
        if (!Array.isArray(studentAnswer)) {
            return this.createErrorResult(correctAnswer.points, 'Invalid answer format');
        }
        // 완전 정답 체크
        const isCompletelyCorrect = studentAnswer.length === correctAnswer.correctOrder.length &&
            studentAnswer.every((item, index) => item === correctAnswer.correctOrder[index]);
        if (isCompletelyCorrect || !correctAnswer.allowsPartialCredit) {
            return this.createSuccessResult(isCompletelyCorrect ? correctAnswer.points : 0, correctAnswer.points, correctAnswer.explanation);
        }
        // 부분 점수 계산: 올바른 위치에 있는 아이템 수
        let correctPositions = 0;
        const minLength = Math.min(studentAnswer.length, correctAnswer.correctOrder.length);
        for (let i = 0; i < minLength; i++) {
            if (studentAnswer[i] === correctAnswer.correctOrder[i]) {
                correctPositions++;
            }
        }
        const totalPositions = correctAnswer.correctOrder.length;
        const percentage = (correctPositions / totalPositions) * 100;
        const score = PartialScoringStrategy.calculate({
            correctItems: correctPositions,
            totalItems: totalPositions,
            maxPoints: correctAnswer.points,
            allowPartialCredit: true // 이미 위에서 체크함
        });
        return this.createSuccessResult(score, correctAnswer.points, correctAnswer.explanation, { correctCount: correctPositions, totalCount: totalPositions, percentage });
    }
    static gradeLongAnswer(studentAnswer, correctAnswer) {
        // 서술형은 수동 채점 필요
        return {
            isCorrect: false,
            score: 0,
            maxScore: correctAnswer.points,
            feedback: 'Long answer requires manual grading'
        };
    }
    // 키워드 기반 자동 채점 (참고용 - 실제 서술형 채점은 수동)
    static getKeywordScore(studentAnswer, correctAnswer) {
        if (!correctAnswer.keywords || correctAnswer.keywords.length === 0) {
            return { keywordCount: 0, totalKeywords: 0, suggestedScore: 0 };
        }
        const normalizedAnswer = AnswerValidationPolicy.normalizeText(studentAnswer);
        let keywordCount = 0;
        for (const keyword of correctAnswer.keywords) {
            const normalizedKeyword = AnswerValidationPolicy.normalizeText(keyword);
            if (normalizedAnswer.includes(normalizedKeyword)) {
                keywordCount++;
            }
        }
        const totalKeywords = correctAnswer.keywords.length;
        const suggestedScore = PartialScoringStrategy.calculate({
            correctItems: keywordCount,
            totalItems: totalKeywords,
            maxPoints: correctAnswer.points,
            allowPartialCredit: true,
            minimumThreshold: 0.3 // 30% 이상의 키워드 필요
        });
        return { keywordCount, totalKeywords, suggestedScore };
    }
}
//# sourceMappingURL=AnswerGradingService.js.map