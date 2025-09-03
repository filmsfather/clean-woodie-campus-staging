import { UniqueEntityID, Result } from '@woodie/domain';
/**
 * 복습 통계 조회 Use Case
 *
 * 비즈니스 규칙:
 * - 인증된 사용자만 자신의 통계를 조회할 수 있음
 * - 기간별 통계 필터링 지원
 * - 학습 효율성 지표 계산
 * - 개선 제안 사항 포함
 * - 알림 통계 선택적 포함
 */
export class GetReviewStatisticsUseCase {
    reviewQueueService;
    notificationService;
    constructor(reviewQueueService, notificationService) {
        this.reviewQueueService = reviewQueueService;
        this.notificationService = notificationService;
    }
    async execute(request) {
        try {
            // 1. 입력 유효성 검증
            if (!request.studentId || request.studentId.trim() === '') {
                return Result.fail('Student ID is required');
            }
            const studentId = new UniqueEntityID(request.studentId);
            const period = request.period || 'all';
            // 2. 복습 통계 조회
            const reviewStatsResult = await this.reviewQueueService.getReviewStatistics(studentId);
            if (reviewStatsResult.isFailure) {
                return Result.fail(reviewStatsResult.error);
            }
            const reviewStats = reviewStatsResult.getValue();
            // 3. 알림 통계 조회 (옵션)
            let notificationStats;
            if (request.includeNotifications) {
                const notificationResult = await this.notificationService.getNotificationStatistics(studentId);
                if (notificationResult.isSuccess) {
                    notificationStats = notificationResult.getValue();
                }
            }
            // 4. 계산된 지표들 생성
            const calculatedMetrics = this.calculateMetrics(reviewStats);
            // 5. 트렌드 분석 (간단한 로직)
            const trends = this.analyzeTrends(reviewStats);
            // 6. 개선 제안 생성
            const recommendations = this.generateRecommendations(reviewStats, calculatedMetrics);
            // 7. 응답 구성
            const response = {
                period,
                review: {
                    ...reviewStats,
                    ...calculatedMetrics
                },
                notification: notificationStats,
                trends,
                recommendations
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Failed to get review statistics: ${error}`);
        }
    }
    /**
     * 계산된 지표들 생성
     */
    calculateMetrics(stats) {
        // 완료율 계산
        const completionRate = stats.dueToday > 0 ?
            Math.round((stats.completedToday / stats.dueToday) * 100) : 0;
        // 효율성 계산 (완료한 항목 수 / 소요 시간)
        const efficiency = stats.totalTimeSpent > 0 ?
            Math.round((stats.completedToday / (stats.totalTimeSpent / 60)) * 100) / 100 : 0;
        // 평균 세션 시간 계산 (분 단위)
        const avgSessionTime = stats.completedToday > 0 ?
            Math.round((stats.totalTimeSpent / stats.completedToday) * 10) / 10 : 0;
        // 생산성 등급 계산
        let productivity;
        if (completionRate >= 90 && stats.averageRetention >= 80 && stats.streakDays >= 7) {
            productivity = 'excellent';
        }
        else if (completionRate >= 70 && stats.averageRetention >= 70) {
            productivity = 'good';
        }
        else if (completionRate >= 50 && stats.averageRetention >= 60) {
            productivity = 'fair';
        }
        else {
            productivity = 'needs_improvement';
        }
        return {
            completionRate,
            efficiency,
            avgSessionTime,
            productivity
        };
    }
    /**
     * 트렌드 분석 (간단한 로직 - 실제로는 시계열 데이터 필요)
     */
    analyzeTrends(stats) {
        // 간단한 휴리스틱 기반 트렌드 분석
        let retentionTrend;
        if (stats.averageRetention >= 80) {
            retentionTrend = 'improving';
        }
        else if (stats.averageRetention >= 70) {
            retentionTrend = 'stable';
        }
        else {
            retentionTrend = 'declining';
        }
        // 속도 트렌드 (완료 시간 기반)
        let speedTrend = 'stable';
        if (stats.totalTimeSpent > 0 && stats.completedToday > 0) {
            const avgTime = stats.totalTimeSpent / stats.completedToday;
            speedTrend = avgTime < 3 ? 'improving' : avgTime > 5 ? 'declining' : 'stable';
        }
        // 일관성 점수 (연속 학습 일수 기반)
        const consistencyScore = Math.min(100, Math.round((stats.streakDays / 30) * 100));
        return {
            retentionTrend,
            speedTrend,
            consistencyScore
        };
    }
    /**
     * 개선 제안 생성
     */
    generateRecommendations(stats, metrics) {
        const recommendations = [];
        // 완료율 기반 제안
        if (metrics.completionRate < 70) {
            recommendations.push('하루에 조금씩이라도 꾸준히 복습하는 습관을 만들어보세요.');
        }
        // 정답률 기반 제안
        if (stats.averageRetention < 70) {
            recommendations.push('어려운 문제는 더 자주 복습하도록 피드백을 조정해보세요.');
        }
        // 연속성 기반 제안
        if (stats.streakDays < 3) {
            recommendations.push('매일 조금씩이라도 학습하는 것이 효과적입니다.');
        }
        else if (stats.streakDays >= 7) {
            recommendations.push('훌륭한 학습 습관을 유지하고 계시네요! 계속 이어가세요.');
        }
        // 연체 항목 기반 제안
        if (stats.overdue > 5) {
            recommendations.push('연체된 복습이 많습니다. 우선순위가 높은 항목부터 먼저 완료해보세요.');
        }
        // 효율성 기반 제안
        if (metrics.efficiency < 1) {
            recommendations.push('문제를 풀기 전에 핵심 개념을 다시 한 번 확인해보세요.');
        }
        // 기본 격려 메시지
        if (recommendations.length === 0) {
            recommendations.push('좋은 학습 패턴을 보이고 있습니다! 현재 수준을 유지해보세요.');
        }
        return recommendations;
    }
}
//# sourceMappingURL=GetReviewStatisticsUseCase.js.map