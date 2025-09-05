import { UniqueEntityID, Result } from '@woodie/domain';
/**
 * 문제별 복습 성과 조회 Use Case
 *
 * 비즈니스 규칙:
 * - 특정 문제에 대한 전체 학습자의 성과를 분석
 * - 문제의 적정 난이도 평가 및 조정 제안
 * - 학습자별 성과 차이 분석
 * - 교육적 개선점 도출
 */
export class GetProblemReviewPerformanceUseCase {
    reviewScheduleRepository;
    studyRecordRepository;
    constructor(reviewScheduleRepository, studyRecordRepository) {
        this.reviewScheduleRepository = reviewScheduleRepository;
        this.studyRecordRepository = studyRecordRepository;
    }
    async execute(request) {
        try {
            // 1. 입력 유효성 검증
            const validationResult = this.validateRequest(request);
            if (validationResult.isFailure) {
                return Result.fail(validationResult.error);
            }
            const problemId = new UniqueEntityID(request.problemId);
            const timeRangeDays = request.timeRangeInDays || 90;
            // 2. 분석 기간 설정
            const toDate = new Date();
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - timeRangeDays);
            // 3. 문제와 관련된 모든 복습 스케줄 조회
            const schedules = await this.reviewScheduleRepository.findByProblemId(problemId);
            if (schedules.length === 0) {
                return Result.fail('No review schedules found for this problem');
            }
            // 4. 문제와 관련된 모든 학습 기록 조회
            const records = await this.studyRecordRepository.findByProblemId(problemId, 10000);
            // 5. 기본 성과 지표 계산
            const basicMetrics = this.calculateBasicMetrics(records, schedules);
            // 6. 난이도 분석
            const difficultyAnalysis = this.analyzeDifficulty(records, schedules);
            // 7. 학생별 성과 분석 (옵션)
            const studentBreakdown = request.includeStudentBreakdown
                ? await this.analyzeStudentPerformance(schedules, records)
                : undefined;
            // 8. 인사이트 생성
            const insights = this.generateInsights(records, schedules, studentBreakdown);
            // 9. 응답 구성
            const response = {
                problemId: request.problemId,
                analysisDate: new Date(),
                timeRangeDays,
                ...basicMetrics,
                difficultyAnalysis,
                studentBreakdown,
                insights
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Failed to get problem review performance: ${error}`);
        }
    }
    /**
     * 입력 요청 유효성 검증
     */
    validateRequest(request) {
        if (!request.problemId || request.problemId.trim() === '') {
            return Result.fail('Problem ID is required');
        }
        if (request.timeRangeInDays !== undefined && request.timeRangeInDays <= 0) {
            return Result.fail('Time range must be a positive number');
        }
        return Result.ok();
    }
    /**
     * 기본 성과 지표 계산
     */
    calculateBasicMetrics(records, schedules) {
        const totalReviews = records.length;
        const correctReviews = records.filter(r => r.isCorrect).length;
        const averageAccuracy = totalReviews > 0 ? (correctReviews / totalReviews) * 100 : 0;
        // 성과 점수 평균
        const performanceScores = records.map(r => r.calculatePerformanceScore());
        const averagePerformance = performanceScores.length > 0
            ? Math.round(performanceScores.reduce((sum, score) => sum + score, 0) / performanceScores.length)
            : 0;
        // 평균 응답 시간
        const recordsWithTime = records.filter(r => r.responseTime !== undefined);
        const averageResponseTime = recordsWithTime.length > 0
            ? Math.round(recordsWithTime.reduce((sum, r) => sum + (r.responseTime || 0), 0) / recordsWithTime.length / 1000 * 100) / 100
            : undefined;
        // 평균 복습 간격
        const averageInterval = schedules.length > 0
            ? Math.round(schedules.reduce((sum, s) => sum + s.currentInterval, 0) / schedules.length * 10) / 10
            : 0;
        // 난이도 트렌드 분석 (간단한 버전)
        const difficultyTrend = this.calculateDifficultyTrend(records);
        // 일관성 점수
        const avgPerformanceScore = performanceScores.reduce((sum, score) => sum + score, 0) / performanceScores.length;
        const variance = performanceScores.reduce((sum, score) => sum + Math.pow(score - avgPerformanceScore, 2), 0) / performanceScores.length;
        const consistencyScore = Math.max(0, Math.min(100, 100 - Math.sqrt(variance)));
        // 보존율 (ease factor 기반 추정)
        const averageEaseFactor = schedules.reduce((sum, s) => sum + s.easeFactor, 0) / schedules.length;
        const retentionRate = Math.min(100, Math.max(0, (averageEaseFactor - 1.3) / (2.5 - 1.3) * 100));
        const uniqueStudents = new Set(schedules.map(s => s.studentId.toString())).size;
        return {
            totalReviews,
            averagePerformance,
            difficultyTrend,
            averageInterval,
            performance: {
                totalStudents: uniqueStudents,
                averageAccuracy: Math.round(averageAccuracy * 100) / 100,
                averageResponseTime,
                consistencyScore: Math.round(consistencyScore),
                retentionRate: Math.round(retentionRate * 100) / 100
            }
        };
    }
    /**
     * 난이도 분석
     */
    analyzeDifficulty(records, schedules) {
        const correctAnswers = records.filter(r => r.isCorrect).length;
        const totalReviews = records.length;
        const accuracy = totalReviews > 0 ? correctAnswers / totalReviews : 0;
        // 평균 ease factor
        const averageEaseFactor = schedules.length > 0
            ? schedules.reduce((sum, s) => sum + s.easeFactor, 0) / schedules.length
            : 2.5;
        // 평균 연속 실패 횟수
        const averageConsecutiveFailures = schedules.length > 0
            ? schedules.reduce((sum, s) => sum + s.consecutiveFailures, 0) / schedules.length
            : 0;
        // 현재 난이도 수준 판단
        let currentLevel;
        if (accuracy >= 0.9 && averageEaseFactor >= 2.3) {
            currentLevel = 'easy';
        }
        else if (accuracy >= 0.75 && averageEaseFactor >= 2.0) {
            currentLevel = 'medium';
        }
        else if (accuracy >= 0.6 && averageEaseFactor >= 1.7) {
            currentLevel = 'hard';
        }
        else {
            currentLevel = 'very_hard';
        }
        // 권장 난이도 수준과 이유 결정
        let recommendedLevel;
        let reasonForRecommendation;
        let adjustmentSuggestion;
        if (accuracy >= 0.95 && averageConsecutiveFailures < 0.5) {
            recommendedLevel = 'easy';
            reasonForRecommendation = '매우 높은 정답률과 안정적인 성과를 보임';
            if (currentLevel !== 'easy') {
                adjustmentSuggestion = '문제 난이도를 낮추거나 기초 개념 확인용으로 활용 권장';
            }
        }
        else if (accuracy >= 0.8 && averageConsecutiveFailures < 1) {
            recommendedLevel = 'medium';
            reasonForRecommendation = '적정한 수준의 정답률과 학습 효과를 보임';
            if (currentLevel === 'very_hard' || currentLevel === 'hard') {
                adjustmentSuggestion = '문제를 좀 더 접근하기 쉽게 개선하거나 힌트 제공 고려';
            }
        }
        else if (accuracy >= 0.65) {
            recommendedLevel = 'hard';
            reasonForRecommendation = '도전적이지만 학습 가능한 수준의 난이도를 보임';
        }
        else {
            recommendedLevel = 'very_hard';
            reasonForRecommendation = '낮은 정답률로 인해 학습자에게 좌절감을 줄 수 있음';
            adjustmentSuggestion = '문제를 단계별로 나누거나 추가 설명/예제 제공 권장';
        }
        return {
            currentLevel,
            recommendedLevel,
            reasonForRecommendation,
            adjustmentSuggestion
        };
    }
    /**
     * 학생별 성과 분석
     */
    async analyzeStudentPerformance(schedules, records) {
        const studentMap = new Map();
        // 학생별 데이터 그룹화
        schedules.forEach(schedule => {
            const studentId = schedule.studentId.toString();
            const studentRecords = records.filter(r => r.studentId.equals(schedule.studentId));
            studentMap.set(studentId, {
                schedule,
                records: studentRecords
            });
        });
        // 각 학생의 성과 분석
        const breakdown = [];
        studentMap.forEach((data, studentId) => {
            const { schedule, records: studentRecords } = data;
            const reviewCount = studentRecords.length;
            const correctCount = studentRecords.filter(r => r.isCorrect).length;
            const accuracy = reviewCount > 0 ? Math.round((correctCount / reviewCount) * 100) : 0;
            const recordsWithTime = studentRecords.filter(r => r.responseTime !== undefined);
            const averageResponseTime = recordsWithTime.length > 0
                ? Math.round(recordsWithTime.reduce((sum, r) => sum + (r.responseTime || 0), 0) / recordsWithTime.length / 1000 * 100) / 100
                : undefined;
            const lastReviewAt = studentRecords.length > 0
                ? studentRecords.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
                : undefined;
            // 성과 등급 계산
            let performanceRating;
            if (accuracy >= 90 && schedule.easeFactor >= 2.3) {
                performanceRating = 'excellent';
            }
            else if (accuracy >= 75 && schedule.easeFactor >= 2.0) {
                performanceRating = 'good';
            }
            else if (accuracy >= 60) {
                performanceRating = 'average';
            }
            else {
                performanceRating = 'needs_improvement';
            }
            breakdown.push({
                studentId,
                reviewCount,
                accuracy,
                averageResponseTime,
                currentEaseFactor: Math.round(schedule.easeFactor * 100) / 100,
                difficultyLevel: schedule.getDifficultyLevel(),
                lastReviewAt,
                performanceRating
            });
        });
        return breakdown.sort((a, b) => b.accuracy - a.accuracy);
    }
    /**
     * 인사이트 생성
     */
    generateInsights(records, schedules, studentBreakdown) {
        const topPerformers = studentBreakdown?.filter(s => s.performanceRating === 'excellent').length || 0;
        const strugglingStudents = studentBreakdown?.filter(s => s.performanceRating === 'needs_improvement').length || 0;
        // 일반적인 실수 패턴 분석
        const commonMistakePatterns = [];
        const incorrectRecords = records.filter(r => !r.isCorrect);
        if (incorrectRecords.length > records.length * 0.3) {
            commonMistakePatterns.push('정답률이 낮습니다 - 개념 이해도 점검 필요');
        }
        const slowIncorrectRecords = records.filter(r => {
            const pattern = r.getStudyPattern();
            return pattern.pattern === 'slow_incorrect';
        });
        if (slowIncorrectRecords.length > records.length * 0.2) {
            commonMistakePatterns.push('시간을 들여도 틀리는 경우가 많음 - 기본 개념 재학습 권장');
        }
        const quickIncorrectRecords = records.filter(r => {
            const pattern = r.getStudyPattern();
            return pattern.pattern === 'quick_incorrect';
        });
        if (quickIncorrectRecords.length > records.length * 0.15) {
            commonMistakePatterns.push('성급한 답변으로 인한 실수가 많음 - 신중한 접근 필요');
        }
        // 최적화 제안
        const optimizationSuggestions = [];
        const averageAccuracy = records.length > 0
            ? records.filter(r => r.isCorrect).length / records.length
            : 0;
        if (averageAccuracy < 0.6) {
            optimizationSuggestions.push('문제 난이도 조정 또는 추가 설명 제공');
            optimizationSuggestions.push('사전 학습 자료나 힌트 시스템 도입 고려');
        }
        else if (averageAccuracy > 0.9) {
            optimizationSuggestions.push('문제 난이도를 높이거나 심화 버전 제공');
            optimizationSuggestions.push('유사 문제나 응용 문제로 확장 학습 권장');
        }
        if (studentBreakdown) {
            const performanceVariance = this.calculatePerformanceVariance(studentBreakdown);
            if (performanceVariance > 30) {
                optimizationSuggestions.push('학습자 간 성과 차이가 큽니다 - 개별화된 접근 방법 고려');
            }
        }
        const highFailureStudents = schedules.filter(s => s.consecutiveFailures >= 3).length;
        if (highFailureStudents > schedules.length * 0.2) {
            optimizationSuggestions.push('연속 실패를 겪는 학습자가 많습니다 - 중간 단계 문제 추가 고려');
        }
        return {
            topPerformers,
            strugglingStudents,
            commonMistakePatterns,
            optimizationSuggestions
        };
    }
    // Helper 메서드들
    calculateDifficultyTrend(records) {
        if (records.length < 20)
            return 'stable';
        // 시간순 정렬
        const sortedRecords = records.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        const halfPoint = Math.floor(sortedRecords.length / 2);
        const firstHalf = sortedRecords.slice(0, halfPoint);
        const secondHalf = sortedRecords.slice(halfPoint);
        const firstHalfAccuracy = firstHalf.filter(r => r.isCorrect).length / firstHalf.length;
        const secondHalfAccuracy = secondHalf.filter(r => r.isCorrect).length / secondHalf.length;
        const improvement = secondHalfAccuracy - firstHalfAccuracy;
        if (improvement > 0.1)
            return 'improving';
        else if (improvement < -0.1)
            return 'declining';
        else
            return 'stable';
    }
    calculatePerformanceVariance(studentBreakdown) {
        if (studentBreakdown.length === 0)
            return 0;
        const accuracies = studentBreakdown.map(s => s.accuracy);
        const mean = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
        const variance = accuracies.reduce((sum, acc) => sum + Math.pow(acc - mean, 2), 0) / accuracies.length;
        return Math.sqrt(variance);
    }
}
//# sourceMappingURL=GetProblemReviewPerformanceUseCase.js.map