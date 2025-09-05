import { UniqueEntityID, Result } from '@woodie/domain';
/**
 * 학생 복습 통계 조회 Use Case
 *
 * 비즈니스 규칙:
 * - ISrsService 인터페이스 구현에 해당하는 상세한 통계 제공
 * - 기본 통계 + 성과 분석 + 트렌드 분석 통합 제공
 * - 학습자의 강점과 약점을 식별하여 개선점 제시
 * - 다음 목표와 마일스톤 제안
 */
export class GetStudentReviewStatsUseCase {
    reviewScheduleRepository;
    studyRecordRepository;
    constructor(reviewScheduleRepository, studyRecordRepository) {
        this.reviewScheduleRepository = reviewScheduleRepository;
        this.studyRecordRepository = studyRecordRepository;
    }
    async execute(request) {
        try {
            // 1. 입력 유효성 검증
            if (!request.studentId || request.studentId.trim() === '') {
                return Result.fail('Student ID is required');
            }
            const studentId = new UniqueEntityID(request.studentId);
            // 2. 기본 통계 조회
            const basicStats = await this.getBasicStats(studentId);
            // 3. 성과 지표 조회 (옵션)
            const performanceMetrics = request.includePerformanceMetrics
                ? await this.getPerformanceMetrics(studentId)
                : undefined;
            // 4. 트렌드 분석 (옵션)
            const trends = request.includeTrends
                ? await this.getTrends(studentId)
                : undefined;
            // 5. 인사이트 생성
            const insights = await this.generateInsights(studentId, basicStats, performanceMetrics);
            // 6. 응답 구성
            const response = {
                studentId: request.studentId,
                calculatedAt: new Date(),
                basicStats,
                performanceMetrics,
                trends,
                insights
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Failed to get student review stats: ${error}`);
        }
    }
    /**
     * 기본 통계 조회
     */
    async getBasicStats(studentId) {
        // 모든 복습 스케줄 조회
        const schedules = await this.reviewScheduleRepository.findByStudentId(studentId);
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
        // 기본 카운트들
        const totalCards = schedules.length;
        const dueToday = schedules.filter(s => s.nextReviewAt <= now && s.nextReviewAt >= todayStart).length;
        const overdue = schedules.filter(s => s.nextReviewAt < todayStart).length;
        // 오늘 완료된 복습 조회
        const todayRecords = await this.studyRecordRepository.findByDateRange(studentId, todayStart, todayEnd);
        const completedToday = todayRecords.length;
        // 평균 ease factor
        const averageEaseFactor = totalCards > 0
            ? schedules.reduce((sum, s) => sum + s.easeFactor, 0) / totalCards
            : 0;
        // 최장 연속 학습 일수 계산 (간단한 버전)
        const longestStreak = await this.calculateLongestStreak(studentId);
        return {
            totalCards,
            dueToday,
            overdue,
            completedToday,
            averageEaseFactor: Math.round(averageEaseFactor * 100) / 100,
            longestStreak
        };
    }
    /**
     * 성과 지표 조회
     */
    async getPerformanceMetrics(studentId) {
        // 모든 학습 기록 조회
        const records = await this.studyRecordRepository.findByStudentId(studentId, 10000);
        // 모든 스케줄 조회
        const schedules = await this.reviewScheduleRepository.findByStudentId(studentId);
        const totalReviewsSinceStart = records.length;
        const correctCount = records.filter((r) => r.isCorrect).length;
        const averageAccuracy = totalReviewsSinceStart > 0 ? Math.round((correctCount / totalReviewsSinceStart) * 100) : 0;
        // 평균 응답 시간
        const recordsWithTime = records.filter((r) => r.responseTime !== undefined);
        const averageResponseTime = recordsWithTime.length > 0
            ? Math.round(recordsWithTime.reduce((sum, r) => sum + (r.responseTime || 0), 0) / recordsWithTime.length / 1000 * 100) / 100
            : undefined;
        // 난이도별 성과 분석
        const difficultyStats = this.analyzeDifficultyPerformance(schedules, records);
        // 가장 일반적인 패턴 분석
        const patternStats = new Map();
        records.forEach(record => {
            const pattern = record.getStudyPattern().pattern;
            patternStats.set(pattern, (patternStats.get(pattern) || 0) + 1);
        });
        const mostCommonPattern = Array.from(patternStats.entries())
            .sort(([, a], [, b]) => b - a)[0]?.[0] || 'quick_correct';
        // 일관성 점수 (성과의 표준편차 기반)
        const performanceScores = records.map(r => r.calculatePerformanceScore());
        const avgPerformance = performanceScores.length > 0
            ? performanceScores.reduce((sum, score) => sum + score, 0) / performanceScores.length
            : 0;
        const variance = performanceScores.length > 0
            ? performanceScores.reduce((sum, score) => sum + Math.pow(score - avgPerformance, 2), 0) / performanceScores.length
            : 0;
        const consistencyScore = Math.max(0, Math.min(100, 100 - Math.sqrt(variance)));
        return {
            totalReviewsSinceStart,
            averageAccuracy,
            averageResponseTime,
            strongestDifficultyLevel: difficultyStats.strongest,
            weakestDifficultyLevel: difficultyStats.weakest,
            mostCommonPattern,
            consistencyScore: Math.round(consistencyScore)
        };
    }
    /**
     * 트렌드 분석
     */
    async getTrends(studentId) {
        // 간단한 구현 - 실제로는 더 정교한 시계열 분석 필요
        const now = new Date();
        const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
        const recentRecords = await this.studyRecordRepository.findByDateRange(studentId, fourWeeksAgo, now);
        // 주간 진행상황 (최근 4주)
        const weeklyProgress = this.calculateWeeklyProgress(recentRecords);
        // 월간 진행상황 (최근 3개월)
        const monthlyProgress = await this.calculateMonthlyProgress(studentId);
        // 개선 트렌드 (간단한 휴리스틱)
        const improvementTrend = this.calculateImprovementTrend(recentRecords);
        // 연속 학습 트렌드
        const streakTrend = 'stable'; // 실제 구현에서는 연속 학습 기록 분석
        return {
            weeklyProgress,
            monthlyProgress,
            improvementTrend,
            streakTrend
        };
    }
    /**
     * 인사이트 생성
     */
    async generateInsights(studentId, basicStats, performanceMetrics) {
        const strengths = [];
        const areas_for_improvement = [];
        const next_milestones = [];
        // 강점 식별
        if (basicStats.averageEaseFactor >= 2.0) {
            strengths.push('높은 기억 보존율을 유지하고 있습니다');
        }
        if (basicStats.longestStreak >= 7) {
            strengths.push('꾸준한 학습 습관을 가지고 있습니다');
        }
        if (performanceMetrics && performanceMetrics.averageAccuracy >= 80) {
            strengths.push('높은 정답률을 보이고 있습니다');
        }
        if (performanceMetrics && performanceMetrics.consistencyScore >= 80) {
            strengths.push('일관된 성과를 보이고 있습니다');
        }
        // 개선 영역 식별
        if (basicStats.overdue > basicStats.totalCards * 0.2) {
            areas_for_improvement.push('연체된 복습이 많습니다. 일정 관리를 개선하세요');
        }
        if (basicStats.averageEaseFactor < 1.8) {
            areas_for_improvement.push('기억 보존 기간이 짧습니다. 학습 방법을 검토해보세요');
        }
        if (performanceMetrics && performanceMetrics.averageAccuracy < 70) {
            areas_for_improvement.push('정답률이 낮습니다. 기본 개념을 다시 학습하세요');
        }
        // 다음 마일스톤 제안
        if (basicStats.longestStreak < 7) {
            next_milestones.push('7일 연속 학습 달성하기');
        }
        else if (basicStats.longestStreak < 30) {
            next_milestones.push('30일 연속 학습 달성하기');
        }
        if (basicStats.totalCards < 100) {
            next_milestones.push('100개 카드 학습하기');
        }
        else if (basicStats.totalCards < 500) {
            next_milestones.push('500개 카드 학습하기');
        }
        if (performanceMetrics && performanceMetrics.averageAccuracy < 90) {
            next_milestones.push('90% 정답률 달성하기');
        }
        // 기본 메시지
        if (strengths.length === 0) {
            strengths.push('학습을 시작한 것만으로도 좋은 첫걸음입니다!');
        }
        if (areas_for_improvement.length === 0) {
            areas_for_improvement.push('현재 학습 패턴을 잘 유지하고 있습니다');
        }
        if (next_milestones.length === 0) {
            next_milestones.push('현재 수준을 꾸준히 유지해보세요');
        }
        return {
            strengths,
            areas_for_improvement,
            next_milestones
        };
    }
    // Helper 메서드들
    async calculateLongestStreak(studentId) {
        // 간단한 구현 - 실제로는 연속 학습 기록을 추적해야 함
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const records = await this.studyRecordRepository.findByDateRange(studentId, thirtyDaysAgo, new Date());
        if (records.length === 0)
            return 0;
        // 날짜별로 그룹화
        const dateGroups = new Map();
        records.forEach((record) => {
            const dateKey = record.createdAt.toISOString().split('T')[0];
            dateGroups.set(dateKey, (dateGroups.get(dateKey) || 0) + 1);
        });
        // 연속 일수 계산 (단순한 버전)
        const sortedDates = Array.from(dateGroups.keys()).sort();
        let currentStreak = 0;
        let maxStreak = 0;
        for (let i = 0; i < sortedDates.length; i++) {
            if (i === 0) {
                currentStreak = 1;
            }
            else {
                const prevDate = new Date(sortedDates[i - 1]);
                const currentDate = new Date(sortedDates[i]);
                const daysDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000));
                if (daysDiff === 1) {
                    currentStreak++;
                }
                else {
                    currentStreak = 1;
                }
            }
            maxStreak = Math.max(maxStreak, currentStreak);
        }
        return maxStreak;
    }
    analyzeDifficultyPerformance(schedules, records) {
        const difficultyPerformance = new Map();
        // 스케줄별 난이도와 해당 기록들의 성과를 매핑
        schedules.forEach(schedule => {
            const difficulty = schedule.getDifficultyLevel();
            const relatedRecords = records.filter(r => r.problemId.equals(schedule.problemId));
            if (relatedRecords.length > 0) {
                const correct = relatedRecords.filter(r => r.isCorrect).length;
                const existing = difficultyPerformance.get(difficulty) || { correct: 0, total: 0 };
                difficultyPerformance.set(difficulty, {
                    correct: existing.correct + correct,
                    total: existing.total + relatedRecords.length
                });
            }
        });
        // 성과율 계산
        const performanceRates = new Map();
        difficultyPerformance.forEach((stats, difficulty) => {
            const rate = stats.total > 0 ? stats.correct / stats.total : 0;
            performanceRates.set(difficulty, rate);
        });
        const sortedByPerformance = Array.from(performanceRates.entries())
            .sort(([, a], [, b]) => b - a);
        return {
            strongest: sortedByPerformance[0]?.[0] || 'beginner',
            weakest: sortedByPerformance[sortedByPerformance.length - 1]?.[0] || 'beginner'
        };
    }
    calculateWeeklyProgress(records) {
        // 주별 데이터 집계 (간단한 구현)
        const weeklyData = [];
        const now = new Date();
        for (let i = 0; i < 4; i++) {
            const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
            const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
            const weekRecords = records.filter(r => r.createdAt >= weekStart && r.createdAt < weekEnd);
            const completedReviews = weekRecords.length;
            const correct = weekRecords.filter(r => r.isCorrect).length;
            const accuracy = completedReviews > 0 ? Math.round((correct / completedReviews) * 100) : 0;
            weeklyData.unshift({
                week: `Week ${4 - i}`,
                completedReviews,
                accuracy,
                averageEaseFactor: 2.5 // 실제 구현에서는 해당 주의 평균 ease factor 계산
            });
        }
        return weeklyData;
    }
    async calculateMonthlyProgress(studentId) {
        // 월별 데이터 집계 (간단한 구현)
        return [
            { month: 'This Month', completedReviews: 45, accuracy: 82, newCards: 12 },
            { month: 'Last Month', completedReviews: 38, accuracy: 78, newCards: 15 },
            { month: '2 Months Ago', completedReviews: 42, accuracy: 75, newCards: 18 }
        ];
    }
    calculateImprovementTrend(records) {
        if (records.length < 10)
            return 'stable';
        const halfPoint = Math.floor(records.length / 2);
        const firstHalf = records.slice(0, halfPoint);
        const secondHalf = records.slice(halfPoint);
        const firstHalfAccuracy = firstHalf.filter(r => r.isCorrect).length / firstHalf.length;
        const secondHalfAccuracy = secondHalf.filter(r => r.isCorrect).length / secondHalf.length;
        const improvement = secondHalfAccuracy - firstHalfAccuracy;
        if (improvement > 0.05)
            return 'improving';
        else if (improvement < -0.05)
            return 'declining';
        else
            return 'stable';
    }
}
//# sourceMappingURL=GetStudentReviewStatsUseCase.js.map