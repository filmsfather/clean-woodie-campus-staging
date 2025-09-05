import { UniqueEntityID, Result } from '@woodie/domain';
/**
 * 학습 패턴 분석 Use Case
 *
 * 비즈니스 규칙:
 * - 학생의 학습 기록을 기반으로 패턴을 분석함
 * - 시간 범위를 지정하여 분석 기간 설정
 * - 강점과 약점을 식별하고 개선 제안 제공
 * - 성과 트렌드 분석 포함
 */
export class AnalyzeStudyPatternsUseCase {
    studyRecordRepository;
    constructor(studyRecordRepository) {
        this.studyRecordRepository = studyRecordRepository;
    }
    async execute(request) {
        try {
            // 1. 입력 유효성 검증
            const validationResult = this.validateRequest(request);
            if (validationResult.isFailure) {
                return Result.fail(validationResult.error);
            }
            const studentId = new UniqueEntityID(request.studentId);
            const problemId = request.problemId ? new UniqueEntityID(request.problemId) : undefined;
            const timeRangeDays = request.timeRangeInDays || 30;
            // 2. 분석 기간 설정
            const toDate = new Date();
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - timeRangeDays);
            // 3. 학습 기록 조회
            const records = await this.studyRecordRepository.findByStudent(studentId, 1000);
            if (records.length === 0) {
                return Result.fail('No study records found for the specified period');
            }
            // 4. 패턴 분석
            const patterns = this.analyzePatterns(records);
            const insights = this.generateInsights(records, patterns);
            const performance = this.analyzePerformance(records);
            // 5. 응답 구성
            const response = {
                studentId: request.studentId,
                problemId: request.problemId,
                analysisDate: new Date(),
                timeRangeDays,
                totalSessions: records.length,
                patterns,
                insights,
                performance
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Failed to analyze study patterns: ${error}`);
        }
    }
    /**
     * 입력 요청 유효성 검증
     */
    validateRequest(request) {
        if (!request.studentId || request.studentId.trim() === '') {
            return Result.fail('Student ID is required');
        }
        if (request.timeRangeInDays !== undefined && request.timeRangeInDays <= 0) {
            return Result.fail('Time range must be a positive number');
        }
        return Result.ok();
    }
    /**
     * 학습 패턴 분석
     */
    analyzePatterns(records) {
        const patternMap = new Map();
        // 각 기록의 패턴 분류
        records.forEach(record => {
            const pattern = record.getStudyPattern();
            const existing = patternMap.get(pattern.pattern) || {
                count: 0,
                responseTimes: [],
                performanceScores: []
            };
            existing.count++;
            if (record.responseTime !== undefined) {
                existing.responseTimes.push(record.responseTime);
            }
            existing.performanceScores.push(record.calculatePerformanceScore());
            patternMap.set(pattern.pattern, existing);
        });
        // 분석 결과 생성
        const patterns = [];
        const totalRecords = records.length;
        patternMap.forEach((data, pattern) => {
            const percentage = Math.round((data.count / totalRecords) * 100);
            const averageResponseTime = data.responseTimes.length > 0
                ? data.responseTimes.reduce((sum, time) => sum + time, 0) / data.responseTimes.length
                : undefined;
            const averagePerformanceScore = data.performanceScores.reduce((sum, score) => sum + score, 0) / data.performanceScores.length;
            patterns.push({
                pattern: pattern,
                count: data.count,
                percentage,
                averageResponseTime,
                averagePerformanceScore: Math.round(averagePerformanceScore * 100) / 100
            });
        });
        return patterns.sort((a, b) => b.count - a.count);
    }
    /**
     * 인사이트 생성
     */
    generateInsights(records, patterns) {
        const dominantPattern = patterns[0]?.pattern || 'unknown';
        const strengths = [];
        const weaknesses = [];
        const recommendations = [];
        // 강점 식별
        patterns.forEach(pattern => {
            if (pattern.pattern === 'quick_correct' && pattern.percentage >= 30) {
                strengths.push('빠르고 정확한 응답이 많습니다');
            }
            if (pattern.averagePerformanceScore >= 80) {
                strengths.push(`${pattern.pattern} 패턴에서 높은 성과를 보입니다`);
            }
        });
        // 약점 식별
        patterns.forEach(pattern => {
            if (pattern.pattern === 'slow_incorrect' && pattern.percentage >= 20) {
                weaknesses.push('시간을 오래 들여도 틀리는 경우가 많습니다');
            }
            if (pattern.pattern === 'quick_incorrect' && pattern.percentage >= 15) {
                weaknesses.push('성급한 답변으로 인한 실수가 많습니다');
            }
        });
        // 추천사항 생성
        if (dominantPattern === 'slow_correct') {
            recommendations.push('정확성은 좋으니 속도를 높이는 연습을 해보세요');
        }
        if (dominantPattern === 'quick_incorrect') {
            recommendations.push('답변 전에 한 번 더 검토하는 습관을 기르세요');
        }
        if (patterns.find(p => p.pattern === 'slow_incorrect')?.percentage >= 20) {
            recommendations.push('기본 개념을 다시 복습하고 문제 해결 전략을 점검해보세요');
        }
        return {
            dominantPattern,
            strengths,
            weaknesses,
            recommendations
        };
    }
    /**
     * 성과 분석
     */
    analyzePerformance(records) {
        const correctAnswers = records.filter((r) => r.isCorrect).length;
        const overallAccuracy = Math.round((correctAnswers / records.length) * 100);
        const recordsWithTime = records.filter((r) => r.responseTime !== undefined);
        const averageSpeed = recordsWithTime.length > 0
            ? recordsWithTime.reduce((sum, r) => sum + (r.responseTime || 0), 0) / recordsWithTime.length / 1000
            : 0;
        // 간단한 트렌드 분석 (최근 30%와 이전 70% 비교)
        const recentCount = Math.floor(records.length * 0.3);
        const recentRecords = records.slice(-recentCount);
        const olderRecords = records.slice(0, records.length - recentCount);
        const recentAccuracy = recentRecords.length > 0
            ? recentRecords.filter((r) => r.isCorrect).length / recentRecords.length
            : 0;
        const olderAccuracy = olderRecords.length > 0
            ? olderRecords.filter((r) => r.isCorrect).length / olderRecords.length
            : 0;
        let improvementTrend;
        const accuracyDiff = recentAccuracy - olderAccuracy;
        if (accuracyDiff > 0.05) {
            improvementTrend = 'improving';
        }
        else if (accuracyDiff < -0.05) {
            improvementTrend = 'declining';
        }
        else {
            improvementTrend = 'stable';
        }
        // 일관성 점수 (성과의 표준편차 기반)
        const performanceScores = records.map((r) => r.calculatePerformanceScore());
        const avgPerformance = performanceScores.reduce((sum, score) => sum + score, 0) / performanceScores.length;
        const variance = performanceScores.reduce((sum, score) => sum + Math.pow(score - avgPerformance, 2), 0) / performanceScores.length;
        const standardDeviation = Math.sqrt(variance);
        const consistencyScore = Math.max(0, Math.min(100, 100 - standardDeviation));
        return {
            overallAccuracy,
            averageSpeed: Math.round(averageSpeed * 100) / 100,
            improvementTrend,
            consistencyScore: Math.round(consistencyScore)
        };
    }
}
//# sourceMappingURL=AnalyzeStudyPatternsUseCase.js.map